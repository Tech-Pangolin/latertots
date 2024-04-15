import React from 'react';

const DraggableChildEvent = ({child}) => {
  const generateDataEventValue = (child) => {
    return JSON.stringify({
      title: child.Name,
      duration: "01:00"
    });
  };

  return (
    <div className='draggable-event' draggable={true} data-event={generateDataEventValue(child)}>
      {child.Name}
    </div>
  );
};

export default DraggableChildEvent;