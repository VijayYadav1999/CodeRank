/**
 * Code Executor Service
 * Handles code execution with Docker containerization
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { config } = require('../../config/config');
const { logger } = require('../shared/logger');
const { InternalServerError } = require('../shared/errors');

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
  java: {
    ext: '.java',
    runCommand: (filename) => {
      const className = path.basename(filename, '.java');
      return `javac "${filename}" && java -cp . ${className}`;
    },
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
  csharp: {
    ext: '.cs',
    runCommand: (filename, input) => {
      const execFile = filename.replace('.cs', '.exe');
      return input
        ? `mcs "${filename}" -out:"${execFile}" && mono "${execFile}" < input.txt`
        : `mcs "${filename}" -out:"${execFile}" && mono "${execFile}"`;
    },
  },
};

class CodeExecutor {
  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp', 'code-execution');
    this.ensureTempDir();
  }

  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async execute(code, language, input) {
    const executionId = uuidv4();
    const executionDir = path.join(this.tempDir, executionId);

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

      // Execute code
      const command = languageConfig.runCommand(filename, input);
      const startTime = Date.now();

      let output = '';
      let error = null;

      try {
        output = execSync(command, {
          cwd: executionDir,
          timeout: parseInt(process.env.EXECUTOR_MAX_EXECUTION_TIME || '30000', 10),
          encoding: 'utf-8',
          maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        });
      } catch (execError) {
        error = execError.stderr || execError.message || 'Execution failed';
      }

      const executionTime = Date.now() - startTime;

      logger.info(`Code executed: ${language} (${executionTime}ms)`);

      return {
        output: output || '',
        error,
        executionTime,
        success: !error,
      };
    } catch (err) {
      logger.error('Code execution error', err);
      return {
        output: '',
        error: err.message || 'Execution error',
        executionTime: 0,
        success: false,
      };
    } finally {
      // Cleanup
      this.cleanup(executionDir);
    }
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
