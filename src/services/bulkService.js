// Bulk email verification service

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { getPgPool } = require('../utils/db');

class BulkService {
  constructor(config) {
    this.config = config;
  }

  async createBulkJob(emails, options = {}) {
    if (!Array.isArray(emails) || emails.length === 0) {
      throw new ValidationError('At least one email is required');
    }

    const pool = await getPgPool();
    if (!pool) {
      throw new Error('Database not configured');
    }

    const jobId = uuidv4();
    const createdAt = new Date();

    try {
      // Create job record in database
      await pool.query(
        `INSERT INTO bulk_jobs (id, total_emails, status, created_at)
         VALUES ($1, $2, $3, $4)`,
        [jobId, emails.length, 'pending', createdAt]
      );

      // Create email records
      for (const email of emails) {
        await pool.query(
          `INSERT INTO bulk_emails (id, job_id, email, status)
           VALUES ($1, $2, $3, $4)`,
          [uuidv4(), jobId, email, 'pending']
        );
      }

      logger.info(`Created bulk job ${jobId} with ${emails.length} emails`);

      return {
        job_id: jobId,
        total_emails: emails.length,
        status: 'pending',
        created_at: createdAt,
      };
    } catch (error) {
      logger.error(error, `Failed to create bulk job`);
      throw error;
    }
  }

  async getBulkJobStatus(jobId) {
    const pool = await getPgPool();
    if (!pool) {
      throw new Error('Database not configured');
    }

    try {
      const result = await pool.query(
        `SELECT id, total_emails, status, created_at, updated_at
         FROM bulk_jobs WHERE id = $1`,
        [jobId]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError(`Bulk job ${jobId} not found`);
      }

      const job = result.rows[0];

      // Get counts by status
      const countResult = await pool.query(
        `SELECT status, COUNT(*) as count FROM bulk_emails
         WHERE job_id = $1 GROUP BY status`,
        [jobId]
      );

      const counts = {};
      countResult.rows.forEach((row) => {
        counts[row.status] = parseInt(row.count, 10);
      });

      return {
        job_id: job.id,
        total_emails: job.total_emails,
        status: job.status,
        counts,
        created_at: job.created_at,
        updated_at: job.updated_at,
      };
    } catch (error) {
      logger.error(error, `Failed to get bulk job status for ${jobId}`);
      throw error;
    }
  }

  async getBulkResults(jobId, limit = 100, offset = 0) {
    const pool = await getPgPool();
    if (!pool) {
      throw new Error('Database not configured');
    }

    try {
      // Verify job exists
      const jobResult = await pool.query(
        `SELECT id FROM bulk_jobs WHERE id = $1`,
        [jobId]
      );

      if (jobResult.rows.length === 0) {
        throw new NotFoundError(`Bulk job ${jobId} not found`);
      }

      // Get results with pagination
      const resultsResult = await pool.query(
        `SELECT id, email, status, result FROM bulk_emails
         WHERE job_id = $1
         ORDER BY created_at ASC
         LIMIT $2 OFFSET $3`,
        [jobId, limit, offset]
      );

      return {
        job_id: jobId,
        results: resultsResult.rows,
        limit,
        offset,
        total: resultsResult.rowCount,
      };
    } catch (error) {
      logger.error(error, `Failed to get bulk results for ${jobId}`);
      throw error;
    }
  }
}

module.exports = BulkService;
