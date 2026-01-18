/**
 * Authentication Service
 * Handles user registration, login, and JWT token generation
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { config } = require('../../config/config');
const { User } = require('../db/models/user.model');
const {
  ValidationError,
  AuthenticationError,
  ConflictError,
} = require('../shared/errors');
const { logger } = require('../shared/logger');

class AuthService {
  async register(email, username, password, firstName, lastName) {
    try {
      // Validation
      if (!email || !username || !password || !firstName || !lastName) {
        throw new ValidationError('All fields are required');
      }

      // Check if user exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      });

      if (existingUser) {
        throw new ConflictError('Email or username already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = new User({
        email,
        username,
        password: hashedPassword,
        firstName,
        lastName,
      });

      await user.save();
      logger.info(`User registered: ${email}`);

      // Generate token
      const token = this.generateToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      return { user, token };
    } catch (error) {
      logger.error('Registration error', error);
      throw error;
    }
  }

  async login(email, password) {
    try {
      if (!email || !password) {
        throw new ValidationError('Email and password are required');
      }

      // Find user with password field
      const user = await User.findOne({ email }).select('+password').lean(false);

      if (!user) {
        throw new AuthenticationError('Invalid credentials');
      }

      if (!user.password) {
        throw new AuthenticationError('Invalid credentials');
      }

      // Compare password - ensure both are strings
      const isPasswordValid = await bcrypt.compare(password, String(user.password));

      if (!isPasswordValid) {
        throw new AuthenticationError('Invalid credentials');
      }

      if (!user.isActive) {
        throw new AuthenticationError('Account is inactive');
      }

      logger.info(`User logged in: ${email}`);

      // Generate token
      const token = this.generateToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      return { user, token };
    } catch (error) {
      logger.error('Login error', error);
      throw error;
    }
  }

  generateToken(payload) {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiry,
    });
  }

  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      return decoded;
    } catch (error) {
      throw new AuthenticationError('Invalid or expired token');
    }
  }

  async refreshToken(token) {
    try {
      const payload = await this.verifyToken(token);
      return this.generateToken(payload);
    } catch (error) {
      throw new AuthenticationError('Failed to refresh token');
    }
  }
}

module.exports = { authService: new AuthService() };
