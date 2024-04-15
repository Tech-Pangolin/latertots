import React, { useEffect } from 'react';

const StyledCalendarEvent = ({event, backgroundColor}) => {
  useEffect(() => {
      const currentNode = document.querySelector(`[data-event-id="${event.id}"]`);
      if (currentNode) {
          let ancestor = currentNode.closest('a'); // This finds the nearest anchor tag which is usually the event wrapper
          if (ancestor) {
              ancestor.style.backgroundColor = backgroundColor; // Change to desired background color
              ancestor.style.borderColor = backgroundColor; // Change to desired border color
          }
      }
  }, [event, backgroundColor]);

  return (
    <div className='fc-event-main' data-event-id={event.id} style={{ backgroundColor, padding: '5px', borderRadius: '5px', color: 'white' }}>
        <b>{event.title}</b>
        {event.extendedProps.status === 'pending' && (
            <i style={{ marginLeft: '5px' }}>Pending</i>
        )}
    </div>
  )
};

export default StyledCalendarEvent;