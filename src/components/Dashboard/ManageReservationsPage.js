import React, { useEffect, useState } from 'react';
import { Grid } from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { FirebaseDbService } from '../../Helpers/firebase';
import { useAuth } from '../AuthProvider';
import { checkAgainstBusinessHours, handleScheduleSave, renderEventContent, checkFutureStartTime } from '../../Helpers/calendar';
import { logger } from '../../Helpers/logger';
import ReservationStatusDialog from '../Shared/ReservationStatusDialog';
import { useLocation } from 'react-router-dom';

const ManageReservationsPage = () => {
  const [events, setEvents] = useState([]);  // Manage events in state rather than using FullCalendar's event source
  const { currentUser } = useAuth();
  const [currentUserData, setCurrentUserData] = useState({});
  const [dbService, setDbService] = useState(null);
  const [currentDate, setCurrentDate] = useState(null);
  const [dialogOpenState, setDialogOpenState] = useState(false);
  const [dialogReservationContext, setDialogReservationContext] = useState(null);
  const [dialogValue, setDialogValue] = useState('pending'); // Only to track the status of the selected reservation
  const [refreshReservations, setRefreshReservations] = useState(false);
const initialDateValue = null;
  // const { state: { date: initialDateValue } } = useLocation();  

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
  }, [currentUser, dbService]);

  // Fetch ALL reservations for the current day
  // Save them in state under events
  useEffect(() => {
    if (!dbService) return;
    if (!currentDate) return;

    dbService.fetchAllReservationsByMonthDay(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate()).then((resp) => {
      let formattedEvents = [];
      resp.forEach((event) => {
        event.start = event.start.toDate().toISOString();
        event.end = event.end.toDate().toISOString();
        formattedEvents.push(event);
      })
      return formattedEvents;
    }
    ).then((resp) => {
      setEvents(resp);
    });
  }, [currentUser, dbService, currentDate, refreshReservations]);

  useEffect(() => {
    logger.info('Events:', events);
  }, [events]);

  // Set the dialog value when the dialog is opened
  useEffect(() => {
    if (!dialogReservationContext) return;
    setDialogValue(dialogReservationContext.extendedProps.status);
  }, [dialogReservationContext]);

  const businessHours = {
    daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
    startTime: '07:00', 
    endTime: '19:00', 
    overlap: false
  };

  const handleDatesSet = (dateInfo) => {
    setCurrentDate(dateInfo.start);
  }

  const handleEventResize = (resizeInfo) => {
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
  };

  const handleEventMove = (info) => {
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
};

// Enforce rules for where events can be dropped or resized
const eventAllow = (dropInfo) => {
  if (!checkAgainstBusinessHours(dropInfo) || !checkFutureStartTime(dropInfo)) {
    return false;
  }
  // Additional validation conditions
  return true;
};

const handleEventClick = ({ event }) => {
  setDialogReservationContext(event);
  setDialogOpenState(true);
};

const handleDialogClose = async (newValue) => {
  setDialogOpenState(false);
  if (newValue) {
    const newEvent = events.find((evt) => evt.id.toString() === dialogReservationContext.id.toString());
    newEvent.extendedProps.status = newValue;
    await handleScheduleSave([newEvent], currentUserData, dbService);
  } 
  setRefreshReservations(!refreshReservations);
}

  return (
    <Grid container spacing={2} justifyContent={"center"} className="schedule-child-sitter-page">
      <Grid item xs={1} />
      <Grid item xs={10} className="main" style={{ marginTop: "25px"}}>
        <FullCalendar
          // TODO: Specify a timezone prop and tie into admin settings
          plugins={[timeGridPlugin, interactionPlugin]}
          initialView="timeGridDay"
          views={{
            timeGridDay: {
              type: 'timeGrid',
              duration: { days: 1 }
            }
          }}
          initialDate={initialDateValue || new Date()}
          // Display an hour before open and after close
          // TODO: Tie these into business hours settings
          slotMinTime={"05:00:00"}
          slotMaxTime={"21:00:00"}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'backToAdminDashboard saveButton'
          }}
          customButtons={{
            saveButton: {
              text: 'Save Schedule',
              click: () => handleScheduleSave(events, currentUserData, dbService)
            },
            backToAdminDashboard: {
              text: 'Cancel',
              click: () => window.location.href = '/admin'
            }
          }}
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
          datesSet={handleDatesSet}
        />
        <ReservationStatusDialog
          keepMounted
          open={dialogOpenState}
          onClose={handleDialogClose}
          value={dialogValue}
          options={{
            'Confirm': 'confirmed',
            'Decline': 'declined', 
            'Refund': 'refunded',
          }}
          title="Update Reservation Status"
          reservationContext={dialogReservationContext}
        />
      </Grid>
      <Grid item xs={1} />
    </Grid>
  );
};

export default ManageReservationsPage;
