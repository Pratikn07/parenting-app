import { describe, it, expect } from 'vitest';
import { 
  VALIDATION, 
  PARENTING_STAGES, 
  FEEDING_PREFERENCES, 
  MILESTONE_TYPES, 
  ROUTES, 
  APP_CONFIG, 
  AUTH_CONFIG 
} from './constants';

describe('Validation Business Logic', () => {
  describe('Email Validation', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com'
      ];

      validEmails.forEach(email => {
        expect(VALIDATION.email.test(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        ''
      ];

      invalidEmails.forEach(email => {
        expect(VALIDATION.email.test(email)).toBe(false);
      });
    });
  });

  describe('Password Validation', () => {
    it('should enforce minimum length requirement', () => {
      const shortPassword = 'Ab1';
      const validPassword = 'AbCdEf123';

      expect(shortPassword.length < VALIDATION.password.minLength).toBe(true);
      expect(validPassword.length >= VALIDATION.password.minLength).toBe(true);
    });

    it('should validate password complexity requirements', () => {
      const validPasswords = [
        'Password123',
        'MySecure123',
        'Test123Pass',
        'AbCdEf123'
      ];

      const invalidPasswords = [
        'password123', // No uppercase
        'PASSWORD123', // No lowercase
        'PasswordABC'  // No digit
      ];

      validPasswords.forEach(password => {
        expect(VALIDATION.password.pattern.test(password)).toBe(true);
      });

      invalidPasswords.forEach(password => {
        expect(VALIDATION.password.pattern.test(password)).toBe(false);
      });
    });
  });

  describe('Name Validation', () => {
    it('should validate proper name formats', () => {
      const validNames = [
        'John Doe',
        "Mary O'Connor",
        'Jean-Pierre'
      ];

      validNames.forEach(name => {
        expect(name.length >= VALIDATION.name.minLength).toBe(true);
        expect(name.length <= VALIDATION.name.maxLength).toBe(true);
        expect(VALIDATION.name.pattern.test(name)).toBe(true);
      });
    });

    it('should reject invalid name formats', () => {
      const invalidNames = [
        'A',           // Too short
        'John123',     // Contains numbers
        'John@Doe',    // Contains symbols
        'John_Doe',    // Contains underscore
        '',            // Empty string
        'A'.repeat(51) // Too long
      ];

      invalidNames.forEach(name => {
        const isValidLength = name.length >= VALIDATION.name.minLength && 
                             name.length <= VALIDATION.name.maxLength;
        const isValidPattern = VALIDATION.name.pattern.test(name);
        
        expect(isValidLength && isValidPattern).toBe(false);
      });
    });
  });

  describe('Business Rule Validation', () => {
    it('should validate parenting stage values', () => {
      const validStages = ['expecting', 'newborn', 'infant', 'toddler'];
      const invalidStages = ['teenager', 'adult', '', 'unknown'];

      // Check that all valid stages are defined in constants
      validStages.forEach(stage => {
        expect(Object.keys(PARENTING_STAGES)).toContain(stage);
      });

      // Check that invalid stages would be rejected
      invalidStages.forEach(stage => {
        expect(Object.keys(PARENTING_STAGES)).not.toContain(stage);
      });
    });

    it('should validate feeding preference values', () => {
      const validPreferences = ['breastfeeding', 'formula', 'mixed'];
      const invalidPreferences = ['bottle', 'solid', '', 'unknown'];

      validPreferences.forEach(preference => {
        expect(Object.keys(FEEDING_PREFERENCES)).toContain(preference);
      });

      invalidPreferences.forEach(preference => {
        expect(Object.keys(FEEDING_PREFERENCES)).not.toContain(preference);
      });
    });

    it('should validate milestone types', () => {
      const validTypes = ['physical', 'cognitive', 'social', 'emotional'];
      const invalidTypes = ['academic', 'spiritual', '', 'unknown'];

      validTypes.forEach(type => {
        expect(Object.keys(MILESTONE_TYPES)).toContain(type);
      });

      invalidTypes.forEach(type => {
        expect(Object.keys(MILESTONE_TYPES)).not.toContain(type);
      });
    });
  });

  describe('Route Validation', () => {
    it('should have all required application routes defined', () => {
      const requiredRoutes = ['index', 'launch', 'auth', 'onboarding', 'chat', 'resources', 'settings'];

      requiredRoutes.forEach(route => {
        expect(ROUTES).toHaveProperty(route);
        expect(typeof ROUTES[route]).toBe('string');
        expect(ROUTES[route].startsWith('/')).toBe(true);
      });
    });

    it('should have unique route paths', () => {
      const routePaths = Object.values(ROUTES);
      const uniquePaths = new Set(routePaths);

      expect(routePaths.length).toBe(uniquePaths.size);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate app configuration structure', () => {
      expect(APP_CONFIG).toHaveProperty('name');
      expect(APP_CONFIG).toHaveProperty('version');
      expect(APP_CONFIG).toHaveProperty('description');
      
      expect(typeof APP_CONFIG.name).toBe('string');
      expect(typeof APP_CONFIG.version).toBe('string');
      expect(typeof APP_CONFIG.description).toBe('string');
      
      expect(APP_CONFIG.name.length).toBeGreaterThan(0);
      expect(APP_CONFIG.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should validate auth configuration structure', () => {
      expect(AUTH_CONFIG).toHaveProperty('sessionDuration');
      expect(AUTH_CONFIG).toHaveProperty('refreshBuffer');
      expect(AUTH_CONFIG).toHaveProperty('storageKeys');

      expect(typeof AUTH_CONFIG.sessionDuration).toBe('number');
      expect(typeof AUTH_CONFIG.refreshBuffer).toBe('number');
      expect(typeof AUTH_CONFIG.storageKeys).toBe('object');

      expect(AUTH_CONFIG.sessionDuration).toBeGreaterThan(0);
      expect(AUTH_CONFIG.refreshBuffer).toBeGreaterThan(0);
    });
  });
});
