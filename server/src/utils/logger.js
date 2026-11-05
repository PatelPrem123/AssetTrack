const isTest = process.env.NODE_ENV === 'test';

export const logger = {
  info: (msg, ...args) => {
    if (!isTest) console.log(`[INFO] [${new Date().toISOString()}] ${msg}`, ...args);
  },
  warn: (msg, ...args) => {
    if (!isTest) console.warn(`[WARN] [${new Date().toISOString()}] ${msg}`, ...args);
  },
  error: (msg, ...args) => {
    if (!isTest) console.error(`[ERROR] [${new Date().toISOString()}] ${msg}`, ...args);
  },
  debug: (msg, ...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] [${new Date().toISOString()}] ${msg}`, ...args);
    }
  },
};
