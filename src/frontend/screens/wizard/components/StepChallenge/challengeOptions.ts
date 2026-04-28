import type { WizardData } from '../../wizardStore';

export interface ChallengeOption {
  challenge: string;
  emoji: string;
}

interface IntentInfo {
  label: string;
  emoji: string;
}

export const INTENT_INFO: Record<string, IntentInfo> = {
  sleep: { label: 'Sleep', emoji: '😴' },
  feeding: { label: 'Feeding & Nutrition', emoji: '🍼' },
  behavior: { label: 'Behavior', emoji: '🧠' },
  development: { label: 'Development', emoji: '📈' },
  health: { label: 'Health & Wellness', emoji: '💚' },
  other: { label: 'Parenting', emoji: '👨‍👩‍👧' },
};

// Generic fallback used by intents that don't break out by age band
const GENERAL_FALLBACK: ChallengeOption[] = [
  { challenge: 'Daily routine', emoji: '📅' },
  { challenge: 'Parental burnout', emoji: '😮‍💨' },
  { challenge: 'Work-life balance', emoji: '⚖️' },
  { challenge: 'Partner teamwork', emoji: '🤝' },
  { challenge: 'Just exploring', emoji: '🔍' },
];

const EXPECTING_BY_INTENT: Record<string, ChallengeOption[]> = {
  sleep: [
    { challenge: 'Sleep during pregnancy', emoji: '🛏️' },
    { challenge: 'Preparing baby sleep space', emoji: '🌙' },
    { challenge: 'Sleep schedule planning', emoji: '📅' },
    { challenge: 'Managing fatigue', emoji: '😴' },
  ],
  feeding: [
    { challenge: 'Breastfeeding prep', emoji: '🤱' },
    { challenge: 'Formula research', emoji: '🍼' },
    { challenge: 'Nutrition during pregnancy', emoji: '🥗' },
    { challenge: 'Building a feeding plan', emoji: '📋' },
  ],
  health: [
    { challenge: 'Prenatal wellness', emoji: '🧘' },
    { challenge: 'Birth plan anxiety', emoji: '📝' },
    { challenge: 'Finding the right doctor', emoji: '👩‍⚕️' },
    { challenge: 'Managing pregnancy symptoms', emoji: '💊' },
  ],
};

const EXPECTING_DEFAULT: ChallengeOption[] = [
  { challenge: 'Preparing for arrival', emoji: '🏠' },
  { challenge: 'Nursery setup', emoji: '🛏️' },
  { challenge: 'Work-life balance', emoji: '⚖️' },
  { challenge: 'Building confidence', emoji: '💪' },
  { challenge: 'Just exploring', emoji: '🔍' },
];

type AgeBand = 'newborn' | 'infant' | 'toddler' | 'preschool' | 'school';

function resolveAgeBand(ageInMonths: number, stage?: string): AgeBand {
  if (stage === 'newborn' || ageInMonths < 4) return 'newborn';
  if (stage === 'infant' || ageInMonths < 12) return 'infant';
  if (stage === 'toddler' || ageInMonths < 36) return 'toddler';
  if (stage === 'preschool' || ageInMonths < 60) return 'preschool';
  return 'school';
}

// SLEEP: split newborn/infant/toddler, share preschool+school
const SLEEP_BY_BAND: Record<AgeBand, ChallengeOption[]> = {
  newborn: [
    { challenge: 'Day/night confusion', emoji: '🌓' },
    { challenge: 'Frequent night waking', emoji: '🌙' },
    { challenge: 'Short naps', emoji: '⏱️' },
    { challenge: 'Safe sleep setup', emoji: '🛏️' },
    { challenge: 'Sleep deprivation (mine!)', emoji: '😵' },
  ],
  infant: [
    { challenge: 'Sleep regression', emoji: '📉' },
    { challenge: 'Transitioning to crib', emoji: '🛏️' },
    { challenge: 'Dropping night feeds', emoji: '🍼' },
    { challenge: 'Nap schedule', emoji: '📅' },
    { challenge: 'Self-soothing', emoji: '🧸' },
  ],
  toddler: [
    { challenge: 'Bedtime battles', emoji: '⚔️' },
    { challenge: 'Early morning waking', emoji: '🌅' },
    { challenge: 'Nightmares/night terrors', emoji: '👻' },
    { challenge: 'Moving to big bed', emoji: '🛏️' },
    { challenge: 'Dropping the nap', emoji: '😴' },
  ],
  preschool: [
    { challenge: 'Bedtime routine', emoji: '📖' },
    { challenge: 'Screen time affecting sleep', emoji: '📱' },
    { challenge: 'Night waking', emoji: '🌙' },
    { challenge: 'School schedule adjustment', emoji: '🏫' },
    { challenge: 'Staying in bed', emoji: '🛏️' },
  ],
  school: [
    { challenge: 'Bedtime routine', emoji: '📖' },
    { challenge: 'Screen time affecting sleep', emoji: '📱' },
    { challenge: 'Night waking', emoji: '🌙' },
    { challenge: 'School schedule adjustment', emoji: '🏫' },
    { challenge: 'Staying in bed', emoji: '🛏️' },
  ],
};

const FEEDING_BY_BAND: Record<AgeBand, ChallengeOption[]> = {
  newborn: [
    { challenge: 'Breastfeeding latch', emoji: '🤱' },
    { challenge: 'Bottle refusal', emoji: '🍼' },
    { challenge: 'Feeding frequency', emoji: '⏰' },
    { challenge: 'Reflux/colic', emoji: '😢' },
    { challenge: 'Pumping & supply', emoji: '🥛' },
  ],
  infant: [
    { challenge: 'Starting solids', emoji: '🥄' },
    { challenge: 'Food allergies', emoji: '⚠️' },
    { challenge: 'Weaning', emoji: '🍼' },
    { challenge: 'Texture progression', emoji: '🥕' },
    { challenge: 'Self-feeding mess', emoji: '🙈' },
  ],
  toddler: [
    { challenge: 'Picky eating', emoji: '🙅' },
    { challenge: 'Mealtime tantrums', emoji: '😤' },
    { challenge: 'Snack obsession', emoji: '🍪' },
    { challenge: 'Refusing vegetables', emoji: '🥦' },
    { challenge: 'Eating independence', emoji: '🍴' },
  ],
  preschool: [
    { challenge: 'Healthy lunch ideas', emoji: '🥪' },
    { challenge: 'Sugar management', emoji: '🍭' },
    { challenge: 'Eating at school', emoji: '🏫' },
    { challenge: 'Body image talks', emoji: '💪' },
    { challenge: 'Trying new foods', emoji: '🍽️' },
  ],
  school: [
    { challenge: 'Healthy lunch ideas', emoji: '🥪' },
    { challenge: 'Sugar management', emoji: '🍭' },
    { challenge: 'Eating at school', emoji: '🏫' },
    { challenge: 'Body image talks', emoji: '💪' },
    { challenge: 'Trying new foods', emoji: '🍽️' },
  ],
};

// BEHAVIOR: newborn+infant share, then toddler/preschool/school distinct
const BEHAVIOR_INFANT: ChallengeOption[] = [
  { challenge: 'Crying & fussiness', emoji: '😢' },
  { challenge: 'Separation anxiety', emoji: '🥺' },
  { challenge: 'Stranger danger phase', emoji: '👀' },
  { challenge: 'Overstimulation', emoji: '😵' },
  { challenge: 'Understanding cues', emoji: '🤔' },
];
const BEHAVIOR_BY_BAND: Record<AgeBand, ChallengeOption[]> = {
  newborn: BEHAVIOR_INFANT,
  infant: BEHAVIOR_INFANT,
  toddler: [
    { challenge: 'Tantrums', emoji: '🌪️' },
    { challenge: 'Biting/hitting', emoji: '😬' },
    { challenge: 'Sharing struggles', emoji: '🧸' },
    { challenge: 'Potty training', emoji: '🚽' },
    { challenge: '"No!" phase', emoji: '🙅' },
  ],
  preschool: [
    { challenge: 'Emotional regulation', emoji: '🎭' },
    { challenge: 'Listening skills', emoji: '👂' },
    { challenge: 'Making friends', emoji: '👫' },
    { challenge: 'Following rules', emoji: '📏' },
    { challenge: 'Whining', emoji: '😩' },
  ],
  school: [
    { challenge: 'Defiance', emoji: '😤' },
    { challenge: 'Sibling rivalry', emoji: '👊' },
    { challenge: 'Confidence building', emoji: '💪' },
    { challenge: 'Homework battles', emoji: '📚' },
    { challenge: 'Screen time limits', emoji: '📱' },
  ],
};

