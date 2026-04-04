import { describe, it, expect } from 'vitest';
import { ValidationUtils } from './ValidationUtils.js';

describe('ValidationUtils', () => {
  describe('isValidEmail', () => {
    it('returns true for valid email addresses', () => {
      expect(ValidationUtils.isValidEmail('user@example.com')).toBe(true);
      expect(ValidationUtils.isValidEmail('user.name@domain.co')).toBe(true);
      expect(ValidationUtils.isValidEmail('user+tag@example.org')).toBe(true);
    });

    it('returns false for invalid email addresses', () => {
      expect(ValidationUtils.isValidEmail('')).toBe(false);
      expect(ValidationUtils.isValidEmail('notanemail')).toBe(false);
      expect(ValidationUtils.isValidEmail('@domain.com')).toBe(false);
      expect(ValidationUtils.isValidEmail('user@')).toBe(false);
      expect(ValidationUtils.isValidEmail('user @domain.com')).toBe(false);
    });
  });

  describe('isValidSlug', () => {
    it('returns true for valid slugs', () => {
      expect(ValidationUtils.isValidSlug('hello-world')).toBe(true);
      expect(ValidationUtils.isValidSlug('post123')).toBe(true);
      expect(ValidationUtils.isValidSlug('a')).toBe(true);
      expect(ValidationUtils.isValidSlug('my-blog-post-2024')).toBe(true);
    });

    it('returns false for invalid slugs', () => {
      expect(ValidationUtils.isValidSlug('')).toBe(false);
      expect(ValidationUtils.isValidSlug('-starts-with-hyphen')).toBe(false);
      expect(ValidationUtils.isValidSlug('ends-with-hyphen-')).toBe(false);
      expect(ValidationUtils.isValidSlug('has spaces')).toBe(false);
      expect(ValidationUtils.isValidSlug('UPPERCASE')).toBe(false);
      expect(ValidationUtils.isValidSlug('special!chars')).toBe(false);
      expect(ValidationUtils.isValidSlug('double--hyphen')).toBe(false);
    });
  });

  describe('isValidDateString', () => {
    it('returns true for valid YYYY-MM-DD dates', () => {
      expect(ValidationUtils.isValidDateString('2024-01-01')).toBe(true);
      expect(ValidationUtils.isValidDateString('2024-12-31')).toBe(true);
      expect(ValidationUtils.isValidDateString('2024-02-29')).toBe(true);
    });

    it('returns false for invalid date formats', () => {
      expect(ValidationUtils.isValidDateString('')).toBe(false);
      expect(ValidationUtils.isValidDateString('01-01-2024')).toBe(false);
      expect(ValidationUtils.isValidDateString('2024/01/01')).toBe(false);
      expect(ValidationUtils.isValidDateString('not-a-date')).toBe(false);
    });

    it('returns false for invalid calendar dates', () => {
      expect(ValidationUtils.isValidDateString('2024-13-01')).toBe(false);
      expect(ValidationUtils.isValidDateString('2024-02-30')).toBe(false);
      expect(ValidationUtils.isValidDateString('2023-02-29')).toBe(false);
    });
  });

  describe('isValidTodoTitle', () => {
    it('returns true for valid titles', () => {
      expect(ValidationUtils.isValidTodoTitle('Buy groceries')).toBe(true);
      expect(ValidationUtils.isValidTodoTitle('a')).toBe(true);
    });

    it('returns false for empty or whitespace-only titles', () => {
      expect(ValidationUtils.isValidTodoTitle('')).toBe(false);
      expect(ValidationUtils.isValidTodoTitle('   ')).toBe(false);
    });

    it('returns false for titles exceeding 500 characters', () => {
      const longTitle = 'a'.repeat(501);
      expect(ValidationUtils.isValidTodoTitle(longTitle)).toBe(false);
    });

    it('returns true for titles at exactly 500 characters', () => {
      const maxTitle = 'a'.repeat(500);
      expect(ValidationUtils.isValidTodoTitle(maxTitle)).toBe(true);
    });
  });

  describe('isValidBlogSlug', () => {
    it('returns true for valid blog slugs within length limit', () => {
      expect(ValidationUtils.isValidBlogSlug('my-blog-post')).toBe(true);
    });

    it('returns false for slugs exceeding 200 characters', () => {
      const longSlug = 'a'.repeat(201);
      expect(ValidationUtils.isValidBlogSlug(longSlug)).toBe(false);
    });

    it('returns false for empty slugs', () => {
      expect(ValidationUtils.isValidBlogSlug('')).toBe(false);
    });

    it('returns false for invalid slug formats', () => {
      expect(ValidationUtils.isValidBlogSlug('Has Spaces')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('returns true for passwords at or above minimum length (6)', () => {
      expect(ValidationUtils.isValidPassword('123456')).toBe(true);
      expect(ValidationUtils.isValidPassword('longpassword123')).toBe(true);
    });

    it('returns false for passwords below minimum length', () => {
      expect(ValidationUtils.isValidPassword('12345')).toBe(false);
      expect(ValidationUtils.isValidPassword('')).toBe(false);
    });
  });

  describe('isValidUsername', () => {
    it('returns true for valid usernames', () => {
      expect(ValidationUtils.isValidUsername('john_doe')).toBe(true);
      expect(ValidationUtils.isValidUsername('user-123')).toBe(true);
      expect(ValidationUtils.isValidUsername('abc')).toBe(true);
      expect(ValidationUtils.isValidUsername('a'.repeat(50))).toBe(true);
    });

    it('returns false for invalid usernames', () => {
      expect(ValidationUtils.isValidUsername('ab')).toBe(false);
      expect(ValidationUtils.isValidUsername('a'.repeat(51))).toBe(false);
      expect(ValidationUtils.isValidUsername('has spaces')).toBe(false);
      expect(ValidationUtils.isValidUsername('special!char')).toBe(false);
      expect(ValidationUtils.isValidUsername('')).toBe(false);
    });
  });

  describe('isValidLevel', () => {
    it('returns true for integers 1-10', () => {
      for (let i = 1; i <= 10; i++) {
        expect(ValidationUtils.isValidLevel(i)).toBe(true);
      }
    });

    it('returns false for out-of-range values', () => {
      expect(ValidationUtils.isValidLevel(0)).toBe(false);
      expect(ValidationUtils.isValidLevel(11)).toBe(false);
    });

    it('returns false for non-integers', () => {
      expect(ValidationUtils.isValidLevel(1.5)).toBe(false);
    });
  });

  describe('isInRange', () => {
    it('returns true for values within range (inclusive)', () => {
      expect(ValidationUtils.isInRange(5, 1, 10)).toBe(true);
      expect(ValidationUtils.isInRange(1, 1, 10)).toBe(true);
      expect(ValidationUtils.isInRange(10, 1, 10)).toBe(true);
    });

    it('returns false for values outside range', () => {
      expect(ValidationUtils.isInRange(0, 1, 10)).toBe(false);
      expect(ValidationUtils.isInRange(11, 1, 10)).toBe(false);
    });
  });

  describe('isNotEmpty', () => {
    it('returns true for non-empty strings', () => {
      expect(ValidationUtils.isNotEmpty('hello')).toBe(true);
      expect(ValidationUtils.isNotEmpty('  x  ')).toBe(true);
    });

    it('returns false for empty, whitespace-only, null, and undefined', () => {
      expect(ValidationUtils.isNotEmpty('')).toBe(false);
      expect(ValidationUtils.isNotEmpty('   ')).toBe(false);
      expect(ValidationUtils.isNotEmpty(null)).toBe(false);
      expect(ValidationUtils.isNotEmpty(undefined)).toBe(false);
    });
  });

  describe('isWithinMaxLength', () => {
    it('returns true when within limit', () => {
      expect(ValidationUtils.isWithinMaxLength('hello', 10)).toBe(true);
      expect(ValidationUtils.isWithinMaxLength('exact', 5)).toBe(true);
    });

    it('returns false when exceeding limit', () => {
      expect(ValidationUtils.isWithinMaxLength('too long', 5)).toBe(false);
    });
  });

  describe('isValidName', () => {
    it('returns true for valid category/tag names', () => {
      expect(ValidationUtils.isValidName('Work')).toBe(true);
      expect(ValidationUtils.isValidName('My Category')).toBe(true);
    });

    it('returns false for empty or overly long names', () => {
      expect(ValidationUtils.isValidName('')).toBe(false);
      expect(ValidationUtils.isValidName('   ')).toBe(false);
      expect(ValidationUtils.isValidName('a'.repeat(101))).toBe(false);
    });

    it('accepts names at exactly 100 characters', () => {
      expect(ValidationUtils.isValidName('a'.repeat(100))).toBe(true);
    });
  });

  describe('isValidHexColor', () => {
    it('returns true for valid hex colors', () => {
      expect(ValidationUtils.isValidHexColor('#fff')).toBe(true);
      expect(ValidationUtils.isValidHexColor('#FFF')).toBe(true);
      expect(ValidationUtils.isValidHexColor('#ff0000')).toBe(true);
      expect(ValidationUtils.isValidHexColor('#1A2B3C')).toBe(true);
    });

    it('returns false for invalid hex colors', () => {
      expect(ValidationUtils.isValidHexColor('')).toBe(false);
      expect(ValidationUtils.isValidHexColor('fff')).toBe(false);
      expect(ValidationUtils.isValidHexColor('#gggggg')).toBe(false);
      expect(ValidationUtils.isValidHexColor('#12345')).toBe(false);
      expect(ValidationUtils.isValidHexColor('#1234567')).toBe(false);
    });
  });

  describe('isValidTimeString', () => {
    it('returns true for valid HH:mm times', () => {
      expect(ValidationUtils.isValidTimeString('00:00')).toBe(true);
      expect(ValidationUtils.isValidTimeString('23:59')).toBe(true);
      expect(ValidationUtils.isValidTimeString('12:30')).toBe(true);
    });

    it('returns true for valid HH:mm:ss times', () => {
      expect(ValidationUtils.isValidTimeString('12:30:45')).toBe(true);
      expect(ValidationUtils.isValidTimeString('00:00:00')).toBe(true);
    });

    it('returns false for invalid times', () => {
      expect(ValidationUtils.isValidTimeString('24:00')).toBe(false);
      expect(ValidationUtils.isValidTimeString('12:60')).toBe(false);
      expect(ValidationUtils.isValidTimeString('1:30')).toBe(false);
      expect(ValidationUtils.isValidTimeString('')).toBe(false);
    });
  });

  describe('validateRegistration', () => {
    it('returns null for valid registration data', () => {
      const result = ValidationUtils.validateRegistration({
        username: 'john_doe',
        email: 'john@example.com',
        password: 'securepassword',
      });
      expect(result).toBeNull();
    });

    it('returns errors for all invalid fields', () => {
      const result = ValidationUtils.validateRegistration({
        username: 'ab',
        email: 'invalid',
        password: '123',
      });
      expect(result).not.toBeNull();
      expect(result!.username).toBeDefined();
      expect(result!.email).toBeDefined();
      expect(result!.password).toBeDefined();
    });

    it('returns errors only for invalid fields', () => {
      const result = ValidationUtils.validateRegistration({
        username: 'valid_user',
        email: 'invalid',
        password: 'validpassword',
      });
      expect(result).not.toBeNull();
      expect(result!.email).toBeDefined();
      expect(result!.username).toBeUndefined();
      expect(result!.password).toBeUndefined();
    });
  });
});
