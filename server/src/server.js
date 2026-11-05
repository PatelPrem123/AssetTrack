import { app } from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/database.js';
import { logger } from './utils/logger.js';
import { startScheduler } from './jobs/warrantyScheduler.js';

async function startServer() {
  await connectDB();

  startScheduler();

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 AssetTrack Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    logger.info(`📡 API Health Check: http://localhost:${env.PORT}/api/v1/health`);
  });

  process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Promise Rejection:', err);
    server.close(() => process.exit(1));
  });

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    server.close(() => process.exit(1));
  });
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
