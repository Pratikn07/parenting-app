export type SettingsView = 'main' | 'account' | 'notifications' | 'subscription';

export interface ChipOption {
  id: string;
  label: string;
}

export const STAGES: ChipOption[] = [
  { id: 'expecting', label: 'Expecting' },
  { id: 'newborn', label: 'Newborn' },
  { id: 'infant', label: 'Infant' },
];

export const FEEDING_OPTIONS: ChipOption[] = [
  { id: 'breastfeeding', label: 'Breastfeeding' },
  { id: 'formula', label: 'Formula' },
  { id: 'mixed', label: 'Mixed' },
];

export interface BabyProfile {
  name: string;
  dob: string | null;
}
