import { checkAgainstBusinessHours, checkFutureStartTime, renderEventContent } from '../../Helpers/calendar';
import FullCalendar from '@fullcalendar/react';
import interactionPlugin from '@fullcalendar/interaction';
import { logger } from '../../Helpers/logger';
import timeGridPlugin from '@fullcalendar/timegrid';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReservationStatusDialog from '../Shared/ReservationStatusDialog';
import { useAuth } from '../AuthProvider';
import { useAdminPanelContext } from './AdminPanelContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useReservationsByMonthDayRQ } from '../../Hooks/query-related/useReservationsByMonthDayRQ';
import _ from 'lodash';
import { BUSINESS_HRS, MIN_RESERVATION_DURATION_MS } from '../../Helpers/constants';

const ManageReservationsPage = () => {
  const { dbService } = useAuth();
  const { selectedDate } = useAdminPanelContext();
  const calendarComponentRef = useRef(null);
  const queryClient = useQueryClient();

  const [dialogOpenState, setDialogOpenState] = useState(false);
  const [dialogReservationContext, setDialogReservationContext] = useState(null);
  const [dialogValue, setDialogValue] = useState(null); // Only to track the status of the selected reservation

  const {
    data: rawEvents = [],
    setMonthYear,
    isLoading,
    isError,
    error
  } = useReservationsByMonthDayRQ();

  const prevRawEventsRef = useRef([]);
  const events = useMemo(() => {
    if (!_.isEqual(prevRawEventsRef.current, rawEvents)) {
      prevRawEventsRef.current = rawEvents;
    }
    return prevRawEventsRef.current;
  }, [rawEvents]);

  useEffect(() => {
    setMonthYear({
      month: selectedDate.getUTCMonth(),
      year: selectedDate.getUTCFullYear(),
    });

    if (!selectedDate || !calendarComponentRef.current) return;
    // Use a timeout to ensure the calendar is fully rendered before navigating
    const handle = setTimeout(() => {
      const api = calendarComponentRef.current.getApi();
      api.gotoDate(selectedDate);
    }, 0);

    return () => clearTimeout(handle);
  }, [selectedDate]);

  useEffect(() => {
    logger.info('Events:', events);
  }, [events]);

  // Set the dialog value when the dialog is opened
  useEffect(() => {
    if (!dialogReservationContext) return;
    setDialogValue(dialogReservationContext.extendedProps.status);
  }, [dialogReservationContext]);

  const reservationTimeChangeMutation = useMutation({
    mutationKey: ['changeReservationTime'],
    mutationFn: async ({ id, newStart, newEnd }) => dbService.changeReservationTime(id, newStart, newEnd),
    onSuccess: () => {
      queryClient.invalidateQueries(
        ['adminCalendarReservationsByMonth'],
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

  // Enforce rules for where events can be dropped or resized
  const eventAllow = useCallback((dropInfo) => {
    if (!checkAgainstBusinessHours(dropInfo) || !checkFutureStartTime(dropInfo)) {
      return false;
    }
    // Additional validation conditions
    return true;
  }, []);

  const handleEventClick = useCallback(({ event }) => {
    setDialogReservationContext(event);
    setDialogOpenState(true);
  }, [setDialogReservationContext, setDialogOpenState]);

  const reservationStatusMutation = useMutation(
    {
      mutationKey: ['changeReservationStatus'],
      mutationFn: async ({ id, status }) => dbService.changeReservationStatus(id, status),
      onSuccess: () => {
        queryClient.invalidateQueries(
          ['adminCalendarReservationsByMonth'],
          selectedDate.getUTCMonth(),
          selectedDate.getUTCFullYear()
        );
      },
      onError: (error) => {
        console.error('Error updating reservation status:', error);
      }
    }
  )

  const handleDialogClose = useCallback(async (newValue) => {
    setDialogOpenState(false);
    if (newValue) {
      reservationStatusMutation.mutate({ id: dialogReservationContext.id, status: newValue });
    }
  }, [dialogReservationContext, reservationStatusMutation]);

  const pluginsConfig = useMemo(() => [timeGridPlugin, interactionPlugin], []);
  const viewsConfig = useMemo(() => ({ timeGridDay: { type: 'timeGrid', duration: { days: 1 } } }), []);
  const headerToolbarConfig = useMemo(() => ({
    left: 'prev,next today',
    center: 'title',
    right: ''
  }), []);

  if (isLoading) {
    return <div>Loading...</div>;
  } else if (isError) {
    console.error('Error loading reservations:', error);
    return <div>Error loading reservations.</div>;
  } else {
    return (
      <>
        <FullCalendar
          ref={calendarComponentRef}
          plugins={pluginsConfig}
          initialView="timeGridDay"
          views={viewsConfig}
          slotMinTime="05:00:00"
          slotMaxTime="21:00:00"
          headerToolbar={headerToolbarConfig}
          height="1100px"
          expandRows={true}
          handleWindowResize={true}

          businessHours={BUSINESS_HRS}
          showNonCurrentDates={false}
          editable={true}
          events={events}
          eventAllow={eventAllow}
          eventContent={renderEventContent}
          eventClick={handleEventClick}
          eventDrop={handleEventMove}
          eventResize={handleEventResize}
          nowIndicator={true}
          allDaySlot={false}
        />

        <ReservationStatusDialog
          keepMounted
          open={dialogOpenState}
          onClose={handleDialogClose}
          value={dialogValue}
          options={{
            Confirm: 'confirmed',
            Decline: 'declined',
            Refund: 'refunded',
            Complete: 'completed',
          }}
          title="Update Reservation Status"
          reservationContext={dialogReservationContext}
        />
      </>
    )
  }
};

export default ManageReservationsPage;
