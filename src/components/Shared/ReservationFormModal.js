import React, { useEffect, useState } from 'react';
import { Button, TextField, Dialog, DialogActions, DialogTitle, DialogContent, MenuItem } from '@mui/material';
import { checkAgainstBusinessHours, checkFutureStartTime, getCurrentDate, getCurrentTime } from '../../Helpers/calendar';
import { v4 as uuidv4 } from 'uuid';
import { checkReservationAllowability } from '../../Helpers/firebase';


// Remember to create state for the open/closed state of the modal and the form data
const ReservationFormModal = ({modalOpenState = false, setModalOpenState, children, setEvents, events, handleScheduleSave, currentUserData}) => {
  const initialState = {
    selectedChild: {id: '', name: 'Select a child'},
    date: `${getCurrentDate()}`,
    start: `${getCurrentTime()}`,
    end: `${getCurrentTime()}`
  }
  const [formData, setFormData] = useState(initialState);

  const handleClose = () => {
    setModalOpenState(false);
  };

  const childrenOptions = [
    {id: '', name: "Select a child"},
     ...children.map( child => Object.fromEntries([["id", child.id], ["name", child.Name]]) )
  ];

  const handleChange = (e) => {
    if (e.target.name === 'selectedChild') {
      setFormData({ ...formData, 'selectedChild': childrenOptions.find(child => child.id === e.target.value)});
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  useEffect(() => { 
    const hasNewEvent = events.some(event => event.id.includes('-'))

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
      end:  new Date(formData.date + 'T' + formData.end).toISOString(),
      allDay: false,
      extendedProps: {
        duration: (new Date(formData.date + 'T' + formData.end).toISOString() - new Date(formData.date + 'T' + formData.start).toISOString())/3600_000,
        status: 'pending',
        childId: formData.selectedChild.id
      }
    }
    // Handle form submission logic here
    let allowSave = false;
    if (checkAgainstBusinessHours(newEvent) && checkFutureStartTime(newEvent)) {
      allowSave = checkReservationAllowability(newEvent);
    }
    if (allowSave) {
      setEvents(prevEvents => [...prevEvents, newEvent]);
      setFormData(initialState);
      handleClose();
    } else {
      alert('Could not save event. Please check the time and try again. Note that only 5 reservations can exist at once.');
    }
  };

  return (
    <Dialog open={modalOpenState}  aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Reservation</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <TextField
              name="selectedChild"
              label="Name"
              select
              value={formData.selectedChild.id}
              onChange={handleChange}
              required
              fullWidth
              style={{ marginTop: '1rem' }}
            >
              { childrenOptions.map((child) => <MenuItem key={child.id} value={child.id}> {child.name} </MenuItem>) }
            </TextField>
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