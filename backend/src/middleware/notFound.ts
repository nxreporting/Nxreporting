import { Request, Response, NextFunction } from 'express';

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: {
      message: error.message,
      path: req.originalUrl,
      method: req.method
    }
  });
};