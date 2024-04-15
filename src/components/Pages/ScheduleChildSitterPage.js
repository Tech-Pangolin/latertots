import React, { useEffect, useState, useRef } from 'react';
import { Grid } from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Draggable } from '@fullcalendar/interaction';
import { createReservationDocument, fetchAllCurrentUsersChildren, fetchCurrentUser } from '../../Helpers/firebase';
import { useAuth } from '../AuthProvider';
import DraggableChildEvent from '../Shared/DraggableChildEvent';
import StyledCalendarEvent from '../Shared/StyledCalendarEvent';
import { v4 as uuidv4 } from 'uuid';

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

  const handleEventDrop = (info) => {
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

  const renderEventContent = (eventInfo) => {
    const { event } = eventInfo;
    const backgroundColor = event.extendedProps.status === 'confirmed' ? 'green' : 'orange';
    return <StyledCalendarEvent event={event} backgroundColor={backgroundColor} />;
  }

  const handleScheduleSave = (events) => {
    events.forEach(async event => {
      // Save each event to the database
      await createReservationDocument(currentUserData.id, event)
    });
    console.log('Schedule saved:', events);
  }


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
              click: () => handleScheduleSave(events)
            }
          }}
          showNonCurrentDates={false}
          editable={true}
          droppable={true}
          events={events}
          eventContent={renderEventContent}
          drop={handleEventDrop}
          eventResize={handleEventResize}
        />
      </Grid>
    </Grid>
  );
};

export default ScheduleChildSitterPage;
