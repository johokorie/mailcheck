const express = require('express');
const Joi = require('joi');
const BulkService = require('../../services/bulkService');
const ThrottleManager = require('../../utils/throttle');
const logger = require('../../utils/logger');

const router = express.Router();

const createBulkJobSchema = Joi.object({
  emails: Joi.array().items(Joi.string().email()).required(),
}).unknown(true);

// POST /v1/bulk - Create a bulk job with throttling
router.post('/', async (req, res, next) => {
  try {
    // Apply throttling
    const throttle = new ThrottleManager(req.config.throttle);
    throttle.checkLimit(req.ip);

    const { error, value } = createBulkJobSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: error.details[0].message,
      });
    }

    const bulkService = new BulkService(req.config);
    const job = await bulkService.createBulkJob(value.emails);

    logger.info(`Created bulk job ${job.job_id} (v1)`);
    res.status(201).json(job);
  } catch (err) {
    next(err);
  }
});

// GET /v1/bulk/:job_id/progress - Get bulk job progress with throttling
router.get('/:job_id/progress', async (req, res, next) => {
  try {
    const throttle = new ThrottleManager(req.config.throttle);
    throttle.checkLimit(req.ip);

    const { job_id } = req.params;
    const bulkService = new BulkService(req.config);
    const status = await bulkService.getBulkJobStatus(job_id);

    res.json(status);
  } catch (err) {
    next(err);
  }
});

// GET /v1/bulk/:job_id/results - Get bulk job results with throttling
router.get('/:job_id/results', async (req, res, next) => {
  try {
    const throttle = new ThrottleManager(req.config.throttle);
    throttle.checkLimit(req.ip);

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
