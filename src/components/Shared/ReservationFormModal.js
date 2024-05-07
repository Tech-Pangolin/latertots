import React, { useState } from 'react';
import { Button, TextField, Dialog, DialogActions, DialogTitle, DialogContent, MenuItem } from '@mui/material';
import { getCurrentDate, getCurrentTime } from '../../Helpers/calendar';


// Remember to create state for the open/closed state of the modal and the form data
const ReservationFormModal = ({modalOpenState = false, setModalOpenState, children}) => {
  const [formData, setFormData] = useState({
    childId: '',
    date: `${getCurrentDate()}`,
    start: `${getCurrentTime()}`,
    end: `${getCurrentTime()}`
  });

  const handleClose = () => {
    setModalOpenState(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log(formData);
    handleClose();
  };

  console.log(children)

  return (
    <Dialog open={modalOpenState}  aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Reservation</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <TextField
              name="childId"
              label="Name"
              select
              value={formData.childId}
              onChange={handleChange}
              required
              fullWidth
              style={{ marginTop: '1rem' }}
            >
              { children.map((child) => <MenuItem key={child.id} value={child.id}> {child.Name} </MenuItem>) }
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