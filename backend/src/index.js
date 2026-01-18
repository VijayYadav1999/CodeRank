/**
 * Application Entry Point
 */

require('dotenv').config({ path: require('path').join(process.cwd(), '.env') });

const path = require('path');
const { config } = require('../config/config');
const { database } = require('./db/connection');
const { apiGateway } = require('./api-gateway/api-gateway');
const { logger } = require('./shared/logger');

async function bootstrap() {
  try {
    // Validate configuration
    config.validate();

    // Connect to database
    logger.info('Connecting to database...');
    await database.connect();

    // Start API Gateway
    apiGateway.start(config.apiGatewayPort);

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      await database.disconnect();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully');
      await database.disconnect();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to bootstrap application', error);
    process.exit(1);
  }
}

bootstrap();
