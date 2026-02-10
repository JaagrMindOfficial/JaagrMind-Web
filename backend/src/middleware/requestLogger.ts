import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const { method, url, body, query } = req;

  // Log request
  console.log(`[REQ] ${method} ${url}`, {
    query,
    // Sanitize body (remove passwords etc if needed)
    body: body ? { ...body, password: body.password ? '***' : undefined } : undefined,
    user: req.user?.id
  });

  // Log response on finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[RES] ${method} ${url} ${res.statusCode} - ${duration}ms`);
  });

  next();
};
