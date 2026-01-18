/**
 * Authentication Controller
 * Handles HTTP requests for authentication
 */

const { authService } = require('./auth.service');
const { ApiResponse } = require('../shared/response');

class AuthController {
  async register(req, res, next) {
    try {
      const { email, username, password, firstName, lastName } = req.body;

      const result = await authService.register(
        email,
        username,
        password,
        firstName,
        lastName,
      );

      return res.status(201).json(
        ApiResponse.success(
          {
            user: {
              id: result.user._id,
              email: result.user.email,
              username: result.user.username,
              firstName: result.user.firstName,
              lastName: result.user.lastName,
            },
            token: result.token,
          },
          'User registered successfully',
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const result = await authService.login(email, password);

      return res.status(200).json(
        ApiResponse.success(
          {
            user: {
              id: result.user._id,
              email: result.user.email,
              username: result.user.username,
              firstName: result.user.firstName,
              lastName: result.user.lastName,
            },
            token: result.token,
          },
          'Login successful',
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(400).json(ApiResponse.error('Token required'));
      }

      const newToken = await authService.refreshToken(token);

      return res.status(200).json(
        ApiResponse.success({ token: newToken }, 'Token refreshed'),
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { authController: new AuthController() };
