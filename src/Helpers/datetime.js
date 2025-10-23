import { Timestamp } from "firebase/firestore";
import { DateTime } from "luxon";


export const luxonDateTimeFromFirebaseTimestamp = (() => {
  const luxonFBCache = new Map();

  return (ts) => {
    // Handle different input types
    let key;
    if (ts && typeof ts.toMillis === 'function') {
      // Firebase Timestamp object
      key = ts.toMillis();
    } else if (ts && typeof ts.getTime === 'function') {
      // JavaScript Date object
      key = ts.getTime();
    } else if (typeof ts === 'string') {
      // ISO string
      key = new Date(ts).getTime();
    } else if (typeof ts === 'number') {
      // Already a timestamp
      key = ts;
    } else {
      console.warn('Unknown timestamp format:', ts);
      return null;
    }

    if (!luxonFBCache.has(key)) {
      const dt = DateTime.fromMillis(key);
      luxonFBCache.set(key, dt);
    }
    return luxonFBCache.get(key);
  }
})();

export const luxonDateTimeFromJSDate = (() => {
  const luxonJSCache = new Map();

  return (jsd) => {
    const key = jsd.getMilliseconds();
    if (!luxonJSCache.has(key)) {
      const dt = DateTime.fromMillis(key);
      luxonJSCache.set(key, dt);
    }
    return luxonJSCache.get(key);
  }
})();

export const luxonDateTimeFromISOString = (() => {
  const luxonISOCache = new Map();
  return (isoString) => {
    if (!luxonISOCache.has(isoString)) {
      const dt = DateTime.fromISO(isoString);
      luxonISOCache.set(isoString, dt);
    }
    return luxonISOCache.get(isoString);
  }
})();

export const firebaseTimestampFromLuxonDateTime = (dt) => Timestamp.fromMillis(dt.toMillis());

/**
 * Converts a Firebase Timestamp to a date string format suitable for HTML date inputs
 * @param {Object} timestamp - Firebase Timestamp object
 * @returns {string} - Date string in YYYY-MM-DD format
 */
export const firebaseTimestampToFormDateString = (timestamp) => {
  if (!timestamp || !timestamp.toDate) return '';
  const luxonDateTime = luxonDateTimeFromFirebaseTimestamp(timestamp);
  return luxonDateTime.toISODate(); // Returns YYYY-MM-DD format
};

/**
 * Checks if an event date falls within a specific calendar day
 * @param {string|Date} eventDate - The event date (ISO string or Date object)
 * @param {Date} calendarDay - The calendar day to check against
 * @returns {boolean} - True if the event falls on the calendar day
 */
export const isEventOnCalendarDay = (eventDate, calendarDay) => {
  const event = new Date(eventDate);
  const day = new Date(calendarDay);

  // Set both dates to start of day for comparison
  const eventStartOfDay = new Date(event.getFullYear(), event.getMonth(), event.getDate());
  const calendarStartOfDay = new Date(day.getFullYear(), day.getMonth(), day.getDate());

  return eventStartOfDay.getTime() === calendarStartOfDay.getTime();
};


/**
 * Calculates the difference in time between start time and end time
 */
export const calculateTimeDifference = (startTime, endTime) => {
  // Parse "HH:MM"
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);

  // Convert to minutes from midnight
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;

  // Difference in minutes (handle crossing midnight)
  let diffMinutes = endMinutes - startMinutes;
  if (diffMinutes < 0) diffMinutes += 24 * 60;

  // Convert to hours as a decimal
  const diffHours = diffMinutes / 60;

  return diffHours.toFixed(2);
};