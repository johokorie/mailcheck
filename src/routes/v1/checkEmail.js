const express = require('express');
const Joi = require('joi');
const EmailService = require('../../services/emailService');
const ThrottleManager = require('../../utils/throttle');
const logger = require('../../utils/logger');

const router = express.Router();

const checkEmailSchema = Joi.object({
  to_email: Joi.string().email().required(),
  proxy: Joi.object({
    host: Joi.string().required(),
    port: Joi.number().required(),
    username: Joi.string(),
    password: Joi.string(),
  }),
}).unknown(true);

router.post('/', async (req, res, next) => {
  try {
    // Apply throttling
    const throttle = new ThrottleManager(req.config.throttle);
    throttle.checkLimit(req.ip);

    // Validate request
    const { error, value } = checkEmailSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: error.details[0].message,
      });
    }

    const emailService = new EmailService(req.config);
    const result = await emailService.checkEmail(value.to_email, {
      proxy: value.proxy,
    });

    logger.info(`Email check completed for ${value.to_email}`);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
