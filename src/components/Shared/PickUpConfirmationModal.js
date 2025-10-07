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
  Alert,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  InputAdornment
} from '@mui/material';

const PickUpConfirmationModal = ({
  show,
  onHide,
  reservationData,
  userData,
  calculatedAmount,
  actualHours,
  onConfirmPickUp
}) => {
  const [isOverriding, setIsOverriding] = useState(false);
  const [finalAmount, setFinalAmount] = useState(0);
  const [overrideReason, setOverrideReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (show && calculatedAmount !== undefined) {
      setFinalAmount(calculatedAmount);
      setIsOverriding(false);
      setOverrideReason('');
      setError(null);
    }
  }, [show, calculatedAmount]);
  
  const handleAmountChange = (e) => {
    const dollars = parseFloat(e.target.value) || 0;
    setFinalAmount(Math.max(0, Math.round(dollars * 100)));
  };
  
  const handleConfirm = async () => {
    if (isOverriding && !overrideReason.trim()) {
      setError('Please provide a reason for the amount override');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await onConfirmPickUp(
        finalAmount,
        calculatedAmount,
        isOverriding ? overrideReason : null
      );
      onHide();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const amountDifference = finalAmount - calculatedAmount;
  const isChanged = finalAmount !== calculatedAmount;
  
  return (
    <Dialog open={show} onClose={onHide} maxWidth="lg" fullWidth>
      <DialogTitle>Confirm Child Pick-Up</DialogTitle>
      <DialogContent>
        {/* Reservation Summary */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Reservation Details</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography><strong>Child:</strong> {reservationData?.title || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography><strong>Parent:</strong> {userData?.Name || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography><strong>Drop-off Time:</strong> {reservationData?.dropOffPickUp?.actualStartTime ?
                new Date(reservationData.dropOffPickUp.actualStartTime.toDate()).toLocaleString() : 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography><strong>Duration:</strong> {actualHours?.toFixed(1)} hours</Typography>
            </Grid>
          </Grid>
        </Box>
        
        {/* Amount Calculation */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Payment Amount</Typography>
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => {
                setIsOverriding(!isOverriding);
                if (isOverriding) {
                  setFinalAmount(calculatedAmount);
                  setOverrideReason('');
                }
              }}
            >
              {isOverriding ? 'Use Calculated Amount' : 'Override Amount'}
            </Button>
          </Box>
          
          {!isOverriding ? (
            <Card>
              <CardContent>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" gutterBottom>Service Cost Breakdown</Typography>
                  
                  {/* Total Service Cost */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body1">
                      {actualHours?.toFixed(1)} hours at $25/hour
                      {reservationData?.groupActivity && ' (includes group activity)'}
                    </Typography>
                    <Typography variant="h6" color="primary">
                      ${((actualHours * 2500) / 100).toFixed(2)}
                    </Typography>
                  </Box>
                  
                  {/* Amount Already Paid */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body1" color="text.secondary">
                      Amount already paid
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      -${((actualHours * 2500 - calculatedAmount) / 100).toFixed(2)}
                    </Typography>
                  </Box>
                  
                  {/* Divider */}
                  <Box sx={{ borderTop: '1px solid #e0e0e0', my: 1 }} />
                  
                  {/* Final Amount Due */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6"><strong>Amount Due</strong></Typography>
                    <Typography variant="h4" color="primary">
                      ${(calculatedAmount / 100).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Override Amount"
                      type="number"
                      value={(finalAmount / 100).toFixed(2)}
                      onChange={handleAmountChange}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                      inputProps={{ step: 0.01, min: 0 }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Reason (Required)"
                      multiline
                      rows={2}
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="Reason for override..."
                    />
                  </Grid>
                </Grid>
                
                {isChanged && (
                  <Alert 
                    severity={amountDifference > 0 ? "warning" : "info"} 
                    sx={{ mt: 2 }}
                  >
                    <strong>Difference:</strong> 
                    {amountDifference > 0 ? ' +' : ' '}
                    ${(amountDifference / 100).toFixed(2)}
                    {amountDifference > 0 ? ' additional charge' : ' discount applied'}
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </Box>
        
        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}
        
        {/* Payment Status */}
        <Box sx={{ mb: 2 }}>
          {finalAmount > 0 ? (
            <Alert severity="info">
              <strong>Payment Required:</strong> A checkout session will be created for the parent.
            </Alert>
          ) : (
            <Alert severity="success">
              <strong>No Payment Required:</strong> The initial deposit covers the full service cost.
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onHide} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <CircularProgress size={16} sx={{ mr: 1 }} />
              Processing...
            </>
          ) : (
            `Confirm Pick-Up${finalAmount > 0 ? ' & Create Payment Link' : ''}`
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PickUpConfirmationModal;
