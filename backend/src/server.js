/**
 * Server Entry Point
 */

require('dotenv').config();

const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');

const PORT = config.port;

const server = app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`, { 
    environment: config.nodeEnv,
    port: PORT,
  });
});

// Graceful shutdown
const shutdown = (signal) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
