import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { FirebaseDbService } from '../../Helpers/firebase';
import { useAuth } from '../AuthProvider';
import { checkAgainstBusinessHours, handleScheduleSave, renderEventContent, checkFutureStartTime } from '../../Helpers/calendar';
import { logger } from '../../Helpers/logger';
import ReservationStatusDialog from '../Shared/ReservationStatusDialog';
import { useReservationsByMonthDayRQ } from '../../Hooks/query-related/useReservationsByMonthDayRQ';
import { useAdminPanelContext } from './AdminPanelContext';
import _ from 'lodash';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const ManageReservationsPage = () => {
  const { currentUser } = useAuth();
  const [currentUserData, setCurrentUserData] = useState({});
  const [dbService, setDbService] = useState(null);
  const [dialogOpenState, setDialogOpenState] = useState(false);
  const [dialogReservationContext, setDialogReservationContext] = useState(null);
  const [dialogValue, setDialogValue] = useState(null); // Only to track the status of the selected reservation
  const { selectedDate, setSelectedDate } = useAdminPanelContext();
  const calendarComponentRef = useRef(null);
  const [eevents, setEvents] = useState([]);  // Manage events in state rather than using FullCalendar's event source
  const queryClient = useQueryClient();


  const {
    data: rawEvents = [],
    isLoading,
    isError,
    error
  } = useReservationsByMonthDayRQ();

  const events = useMemo(() => rawEvents, [JSON.stringify(rawEvents)]);

  // get the dbService instance
  useEffect(() => {
    setDbService(new FirebaseDbService(currentUser));
  }, [currentUser]);

  // Fetch the current user's data
  useEffect(() => {
    if (!dbService) return;
    dbService.fetchCurrentUser(currentUser.email).then((resp) => {
      setCurrentUserData(resp);
    });
  }, [currentUser]);

  useEffect(() => {
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

  const businessHours = useMemo(() => ({
    daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
    startTime: '07:00',
    endTime: '19:00',
    overlap: false
  }), []);

  const handleEventResize = useCallback((resizeInfo) => {
    const { event } = resizeInfo;

    // Calculate the new duration in hours
    const durationHours = Math.abs(new Date(event.end) - new Date(event.start)) / (1000 * 60 * 60);

    const overlap = dbService.checkReservationAllowability(event, events);
    console.log("overlap", overlap)

    if (durationHours < 2) {
      resizeInfo.revert();
      alert('Reservations must be at least 2 hours long.');
      return;
    } else if (!overlap.allow) {
      resizeInfo.revert();
      alert(overlap.message);
      return;
    };

    const newEvents = events.map((evt) => {
      if (evt.id.toString() === event.id.toString()) {
        return {
          ...evt,
          end: event.end.toISOString(),  // Use ISO string for FullCalendar compatibility
          extendedProps: {
            ...evt.extendedProps,
            duration: `${durationHours.toFixed(2)}:00`  // Updated duration, formatted as a string
          }
        };
      }
      return evt;
    });

    setEvents(newEvents);
  }, [events]);

  const handleEventMove = useCallback((info) => {
    const { event } = info;
    const overlap = dbService.checkReservationAllowability(event, events);

    if (!overlap.allow) {
      info.revert();
      alert(overlap.message);
      return;
    }

    const newEvents = events.map((evt) => {
      if (evt.id.toString() === event.id.toString()) {
        return {
          ...evt,
          start: event.start.toISOString(),
          end: event.end.toISOString()
        };
      }
      return evt;
    });

    // Validate the new event state
    let allowSave = false;
    if (checkAgainstBusinessHours(event) && checkFutureStartTime(event)) {
      allowSave = dbService.checkReservationAllowability(event);
    }

    // Update the events state if the new event is valid
    if (allowSave) {
      setEvents(newEvents);
    }
  }, [events]);

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
    right: 'backToAdminDashboard saveButton'
  }), []);
  const customButtonsConfig = useMemo(() => ({
    saveButton: {
      text: 'Save Schedule',
      click: () =>
        handleScheduleSave(events, currentUserData, dbService)
    },
    backToAdminDashboard: {
      text: 'Cancel',
      click: () => (window.location.href = '/admin')
    }
  }), [events]);

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
          customButtons={customButtonsConfig}
          height="1100px"
          expandRows={true}
          handleWindowResize={true}

          businessHours={businessHours}
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
ManageReservationsPage.whyDidYouRender = true;

export default ManageReservationsPage;
