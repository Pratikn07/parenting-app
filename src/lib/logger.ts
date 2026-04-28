/**
 * Lightweight logger that silences debug-level output in release builds.
 *
 * - `log` / `info` / `debug` only fire when `__DEV__` is true (Metro / dev).
 *   This prevents PII, IDs, and verbose state from leaking via Console in
 *   shipped builds.
 * - `warn` / `error` always fire so production crashes and recoverable
 *   anomalies remain visible to crash-reporting/native logs.
 *
 * Usage:
 *   import { logger } from '@/src/lib/logger';
 *   logger.log('Loaded children', count);
 *   logger.error('Failed to fetch', err);
 */

type LogArgs = readonly unknown[];

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : false;

export const logger = {
  log: (...args: LogArgs) => {
    if (isDev) console.log(...args);
  },
  info: (...args: LogArgs) => {
    if (isDev) console.info(...args);
  },
  debug: (...args: LogArgs) => {
    if (isDev) console.debug(...args);
  },
  warn: (...args: LogArgs) => {
    console.warn(...args);
  },
  error: (...args: LogArgs) => {
    console.error(...args);
  },
};
