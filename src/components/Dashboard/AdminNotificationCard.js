import React from 'react';
import { Avatar, Button, Card, CardActions, CardHeader, Typography, Chip, Box } from '@mui/material';
import { useNotificationsRQ } from '../../Hooks/query-related/useNotificationsRQ';
import { NOTIFICATION_TYPES } from '../../Helpers/constants';

export default function AdminNotificationCard({ notification }) {
  const { dismissNotification, isDismissing } = useNotificationsRQ();
  
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
