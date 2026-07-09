// Reacher - Email Verification
// Copyright (C) 2018-2023 Reacher

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const pinoHttp = require('pino-http');
const logger = require('./utils/logger');
const config = require('./config');
const routes = require('./routes');
const { connectDatabase, initWorker } = require('./utils/db');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Logging
app.use(pinoHttp({ logger }));

// Body parsing
app.use(express.json({ limit: '10mb' }));

// Request/response middleware
app.use((req, res, next) => {
  req.config = config;
  next();
});

// Routes
app.use('/v0', routes.v0);
app.use('/v1', routes.v1);
app.get('/version', (req, res) => {
  res.json({
    version: '0.11.7',
    backend_name: config.backend_name,
  });
});

// Error handling
app.use((err, req, res, next) => {
  logger.error(err, 'Unhandled error');
  res.status(err.status || 500).json({
    error: err.message,
    status: err.status || 500,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
async function startServer() {
  try {
    const port = process.env.PORT || config.http_port;
    const host = config.http_host;

    // Connect to database if storage is configured
    if (config.storage?.type === 'postgres') {
      await connectDatabase(config.storage.db_url);
      logger.info('Connected to Postgres database');
    }

    // Initialize worker if enabled
    if (config.worker?.enable) {
      await initWorker(config);
      logger.info('Worker initialized');
    }

    app.listen(port, host, () => {
      logger.info(`Server listening on http://${host}:${port}`);
    });
  } catch (error) {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  }
}

startServer();

module.exports = app;
