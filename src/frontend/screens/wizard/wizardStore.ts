import { z } from 'zod';
import { create } from 'zustand';

// Child data structure
export const childSchema = z.object({
  name: z.string().optional(), // Optional for expecting parents
  age: z.string(), // Display string like "0-3 months"
  ageInMonths: z.number().optional(),
  stage: z.enum(['expecting', 'newborn', 'infant', 'toddler', 'preschool', 'school']).optional(),
  dateOfBirth: z.string().optional(), // YYYY-MM-DD format
});

export type ChildData = z.infer<typeof childSchema>;

// Schema for validation
export const wizardSchema = z.object({
  parentName: z.string().min(1, "Name is required"),
  intent: z.enum(['sleep', 'feeding', 'behavior', 'development', 'health', 'other']),
  customIntent: z.string().optional(), // When intent is 'other', this holds the custom text
  children: z.array(childSchema).min(1).max(2), // 1-2 children
  mainChallenge: z.string(),
});

export type WizardData = z.infer<typeof wizardSchema>;

export type WizardStep = 'parentName' | 'intent' | 'childProfile' | 'challenge';

interface WizardStore {
  // State
  currentStep: WizardStep;
  data: Partial<WizardData>;
  direction: 'forward' | 'back';

  // Actions
  setStep: (step: WizardStep, direction: 'forward' | 'back') => void;
  updateData: (data: Partial<WizardData>) => void;
  reset: () => void;

  // Backward compatibility helpers for accessing first child
  getChildName: () => string | undefined;
  getChildAge: () => string | undefined;
  getChildAgeInMonths: () => number | undefined;
  getChildStage: () => 'expecting' | 'newborn' | 'infant' | 'toddler' | 'preschool' | 'school' | undefined;
  getChildDateOfBirth: () => string | undefined;
}

export const useWizardStore = create<WizardStore>((set, get) => ({
  currentStep: 'parentName',
  data: {},
  direction: 'forward',

  setStep: (step, direction) => set({ currentStep: step, direction }),
  updateData: (newData) => set((state) => ({ data: { ...state.data, ...newData } })),
  reset: () => set({ currentStep: 'parentName', data: {}, direction: 'forward' }),

  // Backward compatibility helpers
  getChildName: () => {
    const state = get();
    return state.data.children?.[0]?.name;
  },
  getChildAge: () => {
    const state = get();
    return state.data.children?.[0]?.age;
  },
  getChildAgeInMonths: () => {
    const state = get();
    return state.data.children?.[0]?.ageInMonths;
  },
  getChildStage: () => {
    const state = get();
    return state.data.children?.[0]?.stage;
  },
  getChildDateOfBirth: () => {
    const state = get();
    return state.data.children?.[0]?.dateOfBirth;
  },
}));
