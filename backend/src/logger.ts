import pino from 'pino';
import { AsyncLocalStorage } from 'async_hooks';

/**
 * Base Pino logger — used for non-request-scoped contexts (startup, CLI scripts).
 * All request-scoped code should use getLogger() instead.
 */
export const baseLogger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
});

/**
 * AsyncLocalStorage stores the per-request child logger.
 * When requestLoggerMiddleware calls runWithLogger(), every async operation
 * spawned within that request's call chain will automatically resolve to
 * the correct child logger via getLogger() — no manual threading required.
 */
const storage = new AsyncLocalStorage<pino.Logger>();

/**
 * Wraps fn() inside an AsyncLocalStorage context bound to childLogger.
 * Called by requestLoggerMiddleware for each incoming request.
 */
export function runWithLogger(childLogger: pino.Logger, fn: () => void): void {
  storage.run(childLogger, fn);
}

/**
 * Returns the per-request child logger if called within a request context,
 * or falls back to the base logger for non-request contexts (e.g. background tasks
 * that were not spawned inside a request, Redis events, etc.).
 */
export function getLogger(): pino.Logger {
  return storage.getStore() ?? baseLogger;
}
