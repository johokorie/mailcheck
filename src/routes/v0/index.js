const express = require('express');
const checkEmailRouter = require('./checkEmail');
const bulkRouter = require('./bulk');
const { checkHeaderSecret } = require('../../utils/auth');
const config = require('../../config');

const router = express.Router();

// Apply header secret check to all v0 routes
router.use(checkHeaderSecret(config));

// Routes
router.use('/check_email', checkEmailRouter);
router.use('/bulk', bulkRouter);

module.exports = router;
