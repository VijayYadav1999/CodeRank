/**
 * Database Connection Manager
 * Handles MongoDB connection with retry logic
 */

const mongoose = require('mongoose');
const { config } = require('../../config/config');
const { logger } = require('../shared/logger');

class Database {
  constructor() {
    this.connection = null;
    this.retryCount = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000; // 5 seconds
  }

  async connect() {
    try {
      if (this.connection) {
        logger.info('Using existing database connection');
        return this.connection;
      }

      const mongoUri = config.db.uri;
      logger.info(`Connecting to MongoDB: ${mongoUri}`);

      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      this.connection = mongoose.connection;
      this.retryCount = 0;

      this.connection.on('error', (error) => {
        logger.error('MongoDB connection error', error);
      });

      this.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
        this.reconnect();
      });

      logger.info('MongoDB connected successfully');
      return this.connection;
    } catch (error) {
      logger.error('MongoDB connection failed', error);
      
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        logger.info(
          `Retrying connection in ${this.retryDelay}ms (${this.retryCount}/${this.maxRetries})`,
        );
        await this.delay(this.retryDelay);
        return this.connect();
      }

      throw new Error('Failed to connect to MongoDB after multiple retries');
    }
  }

  async reconnect() {
    if (this.retryCount >= this.maxRetries) {
      logger.error('Max reconnection attempts reached');
      return;
    }

    this.retryCount++;
    await this.delay(this.retryDelay);
    this.connection = null;
    await this.connect();
  }

  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.disconnect();
        this.connection = null;
        logger.info('MongoDB disconnected');
      }
    } catch (error) {
      logger.error('Error disconnecting from MongoDB', error);
      throw error;
    }
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getConnection() {
    return this.connection;
  }

  isConnected() {
    return this.connection?.readyState === 1;
  }
}

module.exports = { database: new Database() };
