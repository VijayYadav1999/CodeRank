/**
 * Code Executor Service
 * Handles code execution with concurrency support and resource management
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { config } = require('../../config/config');
const { logger } = require('../shared/logger');
const { InternalServerError } = require('../shared/errors');

const execPromise = promisify(exec);

const languageConfigs = {
  python: {
    ext: '.py',
    runCommand: (filename, input) =>
      input ? `python "${filename}" < input.txt` : `python "${filename}"`,
  },
  javascript: {
    ext: '.js',
    runCommand: (filename, input) =>
      input ? `node "${filename}" < input.txt` : `node "${filename}"`,
  },
  cpp: {
    ext: '.cpp',
    runCommand: (filename, input) => {
      const execFile = filename.replace('.cpp', '');
      const isWindows = process.platform === 'win32';
      const execCmd = isWindows ? `"${execFile}.exe"` : `"${execFile}"`;
      return input
        ? `g++ -o "${execFile}" "${filename}" && ${execCmd} < input.txt`
        : `g++ -o "${execFile}" "${filename}" && ${execCmd}`;
    },
  },
};

class CodeExecutor {
  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp', 'code-execution');
    this.ensureTempDir();
    
    // Concurrency management
    this.maxConcurrentExecutions = parseInt(process.env.MAX_CONCURRENT_EXECUTIONS || '10', 10);
    this.executionQueue = [];
    this.activeExecutions = 0;
    this.executionMap = new Map(); // Track active executions by ID
    
    // Resource management
    this.maxMemoryPerExecution = parseInt(process.env.MAX_MEMORY_PER_EXECUTION || '256', 10); // MB
    this.maxExecutionTime = parseInt(process.env.EXECUTOR_MAX_EXECUTION_TIME || '30000', 10); // ms
  }

  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Queue execution request and manage concurrency
   */
  async queueExecution(executionFn) {
    return new Promise((resolve, reject) => {
      this.executionQueue.push({ executionFn, resolve, reject });
      this.processQueue();
    });
  }

  /**
   * Process queued executions with concurrency control
   */
  async processQueue() {
    if (this.activeExecutions >= this.maxConcurrentExecutions || this.executionQueue.length === 0) {
      return;
    }

    this.activeExecutions++;
    const { executionFn, resolve, reject } = this.executionQueue.shift();

    try {
      const result = await executionFn();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.activeExecutions--;
      this.processQueue(); // Process next queued item
    }
  }

  /**
   * Get execution statistics
   */
  getStats() {
    return {
      activeExecutions: this.activeExecutions,
      queuedExecutions: this.executionQueue.length,
      totalInProgress: this.executionMap.size,
    };
  }

  async execute(code, language, input) {
    const executionId = uuidv4();

    return this.queueExecution(async () => {
      const executionDir = path.join(this.tempDir, executionId);
      this.executionMap.set(executionId, { status: 'executing', startTime: Date.now() });

      try {
        // Validate language
        if (!languageConfigs[language]) {
          throw new InternalServerError(`Unsupported language: ${language}`);
        }

        const languageConfig = languageConfigs[language];
        const filename = path.join(executionDir, `code${languageConfig.ext}`);

        // Create execution directory
        fs.mkdirSync(executionDir, { recursive: true });

        // Write code file
        fs.writeFileSync(filename, code);

        // Write input file if provided
        if (input) {
          fs.writeFileSync(path.join(executionDir, 'input.txt'), input);
        }

        // Execute code asynchronously
        const command = languageConfig.runCommand(filename, input);
        const startTime = Date.now();

        let output = '';
        let error = null;

        try {
          const result = await execPromise(command, {
            cwd: executionDir,
            timeout: this.maxExecutionTime,
            encoding: 'utf-8',
            maxBuffer: 10 * 1024 * 1024, // 10MB buffer
          });
          output = result.stdout || '';
          logger.debug(`Execution result: stdout="${output.substring(0, 100)}", stderr="${(result.stderr || '').substring(0, 100)}"`);
        } catch (execError) {
          logger.debug(`Execution error caught:`, { 
            killed: execError.killed, 
            code: execError.code,
            signal: execError.signal,
            message: execError.message 
          });
          // Handle timeout error
          if (execError.killed) {
            error = `Execution timeout (${this.maxExecutionTime}ms exceeded)`;
          } else if (execError.stderr) {
            error = execError.stderr;
            output = execError.stdout || '';
          } else {
            error = execError.message || 'Execution failed';
          }
        }

        const executionTime = Date.now() - startTime;

        logger.info(`Code executed: ${language} (${executionTime}ms) [ID: ${executionId}] - Output: ${output.substring(0, 50)}`);
        if (error) {
          logger.warn(`Execution error: ${error.substring(0, 100)}`);
        }

        return {
          output: output || '',
          error,
          executionTime,
          success: !error,
          executionId,
        };
      } catch (err) {
        logger.error(`Code execution error [ID: ${executionId}]`, err);
        return {
          output: '',
          error: err.message || 'Execution error',
          executionTime: 0,
          success: false,
          executionId,
        };
      } finally {
        // Cleanup
        this.cleanup(executionDir);
        this.executionMap.delete(executionId);
      }
    });
  }

  cleanup(dir) {
    try {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        logger.debug(`Cleaned up execution directory: ${dir}`);
      }
    } catch (error) {
      logger.warn(`Failed to cleanup directory: ${dir}`, error);
    }
  }

  async validateCode(code, language) {
    // Basic validation
    if (!code || code.trim().length === 0) {
      throw new InternalServerError('Code cannot be empty');
    }

    if (!languageConfigs[language]) {
      throw new InternalServerError(`Unsupported language: ${language}`);
    }

    return true;
  }
}

module.exports = { codeExecutor: new CodeExecutor() };
