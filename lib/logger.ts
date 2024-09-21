// lib/logger.ts

import { createLogger, transports, format } from 'winston';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'newsletter-service' },
  transports: [
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
    // Additional transports (e.g., File) can be added here
  ],
});

export default logger;
