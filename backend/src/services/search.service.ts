import { esClient } from '../config/elasticsearch';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export const EMAIL_INDEX = 'emails';

export interface EmailSearchDoc {
  id: string;
  campaignId: string;
  senderId: string;
  userId?: string;
  recipient: string;
  senderEmail?: string;
  subject: string;
  body: string;
  status: string;
  scheduledAt: string;
  sentAt?: string | null;
  errorMessage?: string | null;
  createdAt: string;
}

export const searchService = {
  /**
   * Ensures the Elasticsearch index and mapping schema exist
   */
  async ensureIndexExists(): Promise<void> {
    try {
      const exists = await esClient.indices.exists({ index: EMAIL_INDEX });
      if (!exists) {
        logger.info(`Creating Elasticsearch index "${EMAIL_INDEX}"...`);
        await esClient.indices.create({
          index: EMAIL_INDEX,
          body: {
            mappings: {
              properties: {
                id: { type: 'keyword' },
                campaignId: { type: 'keyword' },
                senderId: { type: 'keyword' },
                userId: { type: 'keyword' },
                recipient: {
                  type: 'text',
                  fields: {
                    keyword: { type: 'keyword' },
                  },
                },
                senderEmail: {
                  type: 'text',
                  fields: {
                    keyword: { type: 'keyword' },
                  },
                },
                subject: { type: 'text' },
                body: { type: 'text' },
                status: { type: 'keyword' },
                scheduledAt: { type: 'date' },
                sentAt: { type: 'date' },
                errorMessage: { type: 'text' },
                createdAt: { type: 'date' },
              },
            },
          },
        });
        logger.info(`✅ Elasticsearch index "${EMAIL_INDEX}" created successfully.`);
      }
    } catch (error) {
      logger.warn({ error }, 'Elasticsearch ensureIndexExists warning / index may exist');
    }
  },

  /**
   * Index or update a single email document in Elasticsearch
   */
  async indexEmail(doc: EmailSearchDoc): Promise<void> {
    try {
      await this.ensureIndexExists();
      await esClient.index({
        index: EMAIL_INDEX,
        id: doc.id,
        document: doc,
        refresh: 'wait_for',
      });
      logger.info({ emailId: doc.id, recipient: doc.recipient }, 'Indexed email in Elasticsearch');
    } catch (error) {
      logger.warn({ error, emailId: doc.id }, 'Failed to index email in Elasticsearch');
    }
  },

  /**
   * Search emails using full-text Elasticsearch queries
   */
  async searchEmails(
    queryText: string,
    options: { userId?: string; status?: string; limit?: number; offset?: number } = {}
  ) {
    await this.ensureIndexExists();
    const { userId, status, limit = 50, offset = 0 } = options;

    const mustClauses: any[] = [];
    const filterClauses: any[] = [];

    if (queryText && queryText.trim()) {
      mustClauses.push({
        multi_match: {
          query: queryText.trim(),
          fields: ['recipient^3', 'recipient.keyword', 'subject^2', 'body', 'senderEmail'],
          fuzziness: 'AUTO',
        },
      });
    } else {
      mustClauses.push({ match_all: {} });
    }

    if (userId) {
      filterClauses.push({ term: { userId } });
    }

    if (status) {
      filterClauses.push({ term: { status } });
    }

    try {
      const response = await esClient.search({
        index: EMAIL_INDEX,
        from: offset,
        size: limit,
        query: {
          bool: {
            must: mustClauses,
            filter: filterClauses,
          },
        },
        sort: [{ scheduledAt: { order: 'desc' } }],
      });

      const hits = response.hits.hits.map((hit) => ({
        ...(hit._source as EmailSearchDoc),
        _score: hit._score,
      }));

      const total =
        typeof response.hits.total === 'number'
          ? response.hits.total
          : response.hits.total?.value || hits.length;

      return {
        success: true,
        source: 'elasticsearch',
        total,
        emails: hits,
      };
    } catch (error) {
      logger.warn({ error }, 'Elasticsearch search failed, falling back to PostgreSQL search');
      return null;
    }
  },

  /**
   * Sync all existing emails from PostgreSQL into Elasticsearch
   */
  async syncDatabaseToElasticsearch(): Promise<number> {
    try {
      await this.ensureIndexExists();
      const emails = await prisma.email.findMany({
        include: {
          campaign: true,
          sender: true,
        },
      });

      if (emails.length === 0) return 0;

      const operations = emails.flatMap((e) => [
        { index: { _index: EMAIL_INDEX, _id: e.id } },
        {
          id: e.id,
          campaignId: e.campaignId,
          senderId: e.senderId,
          userId: e.campaign.userId,
          recipient: e.recipient,
          senderEmail: e.sender?.email,
          subject: e.subject,
          body: e.body,
          status: e.status,
          scheduledAt: e.scheduledAt.toISOString(),
          sentAt: e.sentAt ? e.sentAt.toISOString() : null,
          errorMessage: e.errorMessage,
          createdAt: e.createdAt.toISOString(),
        },
      ]);

      const bulkResponse = await esClient.bulk({ refresh: true, operations });
      if (bulkResponse.errors) {
        logger.warn('Some errors occurred during bulk Elasticsearch sync');
      }

      logger.info(`✅ Synced ${emails.length} email records to Elasticsearch.`);
      return emails.length;
    } catch (error) {
      logger.warn({ error }, 'Elasticsearch sync from DB failed');
      return 0;
    }
  },
};
