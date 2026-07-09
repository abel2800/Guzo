import type { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';
import { Prisma } from '@delivery/database';
import { ApiError } from '../utils/ApiError.js';
import { env, logger } from '../config/index.js';
import { HTTP_STATUS, ERROR_CODES } from '../constants/index.js';

export function errorMiddleware(err: unknown, req: Request, res: Response, _next: NextFunction) {
  let apiError: ApiError;

  if (err instanceof ApiError) {
    apiError = err;
  } else if (err instanceof MulterError) {
    const msg =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File is too large'
        : `Upload error: ${err.message}`;
    apiError = ApiError.badRequest(msg);
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    apiError = mapPrismaError(err);
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    apiError = ApiError.badRequest('Invalid data sent to database layer');
  } else if (err instanceof Error) {
    apiError = new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      err.message || 'Internal server error',
      ERROR_CODES.INTERNAL,
      undefined,
      false,
    );
  } else {
    apiError = ApiError.internal();
  }

  if (!apiError.isOperational || apiError.statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} -> ${apiError.statusCode}: ${apiError.message}`);
    if (err instanceof Error && err.stack) logger.error(err.stack);
  } else {
    logger.warn(`${req.method} ${req.originalUrl} -> ${apiError.statusCode}: ${apiError.message}`);
  }

  res.status(apiError.statusCode).json({
    success: false,
    message: apiError.message,
    errorCode: apiError.errorCode,
    ...(apiError.errors ? { errors: apiError.errors } : {}),
    ...(env.isProd ? {} : { stack: err instanceof Error ? err.stack : undefined }),
  });
}

function mapPrismaError(err: Prisma.PrismaClientKnownRequestError): ApiError {
  switch (err.code) {
    case 'P2002': {
      const target = (err.meta?.target as string[] | undefined)?.join(', ') ?? 'field';
      return ApiError.conflict(`A record with this ${target} already exists`);
    }
    case 'P2025':
      return ApiError.notFound('Requested record not found');
    case 'P2003':
      return ApiError.badRequest('Related record does not exist (foreign key constraint)');
    default:
      return new ApiError(HTTP_STATUS.BAD_REQUEST, `Database error (${err.code})`, ERROR_CODES.VALIDATION_ERROR);
  }
}
