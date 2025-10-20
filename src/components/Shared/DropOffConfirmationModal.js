import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  Box, 
  Typography,
  Alert
} from '@mui/material';
import { Timestamp } from 'firebase/firestore';

const DropOffConfirmationModal = ({ show, onHide, reservationData, onConfirmDropOff }) => {
  const [dropOffTime, setDropOffTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (show) {
      // Default to current time
      const now = new Date();
      const timeString = now.toTimeString().slice(0, 5);
      setDropOffTime(timeString);
      setError(null);
    }
  }, [show]);
  
  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Convert time string to Timestamp
      const [hours, minutes] = dropOffTime.split(':');
      const dropOffDate = new Date();
      dropOffDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const dropOffTimestamp = Timestamp.fromDate(dropOffDate);
      
      await onConfirmDropOff(dropOffTimestamp);
      onHide();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={show} onClose={onHide} maxWidth="sm" fullWidth>
      <DialogTitle>Confirm Drop-Off</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography><strong>Child:</strong> {reservationData?.title}</Typography>
          <Typography><strong>Scheduled:</strong> {reservationData?.start ? 
            (typeof reservationData.start.toDate === 'function' 
              ? new Date(reservationData.start.toDate()).toLocaleString()
              : new Date(reservationData.start).toLocaleString()) : 'N/A'}
          </Typography>
        </Box>
        
        <TextField
          fullWidth
          label="Actual Drop-Off Time"
          type="time"
          value={dropOffTime}
          onChange={(e) => setDropOffTime(e.target.value)}
          helperText="Adjust if child was dropped off at a different time"
          sx={{ mb: 2 }}
        />
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onHide} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button 
          variant="contained" 
          color="success" 
          onClick={handleConfirm} 
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Processing...' : 'Confirm Drop-Off'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DropOffConfirmationModal;
