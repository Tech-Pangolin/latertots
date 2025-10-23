import { setLogLevel, LOG_LEVELS } from "../Helpers/logger";

LOG_LEVELS = {
  NONE: 0,
  ERROR: 1,
  WARN: 2,
  INFO: 3,
  DEBUG: 4,
};

// By default, only show errors in the console
setLogLevel(LOG_LEVELS.ERROR);