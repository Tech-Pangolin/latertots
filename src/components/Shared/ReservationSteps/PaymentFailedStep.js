import React from 'react';
import { Alert, AlertTitle, Button, Box, Typography } from '@mui/material';

const PaymentFailedStep = ({ onRetry, onCancel }) => {
  return (
    <Box>
      <Alert severity="error">
        <AlertTitle>Payment Failed</AlertTitle>
        Your reservation was not completed. No payment was collected.
      </Alert>
      
      <Box mt={3}>
        <Typography variant="body1" gutterBottom>
          What would you like to do?
        </Typography>
        <Box display="flex" gap={2} mt={2}>
          <Button onClick={onRetry} variant="contained" color="primary">
            Try Payment Again
          </Button>
          <Button onClick={onCancel} variant="outlined" color="secondary">
            Cancel Reservation
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default PaymentFailedStep;
