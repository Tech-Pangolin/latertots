// NotificationsFeed.jsx
import React, { useEffect, useState } from 'react';
import { getFirestore } from 'firebase/firestore';
import AdminDashReservationCard from './AdminDashReservationCard';

export default function AdminDashNotificationsFeed() {
  // TODO: Implement react-query for fetching notifications?

  return (
    
    <>
      <AdminDashReservationCard />
      <AdminDashReservationCard />
      <AdminDashReservationCard />
      <AdminDashReservationCard />
      <AdminDashReservationCard />
      <AdminDashReservationCard />
      <AdminDashReservationCard />
      <AdminDashReservationCard />
    </>
  );
}
