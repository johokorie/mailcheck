const express = require('express');
const Joi = require('joi');
const BulkService = require('../../services/bulkService');
const logger = require('../../utils/logger');
const { ValidationError } = require('../../utils/errors');

const router = express.Router();

const createBulkJobSchema = Joi.object({
  emails: Joi.array().items(Joi.string().email()).required(),
}).unknown(true);

// POST /v0/bulk - Create a bulk job
router.post('/', async (req, res, next) => {
  try {
    const { error, value } = createBulkJobSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: error.details[0].message,
      });
    }

    const bulkService = new BulkService(req.config);
    const job = await bulkService.createBulkJob(value.emails);

    logger.info(`Created bulk job ${job.job_id}`);
    res.status(201).json(job);
  } catch (err) {
    next(err);
  }
});

// GET /v0/bulk/:job_id - Get bulk job status
router.get('/:job_id', async (req, res, next) => {
  try {
    const { job_id } = req.params;
    const bulkService = new BulkService(req.config);
    const status = await bulkService.getBulkJobStatus(job_id);

    res.json(status);
  } catch (err) {
    next(err);
  }
});

// GET /v0/bulk/:job_id/results - Get bulk job results
router.get('/:job_id/results', async (req, res, next) => {
  try {
    const { job_id } = req.params;
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 1000);
    const offset = parseInt(req.query.offset, 10) || 0;

    const bulkService = new BulkService(req.config);
    const results = await bulkService.getBulkResults(job_id, limit, offset);

    res.json(results);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
