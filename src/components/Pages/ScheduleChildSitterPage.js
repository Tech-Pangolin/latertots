import React, { useEffect } from 'react';
import { Grid } from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Draggable } from '@fullcalendar/interaction';

const ScheduleChildSitterPage = () => {

  useEffect(() => {
    /**
     * useEffect hook to initialize draggable events.
     * It selects all elements with the class 'draggable-event' and makes them draggable using the Draggable library.
     * The eventData function is used to retrieve event data from the element's attributes.
     */
    let draggableEls = document.getElementsByClassName('draggable-event');
    Array.from(draggableEls).forEach((el) => {
      new Draggable(el, {
        eventData: function(eventEl) {
          let event = JSON.parse(eventEl.getAttribute('data-event'));
          return {
            ...event,
            duration: event.duration
          };
        }
      });
    });
  }, []);

  // Function to handle event drop
  // There have been issues with duplicate calendar events being created when dragging events
  const handleEventDrop = (info) => {
    console.log(info);
    const droppedEventData = JSON.parse(info.draggedEl.dataset.event);

    // Access the calendar API from the view
    const calendarApi = info.view.calendar;

    // Retrieve all events from the calendar
    const allEvents = calendarApi.getEvents();

    // Check if an identical event already exists
    const isDuplicateEvent = allEvents.some(event => {
        const eventStart = event.startStr.slice(0, 10);  // Format 'YYYY-MM-DD'
        // Compare other properties as well for a more specific match
        return event.title === droppedEventData.title &&
               eventStart === info.dateStr &&
               (event.extendedProps.duration === droppedEventData.duration);
    });

    // Only create a new event if no identical event exists
    if (!isDuplicateEvent) {
        calendarApi.addEvent({
            title: droppedEventData.title,
            start: info.date,
            allDay: info.allDay, // or use your specific setting based on droppedEventData
            extendedProps: {
                duration: droppedEventData.duration // Additional properties
            }
        });
        console.log('Event added:', droppedEventData.title);
    } else {
        console.log('Event not added: A duplicate event already exists on this day.');
    }
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
        <div className='draggable-event fc-event' draggable={true} data-event='{"title":"Event 1", "duration":"02:00"}'>
            Drag Event 1
        </div>
        <div className='draggable-event fc-event' draggable={true} data-event='{"title":"Event 2", "duration":"03:00"}'>
            Drag Event 2
        </div>
      </Grid>
      <Grid item xs={10} className="main">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: ''
          }}
          showNonCurrentDates={false}
          events={[
            { title: 'Meeting', start: '2024-04-12T10:30:00', end: '2024-04-12T12:30:00' },
            { title: 'Lunch Break', start: '2024-04-13T12:00:00', end: '2024-04-13T13:00:00' }
          ]}
          editable={true} // Enable draggable events
          droppable={true}
          drop={handleEventDrop}
        />
      </Grid>
    </Grid>
  );
};

export default ScheduleChildSitterPage;