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

      // Validate input
      await codeExecutor.validateCode(code, language);

      // Create submission record
      const submission = new CodeSubmission({
        userId: req.userId,
        title: req.body.title || 'Untitled',
        code,
        language,
        input,
        status: 'executing',
      });

      await submission.save();

      // Execute code
      const result = await codeExecutor.execute(code, language, input);

      // Update submission
      submission.output = result.output;
      submission.error = result.error;
      submission.executionTime = result.executionTime;
      submission.status = result.success ? 'completed' : 'failed';
      await submission.save();

      logger.info(`Code execution completed: ${submission._id}`);

      return res.status(200).json(
        ApiResponse.success(
          {
            submissionId: submission._id,
            output: result.output,
            error: result.error,
            executionTime: result.executionTime,
            status: submission.status,
          },
          'Code executed successfully',
        ),
      );
    } catch (error) {
      next(error);
      return res.status(500).json(ApiResponse.error('Code execution failed'));
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

      if (!submission || submission.userId.toString() !== req.userId) {
        return res.status(404).json(ApiResponse.error('Submission not found'));
      }

      return res.status(200).json(
        ApiResponse.success(submission, 'Submission retrieved successfully'),
      );
    } catch (error) {
      next(error);
      return res.status(500).json(ApiResponse.error('Failed to retrieve submission'));
    }
  }
}

module.exports = { codeExecutorController: new CodeExecutorController() };
