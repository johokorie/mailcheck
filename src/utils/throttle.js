// Rate limiting / throttling implementation

const { RateLimitError } = require('./errors');

class ThrottleManager {
  constructor(config) {
    this.config = config;
    this.counters = new Map();
    this.startCleanupInterval();
  }

  getKey(identifier, period) {
    const now = new Date();
    let timeSlot;

    switch (period) {
      case 'second':
        timeSlot = Math.floor(now.getTime() / 1000);
        break;
      case 'minute':
        timeSlot = Math.floor(now.getTime() / (60 * 1000));
        break;
      case 'hour':
        timeSlot = Math.floor(now.getTime() / (3600 * 1000));
        break;
      case 'day':
        timeSlot = Math.floor(now.getTime() / (86400 * 1000));
        break;
      default:
        throw new Error(`Unknown period: ${period}`);
    }

    return `${identifier}:${period}:${timeSlot}`;
  }

  checkLimit(identifier) {
    const checks = [
      {
        period: 'second',
        limit: this.config.max_requests_per_second,
      },
      {
        period: 'minute',
        limit: this.config.max_requests_per_minute,
      },
      {
        period: 'hour',
        limit: this.config.max_requests_per_hour,
      },
      {
        period: 'day',
        limit: this.config.max_requests_per_day,
      },
    ];

    for (const check of checks) {
      if (!check.limit) continue;

      const key = this.getKey(identifier, check.period);
      const count = (this.counters.get(key) || 0) + 1;

      if (count > check.limit) {
        throw new RateLimitError(
          `Rate limit exceeded: ${check.period}`
        );
      }

      this.counters.set(key, count);
    }
  }

  startCleanupInterval() {
    // Clean up old entries every minute
    setInterval(() => {
      const oneHourAgo = Date.now() - 3600 * 1000;
      for (const [key, timestamp] of this.counters.entries()) {
        if (timestamp < oneHourAgo) {
          this.counters.delete(key);
        }
      }
    }, 60 * 1000);
  }
}

module.exports = ThrottleManager;
