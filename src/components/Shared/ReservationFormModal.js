import React, { useEffect, useState } from 'react';
import { Button, TextField, Dialog, DialogActions, DialogTitle, DialogContent, MenuItem, Select, InputLabel, OutlinedInput, FormControl, Checkbox, FormControlLabel } from '@mui/material';
import { checkAgainstBusinessHours, checkFutureStartTime, getCurrentDate, getCurrentTime } from '../../Helpers/calendar';
import { v4 as uuidv4 } from 'uuid';
import { FirebaseDbService } from '../../Helpers/firebase';
import { useAuth } from '../AuthProvider';
import { logger } from '../../Helpers/logger';


// Remember to create state for the open/closed state of the modal and the form data
const ReservationFormModal = ({ modalOpenState = false, setModalOpenState, children, setEvents, events, handleScheduleSave, currentUserData }) => {
  const { currentUser } = useAuth();
  const [dbService, setDbService] = useState(null);

  useEffect(() => {
    setDbService(new FirebaseDbService(currentUser));
  }, [currentUser]);

  const initialState = {
    selectedChild: [],
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
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value, // Use checked to filter for checkboxes
    });
  };
  

  useEffect(() => {
    logger.info('formData changed:', formData);
  }, [formData]);

  useEffect(() => {
    const hasNewEvent = events.some(event => event.id.includes('-') && event.extendedProps.fromForm)

    if (hasNewEvent) {
      handleScheduleSave(events, currentUserData)
    }
  }, [events]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newEvent = {
      id: uuidv4(),
      title: formData.selectedChild.name,
      start: new Date(formData.date + 'T' + formData.start).toISOString(),
      end: new Date(formData.date + 'T' + formData.end).toISOString(),
      allDay: false,
      extendedProps: {
        duration: (new Date(formData.date + 'T' + formData.end).toISOString() - new Date(formData.date + 'T' + formData.start).toISOString()) / 3600_000,
        status: 'pending',
        childId: formData.selectedChild.id,
        fromForm: true
      }
    }
    // Handle form submission logic here
    let allowSave = false;
    if (checkAgainstBusinessHours(newEvent) && checkFutureStartTime(newEvent)) {
      allowSave = dbService.checkReservationAllowability(newEvent);
    }
    if (allowSave) {
      setEvents(prevEvents => [...prevEvents, newEvent]);
      handleClose();
    } else {
      alert('Could not save event. Please check the time and try again. Note that only 5 reservations can exist at once.');
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