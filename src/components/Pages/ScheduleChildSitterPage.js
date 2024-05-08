import React, { useEffect, useState, useRef } from 'react';
import { Grid } from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Draggable } from '@fullcalendar/interaction';
import { checkReservationAllowability, deleteReservationDocument, fetchAllCurrentUsersChildren, fetchCurrentUser, fetchUserReservations } from '../../Helpers/firebase';
import { useAuth } from '../AuthProvider';
import DraggableChildEvent from '../Shared/DraggableChildEvent';
import { v4 as uuidv4 } from 'uuid';
import { checkAgainstBusinessHours, handleScheduleSave, renderEventContent, checkFutureStartTime } from '../../Helpers/calendar';
import ReservationFormModal from '../Shared/ReservationFormModal';
import { set } from 'react-hook-form';

const ScheduleChildSitterPage = () => {
  const [events, setEvents] = useState([]);  // Manage events in state rather than using FullCalendar's event source
  const draggableInitialized = useRef(false);
  const draggablesLoaded = useRef(false);
  const [children, setChildren] = useState([]);
  const { currentUser } = useAuth();
  const [currentUserData, setCurrentUserData] = useState({});
  const [modalOpenState, setModalOpenState] = useState(false);
  
  useEffect(() => {
    fetchCurrentUser(currentUser.email).then((resp) => {
      setCurrentUserData(resp);
    });
  }, [currentUser]);

  useEffect(() => {
    fetchUserReservations(currentUserData.id).then((resp) => {
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
  }, [currentUserData.id]);

  // Fetch children data and prepare draggables flag
  useEffect(() => {
    fetchAllCurrentUsersChildren(currentUser.email).then((resp) => {
      setChildren(resp);
    }).then(() => { draggablesLoaded.current = true; });
  }, [currentUser.email]);

  // Initialize draggable events
  useEffect(() => {
    if (!draggableInitialized.current && draggablesLoaded.current) { // Prevent multiple initializations from multiple renders
      const draggableEls = document.getElementsByClassName('draggable-event');
      Array.from(draggableEls).forEach(el => {
        new Draggable(el, {
          eventData: function (eventEl) {
            return JSON.parse(eventEl.getAttribute('data-event'));
          }
        });
      });
      draggableInitialized.current = true;
    }
  }, [children]);

  useEffect(() => {
    console.log('Events:', events);
  }, [events]);

  const businessHours = {
    daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
    startTime: '07:00', 
    endTime: '19:00', 
    overlap: false
  };

  const handleDrop = (info) => {
    const droppedEventData = JSON.parse(info.draggedEl.dataset.event);
    const newEvent = {
      id: uuidv4(), 
      title: droppedEventData.title,
      start: info.date.toISOString(),
      end:  new Date(new Date(info.date).getTime() + (60 * 60 * 1000 * parseInt(droppedEventData.duration.split(':')[0]))).toISOString(),
      allDay: info.allDay,
      extendedProps: {
        duration: droppedEventData.duration,
        status: 'pending',
        childId: droppedEventData.extendedProps.childId
      }
    };

    const isDuplicate = events.some(event =>
      event.start === newEvent.start &&
      event.title === newEvent.title &&
      event.extendedProps.duration === newEvent.extendedProps.duration
    );

    if (!isDuplicate) {
      setEvents(prevEvents => [...prevEvents, newEvent]);
    } else {
      console.warn('Event not added: Duplicate detected');
    }
  };

  // The eventReceive callback is triggered when a new event is created in FullCalendar.
  // Only now can we remove the event if it overlaps with too many existing reservations.
  const handleEventReceive = async (info) => {
    const overlap = await checkReservationAllowability(info.event, events);

    if (!overlap.allow) {
      // revert the event from FullCalendar
      info.revert();
      // remove from events state
      setEvents((prevEvents) => prevEvents.filter(e =>{
        return e.title !== info.event.title && e.start !== info.event.start && e.end !== info.event.end
      }));
      // alert the user
      await alert("This reservation overlaps with too many existing reservations. Please choose another time.")
    }
  }

  const handleEventResize = (resizeInfo) => {
    const { event } = resizeInfo;

    // Calculate the new duration in hours
    const durationHours = Math.abs(new Date(event.end) - new Date(event.start)) / (1000 * 60 * 60);

    const overlap = checkReservationAllowability(event, events, true);
    if (durationHours < 1) {
      resizeInfo.revert();
      alert('Reservations must be at least 1 hour long.');
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
    const overlap = checkReservationAllowability(event, events, true);
    console.log('Overlap:', overlap)

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

    setEvents(newEvents);
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
  // Only allow deletion of children reservations that belong to the current user
  const belongsToCurrentUser = children.some(child => child.id === event.extendedProps.childId);

  if (belongsToCurrentUser && window.confirm(`Are you sure you want to delete the event: ${event.title}?`)) {
    deleteReservationDocument(event.id);
    setEvents((prevEvents) => prevEvents.filter(e => e.id !== event.id));
  }
};

  return (
    <Grid container className="schedule-child-sitter-page">
      <Grid item xs={2} className="sidebar">
        <style>
          {`
            .draggable-event {
              padding: 10px;
              margin: 5px;
              background-color: #f9f9f9;
              border: 1px solid #ccc;
              cursor: pointer;
            }
          `}
        </style>
        <div className='draggable-event' draggable={true} data-event='{"title":"Event 1", "duration":"01:00"}'>
          Draggable Example Event
        </div>
        {children.map(child => <DraggableChildEvent key={child.id} child={child} />)}
      </Grid>
      <Grid item xs={10} className="main">
        <FullCalendar
          // TODO: Specify a timezone prop and tie into admin settings
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'newReservationForm saveButton'
          }}
          customButtons={{
            saveButton: {
              text: 'Save Schedule',
              click: () => handleScheduleSave(events, currentUserData)
            },
            newReservationForm: {
              text: 'New Reservation',
              click: () => setModalOpenState(true)
            }
          }}
          businessHours={businessHours}
          showNonCurrentDates={false}
          editable={true}
          droppable={true}
          events={events}
          eventAllow={eventAllow}
          eventContent={renderEventContent}
          eventClick={handleEventClick}
          eventReceive={handleEventReceive}
          drop={handleDrop}
          eventDrop={handleEventMove}
          eventResize={handleEventResize}
          nowIndicator={true}
          allDaySlot={false}
        />
      </Grid>
      <ReservationFormModal 
        modalOpenState={modalOpenState} 
        setModalOpenState={setModalOpenState} 
        children={children}
        setEvents={setEvents}
        events={events}
        handleScheduleSave={handleScheduleSave}
        currentUserData={currentUserData}
      />
    </Grid>
  );
};

export default ScheduleChildSitterPage;
