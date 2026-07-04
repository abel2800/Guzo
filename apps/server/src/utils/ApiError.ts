import { HTTP_STATUS, ERROR_CODES } from '../constants/index.js';

export interface FieldError {
  field: string;
  message: string;
}

/**
 * Centralized, typed application error. Thrown anywhere in services; caught by
 * the global error middleware which turns it into a consistent JSON envelope.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly errors?: FieldError[];
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    errorCode: string = ERROR_CODES.INTERNAL,
    errors?: FieldError[],
    isOperational = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.errors = errors;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, ApiError.prototype);
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(message = 'Bad request', errors?: FieldError[]) {
    return new ApiError(HTTP_STATUS.BAD_REQUEST, message, ERROR_CODES.VALIDATION_ERROR, errors);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(HTTP_STATUS.UNAUTHORIZED, message, ERROR_CODES.UNAUTHORIZED);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(HTTP_STATUS.FORBIDDEN, message, ERROR_CODES.FORBIDDEN);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(HTTP_STATUS.NOT_FOUND, message, ERROR_CODES.NOT_FOUND);
  }

  static conflict(message = 'Conflict') {
    return new ApiError(HTTP_STATUS.CONFLICT, message, ERROR_CODES.CONFLICT);
  }

  static validation(errors: FieldError[], message = 'Validation failed') {
    return new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, message, ERROR_CODES.VALIDATION_ERROR, errors);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, message, ERROR_CODES.INTERNAL, undefined, false);
  }
}
