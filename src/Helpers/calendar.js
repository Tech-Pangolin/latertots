import React from 'react';
import { createReservationDocument } from './firebase';
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
  const backgroundColor = event.extendedProps.status === 'confirmed' ? 'green' : 'orange';
  return <StyledCalendarEvent event={event} backgroundColor={backgroundColor} />;
}

export const handleScheduleSave = (events, currentUserData) => {
  events.forEach(async event => {
    // Save each event to the database
    await createReservationDocument(currentUserData.id, event)
  });
  console.log('Schedule saved:', events);
}