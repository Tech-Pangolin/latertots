import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useSelector } from 'react-redux';
import { useAuth } from '../AuthProvider';
import ChipBadge from './ChipBadge';
import { logger } from '../../Helpers/logger';
import { useNavigate } from 'react-router-dom';

const DashboardCalendar = () => {
  const businessHours = useSelector(state => state.settings.businessHours);
  const [reservations, setReservations] = useState([]);
  const { currentUser, dbService } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    logger.info('reservations:', reservations);
    logger.info('currentUser:', currentUser);
  }, [reservations]);

  const getReservationsByCurrentViewMonth = (month, year) => {
    try {
      dbService.fetchAllReservationsByMonthDay(year, month)
      .then((resp) => {
        return setReservations(resp.map((reservation) => {
          return {
            status: reservation.extendedProps.status,
            title: reservation.title,
            start: new Date(reservation.start.seconds * 1000),
          }
        }))
      })
      .catch((error) => {
        logger.error('Error fetching reservations:', error);
      });
    } catch (error) {
      logger.error('Error in getReservationsByCurrentViewMonth:', error);
    }
    
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

    const pendingEvents = dayEvents.filter((event) => {
      return event.status === 'pending';
    });

    const approvedEvents = dayEvents.filter((event) => {
      return event.status === 'confirmed';
    });

    const chipClickHandler = () => {
      navigate('/admin/manageReservations', {state: {date: dayCellInfo.date} });
    }

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
          <ChipBadge 
            text={'Pending'} 
            color={'tomato'} 
            num={pendingEvents.length.toString()}
            clickHandler={chipClickHandler} 
          />
          <ChipBadge 
            text={'Approved'} 
            color={'mediumseagreen'} 
            num={approvedEvents.length.toString()}
            clickHandler={chipClickHandler} 
          />

          {/* TODO: Display a percentage of capacity (which should be configurable in settings) */}
          {/* ie. If there are 12 hours and 12 child capacity, how many hours of 144 are filled? */}
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