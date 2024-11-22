import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useSelector } from 'react-redux';
import { FirebaseDbService } from '../../Helpers/firebase';
import { useAuth } from '../AuthProvider';
import ChipBadge from './ChipBadge';

const DashboardCalendar = () => {
  const businessHours = useSelector(state => state.settings.businessHours);
  const [reservations, setReservations] = useState([]);
  const { currentUser } = useAuth();
  const [dbService, setDbService] = useState(null);

  useEffect(() => {
    setDbService(new FirebaseDbService(currentUser));
  }, [currentUser]);

  useEffect(() => {
    console.log('reservations:', reservations);
  }, [reservations]);

  const getReservationsByCurrentViewMonth = (month, year) => {
    dbService.fetchAllReservationsByMonth(month, year)
      .then((resp) => {
        setReservations(resp.map((reservation) => {
          return {
            status: reservation.extendedProps.status,
            title: reservation.title,
            start: new Date(reservation.start.seconds * 1000),
          }
        }));
      })
      .catch((error) => {
        console.error('Error fetching reservations:', error);
      });
  }

  const getViewDates = (args) => {
    const date = new Date(args.startStr);
    getReservationsByCurrentViewMonth(date.getMonth(), date.getFullYear());
  };

  const isBusinessDay = (date) => {
    return businessHours.daysOfWeek.includes(date.getDay());
  };

  const renderDayContent = (dayCellInfo) => {
    const dayEvents = reservations.filter((event) => {
      return event.start.getDate() === dayCellInfo.date.getDate();
    })

    if (dayEvents.length === 0 || !isBusinessDay(dayCellInfo.date)) {
      return (
        <div className="fc-daygrid-day-number">
          {dayCellInfo.dayNumberText}
          <div className="event-summary"></div>
        </div>
      );
    }
    return (
      <div className="fc-daygrid-day-number">
        {dayCellInfo.dayNumberText}
        <div className="event-summary">
          <ChipBadge text={'Pending'} color={'tomato'} num={1} />
          <ChipBadge text={'Approved'} color={'mediumseagreen'} num={5} />
          <ChipBadge text={'Capacity Fill'} num={37} />
        </div>
      </div>
    );
  }

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
        dayCellContent={renderDayContent}
        allDaySlot={false}
      />
    </>
  );
};

export default DashboardCalendar;