import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// `logger.ts` captures `__DEV__` at module-load time, so each test must
// stub the global BEFORE importing the module via vi.resetModules() + dynamic import.

const loadLoggerWithDev = async (devValue: boolean | undefined) => {
  vi.resetModules();
  if (devValue === undefined) {
    vi.stubGlobal('__DEV__', undefined);
  } else {
    vi.stubGlobal('__DEV__', devValue);
  }
  const mod = await import('./logger');
  return mod.logger;
};

describe('logger', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let debugSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('when __DEV__ is true (development build)', () => {
    it('log / info / debug call through to console', async () => {
      const logger = await loadLoggerWithDev(true);

      logger.log('hello');
      logger.info('there');
      logger.debug('friend');

      expect(logSpy).toHaveBeenCalledWith('hello');
      expect(infoSpy).toHaveBeenCalledWith('there');
      expect(debugSpy).toHaveBeenCalledWith('friend');
    });

    it('warn / error always call through to console', async () => {
      const logger = await loadLoggerWithDev(true);

      logger.warn('careful');
      logger.error('boom');

      expect(warnSpy).toHaveBeenCalledWith('careful');
      expect(errorSpy).toHaveBeenCalledWith('boom');
    });
  });

  describe('when __DEV__ is false (production build)', () => {
    it('log / info / debug are silenced', async () => {
      const logger = await loadLoggerWithDev(false);

      logger.log('PII leak');
      logger.info('verbose state');
      logger.debug('internal id');

      expect(logSpy).not.toHaveBeenCalled();
      expect(infoSpy).not.toHaveBeenCalled();
      expect(debugSpy).not.toHaveBeenCalled();
    });

    it('warn / error still call through to console', async () => {
      const logger = await loadLoggerWithDev(false);

      logger.warn('still visible');
      logger.error('still visible');

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('when __DEV__ is undefined (non-RN runtime)', () => {
    it('falls back to silent for log / info / debug', async () => {
      const logger = await loadLoggerWithDev(undefined);

      logger.log('should not appear');
      logger.info('should not appear');
      logger.debug('should not appear');

      expect(logSpy).not.toHaveBeenCalled();
      expect(infoSpy).not.toHaveBeenCalled();
      expect(debugSpy).not.toHaveBeenCalled();
    });

    it('still emits warn / error', async () => {
      const logger = await loadLoggerWithDev(undefined);

      logger.warn('w');
      logger.error('e');

      expect(warnSpy).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  it('forwards multiple arguments to console.log', async () => {
    const logger = await loadLoggerWithDev(true);

    logger.log('count', 42, { foo: 'bar' });

    expect(logSpy).toHaveBeenCalledWith('count', 42, { foo: 'bar' });
  });
});
