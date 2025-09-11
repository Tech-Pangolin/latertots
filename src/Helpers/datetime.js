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
