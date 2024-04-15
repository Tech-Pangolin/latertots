import React, { useEffect, useState, useRef } from 'react';
import { Grid } from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Draggable } from '@fullcalendar/interaction';
import { fetchAllCurrentUsersChildren } from '../../Helpers/firebase';
import { useAuth } from '../AuthProvider';
import DraggableChildEvent from '../Shared/DraggableChildEvent';

const ScheduleChildSitterPage = () => {
  const [events, setEvents] = useState([]);  // Manage events in state rather than using FullCalendar's event source
  const draggableInitialized = useRef(false);
  const draggablesLoaded = useRef(false);
  const [children, setChildren] = useState([]);
  const { currentUser: { email } } = useAuth();


  useEffect(() => {
    // Fetch children data
    fetchAllCurrentUsersChildren(email).then((resp) => {
      setChildren(resp);
    }).then(() => { draggablesLoaded.current = true; });
  }, [email]);

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
      id: new Date().getTime(),  // TODO: Use a better ID
      title: droppedEventData.title,
      start: info.date.toISOString(),
      end: new Date(info.date).getTime() + (60 * 60 * 1000 * parseInt(droppedEventData.duration.split(':')[0])),
      allDay: info.allDay,
      extendedProps: {
        duration: droppedEventData.duration
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
            right: ''
          }}
          showNonCurrentDates={false}
          editable={true}
          droppable={true}
          events={events}
          drop={handleEventDrop}
          eventResize={handleEventResize}
        />
      </Grid>
    </Grid>
  );
};

export default ScheduleChildSitterPage;
