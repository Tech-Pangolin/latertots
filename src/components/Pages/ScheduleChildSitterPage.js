import React, { useEffect, useState, useRef } from 'react';
import { Grid } from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Draggable } from '@fullcalendar/interaction';
import { deleteReservationDocument, fetchAllCurrentUsersChildren, fetchCurrentUser, fetchUserReservations } from '../../Helpers/firebase';
import { useAuth } from '../AuthProvider';
import DraggableChildEvent from '../Shared/DraggableChildEvent';
import { v4 as uuidv4 } from 'uuid';
import { checkAgainstBusinessHours, handleScheduleSave, renderEventContent, checkFutureStartTime } from '../../Helpers/calendar';

const ScheduleChildSitterPage = () => {
  const [events, setEvents] = useState([]);  // Manage events in state rather than using FullCalendar's event source
  const draggableInitialized = useRef(false);
  const draggablesLoaded = useRef(false);
  const [children, setChildren] = useState([]);
  const { currentUser } = useAuth();
  const [currentUserData, setCurrentUserData] = useState({});
  
  useEffect(() => {
    fetchCurrentUser(currentUser.email).then((resp) => {
      setCurrentUserData(resp);
    });
  }, [currentUser]);

  useEffect(() => {
    fetchUserReservations(currentUserData.id).then((resp) => {
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
      end: new Date(new Date(info.date).getTime() + (60 * 60 * 1000 * parseInt(droppedEventData.duration.split(':')[0]))).toISOString(),
      allDay: info.allDay,
      extendedProps: {
        duration: droppedEventData.duration,
        status: 'pending',
        childId: droppedEventData.extendedProps.childId
      }
    };

    console.log('New event:', info);

    const isDuplicate = events.some(event =>
      event.start === newEvent.start &&
      event.title === newEvent.title &&
      event.extendedProps.duration === newEvent.extendedProps.duration
    );

    if (!isDuplicate) {
      setEvents(prevEvents => [...prevEvents, newEvent]);
      console.log('Event added:', newEvent.title);
    } else {
      console.log('Event not added: Duplicate detected');
    }
  };

  const handleEventResize = (resizeInfo) => {
    const { event } = resizeInfo;

    // Calculate the new duration in hours
    const durationHours = Math.abs(new Date(event.end) - new Date(event.start)) / (1000 * 60 * 60);

    if (durationHours < 1) {
      resizeInfo.revert();  // Prevent events from being resized to less than 1 hour
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
const eventAllow = (dropInfo, draggedEvent) => {
  if (!checkAgainstBusinessHours(dropInfo, businessHours) || !checkFutureStartTime(dropInfo)) {
    return false;
  }
  // Additional validation conditions
  return true;
};

const handleEventClick = ({ event }) => {
  if (window.confirm(`Are you sure you want to delete the event: ${event.title}?`)) {
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
            right: 'saveButton'
          }}
          customButtons={{
            saveButton: {
              text: 'Save Schedule',
              click: () => handleScheduleSave(events, currentUserData)
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
          drop={handleDrop}
          eventDrop={handleEventMove}
          eventResize={handleEventResize}
          nowIndicator={true}
          allDaySlot={false}
        />
      </Grid>
    </Grid>
  );
};

export default ScheduleChildSitterPage;
