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

  async googleAuth(googleToken) {
    try {
      if (!googleToken) {
        throw new ValidationError('Google token is required');
      }

      const { OAuth2Client } = require('google-auth-library');
      
      // Validate Google Client ID is configured
      if (!config.google.clientId || config.google.clientId.trim() === '') {
        logger.error('Google Client ID is not configured. Please set GOOGLE_CLIENT_ID environment variable.');
        throw new AuthenticationError('Google OAuth is not properly configured on the server. Please contact support.');
      }

      const client = new OAuth2Client(config.google.clientId);

      // Verify the token
      const ticket = await client.verifyIdToken({
        idToken: googleToken,
        audience: config.google.clientId,
      });

      const payload = ticket.getPayload();
      const { email, name, given_name, family_name, picture, email_verified } = payload;

      if (!email) {
        throw new ValidationError('Email not provided by Google');
      }

      if (!email_verified) {
        throw new ValidationError('Email not verified by Google');
      }

      // Find or create user
      let user = await User.findOne({ email });
      let isNewUser = false;

      if (!user) {
        // Create new user from Google profile
        const generatedUsername = email.split('@')[0] + '_' + Math.random().toString(36).slice(2, 9);
        
        user = new User({
          email,
          username: generatedUsername,
          firstName: given_name || name?.split(' ')[0] || 'User',
          lastName: family_name || name?.split(' ')[1] || '',
          profilePicture: picture,
          isGoogleAuth: true,
          isActive: true,
        });

        try {
          await user.save();
          logger.info(`New user created via Google: ${email}`);
          isNewUser = true;
        } catch (saveError) {
          logger.error(`Failed to save Google user: ${email}`, saveError);
          // If username conflict, try alternative
          if (saveError.code === 11000) {
            user.username = email.split('@')[0] + '_' + Date.now();
            await user.save();
            logger.info(`User created with alternative username: ${user.username}`);
          } else {
            throw saveError;
          }
        }
      } else {
        // Existing user
        if (!user.isActive) {
          throw new AuthenticationError('Account is inactive');
        }
        // Update profile picture if available
        if (picture && user.profilePicture !== picture) {
          user.profilePicture = picture;
          await user.save();
        }
        logger.info(`User logged in via Google: ${email}`);
      }

      // Generate JWT token
      const token = this.generateToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      return { user, token, isNewUser };
    } catch (error) {
      logger.error('Google authentication error', error);
      // Re-throw with appropriate error type
      if (error instanceof ValidationError || error instanceof AuthenticationError) {
        throw error;
      }
      throw new AuthenticationError('Google authentication failed: ' + error.message);
    }
  }
}

module.exports = { authService: new AuthService() };
