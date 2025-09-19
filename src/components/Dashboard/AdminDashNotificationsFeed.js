import React from 'react';
import { useNotificationsRQ } from '../../Hooks/query-related/useNotificationsRQ';
import AdminNotificationCard from './AdminNotificationCard';
import { Typography, Alert } from '@mui/material';

export default function AdminDashNotificationsFeed() {
  const { data: notifications, isLoading, isError, error } = useNotificationsRQ();

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <Typography variant="body1">Loading notifications...</Typography>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert severity="error" sx={{ margin: '10px' }}>
        Error loading notifications: {error?.message || 'Unknown error'}
      </Alert>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <Typography variant="body1" color="text.secondary">
          No notifications at this time
        </Typography>
      </div>
    );
  }

  return (
    <>
      {notifications.map((notification) => (
        <AdminNotificationCard 
          key={notification.id} 
          notification={notification} 
        />
      ))}
    </>
  );
}
