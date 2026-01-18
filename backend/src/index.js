/**
 * Application Entry Point
 */

// Load environment variables from .env file if it exists
// On production (Render), environment variables are set directly
try {
  require('dotenv').config({ path: require('path').join(process.cwd(), '.env') });
} catch (error) {
  // .env file not found - this is expected in production
}

const path = require('path');
const { config } = require('../config/config');
const { database } = require('./db/connection');
const { apiGateway } = require('./api-gateway/api-gateway');
const { logger } = require('./shared/logger');

async function bootstrap() {
  try {
    // 🔍 DEBUG: Log all environment variables
    console.log('\n=== ENVIRONMENT CONFIGURATION ===');
    console.log('NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'SET ✅' : 'NOT SET ❌');
    console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET ✅' : 'NOT SET ❌');
    console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN || 'NOT SET');
    console.log('API_GATEWAY_PORT:', process.env.API_GATEWAY_PORT || '5000');
    console.log('==================================\n');

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
