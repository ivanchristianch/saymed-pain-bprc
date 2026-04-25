import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { baseLogger, runWithLogger } from '../logger.js';

/**
 * Request logger middleware.
 *
 * 1. Reads `x-request-id` from the incoming header, or generates a UUID fallback.
 * 2. Creates a Pino child logger bound with { requestId, method, path }.
 * 3. Runs the rest of the request pipeline inside AsyncLocalStorage so that
 *    any code calling getLogger() automatically inherits this child logger.
 * 4. Logs the incoming request on entry and the completed response on 'finish'.
 */
export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = (req.headers['x-request-id'] as string | undefined) ?? randomUUID();

  const childLogger = baseLogger.child({
    requestId,
    method: req.method,
    path: req.path,
  });

  // Attach to request so route handlers can access it directly if needed
  (req as any).log = childLogger;

  // Echo the request id back so clients can correlate logs
  res.setHeader('x-request-id', requestId);

  const startAt = Date.now();

  childLogger.info({ msg: 'incoming request' });

  res.on('finish', () => {
    const durationMs = Date.now() - startAt;
    childLogger.info({
      msg: 'request completed',
      statusCode: res.statusCode,
      durationMs,
    });
  });

  // Wrap next() in AsyncLocalStorage so all downstream async code
  // (services, repositories, etc.) inherits this child logger via getLogger()
  runWithLogger(childLogger, () => next());
}
