import React, { useState } from 'react';
import { Avatar, Button, Card, CardActions, CardHeader, Typography, Chip, Box, Collapse, Divider } from '@mui/material';
import { useNotificationsRQ } from '../../Hooks/query-related/useNotificationsRQ';
import { useAuth } from '../../components/AuthProvider';
import { NOTIFICATION_TYPES } from '../../Helpers/constants';
import { useQuery } from '@tanstack/react-query';

export default function AdminNotificationCard({ notification }) {
  const { dismissNotification, isDismissing } = useNotificationsRQ();
  const { dbService } = useAuth();
  const [expanded, setExpanded] = useState(false);
  
  // Fetch reservation data if reservationId exists
  const { data: reservation, isLoading: isLoadingReservation } = useQuery({
    queryKey: ['reservation', notification.reservationId],
    queryFn: () => dbService.getReservationData(notification.reservationId),
    enabled: !!notification.reservationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch user data if reservation exists
  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user', reservation?.userId],
    queryFn: () => dbService.getUserData(reservation.userId),
    enabled: !!reservation?.userId,
    staleTime: 5 * 60 * 1000,
  });
  
  const handleDismiss = () => {
    dismissNotification(notification.id);
  };
  
  const getNotificationIcon = () => {
    switch (notification.type) {
      case NOTIFICATION_TYPES.ADMIN:
        return '🔔';
      case NOTIFICATION_TYPES.SYSTEM:
        return '⚙️';
      default:
        return '📢';
    }
  };
  
  const getNotificationColor = () => {
    switch (notification.type) {
      case NOTIFICATION_TYPES.ADMIN:
        return 'primary';
      case NOTIFICATION_TYPES.SYSTEM:
        return 'secondary';
      default:
        return 'default';
    }
  };
  
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStripePaymentIds = () => {
    if (!reservation?.stripePayments) return [];
    const payments = [];
    if (reservation.stripePayments.minimum) {
      payments.push({ type: 'Minimum Deposit', id: reservation.stripePayments.minimum });
    }
    if (reservation.stripePayments.remainder) {
      payments.push({ type: 'Remainder', id: reservation.stripePayments.remainder });
    }
    if (reservation.stripePayments.full) {
      payments.push({ type: 'Full Payment', id: reservation.stripePayments.full });
    }
    return payments;
  };

  const hasRefundDetails = notification.reservationId && reservation;
  
  return (
    <Card 
      variant='outlined' 
      sx={{ 
        marginBottom: '12px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          transform: 'translateY(-1px)'
        }
      }}
    >
      <CardHeader
        avatar={
          <Avatar 
            sx={{ 
              width: 48, 
              height: 48, 
              backgroundColor: 'rgba(25, 118, 210, 0.1)',
              fontSize: '24px',
              border: '2px solid rgba(25, 118, 210, 0.2)'
            }}
          >
            {getNotificationIcon()}
          </Avatar>
        }
        title={
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '12px', mb: 1 }}>
            <Typography 
              variant="body1" 
              sx={{ 
                flex: 1,
                fontWeight: 500,
                lineHeight: 1.4,
                color: 'text.primary'
              }}
            >
              {notification.message}
            </Typography>
            <Chip 
              label={notification.type} 
              color={getNotificationColor()}
              size="small"
              variant="outlined"
              sx={{ 
                minWidth: '60px',
                fontWeight: 500,
                textTransform: 'capitalize'
              }}
            />
          </Box>
        }
        subheader={
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              fontSize: '0.875rem',
              fontWeight: 400
            }}
          >
            {formatDate(notification.createdAt)}
          </Typography>
        }
        sx={{
          padding: '16px 20px 8px 20px',
          '& .MuiCardHeader-content': {
            overflow: 'visible'
          }
        }}
      />
      
      {/* Refund Details Section */}
      {hasRefundDetails && (
        <>
          <Divider />
          <Box sx={{ padding: '16px 20px' }}>
            <Button
              size="small"
              onClick={() => setExpanded(!expanded)}
              sx={{ textTransform: 'none', mb: expanded ? 2 : 0 }}
            >
              {expanded ? 'Hide' : 'Show'} Refund Details
            </Button>
            <Collapse in={expanded}>
              {isLoadingReservation || isLoadingUser ? (
                <Typography variant="body2" color="text.secondary">
                  Loading details...
                </Typography>
              ) : (
                <Box sx={{ mt: 2 }}>
                  {/* User Information */}
                  {userData && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        User Information
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Name:</strong> {userData.Name || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Email:</strong> {userData.Email || 'N/A'}
                      </Typography>
                    </Box>
                  )}

                  {/* Refund Reason */}
                  {reservation.refundReason && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Refund Reason
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {reservation.refundReason}
                      </Typography>
                    </Box>
                  )}

                  {/* Stripe Payment IDs */}
                  {getStripePaymentIds().length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Stripe Payment Confirmation IDs
                      </Typography>
                      {getStripePaymentIds().map((payment, index) => (
                        <Typography key={index} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          <strong>{payment.type}:</strong> {payment.id}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
            </Collapse>
          </Box>
        </>
      )}

      <CardActions sx={{ 
        justifyContent: 'flex-end', 
        padding: '0 20px 16px 20px',
        paddingTop: 0
      }}>
        <Button 
          size="small" 
          variant='outlined'
          color="secondary"
          onClick={handleDismiss}
          disabled={isDismissing}
          sx={{
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 500,
            px: 2,
            py: 0.5
          }}
        >
          {isDismissing ? 'Dismissing...' : 'Dismiss'}
        </Button>
      </CardActions>
    </Card>
  );
}
