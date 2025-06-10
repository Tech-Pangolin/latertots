import React, { useEffect, useState } from 'react';
import { Button, TextField, Dialog, DialogActions, DialogTitle, DialogContent, MenuItem, Select, InputLabel, OutlinedInput, FormControl, Checkbox, FormControlLabel } from '@mui/material';
import { checkAgainstBusinessHours, checkFutureStartTime, getCurrentDate, getCurrentTime } from '../../Helpers/calendar';
import { v4 as uuidv4 } from 'uuid';
import { FirebaseDbService } from '../../Helpers/firebase';
import { useAuth } from '../AuthProvider';
import { logger } from '../../Helpers/logger';
import { debounce } from '../../Helpers/util';
import { useMutation, useQueryClient } from '@tanstack/react-query';


// Remember to create state for the open/closed state of the modal and the form data
const ReservationFormModal = ({ modalOpenState = false, setModalOpenState, children, scheduleChildSitterPage_queryKey }) => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [dbService, setDbService] = useState(null);
  const [errors, setErrors] = useState({
    start: '',
    end: '',
    date: '',
    selectedChild: ''
  });

  useEffect(() => {
    setDbService(new FirebaseDbService(currentUser));
  }, [currentUser]);

  const initialState = {
    selectedChild: [], // example {id: 'n7EBw3pLzUmsXtVHMqWf', name: 'Jimmm'}
    date: `${getCurrentDate()}`,
    start: `${getCurrentTime()}`,
    end: `${getCurrentTime()}`,
    groupActivity: false
  }
  const [formData, setFormData] = useState(initialState);

  const handleClose = () => {
    setFormData(initialState);
    setModalOpenState(false);
  };

  const childrenOptions = [
    ...children.map(child => Object.fromEntries([["id", child.id], ["name", child.Name]]))
  ];

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    const updatedFormData = {
      ...formData,
      [name]: type === "checkbox" ? checked : value, // Use checked to filter for checkboxes
    };
    setFormData(updatedFormData);
    validateTimesDebounced(updatedFormData, name);
  };

  const saveNewEventMutation = useMutation({
    mutationFn: async ({loggedInUserId, newEvent}) => await dbService.createReservationDocument(loggedInUserId, newEvent),
    onSuccess: () => queryClient.invalidateQueries(scheduleChildSitterPage_queryKey),
    onError: (error) => {
      alert('Could not save event. Please try again later.');
    }
  });

  const validateTimesDebounced = debounce((updatedFormData, field) => {
    const now = new Date();
    const startTime = new Date(`${updatedFormData.date}T${updatedFormData.start}`);
    const endTime = new Date(`${updatedFormData.date}T${updatedFormData.end}`);
    const selectedDate = new Date(`${updatedFormData.date}T00:00:00`);
    const today = new Date(now.toISOString().split('T')[0] + 'T00:00:00'); // Today's date at midnight

    let updatedErrors = { ...errors };

    if (!updatedFormData.selectedChild || updatedFormData.selectedChild.length === 0) {
      updatedErrors.selectedChild = 'At least one child must be selected.';
    }

    if (field === 'start') {
      if (startTime <= now) {
        updatedErrors.start = 'Dropoff time must be in the future.';
      } else {
        updatedErrors.start = '';
      }
    }

    if (field === 'end') {
      if (endTime - startTime < 2 * 60 * 60 * 1000) {
        updatedErrors.end = 'Pickup time must be at least 2 hours after dropoff time.';
      } else {
        updatedErrors.end = '';
      }
    }

    if (field === 'date') {
      if (selectedDate < today) {
        updatedErrors.date = 'Date must be today or in the future.';
      } else {
        updatedErrors.date = '';
      }
    }

    setErrors(updatedErrors);
  }, 500);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newEvents = formData.selectedChild.map(child => {
      return {
        id: uuidv4(),
        title: child.name,
        start: new Date(formData.date + 'T' + formData.start).toISOString(),
        end: new Date(formData.date + 'T' + formData.end).toISOString(),
        allDay: false,
        locked: false,
        extendedProps: {
          duration: (new Date(formData.date + 'T' + formData.end).toISOString() - new Date(formData.date + 'T' + formData.start).toISOString()) / 3600_000,
          status: 'pending',
          childId: child.id,
          fromForm: true
        }
      }
    });

    // Check if all events are valid
    const allValid = newEvents.every((event) => {
      return checkAgainstBusinessHours(event) && checkFutureStartTime(event);
    });

    if (allValid) {
      // Validate all reservations collectively
      const allowSave = dbService.checkReservationOverlapLimit(newEvents);

      if (allowSave) {
        newEvents.forEach(event => {
          saveNewEventMutation.mutate({loggedInUserId: currentUser.uid, newEvent: event})
        })
        handleClose();
      } else {
        alert(
          'Could not save event(s). Please check the time and try again. Note that only 5 reservations can exist at once.'
        );
      }
    } else {
      alert('One or more reservations did not pass validation.');
    }
  };

  return (
    <Dialog open={modalOpenState} aria-labelledby="form-dialog-title">
      <DialogTitle id="form-dialog-title">Reservation</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit}>

          {/* This is going to break the submit workflow, since it will create multiple reservations at once */}
          <FormControl fullWidth style={{ marginTop: '1rem' }}>
            <InputLabel id="multiselect-child-label">Name</InputLabel>
            <Select
              labelId="multiselect-child-label"
              name="selectedChild"
              multiple
              value={formData.selectedChild.map(child => child.id) || []}
              onChange={(e) => {
                const { value } = e.target;
                const selectedChildren = value.map(id =>
                  childrenOptions.find(child => child.id === id)
                );
                setFormData({ ...formData, selectedChild: selectedChildren });
              }}
              input={<OutlinedInput label="Name" />}
              required
              error={!!errors.selectedChild}
            >
              {childrenOptions.map((child) => (
                <MenuItem key={child.id} value={child.id}>
                  {child.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.groupActivity}
                onChange={handleChange}
                name="groupActivity"
              />
            }
            label="Participate in group activity"
          />
          <TextField
            name="date"
            label="Date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            required
            fullWidth
            style={{ marginTop: '1rem' }}
            error={!!errors.date}
            helperText={errors.date}
          />
          <TextField
            name="start"
            label="Dropoff Time"
            type="time"
            value={formData.start}
            onChange={handleChange}
            required
            fullWidth
            style={{ marginTop: '1rem' }}
            error={!!errors.start}
            helperText={errors.start}
          />
          <TextField
            name="end"
            label="Pickup Time"
            type="time"
            value={formData.end}
            onChange={handleChange}
            required
            fullWidth
            style={{ marginTop: '1rem' }}
            error={!!errors.end}
            helperText={errors.end}
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleSubmit} color="primary">
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReservationFormModal;