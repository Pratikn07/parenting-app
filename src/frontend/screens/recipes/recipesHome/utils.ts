import { getAgeInMonths } from '@/src/lib/dateUtils';

const DEFAULT_AGE_MONTHS = 12;

export function getChildAgeMonths(birthDate: string | null | undefined): number {
  if (!birthDate) return DEFAULT_AGE_MONTHS;
  return getAgeInMonths(birthDate);
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
