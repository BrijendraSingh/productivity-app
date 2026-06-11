import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isRegistrationEnabled, isDevLoginEnabled, validateProductionConfig } from './security.js';

describe('security config', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isRegistrationEnabled', () => {
    it('returns false in production by default', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.ALLOW_REGISTRATION;
      expect(isRegistrationEnabled()).toBe(false);
    });

    it('returns true in production only when ALLOW_REGISTRATION is "true"', () => {
      process.env.NODE_ENV = 'production';
      process.env.ALLOW_REGISTRATION = 'true';
      expect(isRegistrationEnabled()).toBe(true);
    });

    it('returns true in development by default', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.ALLOW_REGISTRATION;
      expect(isRegistrationEnabled()).toBe(true);
    });

    it('returns false in development when ALLOW_REGISTRATION is "false"', () => {
      process.env.NODE_ENV = 'development';
      process.env.ALLOW_REGISTRATION = 'false';
      expect(isRegistrationEnabled()).toBe(false);
    });
  });

  describe('isDevLoginEnabled', () => {
    it('returns false in production', () => {
      process.env.NODE_ENV = 'production';
      expect(isDevLoginEnabled()).toBe(false);
    });

    it('returns true outside production', () => {
      process.env.NODE_ENV = 'development';
      expect(isDevLoginEnabled()).toBe(true);
    });
  });

  describe('validateProductionConfig', () => {
    it('does nothing outside production', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.FRONTEND_URL;
      expect(() => validateProductionConfig()).not.toThrow();
    });

    it('throws when FRONTEND_URL is missing in production', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.FRONTEND_URL;
      expect(() => validateProductionConfig()).toThrow(/FRONTEND_URL/);
    });

    it('throws when FRONTEND_URL contains localhost in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.FRONTEND_URL = 'http://localhost:3000';
      expect(() => validateProductionConfig()).toThrow(/FRONTEND_URL/);
    });

    it('passes with a valid production FRONTEND_URL', () => {
      process.env.NODE_ENV = 'production';
      process.env.FRONTEND_URL = 'https://app.example.com';
      expect(() => validateProductionConfig()).not.toThrow();
    });
  });
});
