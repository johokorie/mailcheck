// Header secret authentication middleware

const { UnauthorizedError } = require('./errors');

function checkHeaderSecret(config) {
  return (req, res, next) => {
    if (!config.header_secret) {
      // No secret configured, allow all requests
      return next();
    }

    const headerSecret = req.headers['x-reacher-secret'];
    if (!headerSecret || headerSecret !== config.header_secret) {
      throw new UnauthorizedError('Invalid x-reacher-secret header');
    }

    next();
  };
}

module.exports = {
  checkHeaderSecret,
};
