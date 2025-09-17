import React, { useEffect } from 'react';

/**
 * Component for displaying aggregate time slot events on the calendar
 * Shows count of confirmed appointments in a 15-minute time slot
 */
const AggregateTimeSlot = ({ event, backgroundColor }) => {
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
    <div 
      className='fc-event-main' 
      data-event-id={event.id} 
      style={{ 
        backgroundColor, 
        padding: '5px', 
        borderRadius: '5px', 
        color: 'white',
        fontWeight: 'bold'
      }}
    >
      <b>{event.title}</b>
    </div>
  );
};

export default AggregateTimeSlot;
