import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getAgeInMonths,
  getFormattedAge,
  getDevelopmentalStage,
  isOlderThanHours,
} from './dateUtils';

// All date literals use `T12:00:00Z` so the test stays stable across timezones
// (between UTC-12 and UTC+11 the date never shifts across a calendar boundary).

describe('dateUtils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getAgeInMonths', () => {
    it('returns 0 for a child born this month', () => {
      vi.setSystemTime(new Date('2026-04-20T12:00:00Z'));
      expect(getAgeInMonths('2026-04-15T12:00:00Z')).toBe(0);
    });

    it('returns 1 once we cross into the next calendar month', () => {
      vi.setSystemTime(new Date('2026-04-15T12:00:00Z'));
      expect(getAgeInMonths('2026-03-15T12:00:00Z')).toBe(1);
    });

    it('counts whole years across year boundaries', () => {
      vi.setSystemTime(new Date('2027-01-15T12:00:00Z'));
      expect(getAgeInMonths('2026-01-15T12:00:00Z')).toBe(12);
    });

    it('counts months correctly when crossing a year boundary', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
      expect(getAgeInMonths('2025-12-15T12:00:00Z')).toBe(1);
    });

    it('handles a leap-year Feb 29 birthday in a non-leap year', () => {
      vi.setSystemTime(new Date('2025-02-28T12:00:00Z'));
      expect(getAgeInMonths('2024-02-29T12:00:00Z')).toBe(12);
    });

    it('handles birth dates many years in the past', () => {
      vi.setSystemTime(new Date('2026-04-20T12:00:00Z'));
      expect(getAgeInMonths('2020-04-20T12:00:00Z')).toBe(72);
    });
  });

  describe('getFormattedAge', () => {
    beforeEach(() => {
      vi.setSystemTime(new Date('2026-04-20T12:00:00Z'));
    });

    it('returns "Newborn" for an under-1-month-old', () => {
      expect(getFormattedAge('2026-04-15T12:00:00Z')).toBe('Newborn');
    });

    it('returns "Nmo" for ages between 1 and 11 months', () => {
      expect(getFormattedAge('2026-01-15T12:00:00Z')).toBe('3mo');
    });

    it('returns "Ny" with no remainder when months are exact multiples of 12', () => {
      expect(getFormattedAge('2025-04-15T12:00:00Z')).toBe('1y');
    });

    it('returns "Ny Nmo" for mixed years and months', () => {
      expect(getFormattedAge('2024-10-15T12:00:00Z')).toBe('1y 6mo');
    });
  });

  describe('getDevelopmentalStage', () => {
    beforeEach(() => {
      vi.setSystemTime(new Date('2026-04-20T12:00:00Z'));
    });

    it('returns Newborn for < 3 months', () => {
      expect(getDevelopmentalStage('2026-03-15T12:00:00Z').label).toBe('Newborn');
    });

    it('returns Infant for 3 to under 12 months', () => {
      expect(getDevelopmentalStage('2025-10-15T12:00:00Z').label).toBe('Infant');
    });

    it('returns Toddler for 12 to under 36 months', () => {
      expect(getDevelopmentalStage('2024-04-15T12:00:00Z').label).toBe('Toddler');
    });

    it('returns Preschool for 36 to under 60 months', () => {
      expect(getDevelopmentalStage('2022-10-15T12:00:00Z').label).toBe('Preschool');
    });

    it('returns Child for 60+ months', () => {
      expect(getDevelopmentalStage('2020-01-15T12:00:00Z').label).toBe('Child');
    });
  });

  describe('isOlderThanHours', () => {
    beforeEach(() => {
      vi.setSystemTime(new Date('2026-04-20T12:00:00Z'));
    });

    it('returns true when the date is older than the threshold', () => {
      const twoHoursAgo = new Date('2026-04-20T10:00:00Z');
      expect(isOlderThanHours(twoHoursAgo, 1)).toBe(true);
    });

    it('returns false when the date is younger than the threshold', () => {
      const halfHourAgo = new Date('2026-04-20T11:30:00Z');
      expect(isOlderThanHours(halfHourAgo, 1)).toBe(false);
    });

    it('uses strict greater-than at the boundary (exactly 1 hour ago is not older)', () => {
      const exactlyOneHourAgo = new Date('2026-04-20T11:00:00Z');
      expect(isOlderThanHours(exactlyOneHourAgo, 1)).toBe(false);
    });

    it('accepts ISO strings as well as Date objects', () => {
      expect(isOlderThanHours('2026-04-20T10:00:00Z', 1)).toBe(true);
    });
  });
});
