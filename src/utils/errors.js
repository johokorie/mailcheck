class ReacherError extends Error {
  constructor(message, status = 400, code = 'INTERNAL_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
    this.name = 'ReacherError';
  }
}

class ValidationError extends ReacherError {
  constructor(message) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

class NotFoundError extends ReacherError {
  constructor(message = 'Not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

class UnauthorizedError extends ReacherError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

class RateLimitError extends ReacherError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT');
    this.name = 'RateLimitError';
  }
}

module.exports = {
  ReacherError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  RateLimitError,
};
