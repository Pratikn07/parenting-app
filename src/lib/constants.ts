// Application constants and configuration

export const APP_CONFIG = {
  name: 'Parenting App',
  version: '1.0.0',
  description: 'AI-powered parenting companion app',
} as const;

export const SUPABASE_CONFIG = {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL!,
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  apiUrl: process.env.EXPO_PUBLIC_API_URL!,
} as const;

export const AUTH_CONFIG = {
  // Session duration in seconds (24 hours)
  sessionDuration: 24 * 60 * 60,
  // Auto refresh token before expiry (5 minutes before)
  refreshBuffer: 5 * 60,
  // Storage keys
  storageKeys: {
    session: 'supabase.auth.token',
    user: 'parenting-app.user',
    onboarding: 'parenting-app.onboarding',
  },
} as const;

export const PARENTING_STAGES = {
  expecting: 'Expecting',
  newborn: 'Newborn (0-3 months)',
  infant: 'Infant (3-12 months)',
  toddler: 'Toddler (1-3 years)',
} as const;

export const FEEDING_PREFERENCES = {
  breastfeeding: 'Breastfeeding',
  formula: 'Formula Feeding',
  mixed: 'Mixed Feeding',
} as const;

export const MILESTONE_TYPES = {
  physical: 'Physical Development',
  cognitive: 'Cognitive Development',
  social: 'Social Development',
  emotional: 'Emotional Development',
} as const;

export const ROUTES = {
  index: '/',
  launch: '/launch',
  auth: '/auth',
  onboarding: '/onboarding',
  chat: '/chat',
  resources: '/resources',
  settings: '/settings',
} as const;

// Validation patterns
export const VALIDATION = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: {
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, // At least 1 lowercase, 1 uppercase, 1 digit
  },
  name: {
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s'-]+$/, // Letters, spaces, hyphens, apostrophes
  },
} as const;