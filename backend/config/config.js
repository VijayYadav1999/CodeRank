/**
 * Environment Configuration Manager
 * Handles environment-specific configurations for development and production
 */

class Config {
  constructor() {
    this.env = process.env.NODE_ENV || 'development';
    this.port = parseInt(process.env.PORT || '3000', 10);
    this.apiGatewayPort = parseInt(process.env.API_GATEWAY_PORT || '5000', 10);
    
    // Try to get MongoDB URI, fallback to localhost
    const mongoUri = process.env.MONGODB_URI || 
                     process.env.MONGO_URI ||
                     'mongodb://localhost:27017/coderank';
    
    this.db = {
      uri: mongoUri,
      user: process.env.MONGODB_USER || 'admin',
      password: process.env.MONGODB_PASSWORD || 'admin123',
    };

    this.jwt = {
      secret: process.env.JWT_SECRET || 'dev-secret-key',
      expiry: process.env.JWT_EXPIRY || '7d',
    };

    this.executor = {
      timeout: parseInt(process.env.CODE_EXECUTOR_TIMEOUT || '5000', 10),
      maxMemory: process.env.MAX_MEMORY || '512m',
      maxCpu: parseFloat(process.env.MAX_CPU || '1'),
      maxConcurrentExecutions: parseInt(process.env.MAX_CONCURRENT_EXECUTIONS || '10', 10),
      maxExecutionTime: parseInt(process.env.EXECUTOR_MAX_EXECUTION_TIME || '30000', 10),
      maxMemoryPerExecution: parseInt(process.env.MAX_MEMORY_PER_EXECUTION || '256', 10),
    };

    this.rateLimit = {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    };

    this.logging = {
      level: process.env.LOG_LEVEL || 'debug',
    };
  }

  isDevelopment() {
    return this.env === 'development';
  }

  isProduction() {
    return this.env === 'production';
  }

  validate() {
    if (this.isProduction() && this.jwt.secret === 'dev-secret-key') {
      throw new Error('JWT_SECRET must be set in production environment');
    }
  }
}

module.exports = { config: new Config() };
