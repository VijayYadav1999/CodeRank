/**
 * API Gateway with Load Balancer and Rate Limiting
 * Main entry point for all API requests
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { config } = require('../../config/config');
const { logger } = require('../shared/logger');
const { globalRateLimiter } = require('../shared/middleware/rate-limiter.middleware');
const { errorHandler, notFoundHandler } = require('../shared/middleware/error.middleware');
const { authRouter } = require('../auth-service/auth.routes');
const { codeExecutorRouter } = require('../code-executor/code-executor.routes');
const { ApiResponse } = require('../shared/response');

class ApiGateway {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors({
      origin: config.isDevelopment() ? '*' : process.env.CORS_ORIGIN,
      credentials: true,
    }));

    // Body parser
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ limit: '50mb', extended: true }));

    // Logging middleware
    this.app.use((req, _res, next) => {
      logger.info(`${req.method} ${req.path}`);
      next();
    });

    // Global rate limiter
    this.app.use(globalRateLimiter);
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (_req, res) => {
      res.status(200).json(ApiResponse.success({ status: 'ok' }));
    });

    // API routes
    const apiPrefix = '/api/v1';

    this.app.use(`${apiPrefix}/auth`, authRouter);
    this.app.use(`${apiPrefix}/code`, codeExecutorRouter);

    // 404 handler
    this.app.use(notFoundHandler);
  }

  setupErrorHandling() {
    this.app.use(errorHandler);
  }

  getApp() {
    return this.app;
  }

  start(port = config.apiGatewayPort) {
    this.app.listen(port, () => {
      logger.info(`API Gateway running on port ${port}`);
      logger.info(`Environment: ${config.env}`);
    });
  }
}

module.exports = { apiGateway: new ApiGateway() };
