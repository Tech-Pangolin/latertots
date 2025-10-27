import { getAuth } from 'firebase/auth';
import { LOGGER_ERROR_MESSAGES } from './constants.mjs';

export const LOG_LEVELS = {
  NONE: 0,
  ERROR: 1,
  WARN: 2,
  INFO: 3,
  DEBUG: 4,
};

let currentLogLevel = LOG_LEVELS.ERROR;

export const setLogLevel = (level) => {
  currentLogLevel = level;
};

const sendToCloudLogs = async (logData) => {
  try {
    const auth = getAuth();
    const token = await auth.currentUser?.getIdToken();
    
    if (!token) {
      // No auth token available - silently skip cloud logging
      return;
    }

    await fetch(`${process.env.REACT_APP_FIREBASE_FUNCTION_URL}/writeLogs`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(logData)
    });
  } catch (error) {
    // Fallback to console if cloud logging fails - use generic error message
    console.error(LOGGER_ERROR_MESSAGES.SYSTEM_ERROR);
  }
};

const log = (level, message, ...args) => {
  if (level <= currentLogLevel) {
    // Send to cloud logging
    const logData = {
      level: level === LOG_LEVELS.ERROR ? 'error' :
             level === LOG_LEVELS.WARN ? 'warn' :
             level === LOG_LEVELS.INFO ? 'info' :
             level === LOG_LEVELS.DEBUG ? 'debug' : 'info',
      message,
      args,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };
    
    // Send to cloud (async, don't wait)
    sendToCloudLogs(logData);
    
    // Also log to console for development
    if (process.env.NODE_ENV === 'development') {
      switch (level) {
        case LOG_LEVELS.ERROR:
          console.error(message, ...args);
          break;
        case LOG_LEVELS.WARN:
          console.warn(message, ...args);
          break;
        case LOG_LEVELS.INFO:
          console.info(message, ...args);
          break;
        case LOG_LEVELS.DEBUG:
          console.debug(message, ...args);
          break;
        default:
          console.log(message, ...args);
      }
    }
  }
};

export const logger = {
  error: (message, ...args) => log(LOG_LEVELS.ERROR, message, ...args),
  warn: (message, ...args) => log(LOG_LEVELS.WARN, message, ...args),
  info: (message, ...args) => log(LOG_LEVELS.INFO, message, ...args),
  debug: (message, ...args) => log(LOG_LEVELS.DEBUG, message, ...args),
};
