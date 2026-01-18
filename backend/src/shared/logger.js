/**
 * Logger Utility
 * Centralized logging for all services
 */

const fs = require('fs');
const path = require('path');

const LogLevel = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

class Logger {
  constructor(logLevel = 'info') {
    this.logDir = path.join(process.cwd(), 'logs');
    this.ensureLogDirectory();
    this.minLogLevel = this.parseLogLevel(logLevel);
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  parseLogLevel(level) {
    return LogLevel[level.toUpperCase()] || LogLevel.INFO;
  }

  shouldLog(level) {
    const levels = Object.values(LogLevel);
    return levels.indexOf(level) <= levels.indexOf(this.minLogLevel);
  }

  getLogFile() {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `app-${date}.log`);
  }

  formatMessage(level, message, meta) {
    const timestamp = new Date().toISOString();
    let metaStr = '';
    
    if (meta) {
      if (meta instanceof Error) {
        metaStr = ` | ${meta.message}`;
      } else {
        metaStr = ` | ${JSON.stringify(meta)}`;
      }
    }
    
    return `[${timestamp}] [${level}] ${message}${metaStr}\n`;
  }

  writeLog(level, message, meta) {
    if (!this.shouldLog(level)) return;

    const formatted = this.formatMessage(level, message, meta);
    
    // Console output
    console.log(formatted.trim());

    // File output
    fs.appendFileSync(this.getLogFile(), formatted);
  }

  error(message, meta) {
    this.writeLog(LogLevel.ERROR, message, meta);
  }

  warn(message, meta) {
    this.writeLog(LogLevel.WARN, message, meta);
  }

  info(message, meta) {
    this.writeLog(LogLevel.INFO, message, meta);
  }

  debug(message, meta) {
    this.writeLog(LogLevel.DEBUG, message, meta);
  }
}

module.exports = { logger: new Logger(process.env.LOG_LEVEL || 'info') };
