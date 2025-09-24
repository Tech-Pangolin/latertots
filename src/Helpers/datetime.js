import { Timestamp } from "firebase/firestore";
import { DateTime } from "luxon";


export const luxonDateTimeFromFirebaseTimestamp = (() => {
  const luxonFBCache = new Map();

  return (ts) => {
    const key = ts.toMillis();
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
