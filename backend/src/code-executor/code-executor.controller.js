/**
 * Code Executor Controller
 */

const { codeExecutor } = require('./code-executor.service');
const { CodeSubmission } = require('../db/models/submission.model');
const { ApiResponse } = require('../shared/response');
const { logger } = require('../shared/logger');

class CodeExecutorController {
  async execute(req, res, next) {
    try {
      const { code, language, input } = req.body;

      logger.info(`[EXECUTE] Validating code for language: ${language}`);

      // Validate input
      await codeExecutor.validateCode(code, language);

      // Create submission record
      const submission = new CodeSubmission({
        userId: req.userId,
        title: req.body.title || 'Untitled',
        code,
        language,
        input,
        status: 'pending',
      });

      await submission.save();
      logger.info(`[EXECUTE] Submission created: ${submission._id}`);

      // Return immediately with submission ID (async execution)
      res.status(202).json(
        ApiResponse.success(
          {
            submissionId: submission._id,
            status: 'pending',
            message: 'Code execution queued. Check status using submission ID.',
          },
          'Code execution started',
        ),
      );

      // Update status to queued
      submission.status = 'queued';
      await submission.save();
      logger.info(`[EXECUTE] Submission status updated to queued: ${submission._id}`);

      // Execute code asynchronously in background (don't await)
      (async () => {
        try {
          logger.info(`[EXECUTE] Starting code execution for submission: ${submission._id}`);
          const result = await codeExecutor.execute(code, language, input);
          logger.info(`[EXECUTE] Code execution result:`, { output: result.output?.substring(0, 50), error: result.error });

          // Update submission with results
          submission.output = result.output;
          submission.error = result.error;
          submission.executionTime = result.executionTime;
          submission.status = result.success ? 'completed' : 'failed';
          await submission.save();

          logger.info(`[EXECUTE] Submission saved with status: ${submission.status}`);
        } catch (error) {
          logger.error(`[EXECUTE] Failed to execute code: ${submission._id}`, error);
          submission.error = error.message || 'Execution error';
          submission.status = 'failed';
          await submission.save();
        }
      })();
    } catch (error) {
      logger.error(`[EXECUTE] Controller error:`, error);
      next(error);
    }
  }

  async getHistory(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;

      const submissions = await CodeSubmission.find({ userId: req.userId })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .sort({ createdAt: -1 });

      const total = await CodeSubmission.countDocuments({ userId: req.userId });

      return res.status(200).json(
        ApiResponse.success(
          {
            submissions,
            pagination: {
              total,
              page: parseInt(page),
              limit: parseInt(limit),
              pages: Math.ceil(total / parseInt(limit)),
            },
          },
          'History retrieved successfully',
        ),
      );
    } catch (error) {
      next(error);
      return res.status(500).json(ApiResponse.error('Failed to retrieve history'));
    }
  }

  async getSubmission(req, res, next) {
    try {
      const { submissionId } = req.params;

      const submission = await CodeSubmission.findById(submissionId);

      if (!submission) {
        return res.status(404).json(ApiResponse.error('Submission not found'));
      }

      // For now, allow any authenticated user to view any submission (for testing)
      // In production, should check: submission.userId.toString() === req.userId

      return res.status(200).json(
        ApiResponse.success(submission, 'Submission retrieved successfully'),
      );
    } catch (error) {
      logger.error('Failed to retrieve submission', error);
      next(error);
    }
  }
}

module.exports = { codeExecutorController: new CodeExecutorController() };
