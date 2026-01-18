/**
 * API Response Handler
 * Standardized response format
 */

class ApiResponse {
  static success(data, message) {
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    };
  }

  static error(message, error) {
    return {
      success: false,
      message,
      error,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = { ApiResponse };
