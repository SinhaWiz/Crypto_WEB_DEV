import { ERROR_CODES } from '../constants/index.js';

export class AppError extends Error {
  constructor(message, status = 500, code = ERROR_CODES.INTERNAL_ERROR, details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
