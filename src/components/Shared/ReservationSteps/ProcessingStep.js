import React from 'react';
import { CircularProgress, Typography, Box } from '@mui/material';

const ProcessingStep = ({ isProcessing, error }) => {
  return (
    <Box display="flex" flexDirection="column" alignItems="center" p={3}>
      {isProcessing && (
        <>
          <CircularProgress size={48} style={{ marginBottom: '16px' }} />
          <Typography variant="h6">Processing your reservation...</Typography>
          <Typography variant="body2" color="textSecondary">
            Please wait while we set up your payment.
          </Typography>
        </>
      )}
      
      {error && (
        <Typography color="error" variant="body1">
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default ProcessingStep;
