import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Grid } from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useAuth } from '../AuthProvider';
import { checkAgainstBusinessHours, renderEventContent, checkFutureStartTime } from '../../Helpers/calendar';
import ReservationFormModal from '../Shared/ReservationFormModal';
import { BUSINESS_HRS, MIN_RESERVATION_DURATION_MS } from '../../Helpers/constants';
import { useReservationsByMonthDayRQ } from '../../Hooks/query-related/useReservationsByMonthDayRQ';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logger } from '../../Helpers/logger';

const ScheduleChildSitterPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const queryClient = useQueryClient();
  const [children, setChildren] = useState([]);
  const { currentUser, dbService } = useAuth();
  const [modalOpenState, setModalOpenState] = useState(false);

  const { data: events = [], setMonthYear } = useReservationsByMonthDayRQ()

  // Fetch children data
  useEffect(() => {
    if (!dbService) return;
    dbService.fetchAllCurrentUsersChildren(currentUser.email).then((resp) => {
      setChildren(resp);
    });
  }, [currentUser.email, dbService]);

  useEffect(() => {
    logger.info('Events:', events);
    logger.info("children:", children);
  }, [events]);

  const getViewDates = useCallback((args) => {
    setSelectedDate(args.start);
    setMonthYear({
      day: args.start.getDate(),
      week: args.view.type === 'timeGridWeek',
      month: args.start.getMonth(),
      year: args.start.getFullYear()
    })
  }, []);

  const reservationTimeChangeMutation = useMutation({
    mutationFn: async ({ id, newStart, newEnd }) => dbService.changeReservationTime(id, newStart, newEnd),
    onSuccess: () => {
      queryClient.invalidateQueries(
        ['adminCalendarReservationsByWeek'],
        selectedDate.getUTCDate(),
        selectedDate.getUTCMonth(),
        selectedDate.getUTCFullYear()
      )
    },
    onError: (err) => console.error("Error changing reservation time: ", err)
  })

  const handleEventResize = useCallback((resizeInfo) => {
    const { event } = resizeInfo;

    // Calculate the new duration in hours
    const durationHours = Math.abs(new Date(event.end) - new Date(event.start));
    if (durationHours < MIN_RESERVATION_DURATION_MS) {
      resizeInfo.revert();
      alert('Reservations must be at least 2 hours long.');
      return;
    }

    // Check if event is during too many other reservations
    const overlap = dbService.checkReservationOverlapLimit(event, events);
    if (!overlap.allow) {
      resizeInfo.revert();
      alert(overlap.message);
      return;
    }

    reservationTimeChangeMutation.mutate({ id: event.id, newStart: event.start, newEnd: event.end });
  }, [events, dbService, reservationTimeChangeMutation]);


  const handleEventMove = useCallback((info) => {
    const { event } = info;

    if (!checkAgainstBusinessHours(event) || !checkFutureStartTime(event)) {
      info.revert();
      return
    }

    const overlap = dbService.checkReservationOverlapLimit(event, events);
    if (!overlap.allow) {
      info.revert();
      alert(overlap.message);
      return;
    }

    reservationTimeChangeMutation.mutate({
      id: event.id,
      newStart: event.start,
      newEnd: event.end
    })
  }, [events, dbService, reservationTimeChangeMutation]);


  const reservationArchiveChangeMutation = useMutation({
    mutationFn: async (eventId) => dbService.archiveReservationDocument(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries(
        ['adminCalendarReservationsByWeek'],
        selectedDate.getUTCDate(),
        selectedDate.getUTCMonth(),
        selectedDate.getUTCFullYear()
      )
    },
    onError: (err) => console.error("Error archiving reservation: ", err)
  })

  const handleEventClick = useCallback(({ event }) => {
    // Only allow deletion of children reservations that belong to the current user
    const belongsToCurrentUser = children.some(child => child.id === event.extendedProps.childId);

    if (currentUser.Role == 'admin' || (belongsToCurrentUser && window.confirm(`Are you sure you want to remove the event: ${event.title}?`))) {
      reservationArchiveChangeMutation.mutate(event.id);
    }
  }, [children, currentUser, reservationArchiveChangeMutation]);

  // Enforce rules for where events can be dropped or resized
  const eventAllow = useCallback((dropInfo) => {
    if (!checkAgainstBusinessHours(dropInfo) || !checkFutureStartTime(dropInfo)) {
      return false;
    }
    // Additional validation conditions
    return true;
  }, []);

  const pluginsConfig = useMemo(() => [dayGridPlugin, timeGridPlugin, interactionPlugin], []);
  const headerToolbarConfig = useMemo(() => ({
    left: 'prev,next today',
    center: 'title',
    right: 'newReservationForm'
  }), []);
  const customButtonsConfig = useMemo(() => ({
    newReservationForm: {
      text: 'New Reservation',
      click: () => setModalOpenState(true)
    }
  }), []);

  return (
    <Grid container className="schedule-child-sitter-page">
      <Grid item xs={1} />
      <Grid item xs={10} className="main" style={{ marginTop: '15px' }}>
        <FullCalendar
          // TODO: Specify a timezone prop and tie into admin settings
          plugins={pluginsConfig}
          initialView="timeGridWeek"
          headerToolbar={headerToolbarConfig}
          customButtons={customButtonsConfig}
          businessHours={BUSINESS_HRS}
          showNonCurrentDates={false}
          editable={true}
          droppable={true}
          datesSet={getViewDates}
          events={events}
          eventAllow={eventAllow}
          eventContent={renderEventContent}
          eventClick={handleEventClick}
          eventDrop={handleEventMove}
          eventResize={handleEventResize}
          nowIndicator={true}
          allDaySlot={false}
        />
      </Grid>
      <Grid item xs={1} />
      <ReservationFormModal
        modalOpenState={modalOpenState}
        setModalOpenState={setModalOpenState}
        children={children}
        events={events}
        currentUserData={currentUser}
      />
    </Grid>
  );
};

export default ScheduleChildSitterPage;
