import { Request, Response, NextFunction } from 'express';

export interface CustomError extends Error {
  statusCode?: number;
}

export function globalErrorHandler(
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected server error occurred.';

  console.error(`[Server Error] Route: ${req.method} ${req.path}`, {
    message,
    statusCode,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
  });

  return res.status(statusCode).json({
    error: message,
    statusCode
  });
}
