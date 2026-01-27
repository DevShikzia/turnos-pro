import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error.js';
import { logger } from '../utils/logger.js';
import { isDev } from '../config/env.js';
import mongoose from 'mongoose';

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    requestId?: string;
    details?: unknown;
    stack?: string;
  };
}

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Error interno del servidor';
  let details: unknown = undefined;

  // ApiError (errores controlados)
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  }
  // Error de validación de Mongoose
  else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Error de validación';
    details = Object.fromEntries(
      Object.entries(err.errors).map(([key, val]) => [key, val.message])
    );
  }
  // Error de CastError de Mongoose (ID inválido)
  else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    code = 'INVALID_ID';
    message = `ID inválido: ${err.value}`;
  }
  // Error de duplicado de MongoDB
  else if (err.name === 'MongoServerError' && (err as { code?: number }).code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_ERROR';
    const keyValue = (err as { keyValue?: Record<string, unknown> }).keyValue;
    message = `Ya existe un registro con ${JSON.stringify(keyValue)}`;
  }

  // Log del error
  const logData = {
    err,
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.id?.toString(),
    statusCode,
    code,
  };

  if (statusCode >= 500) {
    logger.error(logData, message);
  } else {
    logger.warn(logData, message);
  }

  // Respuesta
  const response: ErrorResponse = {
    error: {
      code,
      message,
      requestId: req.requestId,
    },
  };

  if (details) {
    response.error.details = details;
  }

  if (isDev && err.stack) {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
}
