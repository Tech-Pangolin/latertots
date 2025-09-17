import { BUSINESS_HRS } from './constants';

/**
 * Generates 15-minute time slot aggregates for confirmed appointments
 * 
 * @param {Array} confirmedAppointments - Array of confirmed appointment events
 * @returns {Array} Array of aggregate events for FullCalendar
 */
export function generateTimeSlotAggregates(confirmedAppointments) {
  if (!confirmedAppointments || confirmedAppointments.length === 0) {
    return [];
  }

  // Group appointments by 15-minute time slots
  const slotMap = new Map();
  
  // Generate all possible 15-minute slots within business hours
  const businessStartHour = parseInt(BUSINESS_HRS.startTime.split(':')[0]);
  const businessEndHour = parseInt(BUSINESS_HRS.endTime.split(':')[0]);
  
  // Get unique dates from all appointments
  const appointmentDates = [...new Set(confirmedAppointments.map(apt => {
    const date = new Date(apt.start);
    return date.toDateString();
  }))];
  
  // Create slots for each unique date
  appointmentDates.forEach(dateString => {
    const targetDate = new Date(dateString);
    
    // Create slots for each hour in business hours on this date
    for (let hour = businessStartHour; hour < businessEndHour; hour++) {
      const slots = ['00', '15', '30', '45'];
      
      slots.forEach(minutes => {
        const slotStart = new Date(targetDate);
        slotStart.setHours(hour, parseInt(minutes), 0, 0);
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + 15);
        
        const slotKey = `${dateString}-${hour.toString().padStart(2, '0')}:${minutes}`;
        slotMap.set(slotKey, {
          start: slotStart,
          end: slotEnd,
          appointments: []
        });
      });
    }
  });
  
  // Count appointments in each slot
  confirmedAppointments.forEach((appointment, index) => {
    // Use the original string dates to preserve timezone information
    const apptStart = new Date(appointment.start);
    const apptEnd = new Date(appointment.end);
    
    slotMap.forEach((slot, slotKey) => {
      if (shouldCountAppointmentInSlot(apptStart, apptEnd, slot.start, slot.end)) {
        slot.appointments.push(appointment);
      }
    });
  });
  
  // Convert slots with appointments to aggregate events
  const aggregates = [];
  slotMap.forEach((slot, slotKey) => {
    if (slot.appointments.length > 0) {
      const aggregateEvent = {
        id: `aggregate-${slotKey}`,
        title: `${slot.appointments.length} appointment${slot.appointments.length === 1 ? '' : 's'}`,
        start: slot.start.toISOString(),
        end: slot.end.toISOString(),
        extendedProps: {
          isAggregate: true,
          appointmentIds: slot.appointments.map(apt => apt.id),
          count: slot.appointments.length,
          appointments: slot.appointments // Store full appointment data for future use
        }
      };
      aggregates.push(aggregateEvent);
    }
  });
  
  return aggregates;
}

/**
 * Determines if an appointment should be counted in a specific time slot
 * 
 * @param {Date} apptStart - Appointment start time
 * @param {Date} apptEnd - Appointment end time
 * @param {Date} slotStart - Time slot start time
 * @param {Date} slotEnd - Time slot end time
 * @returns {boolean} True if appointment should be counted in this slot
 */
function shouldCountAppointmentInSlot(apptStart, apptEnd, slotStart, slotEnd) {
  // Appointment must actively occupy the slot
  // Excludes: appointment ends exactly at slot start OR starts exactly at slot end
  return apptStart < slotEnd && apptEnd > slotStart;
}
