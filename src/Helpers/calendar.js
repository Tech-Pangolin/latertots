import React from 'react';
import { createReservationDocument, updateReservationDocument } from './firebase';
import  StyledCalendarEvent from '../components/Shared/StyledCalendarEvent';


export function checkAgainstBusinessHours(event, businessHours) {
  // Convert times to comparable formats if necessary
  const start = new Date(event.start).getHours() + new Date(event.start).getMinutes() / 60;
  const end = new Date(event.end).getHours() + new Date(event.end).getMinutes() / 60;
  const startTime = parseFloat(businessHours.startTime.split(':').join('.'));
  const endTime = parseFloat(businessHours.endTime.split(':').join('.'));

  return (
    businessHours.daysOfWeek.includes(new Date(event.start).getDay()) &&
    start >= startTime &&
    end <= endTime
  );
}

export function checkFutureStartTime(event) {
  const currentDateTime = new Date();
  const eventStartDateTime = new Date(event.start);
  return eventStartDateTime > currentDateTime;
}

export const renderEventContent = (eventInfo) => {
  const { event } = eventInfo;
  let backgroundColor;
  switch (event.extendedProps.status) {
    case 'confirmed':
      backgroundColor = 'green';
      break;
    case 'pending':
      backgroundColor = 'orange';
      break;
    default:
      backgroundColor = 'gray';
      break;
  }
  return <StyledCalendarEvent event={event} backgroundColor={backgroundColor} />;
}

export const handleScheduleSave = async (events, currentUserData) => {
  for (const event of events) {
    // Check if reservation already exists
    const reservationExists = await checkReservationExists(currentUserData.id, event);
    
    if (reservationExists) {
      // Update existing reservation
      await updateReservationDocument(event);
    } else {
      // Create new reservation
      await createReservationDocument(currentUserData.id, event);
    }
  }
  
  alert('Schedule saved successfully!');
}

async function checkReservationExists(userId, event) {
  // New reservations are given a uuidv4 before being saved to the database, including "-" and lowercase letters
  // Firebase will automatically assign a unique ID when the document is created. It includes uppercase letters and no special characters

  if (event.id.includes('-') || event.id.toLowerCase() === event.id) {
    return false;
  } else {
    return true;
  }
}