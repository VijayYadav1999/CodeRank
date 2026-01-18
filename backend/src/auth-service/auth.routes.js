/**
 * Authentication Routes
 */

const { Router } = require('express');
const { authController } = require('./auth.controller');
const { authRateLimiter } = require('../shared/middleware/rate-limiter.middleware');

const authRouter = Router();

authRouter.post('/register', authRateLimiter, (req, res, next) =>
  authController.register(req, res, next),
);

authRouter.post('/login', authRateLimiter, (req, res, next) =>
  authController.login(req, res, next),
);

authRouter.post('/refresh', (req, res, next) =>
  authController.refreshToken(req, res, next),
);

module.exports = { authRouter };
