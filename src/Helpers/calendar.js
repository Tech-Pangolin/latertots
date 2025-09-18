import React from 'react';
import  StyledCalendarEvent from '../components/Shared/StyledCalendarEvent';
import AggregateTimeSlot from '../components/Shared/AggregateTimeSlot';
import { BUSINESS_HRS } from './constants';


export function checkAgainstBusinessHours(event) {
  // Convert times to comparable formats if necessary
  const start = new Date(event.start).getHours() + new Date(event.start).getMinutes() / 60;
  const end = new Date(event.end).getHours() + new Date(event.end).getMinutes() / 60;
  const startTime = parseFloat(BUSINESS_HRS.startTime.split(':').join('.'));
  const endTime = parseFloat(BUSINESS_HRS.endTime.split(':').join('.'));

  return (
    BUSINESS_HRS.daysOfWeek.includes(new Date(event.start).getDay()) &&
    start >= startTime &&
    end <= endTime
  );
}

export function checkFutureStartTime(event) {
  return new Date(event.start) > new Date();
}

export const renderEventContent = (eventInfo) => {
  const { event } = eventInfo;
  
  // Handle aggregate events (confirmed appointments grouped into 15-minute slots)
  if (event.extendedProps?.isAggregate) {
    // Muted neon purple color for aggregate events
    const backgroundColor = '#8A2BE2'; // BlueViolet - muted neon purple
    return <AggregateTimeSlot event={event} backgroundColor={backgroundColor} />;
  }
  
  // Handle individual events (pending appointments and other statuses)
  let backgroundColor;
  switch (event.status) {
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