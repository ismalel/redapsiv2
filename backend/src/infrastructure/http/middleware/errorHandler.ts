import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../../../shared/apiError';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import multer from 'multer';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Always log errors for debugging
  console.error('[Error Handler]:', err);

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  // Zod Validation Error
  if (err instanceof ZodError) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'The provided data is invalid.',
        details: err.errors,
      },
    });
  }

  // Multer Error Handling
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'The uploaded file exceeds the allowed size limit.',
        },
      });
    }
    return res.status(400).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: err.message,
      },
    });
  }

  // Prisma Error Handling
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002: Unique constraint failed
    if (err.code === 'P2002') {
      const field = (err.meta?.target as string[])?.join(', ') || 'field';
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: `Uniqueness constraint failed on ${field}`,
          details: err.meta,
        },
      });
    }
    
    // P2025: Record to update/delete not found
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'The requested record was not found or is already deleted.',
          details: err.meta,
        },
      });
    }
  }

  // Default error
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred.',
    },
  });
};
