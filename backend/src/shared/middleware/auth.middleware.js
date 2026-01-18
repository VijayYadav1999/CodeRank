/**
 * JWT Authentication Middleware
 */

const jwt = require('jsonwebtoken');
const { config } = require('../../../config/config');
const { AuthenticationError } = require('../errors');

const authMiddleware = (req, _res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new AuthenticationError('No token provided');
    }

    const decoded = jwt.verify(token, config.jwt.secret);

    req.userId = decoded.userId;
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    throw new AuthenticationError('Invalid or expired token');
  }
};

const optionalAuthMiddleware = (req, _res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret);

      req.userId = decoded.userId;
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
    }
  } catch (error) {
    // Silent fail, user remains unauthenticated
  }

  next();
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
};
