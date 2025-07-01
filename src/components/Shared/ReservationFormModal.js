import React, { useState } from 'react';
import { Button, TextField, Dialog, DialogActions, DialogTitle, DialogContent, MenuItem, Select, InputLabel, OutlinedInput, FormControl, Checkbox, FormControlLabel } from '@mui/material';
import { checkAgainstBusinessHours, checkFutureStartTime, getCurrentDate, getCurrentTime } from '../../Helpers/calendar';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../AuthProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MIN_RESERVATION_DURATION_MS } from '../../Helpers/constants';
import useDebouncedValidateField from '../../Hooks/useDebouncedValidateField';


// Remember to create state for the open/closed state of the modal and the form data
const ReservationFormModal = ({ modalOpenState = false, setModalOpenState, children, scheduleChildSitterPage_queryKey }) => {
  const queryClient = useQueryClient();
  const { currentUser, dbService } = useAuth();
  const [errors, setErrors] = useState({
    start: '',
    end: '',
    date: '',
    selectedChild: ''
  });
  const childrenOptions = children.map(child => Object.fromEntries([["id", child.id], ["name", child.Name]]));

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

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    const updatedFormData = {
      ...formData,
      [name]: type === "checkbox" ? checked : value, // Use checked to filter for checkboxes
    };
    setFormData(updatedFormData);
    debouncedValidateFieldFxn(updatedFormData, name);
  };

  const saveNewEventMutation = useMutation({
    mutationFn: async ({ loggedInUserId, newEvent }) => await dbService.createReservationDocument(loggedInUserId, newEvent),
    onSuccess: () => queryClient.invalidateQueries(scheduleChildSitterPage_queryKey),
    onError: (error) => {
      alert('Could not save event. Please try again later.');
    }
  });

  const debouncedValidateFieldFxn = useDebouncedValidateField((data, field) => {
    const errors = {};
    if (!data.selectedChild?.length) {
      errors.selectedChild = 'At least one child must be selected.';
    }
    const start = new Date(`${data.date}T${data.start}`);
    const now = new Date();
    if (field === 'start' && start <= now) {
      errors.start = 'Dropoff time must be in the future.';
    }
    if (field === 'end') {
      const end = new Date(`${data.date}T${data.end}`);
      if (end - start < MIN_RESERVATION_DURATION_MS) {
        errors.end = 'Pickup time must be at least 2 hours after dropoff time.';
      }
    }
    if (field === 'date') {
      const selectedDate = new Date(`${data.date}T00:00:00`);
      const today = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00');
      if (selectedDate < today) {
        errors.date = 'Date must be today or in the future.';
      }
    }
    return errors;
  }, setErrors, 500);


  const handleSubmit = async (e) => {
    e.preventDefault();
    const newEvents = formData.selectedChild.map(child => {
      return {
        id: uuidv4(),
        title: child.name,
        start: new Date(formData.date + 'T' + formData.start).toISOString(),
        end: new Date(formData.date + 'T' + formData.end).toISOString(),
        allDay: false,
        billingLocked: false,
        groupActivity: formData.groupActivity,
        extendedProps: {
          status: 'pending',
          childId: child.id
        }
      }
    });

    const validHours = newEvents.every((event) => {
      return checkAgainstBusinessHours(event) && checkFutureStartTime(event);
    });
    if (!validHours) {
      // TODO: Handle individual validation errors
      alert('One or more reservations falls outside of valid business hours. Please check the date/time and try again.');
      return;
    }

    const validOverlap = dbService.checkReservationOverlapLimit(newEvents);
    if (!validOverlap) {
      alert('No more than 5 reservations can take place simultaneously. Please check available time slots and try again.');
      return;
    }

    newEvents.forEach((validatedEvent) => {
      saveNewEventMutation.mutate({ loggedInUserId: currentUser.uid, newEvent: validatedEvent });
    });
    handleClose();
  };

  return (
    <Dialog open={modalOpenState} aria-labelledby="form-dialog-title">
      <DialogTitle id="form-dialog-title">Reservation</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit}>

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