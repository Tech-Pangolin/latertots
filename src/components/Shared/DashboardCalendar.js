import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useSelector } from 'react-redux';
import { checkReservationAllowability, deleteReservationDocument, fetchAllCurrentUsersChildren, fetchAllReservationsByMonth, fetchCurrentUser, fetchUserReservations } from '../../Helpers/firebase';
import { useAuth } from '../AuthProvider';
import { checkAgainstBusinessHours, handleScheduleSave, renderEventContent, checkFutureStartTime } from '../../Helpers/calendar';

const DashboardCalendar = () => {
  const businessHours = useSelector(state => state.settings.businessHours);
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    console.log('reservations:', reservations);
  }, [reservations]);

  const getReservationsByCurrentViewMonth = (month, year) => {
    fetchAllReservationsByMonth(month, year)
      .then((resp) => {
        setReservations(resp);
      })
      .catch((error) => {
        console.error('Error fetching reservations:', error);
      });
  }

  const getViewDates = (args) => {
    const date = new Date(args.startStr);
    getReservationsByCurrentViewMonth(date.getMonth(), date.getFullYear());
  };

  return (
    <>
      <FullCalendar
        // TODO: Specify a timezone prop and tie into admin settings
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: ''
        }}
        businessHours={businessHours}
        showNonCurrentDates={false}
        datesSet={getViewDates}
        // events={events}
        // eventAllow={eventAllow}
        // eventContent={renderEventContent}
        // eventClick={handleEventClick}
        // eventReceive={handleEventReceive}
        // drop={handleDrop}
        // eventDrop={handleEventMove}
        // eventResize={handleEventResize}
        allDaySlot={false}
      />
    </>
  );
};

export default DashboardCalendar;