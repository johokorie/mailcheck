const { Pool } = require('pg');
const amqp = require('amqplib');
const logger = require('./logger');

let pgPool = null;
let mqChannel = null;

async function connectDatabase(dbUrl) {
  if (pgPool) return pgPool;

  pgPool = new Pool({ connectionString: dbUrl });
  pgPool.on('error', (err) => {
    logger.error(err, 'Unexpected error on idle client');
  });

  try {
    const client = await pgPool.connect();
    client.release();
    logger.info('Successfully connected to Postgres');
  } catch (err) {
    logger.error(err, 'Failed to connect to Postgres');
    throw err;
  }

  return pgPool;
}

async function getPgPool() {
  return pgPool;
}

async function connectRabbitMQ(url) {
  if (mqChannel) return mqChannel;

  try {
    const connection = await amqp.connect(url);
    mqChannel = await connection.createChannel();
    logger.info('Connected to RabbitMQ');
    return mqChannel;
  } catch (err) {
    logger.error(err, 'Failed to connect to RabbitMQ');
    throw err;
  }
}

async function initWorker(config) {
  if (!config.worker?.enable || !config.worker?.rabbitmq?.url) {
    return;
  }

  try {
    const channel = await connectRabbitMQ(config.worker.rabbitmq.url);
    const concurrency = config.worker.rabbitmq.concurrency || 5;

    // Set up consumer with concurrency
    await channel.prefetch(concurrency);
    logger.info(`Worker initialized with concurrency: ${concurrency}`);
  } catch (err) {
    logger.error(err, 'Failed to initialize worker');
    throw err;
  }
}

async function getMQChannel() {
  return mqChannel;
}

module.exports = {
  connectDatabase,
  getPgPool,
  connectRabbitMQ,
  initWorker,
  getMQChannel,
};
