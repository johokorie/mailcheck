// Configuration loader - supports TOML config file and environment variables

const fs = require('fs');
const path = require('path');
const toml = require('toml');
const logger = require('./utils/logger');

function loadConfig() {
  let config = {
    backend_name: 'backend-dev',
    http_host: '127.0.0.1',
    http_port: 8080,
    hello_name: 'localhost',
    from_email: 'hello@localhost',
    smtp_timeout: null,
    header_secret: null,
    sentry_dsn: null,
    webdriver_addr: 'http://localhost:9515',
    webdriver: {
      binary: null,
    },
    worker: {
      enable: false,
      rabbitmq: {
        url: 'amqp://guest:guest@localhost:5672',
        concurrency: 5,
      },
      webhook: null,
    },
    storage: null,
    throttle: {
      max_requests_per_second: null,
      max_requests_per_minute: 60,
      max_requests_per_hour: 1000,
      max_requests_per_day: 10000,
    },
    overrides: {
      proxies: {},
      gmail: null,
      hotmailb2b: null,
      hotmailb2c: null,
      mimecast: null,
      proofpoint: null,
      yahoo: null,
    },
  };

  // Load from config file if exists
  const configPath = path.join(process.cwd(), 'backend_config.toml');
  if (fs.existsSync(configPath)) {
    try {
      const fileConfig = toml.parse(fs.readFileSync(configPath, 'utf-8'));
      config = { ...config, ...fileConfig };
      logger.info(`Loaded config from ${configPath}`);
    } catch (err) {
      logger.warn(`Failed to load config file: ${err.message}`);
    }
  }

  // Load from environment variables (take precedence)
  const envPrefix = 'RCH__';
  Object.keys(process.env).forEach((key) => {
    if (key.startsWith(envPrefix)) {
      const configKey = key
        .substring(envPrefix.length)
        .toLowerCase()
        .replace(/__/g, '.');
      setNestedProperty(config, configKey, process.env[key]);
    }
  });

  // Validate configuration
  if (config.worker?.enable && !config.storage?.db_url) {
    throw new Error('Worker mode requires Postgres database to be configured');
  }

  return config;
}

function setNestedProperty(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key]) {
      current[key] = {};
    }
    current = current[key];
  }
  current[keys[keys.length - 1]] = parseValue(value);
}

function parseValue(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (!isNaN(value)) return Number(value);
  return value;
}

module.exports = loadConfig();