// DEVELOPMENT: newborn+infant share, toddler distinct, preschool+school share
const DEV_INFANT: ChallengeOption[] = [
  { challenge: 'Milestone tracking', emoji: '📊' },
  { challenge: 'Tummy time', emoji: '👶' },
  { challenge: 'Motor skill development', emoji: '🤸' },
  { challenge: 'Language stimulation', emoji: '🗣️' },
  { challenge: 'Play & engagement', emoji: '🎯' },
];
const DEV_OLDER: ChallengeOption[] = [
  { challenge: 'School readiness', emoji: '🏫' },
  { challenge: 'Reading & writing', emoji: '📖' },
  { challenge: 'Focus & attention', emoji: '🎯' },
  { challenge: 'Creative expression', emoji: '🎨' },
  { challenge: 'Problem solving', emoji: '🧠' },
];
const DEVELOPMENT_BY_BAND: Record<AgeBand, ChallengeOption[]> = {
  newborn: DEV_INFANT,
  infant: DEV_INFANT,
  toddler: [
    { challenge: 'Speech delay concerns', emoji: '🗣️' },
    { challenge: 'Walking/running', emoji: '🏃' },
    { challenge: 'Learning through play', emoji: '🧩' },
    { challenge: 'Independence skills', emoji: '👍' },
    { challenge: 'Social development', emoji: '👫' },
  ],
  preschool: DEV_OLDER,
  school: DEV_OLDER,
};

// HEALTH
const HEALTH_INFANT: ChallengeOption[] = [
  { challenge: 'Vaccination schedule', emoji: '💉' },
  { challenge: 'Common illnesses', emoji: '🤒' },
  { challenge: 'Skin care (eczema, rashes)', emoji: '🧴' },
  { challenge: 'Growth concerns', emoji: '📈' },
  { challenge: 'Finding a pediatrician', emoji: '👩‍⚕️' },
];
const HEALTH_OLDER: ChallengeOption[] = [
  { challenge: 'Staying healthy at school', emoji: '🏫' },
  { challenge: 'Mental wellness', emoji: '🧘' },
  { challenge: 'Sports & physical activity', emoji: '⚽' },
  { challenge: 'Vision/hearing checks', emoji: '👁️' },
  { challenge: 'Building immunity', emoji: '💪' },
];
const HEALTH_BY_BAND: Record<AgeBand, ChallengeOption[]> = {
  newborn: HEALTH_INFANT,
  infant: HEALTH_INFANT,
  toddler: [
    { challenge: 'Frequent colds', emoji: '🤧' },
    { challenge: 'Teething pain', emoji: '🦷' },
    { challenge: 'Active play safety', emoji: '⚠️' },
    { challenge: 'Allergies', emoji: '🌸' },
    { challenge: 'Dental care', emoji: '🪥' },
  ],
  preschool: HEALTH_OLDER,
  school: HEALTH_OLDER,
};

const CHALLENGES_BY_INTENT: Record<string, Record<AgeBand, ChallengeOption[]>> = {
  sleep: SLEEP_BY_BAND,
  feeding: FEEDING_BY_BAND,
  behavior: BEHAVIOR_BY_BAND,
  development: DEVELOPMENT_BY_BAND,
  health: HEALTH_BY_BAND,
};

export function getChallenges(
  intent: WizardData['intent'],
  ageInMonths: number,
  stage?: string
): ChallengeOption[] {
  if (stage === 'expecting') {
    return (intent && EXPECTING_BY_INTENT[intent]) || EXPECTING_DEFAULT;
  }

  const band = resolveAgeBand(ageInMonths, stage);
  const intentTable = intent ? CHALLENGES_BY_INTENT[intent] : undefined;
  return intentTable?.[band] || GENERAL_FALLBACK;
}

export function getTitle(intent: WizardData['intent'], stage?: string): string {
  if (stage === 'expecting') {
    return "What's on your mind?";
  }
  const intentInfo = INTENT_INFO[intent || 'other'];
  return `${intentInfo.emoji} ${intentInfo.label} Challenge`;
}

function getChildrenDisplayName(children?: WizardData['children']): string {
  if (!children || children.length === 0) return 'your little one';
  if (children.length === 1) return children[0].name || 'your little one';
  const names = children
    .map((c) => c.name)
    .filter((n): n is string => Boolean(n && n.trim()));
  if (names.length === 0) return 'your little ones';
  if (names.length === 1) return names[0];
  return `${names[0]} and ${names[1]}`;
}

export function getSubtitle(
  intent: WizardData['intent'],
  children?: WizardData['children'],
  stage?: string
): string {
  const name = getChildrenDisplayName(children);

  if (stage === 'expecting') {
    return `Let's prepare for ${name}'s arrival together.`;
  }

  switch (intent) {
    case 'sleep':
      return `Let's tackle ${name}'s sleep together.`;
    case 'feeding':
      return `Let's make mealtimes easier for ${name}.`;
    case 'behavior':
      return `Let's understand ${name}'s behavior better.`;
    case 'development':
      return `Let's support ${name}'s growth journey.`;
    case 'health':
      return `Let's keep ${name} healthy & happy.`;
    default:
      return `What matters most for ${name} right now?`;
  }
}
