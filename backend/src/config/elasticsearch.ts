import { Client } from '@elastic/elasticsearch';
import { env } from './env';
import { logger } from '../utils/logger';

export const esClient = new Client({
  node: env.ELASTICSEARCH_URL,
  auth:
    env.ELASTICSEARCH_USERNAME && env.ELASTICSEARCH_PASSWORD
      ? {
          username: env.ELASTICSEARCH_USERNAME,
          password: env.ELASTICSEARCH_PASSWORD,
        }
      : undefined,
});

export const checkElasticsearch = async (): Promise<boolean> => {
  try {
    const health = await esClient.cluster.health();
    logger.info({ status: health.status }, 'Elasticsearch cluster health OK');
    return true;
  } catch (error) {
    logger.warn({ err: error instanceof Error ? error.message : error }, 'Elasticsearch not ready or connection failed');
    return false;
  }
};
