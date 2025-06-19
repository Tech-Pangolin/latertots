import React, { useCallback, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ChipBadge from './ChipBadge';
import { useAdminPanelContext } from '../Dashboard/AdminPanelContext';
import { useReservationsByMonthDayRQ } from '../../Hooks/query-related/useReservationsByMonthDayRQ';
import { BUSINESS_HRS } from '../../Helpers/constants';

const DashboardCalendar = () => {
  const { setSelectedDate } = useAdminPanelContext();
  const {
    data: rawReservations = [],
    isLoading,
    isError,
    setMonthYear
  } = useReservationsByMonthDayRQ();

  const reservations = useMemo(() => rawReservations, [JSON.stringify(rawReservations)]);

  const getViewDates = useCallback((args) => {
    const date = new Date(args.startStr);
    setMonthYear({
      month: date.getMonth(),
      year: date.getFullYear()
    })
  }, [setMonthYear]);

  const isBusinessDay = useCallback((date) => {
    return BUSINESS_HRS.daysOfWeek.includes(date.getDay());
  }, [BUSINESS_HRS]);

  const renderDayContent = useCallback((dayCellInfo) => {
    const dayEvents = reservations.filter((event) => {
      return event.start.getDate() === dayCellInfo.date.getDate();
    })

    const pendingEvents = dayEvents.filter((event) => {
      return event.status === 'pending';
    });

    const approvedEvents = dayEvents.filter((event) => {
      return event.status === 'confirmed';
    });

    const unpaidEvents = dayEvents.filter((event) => {
      return ['unpaid', 'late'].includes(event.status)
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
          <ChipBadge
            text={'Pending'}
            color={'tomato'}
            num={pendingEvents.length.toString()}
          />
          <ChipBadge
            text={'Approved'}
            color={'mediumseagreen'}
            num={approvedEvents.length.toString()}
          />

          <ChipBadge
            text={'Unpaid'}
            color={'darkorange'}
            num={unpaidEvents.length.toString()}
          />


          {/* TODO: Display a percentage of capacity (which should be configurable in settings) */}
          {/* ie. If there are 12 hours and 12 child capacity, how many hours of 144 are filled? */}
        </div>
      </div>
    );
  }, [reservations, BUSINESS_HRS]);

  // Update daily view calendar when a date is clicked
  const handleDateClick = useCallback(info => {
    setSelectedDate(info.date);
  }, [setSelectedDate]);

  const pluginsConfig = useMemo(() => [dayGridPlugin, timeGridPlugin, interactionPlugin], [])
  const headerToolbarConfig = useMemo(() => ({
    left: 'prev,next today',
    center: 'title',
    right: ''
  }), []);

  return (
    <>
      <FullCalendar
        // TODO: Specify a timezone prop and tie into admin settings
        plugins={pluginsConfig}
        height={'auto'}
        headerToolbar={headerToolbarConfig}
        dateClick={handleDateClick}
        businessHours={BUSINESS_HRS}
        showNonCurrentDates={false}
        datesSet={getViewDates}
        dayCellContent={renderDayContent}
        allDaySlot={false}
      />
    </>
  );
};

export default DashboardCalendar;