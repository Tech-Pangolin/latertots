import React from 'react';
import  StyledCalendarEvent from '../components/Shared/StyledCalendarEvent';


export function checkAgainstBusinessHours(event) {
  const businessHours = {
    daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
    startTime: '07:00', 
    endTime: '19:00', 
    overlap: false
  };
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
      backgroundColor = 'mediumseagreen';
      break;
    case 'pending':
      backgroundColor = 'tomato';
      break;
    case 'unpaid':
      backgroundColor = 'darkorange';
      break;
    default:
      backgroundColor = 'gray';
      break;
  }
  return <StyledCalendarEvent event={event} backgroundColor={backgroundColor} />;
}

export const handleScheduleSave = async (events, currentUserData, dbService) => {
  for (const event of events) {
    // Check if reservation already exists
    const reservationExists = await checkReservationExists(event);
    if (reservationExists) {
      // Update existing reservation
      await dbService.updateReservationDocument(event);
    } else {
      // Create new reservation
      await dbService.createReservationDocument(currentUserData.id, event);
    }
  }
  
  alert('Schedule saved successfully!');
  if (currentUserData.Role === 'admin') {
    return;
  }
  window.location.href = '/schedule';
}

async function checkReservationExists(event) {
  // New reservations are given a uuidv4 before being saved to the database, including "-" and lowercase letters
  // Firebase will automatically assign a unique ID when the document is created. It includes uppercase letters and no special characters

  if (event.id.includes('-') || event.id.toLowerCase() === event.id) {
    return false;
  } else {
    return true;
  }
}

export const getCurrentDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const getCurrentTime = () => {
  const today = new Date();
  const hours = today.getHours().toString().padStart(2, '0');
  const minutes = today.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}