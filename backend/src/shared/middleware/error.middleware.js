/**
 * Error Handling Middleware
 */

const { HttpError } = require('../errors');
const { ApiResponse } = require('../response');
const { logger } = require('../logger');

const errorHandler = (err, _req, res, _next) => {
  logger.error('Error occurred', err);

  if (err instanceof HttpError) {
    return res.status(err.statusCode).json(
      ApiResponse.error(err.message, err.details),
    );
  }

  return res.status(500).json(
    ApiResponse.error('Internal Server Error', err.message),
  );
};

const notFoundHandler = (_req, res, _next) => {
  return res.status(404).json(ApiResponse.error('Route not found'));
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
