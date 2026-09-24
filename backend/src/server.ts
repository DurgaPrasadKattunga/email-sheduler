import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { connectDatabase, prisma } from './config/database';
import { connectRedis, redisConnection } from './config/redis';
import { checkElasticsearch } from './config/elasticsearch';
import { searchService } from './services/search.service';
import { startEmailWorker, stopEmailWorker } from './queue/email.worker';
import { closeEmailQueue } from './queue/email.queue';

const PORT = env.PORT || 5000;

async function bootstrap() {
  try {
    // 1. Connect to PostgreSQL
    await connectDatabase();

    // 2. Connect to Redis
    await connectRedis();

    // 3. Verify Elasticsearch and Sync Database
    await checkElasticsearch();
    await searchService.ensureIndexExists();
    await searchService.syncDatabaseToElasticsearch();

    // 4. Start BullMQ Worker
    startEmailWorker();

    // 5. Start HTTP Server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} [${env.NODE_ENV}]`);
      logger.info(`🩺 Health check: http://localhost:${PORT}/health`);
    });

    const handleShutdown = async (signal: string) => {
      logger.info(`${signal} received: closing services gracefully...`);
      server.close(async () => {
        logger.info('HTTP server closed.');
        try {
          await stopEmailWorker();
          await closeEmailQueue();
          await prisma.$disconnect();
          logger.info('Database disconnected.');
          await redisConnection.quit();
          logger.info('Redis connection closed.');
        } catch (err) {
          logger.error({ err }, 'Error during shutdown cleanup');
        }
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (error) {
    logger.error({ error }, 'Fatal error during server bootstrap');
    process.exit(1);
  }
}

bootstrap();
