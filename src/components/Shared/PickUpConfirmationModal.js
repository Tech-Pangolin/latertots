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
  costBreakdown,
  onConfirmPickUp
}) => {
  const [isOverriding, setIsOverriding] = useState(false);
  const [finalAmount, setFinalAmount] = useState(0);
  const [overrideReason, setOverrideReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (show && costBreakdown) {
      setFinalAmount(costBreakdown.finalAmount);
      setIsOverriding(false);
      setOverrideReason('');
      setError(null);
    }
  }, [show, costBreakdown]);
  
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
        costBreakdown?.finalAmount || 0,
        isOverriding ? overrideReason : null
      );
      onHide();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const amountDifference = finalAmount - (costBreakdown?.finalAmount || 0);
  const isChanged = finalAmount !== (costBreakdown?.finalAmount || 0);
  
  // LineItem component for consistent display
  const LineItem = ({ label, hours, rate, amount, description, isSubtotal, isLateFee, isCredit, isTotal }) => (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'flex-start',
      py: isSubtotal || isTotal ? 1.5 : 1,
      borderTop: isSubtotal ? '1px solid #e0e0e0' : 'none'
    }}>
      <Box sx={{ flex: 1 }}>
        <Typography variant={isTotal ? 'h6' : 'body1'} sx={{ fontWeight: isTotal ? 'bold' : 'normal' }}>
          {label}
        </Typography>
        {description && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {description}
          </Typography>
        )}
        {hours !== undefined && rate !== undefined && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {hours.toFixed(1)} hours × ${(rate / 100).toFixed(2)}/hour
          </Typography>
        )}
      </Box>
      <Typography 
        variant={isTotal ? 'h5' : 'body1'}
        color={isLateFee ? 'warning.main' : isCredit ? 'success.main' : isTotal ? 'primary.main' : 'text.primary'}
        sx={{ fontWeight: isTotal ? 'bold' : 'normal' }}
      >
        {isCredit ? '-' : ''}${(Math.abs(amount) / 100).toFixed(2)}
      </Typography>
    </Box>
  );
  
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
              <Typography><strong>Duration:</strong> {costBreakdown?.actualHours?.toFixed(1)} hours</Typography>
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
                  setFinalAmount(costBreakdown?.finalAmount || 0);
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
                  
                  {/* Base Service */}
                  {costBreakdown?.costBreakdown?.baseService && (
                    <LineItem
                      label="Base Service"
                      hours={costBreakdown.costBreakdown.baseService.hours}
                      rate={costBreakdown.costBreakdown.baseService.rate}
                      amount={costBreakdown.costBreakdown.baseService.subtotal}
                      description={costBreakdown.costBreakdown.baseService.description}
                    />
                  )}
                  
                  {/* Group Activity */}
                  {costBreakdown?.costBreakdown?.groupActivity && (
                    <LineItem
                      label="Group Activity"
                      hours={costBreakdown.costBreakdown.groupActivity.hours}
                      rate={costBreakdown.costBreakdown.groupActivity.rate}
                      amount={costBreakdown.costBreakdown.groupActivity.subtotal}
                      description={costBreakdown.costBreakdown.groupActivity.description}
                    />
                  )}
                  
                  {/* Late Fee */}
                  {costBreakdown?.costBreakdown?.lateFee && (
                    <LineItem
                      label="Late Fee"
                      hours={costBreakdown.costBreakdown.lateFee.hours}
                      rate={costBreakdown.costBreakdown.lateFee.rate}
                      amount={costBreakdown.costBreakdown.lateFee.subtotal}
                      description={costBreakdown.costBreakdown.lateFee.description}
                      isLateFee={true}
                    />
                  )}
                  
                  {/* Subtotal */}
                  <LineItem
                    label="Total Service Cost"
                    amount={costBreakdown?.costBreakdown?.totalServiceCost || 0}
                    isSubtotal={true}
                  />
                  
                  {/* Amount Paid */}
                  <LineItem
                    label="Amount Already Paid"
                    amount={-costBreakdown?.costBreakdown?.amountPaid || 0}
                    isCredit={true}
                  />
                  
                  {/* Final Amount Due */}
                  <LineItem
                    label="Amount Due"
                    amount={costBreakdown?.costBreakdown?.amountDue || 0}
                    isTotal={true}
                  />
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
