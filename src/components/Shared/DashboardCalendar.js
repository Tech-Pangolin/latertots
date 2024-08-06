import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useSelector } from 'react-redux';
import { Draggable } from '@fullcalendar/interaction';
import { checkReservationAllowability, deleteReservationDocument, fetchAllCurrentUsersChildren, fetchCurrentUser, fetchUserReservations } from '../../Helpers/firebase';
import { useAuth } from '../AuthProvider';
import DraggableChildEvent from '../Shared/DraggableChildEvent';
import { v4 as uuidv4 } from 'uuid';
import { checkAgainstBusinessHours, handleScheduleSave, renderEventContent, checkFutureStartTime } from '../../Helpers/calendar';
import ReservationFormModal from '../Shared/ReservationFormModal';

const DashboardCalendar = () => {
  const businessHours = useSelector(state => state.settings.businessHours);

  return (
    <>
      <FullCalendar
        // TODO: Specify a timezone prop and tie into admin settings
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: ''
        }}
        businessHours={businessHours}
        showNonCurrentDates={false}
        // events={events}
        // eventAllow={eventAllow}
        // eventContent={renderEventContent}
        // eventClick={handleEventClick}
        // eventReceive={handleEventReceive}
        // drop={handleDrop}
        // eventDrop={handleEventMove}
        // eventResize={handleEventResize}
        allDaySlot={false}
      />
    </>
  );
};

export default DashboardCalendar;