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

const log = (level, message, ...args) => {
  if (level <= currentLogLevel) {
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
};

export const logger = {
  error: (message, ...args) => log(LOG_LEVELS.ERROR, message, ...args),
  warn: (message, ...args) => log(LOG_LEVELS.WARN, message, ...args),
  info: (message, ...args) => log(LOG_LEVELS.INFO, message, ...args),
  debug: (message, ...args) => log(LOG_LEVELS.DEBUG, message, ...args),
};
