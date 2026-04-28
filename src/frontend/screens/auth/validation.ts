import type { AuthFormData } from '@/src/shared/types/auth.types';

export type AuthFormErrors = Partial<AuthFormData>;

const EMAIL_REGEX = /\S+@\S+\.\S+/;

const PASSWORD_RULES: Array<{ test: (pw: string) => boolean; message: string }> = [
  { test: (pw) => pw.length >= 8, message: 'Password must be at least 8 characters' },
  { test: (pw) => /(?=.*[a-z])/.test(pw), message: 'Password must contain a lowercase letter' },
  { test: (pw) => /(?=.*[A-Z])/.test(pw), message: 'Password must contain an uppercase letter' },
  { test: (pw) => /(?=.*\d)/.test(pw), message: 'Password must contain a number' },
  { test: (pw) => /(?=.*[@$!%*?&])/.test(pw), message: 'Password must contain a symbol (@$!%*?&)' },
];

export const PASSWORD_HELPER_TEXT =
  'Password must be at least 8 characters, contain uppercase, lowercase, number, and symbol.';

function firstPasswordRuleFailure(password: string): string | null {
  for (const rule of PASSWORD_RULES) {
    if (!rule.test(password)) return rule.message;
  }
  return null;
}

interface ValidateOptions {
  isSignIn: boolean;
}

export function validateAuthForm(
  data: AuthFormData,
  { isSignIn }: ValidateOptions
): AuthFormErrors {
  const errors: AuthFormErrors = {};

  if (!isSignIn && !data.name.trim()) {
    errors.name = 'Name is required';
  }

  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!EMAIL_REGEX.test(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!data.password) {
    errors.password = 'Password is required';
  } else if (!isSignIn) {
    const passwordError = firstPasswordRuleFailure(data.password);
    if (passwordError) errors.password = passwordError;
  }

  if (!isSignIn && !errors.password) {
    if (!data.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (data.password !== data.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
  }

  return errors;
}
