// Centralized logging utility
export const log = {
  info: (message, data = {}) => {
    console.log(`[INFO] ${message}`, data);
  },
  error: (message, error = {}) => {
    console.error(`[ERROR] ${message}`, error);
  },
  debug: (message, data = {}) => {
    console.debug(`[DEBUG] ${message}`, data);
  }
};
