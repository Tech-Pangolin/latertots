import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Grid } from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthProvider';
import { checkAgainstBusinessHours, renderEventContent, checkFutureStartTime } from '../../Helpers/calendar';
import UnifiedReservationModal from '../Shared/UnifiedReservationModal';
import { BUSINESS_HRS, MIN_RESERVATION_DURATION_MS } from '../../Helpers/constants';
import { getProfileIncompleteMessage } from '../../Helpers/util';
import { useReservationsByMonthDayRQ } from '../../Hooks/query-related/useReservationsByMonthDayRQ';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LOG_LEVELS, logger, setLogLevel } from '../../Helpers/logger';
import { luxonDateTimeFromISOString, luxonDateTimeFromJSDate } from '../../Helpers/datetime';
import { DateTime } from 'luxon';

setLogLevel(LOG_LEVELS.DEBUG); // Set log level to 'info' for debugging

const ScheduleChildSitterPage = () => {
  const [selectedDate, setSelectedDate] = useState(DateTime.now());
  const queryClient = useQueryClient();
  const [children, setChildren] = useState([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState(true);
  const { currentUser, dbService } = useAuth();
  const [modalOpenState, setModalOpenState] = useState(false);
  const [initialContext, setInitialContext] = useState(null);

  // Handle modal close with context reset
  const closeTheModal = () => {
    setModalOpenState(false);
    setInitialContext(null); // Reset to default for future opens
  };
  const navigate = useNavigate();
  const { data: events = [], setMonthYear } = useReservationsByMonthDayRQ()
  
  // Handle URL parameters for payment recovery
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success') {
      setInitialContext('payment_success');
      setModalOpenState(true);
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'failed') {
      setInitialContext('payment_failed');
      setModalOpenState(true);
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);
  
  // Fetch children data
  useEffect(() => {
    if (!dbService) return;
    setIsLoadingChildren(true);
    dbService.fetchAllCurrentUsersChildren(currentUser.email).then((resp) => {
      setChildren(resp);
      setIsLoadingChildren(false);
    }).catch((error) => {
      console.error('Error fetching children:', error);
      setIsLoadingChildren(false);
    });
  }, [currentUser.email, dbService]);

  // Redirect to profile if no children are registered OR profile is incomplete
  useEffect(() => {
    if (!isLoadingChildren && currentUser.Role !== 'admin' && dbService) {
      // Check for missing children
      if (children.length === 0) {
        navigate('/profile', {
          state: {
            alerts: [{
              id: Date.now().toString(),
              type: 'warning',
              message: 'Please register at least one child before scheduling appointments.',
              autoDismissDelayMillis: null
            }],
            switchToTab: 'children'
          }
        });
        return;
      }
      
      // Check for incomplete profile
      const profileWarning = getProfileIncompleteMessage(currentUser);
      if (profileWarning) {
        navigate('/profile', {
          state: {
            alerts: [{
              id: Date.now().toString(),
              type: 'warning',
              message: profileWarning,
              autoDismissDelayMillis: null
            }],
            switchToTab: 'home' // User Info tab
          }
        });
      }
    }
  }, [isLoadingChildren, children, currentUser, navigate, dbService]);

  const formatDateTime = (dt) => {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    };

    const readableTime = new Date(dt).toLocaleString('en-US', options);
    return readableTime;
  }
  const getViewDates = useCallback((args) => {
    setSelectedDate(luxonDateTimeFromISOString(args.startStr));
    setMonthYear({
      day: luxonDateTimeFromISOString(args.startStr).day,
      week: args.view.type === 'timeGridWeek',
      month: luxonDateTimeFromISOString(args.startStr).month - 1, // FullCalendar months are 0-indexed
      year: luxonDateTimeFromISOString(args.startStr).year
    })
  }, []);

  const reservationTimeChangeMutation = useMutation({
    mutationFn: async ({ id, newStart, newEnd }) => dbService.changeReservationTime(id, newStart, newEnd),
    onSuccess: () => {
      queryClient.invalidateQueries(
        ['calendarReservationsByWeek'],
        selectedDate.toUTC().day,
        selectedDate.toUTC().month - 1,
        selectedDate.toUTC().year
      )
    },
    onError: (err) => console.error("Error changing reservation time: ", err)
  })

  const handleEventResize = useCallback(async (resizeInfo) => {
    const { event } = resizeInfo;

    // Calculate the new duration in hours
    const durationHours = Math.abs(new Date(event.end) - new Date(event.start));
    if (durationHours < MIN_RESERVATION_DURATION_MS) {
      resizeInfo.revert();
      alert('Reservations must be at least 2 hours long.');
      return;
    }

    // Check if event is during too many other reservations
    const overlap = await dbService.checkReservationOverlapLimit(event, events);
    if (!overlap.allow) {
      resizeInfo.revert();
      alert(overlap.message);
      return;
    }

    reservationTimeChangeMutation.mutate({ id: event.id, newStart: event.start, newEnd: event.end });
  }, [events, dbService, reservationTimeChangeMutation]);


  const handleEventMove = useCallback(async (info) => {
    const { event } = info;

    if (!checkAgainstBusinessHours(event) || !checkFutureStartTime(event)) {
      info.revert();
      return
    }

    const overlap = await dbService.checkReservationOverlapLimit(event, events);
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


  const archiveReservationMutation = useMutation({
    mutationFn: async (eventId) => dbService.archiveReservationDocument(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries(
        ['calendarReservationsByWeek'],
        selectedDate.getUTCDate(),
        selectedDate.getUTCMonth(),
        selectedDate.getUTCFullYear()
      )
    },
    onError: (err) => { if (process.env.NODE_ENV === 'development') { console.error("Error: ", err) } }
  })
  const handleEventClick = useCallback(({ event }) => {
    // Only allow deletion of children reservations that belong to the current user
    const belongsToCurrentUser = children.some(child => child.id === event.childId);

    if (currentUser.Role === 'admin' || (belongsToCurrentUser && window.confirm(`Are you sure you want to remove the event: ${event.title}?`))) {
      archiveReservationMutation.mutate(event.id);
    }
  }, [children, currentUser, archiveReservationMutation]);

  const handleEventClickMobile = useCallback(({ event }) => {
    // Only allow deletion of children reservations that belong to the current user
    const belongsToCurrentUser = children.some(child => child.id === event.childId);

    if (currentUser.Role === 'admin' || (belongsToCurrentUser && window.confirm(`Are you sure you want to remove the event: ${event.title}?`))) {
      archiveReservationMutation.mutate(event.id);
    }
  }, [children, currentUser, archiveReservationMutation]);
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
      click: () => {
        const profileWarning = getProfileIncompleteMessage(currentUser);
        if (profileWarning) {
          alert(profileWarning); // Simple alert for immediate feedback
          navigate('/profile', {
            state: {
              alerts: [{
                id: Date.now().toString(),
                type: 'warning',
                message: profileWarning,
                autoDismissDelayMillis: null
              }],
              switchToTab: 'home'
            }
          });
          return;
        }
        setModalOpenState(true);
      }
    }
  }), [currentUser, navigate]);

  // Calculate min and max times based on business hours (1 hour before/after)
  const timeBounds = useMemo(() => {
    const businessStart = BUSINESS_HRS.startTime; // '07:00'
    const businessEnd = BUSINESS_HRS.endTime; // '19:00'

    // Parse business hours
    const [startHour, startMin] = businessStart.split(':').map(Number);
    const [endHour, endMin] = businessEnd.split(':').map(Number);

    // Calculate min time (1 hour before business start)
    const minHour = startHour - 1;
    const minTime = `${minHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;

    // Calculate max time (1 hour after business end)
    const maxHour = endHour + 1;
    const maxTime = `${maxHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;

    return { slotMinTime: minTime, slotMaxTime: maxTime };
  }, []);

  return (
    <Grid container className="schedule-child-sitter-page" style={{ minHeight: 'auto' }}>
      <Grid item xs={1} />
      <Grid item xs={10} className="main" style={{ marginTop: '15px', marginBottom: '15px' }}>
        <div className='d-block d-md-none'>
          <h2 className='mb-3'>Schedule Child Sitter</h2>
          <button 
            onClick={() => {
              const profileWarning = getProfileIncompleteMessage(currentUser);
              if (profileWarning) {
                alert(profileWarning);
                navigate('/profile', {
                  state: {
                    alerts: [{
                      id: Date.now().toString(),
                      type: 'warning',
                      message: profileWarning,
                      autoDismissDelayMillis: null
                    }],
                    switchToTab: 'home'
                  }
                });
                return;
              }
              setModalOpenState(true);
            }} 
            className="btn btn-secondary"
          >
            New Reservation
          </button>
          <h5 className='mt-4'>Current Reservations</h5>
          {events.length === 0 && <p>No reservations scheduled.</p>}
          {events.length > 0 && events.map(event => (

            <div key={event.id} className="card mb-2">
              <div className="card-body d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="card-title">{event.title}</h5>
                  <p className="card-text">{formatDateTime(event.start)} - {formatDateTime(event.end)}</p>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => handleEventClickMobile({ event })}>Cancel</button>
              </div>
            </div>
          ))}
        </div>
        <div className="d-none d-md-block mb-3">
          <FullCalendar
            // TODO: Specify a timezone prop and tie into admin settings
            plugins={pluginsConfig}
            initialView="timeGridWeek"
            headerToolbar={headerToolbarConfig}
            customButtons={customButtonsConfig}
            businessHours={BUSINESS_HRS}
            slotMinTime={timeBounds.slotMinTime}
            slotMaxTime={timeBounds.slotMaxTime}
            height="auto"
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
        </div>
      </Grid>
      <Grid item xs={1} />
      <UnifiedReservationModal
        modalOpenState={modalOpenState}
        closeTheModal={closeTheModal}
        children={children}
        scheduleChildSitterPage_queryKey={['calendarReservationsByMonth', selectedDate.month - 1, selectedDate.year]}
        initialContext={initialContext}
      />
    </Grid>
  );
};
// ScheduleChildSitterPage.whyDidYouRender = true; // Enable for debugging purposes
export default ScheduleChildSitterPage;
