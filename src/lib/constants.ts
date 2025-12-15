// Application constants and configuration

export const APP_CONFIG = {
  name: 'My Curated Haven',
  version: '1.0.0',
  description: 'AI-powered parenting companion app',
} as const;

export const SUPABASE_CONFIG = {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL!,
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  apiUrl: process.env.EXPO_PUBLIC_API_URL!,
} as const;

export const THEME = {
  colors: {
    primary: '#E07A5F',    // Terracotta - Love/Care/Primary Actions
    secondary: '#8BA888',  // Sage Green - Growth/Data/Success
    background: '#FDFCF8', // Soft Cream
    text: {
      primary: '#3D405B',
      secondary: '#6B7280',
      light: '#FFFFFF',
      accent: '#E07A5F',
    },
    ui: {
      white: '#FFFFFF',
      border: '#E5E7EB',
      inputBg: '#F9FAFB',
    },
    status: {
      error: '#EF4444',
      success: '#8BA888',
      warning: '#F59E0B',
    }
  },
  fonts: {
    header: 'Nunito_700Bold',
    body: 'Inter_400Regular',
    bodyMedium: 'Inter_500Medium',
    bodySemiBold: 'Inter_600SemiBold',
  },
  layout: {
    borderRadius: {
      sm: 12,
      md: 24,
      lg: 30,
    }
  }
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
  preschool: 'Preschool (3-5 years)',
  school: 'School Age (5+ years)',
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

export const TIP_CATEGORIES = {
  sleep: { name: 'Sleep & Rest', icon: 'Moon', color: '#6366F1' },
  feeding: { name: 'Feeding & Nutrition', icon: 'Utensils', color: '#F59E0B' },
  development: { name: 'Growth & Development', icon: 'TrendingUp', color: '#10B981' },
  health: { name: 'Health & Wellness', icon: 'Heart', color: '#EF4444' },
  behavior: { name: 'Behavior & Discipline', icon: 'Brain', color: '#8B5CF6' },
  activities: { name: 'Play & Activities', icon: 'Puzzle', color: '#EC4899' },
  safety: { name: 'Safety & Childproofing', icon: 'Shield', color: '#14B8A6' },
  bonding: { name: 'Bonding & Connection', icon: 'Heart', color: '#E07A5F' },
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
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, // At least 1 lowercase, 1 uppercase, 1 digit, 1 symbol
    description: '8+ characters with uppercase, lowercase, number, and symbol (@$!%*?&)',
  },
  name: {
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s'-]+$/, // Letters, spaces, hyphens, apostrophes
  },
} as const;

export const FEEDING_TYPES_DATA = [
  { key: 'pregnancyNutrition', label: 'Pregnancy Nutrition', description: 'Healthy recipes for expecting mothers' },
  { key: 'babyPurees', label: 'Baby Purees', description: 'Smooth textures for 4-10mo' },
  { key: 'fingerFoods', label: 'Finger Foods', description: 'Self-feeding bites for 8-24mo' },
  { key: 'toddlerMeals', label: 'Toddler Meals', description: 'Balanced meals for 12mo-4yr' },
  { key: 'familyDinners', label: 'Family Dinners', description: 'One meal for everyone (12mo+)' },
  { key: 'lunchboxIdeas', label: 'Lunchbox Ideas', description: 'Packable meals for 3yr+' },
  { key: 'treatsSnacks', label: 'Treats & Snacks', description: 'Occasional goodies' },
];
