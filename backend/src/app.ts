import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { logger } from './utils/logger';
import { prisma } from './config/database';
import { checkRedisHealth } from './config/redis';
import { checkElasticsearch } from './config/elasticsearch';
import { getQueueStats } from './queue/email.queue';
import { serverAdapter } from './config/bullBoard';
import { errorHandler } from './middleware/error.middleware';
import { authRouter } from './routes/auth.routes';
import { emailRouter } from './routes/email.routes';
import { campaignRouter } from './routes/campaign.routes';
import { slackRouter } from './routes/slack.routes';

const app = express();

// Security and utility middleware
app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.originalUrl !== '/health') {
      logger.info(
        {
          method: req.method,
          url: req.originalUrl,
          status: res.statusCode,
          duration: `${duration}ms`,
        },
        'HTTP Request'
      );
    }
  });
  next();
});

// Comprehensive Health & Dependency Check Endpoint
app.get('/health', async (req: Request, res: Response) => {
  let dbStatus = 'healthy';
  let redisStatus = 'healthy';
  let esStatus = 'healthy';
  let queueStats = null;

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'degraded/unreachable';
  }

  const isRedisOk = await checkRedisHealth();
  if (!isRedisOk) {
    redisStatus = 'degraded/unreachable';
  }

  const isEsOk = await checkElasticsearch();
  if (!isEsOk) {
    esStatus = 'degraded/unreachable';
  }

  if (isRedisOk) {
    try {
      queueStats = await getQueueStats();
    } catch {
      queueStats = null;
    }
  }

  const isAllHealthy =
    dbStatus === 'healthy' && redisStatus === 'healthy' && esStatus === 'healthy';

  const memoryUsage = process.memoryUsage();

  res.status(isAllHealthy ? 200 : 503).json({
    status: isAllHealthy ? 'ok' : 'degraded',
    service: 'email-scheduler-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    environment: env.NODE_ENV,
    dependencies: {
      postgres: dbStatus,
      redis: redisStatus,
      elasticsearch: esStatus,
    },
    queue: {
      concurrency: env.WORKER_CONCURRENCY,
      minDelayMs: env.MIN_EMAIL_DELAY_MS,
      maxEmailsPerHour: env.MAX_EMAILS_PER_HOUR,
      stats: queueStats,
    },
    system: {
      heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
    },
  });
});

// Bull Board Queue Dashboard
app.use('/admin/queues', serverAdapter.getRouter());

// API Routes
app.use('/auth', authRouter);
app.use('/api/emails', emailRouter);
app.use('/api/campaigns', campaignRouter);
app.use('/api/slack', slackRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
});

// Global error handler
app.use(errorHandler);

export default app;
