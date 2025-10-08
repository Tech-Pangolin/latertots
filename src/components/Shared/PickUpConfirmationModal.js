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
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { useAuth } from '../AuthProvider';

const PickUpConfirmationModal = ({
  show,
  onHide,
  reservationData,
  userData,
  costBreakdown,
  onConfirmPickUp
}) => {
  const { dbService } = useAuth();
  const [isOverriding, setIsOverriding] = useState(false);
  const [finalAmount, setFinalAmount] = useState(0);
  const [overrideReason, setOverrideReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [selectedGroupActivity, setSelectedGroupActivity] = useState(null);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [currentCostBreakdown, setCurrentCostBreakdown] = useState(null);
  
  useEffect(() => {
    if (show && costBreakdown) {
      setFinalAmount(costBreakdown.finalAmount);
      setCurrentCostBreakdown(costBreakdown); // Initialize with original data
      setIsOverriding(false);
      setOverrideReason('');
      setError(null);
      setSelectedGroupActivity(null); // Reset activity selection
    }
  }, [show, costBreakdown]);

  const handleActivityChange = async (activityId) => {
    setSelectedGroupActivity(activityId);
    setIsRecalculating(true);
    
    try {
      const newCostBreakdown = await dbService.calculateFinalCheckoutAmount(
        reservationData,
        activityId || null
      );
      setFinalAmount(newCostBreakdown.finalAmount);
      setCurrentCostBreakdown(newCostBreakdown); // Store the recalculated data
    } catch (error) {
      console.error('Error recalculating with activity:', error);
      setError('Failed to recalculate cost with selected activity');
    } finally {
      setIsRecalculating(false);
    }
  };
  
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
        isOverriding ? overrideReason : null,
        selectedGroupActivity || null
      );
      onHide();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Use current cost breakdown if available, otherwise fall back to original prop
  const displayCostBreakdown = currentCostBreakdown || costBreakdown;
  
  const amountDifference = finalAmount - (displayCostBreakdown?.finalAmount || 0);
  const isChanged = finalAmount !== (displayCostBreakdown?.finalAmount || 0);
  
  // LineItem component for consistent display
  const LineItem = ({ label, hours, rate, amount, description, isSubtotal, isLateFee, isCredit, isTotal, isFlat }) => (
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
        {hours !== undefined && rate !== undefined && !isFlat && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {hours.toFixed(1)} hours × ${(rate / 100).toFixed(2)}/hour
          </Typography>
        )}
        {isFlat && hours !== undefined && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {hours.toFixed(1)} hours overlap (flat rate)
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
          
          {/* Group Activity Selection */}
          {reservationData?.groupActivity && !isOverriding && (
            <Card sx={{ mb: 2, backgroundColor: '#fff3e0', border: '1px solid #ff9800' }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Group Activity Selection
                </Typography>
                <FormControl fullWidth size="small" disabled={isRecalculating}>
                  <InputLabel>Select Tot-tivity/Event</InputLabel>
                  <Select
                    value={selectedGroupActivity || ''}
                    onChange={(e) => handleActivityChange(e.target.value)}
                    label="Select Tot-tivity/Event"
                  >
                    <MenuItem value="">
                      <em>No group activity</em>
                    </MenuItem>
                    {displayCostBreakdown.costBreakdown.availableActivities?.map((activity) => (
                      <MenuItem key={activity.stripeId} value={activity.stripeId}>
                        {activity.name} - {activity.daysOfWeek}
                        {activity.hasTimeData && ` (${activity.startTime} - ${activity.endTime})`}
                        {!activity.hasTimeData && ' (times not configured)'}
                        {' - '}${(activity.pricePerUnitInCents / 100).toFixed(2)}
                        {activity.isFlat ? ' (flat)' : '/hr'}
                      </MenuItem>
                    )) || (
                      <MenuItem value="no-activities" disabled>
                        <em>No activities available</em>
                      </MenuItem>
                    )}
                  </Select>
                </FormControl>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {displayCostBreakdown.costBreakdown.availableActivities?.length > 0 ? (
                    <>
                      Select the tot-tivity or event this child participated in. 
                      {displayCostBreakdown.costBreakdown.availableActivities.some(a => !a.hasTimeData) && 
                        ' Note: Activities without configured times will require manual override.'}
                    </>
                  ) : (
                    'No activities are currently available. You can use the override amount feature to manually add group activity charges.'
                  )}
                </Typography>
                {isRecalculating && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    <Typography variant="caption">Recalculating...</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {!isOverriding ? (
            <Card>
              <CardContent>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" gutterBottom>Service Cost Breakdown</Typography>
                  
                  {/* Base Service */}
                  {displayCostBreakdown?.costBreakdown?.baseService && (
                    <LineItem
                      label="Base Service"
                      hours={displayCostBreakdown.costBreakdown.baseService.hours}
                      rate={displayCostBreakdown.costBreakdown.baseService.rate}
                      amount={displayCostBreakdown.costBreakdown.baseService.subtotal}
                      description={displayCostBreakdown.costBreakdown.baseService.description}
                    />
                  )}
                  
                  {/* Group Activity */}
                  {displayCostBreakdown?.costBreakdown?.groupActivity && (
                    <LineItem
                      label="Group Activity"
                      hours={displayCostBreakdown.costBreakdown.groupActivity.hours}
                      rate={displayCostBreakdown.costBreakdown.groupActivity.rate}
                      amount={displayCostBreakdown.costBreakdown.groupActivity.subtotal}
                      description={displayCostBreakdown.costBreakdown.groupActivity.description}
                      isFlat={displayCostBreakdown.costBreakdown.groupActivity.isFlat}
                    />
                  )}
                  
                  {/* Late Fee */}
                  {displayCostBreakdown?.costBreakdown?.lateFee && (
                    <LineItem
                      label="Late Fee"
                      hours={displayCostBreakdown.costBreakdown.lateFee.hours}
                      rate={displayCostBreakdown.costBreakdown.lateFee.rate}
                      amount={displayCostBreakdown.costBreakdown.lateFee.subtotal}
                      description={displayCostBreakdown.costBreakdown.lateFee.description}
                      isLateFee={true}
                    />
                  )}
                  
                  {/* Subtotal */}
                  <LineItem
                    label="Total Service Cost"
                    amount={displayCostBreakdown?.costBreakdown?.totalServiceCost || 0}
                    isSubtotal={true}
                  />
                  
                  {/* Amount Paid */}
                  <LineItem
                    label="Amount Already Paid"
                    amount={-displayCostBreakdown?.costBreakdown?.amountPaid || 0}
                    isCredit={true}
                  />
                  
                  {/* Final Amount Due */}
                  <LineItem
                    label="Amount Due"
                    amount={displayCostBreakdown?.costBreakdown?.amountDue || 0}
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
