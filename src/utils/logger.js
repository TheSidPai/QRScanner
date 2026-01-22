const DEBUG_MODE = false;

const logger = {
  log: (...args) => {
    if (DEBUG_MODE) console.log(...args);
  },
  error: (...args) => {
    if (DEBUG_MODE) console.error(...args);
  },
};

export default logger;