import React from 'react';
import { Alert, AlertTitle, Button, Box } from '@mui/material';

const PaymentSuccessStep = ({ onClose }) => {
  return (
    <Box>
      <Alert severity="success">
        <AlertTitle>Payment Successful!</AlertTitle>
        Your reservations have been confirmed and you will receive a confirmation email shortly.
      </Alert>
      
      <Box display="flex" justifyContent="center" mt={3}>
        <Button onClick={onClose} variant="contained" color="primary">
          Close
        </Button>
      </Box>
    </Box>
  );
};

export default PaymentSuccessStep;
