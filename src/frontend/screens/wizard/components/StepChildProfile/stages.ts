import type { ChildData } from '../../wizardStore';

export const STAGES = [
  { label: 'Expecting',  range: 'Baby on the way', emoji: '🤰', color: '#FCE7F3', textColor: '#9D174D', months: 0,  stage: 'expecting' },
  { label: 'Newborn',    range: '0-3 months',      emoji: '👶', color: '#FEF3C7', textColor: '#92400E', months: 1,  stage: 'newborn'   },
  { label: 'Infant',     range: '4-12 months',     emoji: '🍼', color: '#DBEAFE', textColor: '#1E40AF', months: 8,  stage: 'infant'    },
  { label: 'Toddler',    range: '1-3 years',       emoji: '🧸', color: '#FEE2E2', textColor: '#991B1B', months: 24, stage: 'toddler'   },
  { label: 'Preschool',  range: '3-5 years',       emoji: '🎨', color: '#D1FAE5', textColor: '#065F46', months: 48, stage: 'preschool' },
  { label: 'School Age', range: '5+ years',        emoji: '🎒', color: '#E0E7FF', textColor: '#3730A3', months: 72, stage: 'school'    },
] as const;

export type StageDef = (typeof STAGES)[number];

export interface ChildFormData {
  id: string;
  name: string;
  selectedIndex: number;
  dateOfBirth: Date | null;
  showDatePicker: boolean;
}

export function isExpectingStage(stage: StageDef): boolean {
  return stage.stage === 'expecting';
}

export function calculateAge(dob: Date): string {
  const today = new Date();
  const months =
    (today.getFullYear() - dob.getFullYear()) * 12 + (today.getMonth() - dob.getMonth());
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0) {
    return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''} old`;
  }
  if (remainingMonths === 0) {
    return `${years} year${years !== 1 ? 's' : ''} old`;
  }
  return `${years}y ${remainingMonths}mo old`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function isChildValid(child: ChildFormData): boolean {
  const stage = STAGES[child.selectedIndex];
  const expecting = isExpectingStage(stage);
  const isNameValid = expecting || child.name.trim().length > 0;
  const isDobValid = expecting || child.dateOfBirth !== null;
  return isNameValid && isDobValid;
}

export function toChildData(child: ChildFormData): ChildData {
  const stage = STAGES[child.selectedIndex];
  let ageInMonths = stage.months;

  if (child.dateOfBirth && stage.stage !== 'expecting') {
    const today = new Date();
    ageInMonths =
      (today.getFullYear() - child.dateOfBirth.getFullYear()) * 12 +
      (today.getMonth() - child.dateOfBirth.getMonth());
  }

  return {
    name: child.name.trim() || (stage.stage === 'expecting' ? 'Baby' : ''),
    age: stage.range,
    ageInMonths,
    stage: stage.stage as ChildData['stage'],
    dateOfBirth: child.dateOfBirth ? child.dateOfBirth.toISOString().split('T')[0] : undefined,
  };
}
