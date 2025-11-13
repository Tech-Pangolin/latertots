import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Box,
  Typography
} from '@mui/material';
import { RESERVATION_STATUS } from '../../Helpers/constants';
import { DateTime } from 'luxon';

const ReservationActionModal = ({
  open,
  onClose,
  event,
  userRole,
  onArchive,
  onCancel,
  onRefund
}) => {
  const [selectedAction, setSelectedAction] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) {
      setSelectedAction('');
      setRefundReason('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [open, event]);

  if (!event) return null;

  const eventStatus = event.status || event.extendedProps?.status;
  const isFuture = new Date(event.start) > DateTime.now().toJSDate();
  const isAdmin = userRole === 'admin';

  const getAvailableActions = () => {
    if (isAdmin) {
      const actions = ['archive'];
      if (eventStatus === RESERVATION_STATUS.CONFIRMED && isFuture) {
        actions.push('cancel-refund');
      }
      if ([RESERVATION_STATUS.CONFIRMED, RESERVATION_STATUS.PROCESSING, RESERVATION_STATUS.PAID].includes(eventStatus) && !isFuture) {
        actions.push('refund');
      }
      return actions;
    } else {
      if (eventStatus === RESERVATION_STATUS.PENDING && isFuture) {
        return ['archive'];
      }
      if (eventStatus === RESERVATION_STATUS.CONFIRMED && isFuture) {
        return ['cancel-refund'];
      }
      if ([RESERVATION_STATUS.CONFIRMED, RESERVATION_STATUS.PROCESSING, RESERVATION_STATUS.PAID].includes(eventStatus) && !isFuture) {
        return ['refund'];
      }
      return [];
    }
  };

  const availableActions = getAvailableActions();
  // For parent users, determine if refund reason is needed based on the available action
  // For admin users, check based on selected action
  const actionToCheck = isAdmin ? selectedAction : availableActions[0];
  const needsRefundReason = actionToCheck === 'refund';

  const handleSubmit = async () => {
    setError(null);

    // Determine the action to take (for parent users, use the first available action)
    const actionToTake = isAdmin ? selectedAction : availableActions[0];

    if ((actionToTake === 'cancel-refund' || actionToTake === 'refund') && (!refundReason || refundReason.trim() === '')) {
      setError('Refund reason is required');
      return;
    }

    setIsSubmitting(true);

    try {
      if (actionToTake === 'archive') {
        await onArchive(event.id);
      } else if (actionToTake === 'cancel-refund') {
        // Pass refund reason to cancelReservation for future reservations
        await onCancel(event.id, refundReason);
      } else if (actionToTake === 'refund') {
        // Use requestRefund for past services
        await onRefund(event.id, refundReason);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'An error occurred');
      setIsSubmitting(false);
    }
  };

  const canSubmit = isAdmin 
    ? selectedAction !== '' && (!needsRefundReason || refundReason.trim() !== '')
    : availableActions.length > 0 && (!needsRefundReason || refundReason.trim() !== '');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isAdmin ? 'Reservation Actions' : 'Manage Reservation'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            <strong>{event.title}</strong>
            <br />
            {new Date(event.start).toLocaleString()} - {new Date(event.end).toLocaleString()}
            <br /><br />
            <strong>Status:</strong> {event.extendedProps?.status}
          </Typography>

          {isAdmin ? (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Action</InputLabel>
              <Select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                label="Select Action"
              >
                {availableActions.map(action => (
                  <MenuItem key={action} value={action}>
                    {action === 'archive' && 'Archive'}
                    {action === 'cancel-refund' && 'Cancel/Refund'}
                    {action === 'refund' && 'Refund'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <Typography variant="body2" sx={{ mb: 2 }}>
              {eventStatus === RESERVATION_STATUS.PENDING && 'Archive this pending reservation?'}
              {eventStatus === RESERVATION_STATUS.CONFIRMED && isFuture && 'Cancel and request refund for this reservation?'}
              {[RESERVATION_STATUS.CONFIRMED, RESERVATION_STATUS.PROCESSING, RESERVATION_STATUS.PAID].includes(eventStatus) && !isFuture && 'Request refund for this reservation?'}
            </Typography>
          )}

          {needsRefundReason && (
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Refund Reason (Required)"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Please describe the service problem..."
              required
              sx={{ mb: 2 }}
            />
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting ? 'Processing...' : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReservationActionModal;

