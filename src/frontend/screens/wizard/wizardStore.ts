import { z } from 'zod';
import { create } from 'zustand';

// Schema for validation
export const wizardSchema = z.object({
  parentName: z.string().min(1, "Name is required"),
  intent: z.enum(['sleep', 'feeding', 'behavior', 'development', 'health', 'other']),
  customIntent: z.string().optional(), // When intent is 'other', this holds the custom text
  childName: z.string().optional(), // Optional for expecting parents
  childAge: z.string(), // Can be "0-3m", "toddler", etc. or specific date
  childAgeInMonths: z.number().optional(),
  childStage: z.enum(['expecting', 'newborn', 'infant', 'toddler', 'preschool', 'school']).optional(),
  childDateOfBirth: z.string().optional(), // Actual DOB in YYYY-MM-DD format
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
}

export const useWizardStore = create<WizardStore>((set) => ({
  currentStep: 'parentName',
  data: {},
  direction: 'forward',
  
  setStep: (step, direction) => set({ currentStep: step, direction }),
  updateData: (newData) => set((state) => ({ data: { ...state.data, ...newData } })),
  reset: () => set({ currentStep: 'parentName', data: {}, direction: 'forward' }),
}));

