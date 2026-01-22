/**
 * Code Executor Routes
 */

const { Router } = require('express');
const { authMiddleware } = require('../shared/middleware/auth.middleware');
const { codeExecutionRateLimiter } = require('../shared/middleware/rate-limiter.middleware');
const { codeExecutorController } = require('./code-executor.controller');
const { codeExecutor } = require('./code-executor.service');

const codeExecutorRouter = Router();

codeExecutorRouter.post(
  '/execute',
  authMiddleware,
  codeExecutionRateLimiter,
  (req, res, next) => codeExecutorController.execute(req, res, next),
);

codeExecutorRouter.get(
  '/history',
  authMiddleware,
  (req, res, next) => codeExecutorController.getHistory(req, res, next),
);

// Alias for /history endpoint
codeExecutorRouter.get(
  '/submissions',
  authMiddleware,
  (req, res, next) => codeExecutorController.getHistory(req, res, next),
);

codeExecutorRouter.get(
  '/submission/:submissionId',
  authMiddleware,
  (req, res, next) => codeExecutorController.getSubmission(req, res, next),
);

// New endpoint to get execution statistics
codeExecutorRouter.get(
  '/stats',
  authMiddleware,
  (req, res) => {
    const stats = codeExecutor.getStats();
    res.status(200).json({
      success: true,
      data: stats,
      message: 'Execution statistics',
    });
  },
);

module.exports = { codeExecutorRouter };
