/**
 * Custom HTTP Error Class
 * Centralized error handling
 */

class HttpError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.details = details;
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

class ValidationError extends HttpError {
  constructor(message, details) {
    super(400, message, details);
  }
}

class AuthenticationError extends HttpError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

class AuthorizationError extends HttpError {
  constructor(message = 'Forbidden') {
    super(403, message);
  }
}

class NotFoundError extends HttpError {
  constructor(message = 'Not Found') {
    super(404, message);
  }
}

class ConflictError extends HttpError {
  constructor(message = 'Conflict') {
    super(409, message);
  }
}

class InternalServerError extends HttpError {
  constructor(message = 'Internal Server Error') {
    super(500, message);
  }
}

module.exports = {
  HttpError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  InternalServerError,
};
