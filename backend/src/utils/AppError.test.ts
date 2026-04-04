import { describe, it, expect } from 'vitest';
import { AppError } from './AppError.js';

describe('AppError', () => {
  describe('constructor', () => {
    it('creates an error with the given status code and message', () => {
      const err = new AppError(500, 'Something went wrong');
      expect(err.statusCode).toBe(500);
      expect(err.message).toBe('Something went wrong');
    });

    it('defaults code to INTERNAL_ERROR when not provided', () => {
      const err = new AppError(500, 'fail');
      expect(err.code).toBe('INTERNAL_ERROR');
    });

    it('accepts a custom code', () => {
      const err = new AppError(422, 'Validation error', 'VALIDATION_ERROR');
      expect(err.code).toBe('VALIDATION_ERROR');
    });

    it('sets isOperational to true', () => {
      const err = new AppError(500, 'fail');
      expect(err.isOperational).toBe(true);
    });

    it('sets name to AppError', () => {
      const err = new AppError(500, 'fail');
      expect(err.name).toBe('AppError');
    });

    it('extends Error', () => {
      const err = new AppError(500, 'fail');
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(AppError);
    });
  });

  describe('notFound', () => {
    it('creates a 404 error with default message', () => {
      const err = AppError.notFound();
      expect(err.statusCode).toBe(404);
      expect(err.message).toBe('Resource not found');
      expect(err.code).toBe('NOT_FOUND');
    });

    it('accepts a custom message', () => {
      const err = AppError.notFound('User not found');
      expect(err.message).toBe('User not found');
    });
  });

  describe('conflict', () => {
    it('creates a 409 error with default message', () => {
      const err = AppError.conflict();
      expect(err.statusCode).toBe(409);
      expect(err.message).toBe('Resource already exists');
      expect(err.code).toBe('CONFLICT');
    });

    it('accepts a custom message', () => {
      const err = AppError.conflict('Slug already taken');
      expect(err.message).toBe('Slug already taken');
    });
  });

  describe('badRequest', () => {
    it('creates a 400 error with default message', () => {
      const err = AppError.badRequest();
      expect(err.statusCode).toBe(400);
      expect(err.message).toBe('Invalid request');
      expect(err.code).toBe('BAD_REQUEST');
    });

    it('accepts a custom message', () => {
      const err = AppError.badRequest('Missing required field');
      expect(err.message).toBe('Missing required field');
    });
  });

  describe('unauthorized', () => {
    it('creates a 401 error with default message', () => {
      const err = AppError.unauthorized();
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe('Authentication required');
      expect(err.code).toBe('UNAUTHORIZED');
    });

    it('accepts a custom message', () => {
      const err = AppError.unauthorized('Token expired');
      expect(err.message).toBe('Token expired');
    });
  });

  describe('all factory methods produce operational errors', () => {
    it.each([
      ['notFound', AppError.notFound()],
      ['conflict', AppError.conflict()],
      ['badRequest', AppError.badRequest()],
      ['unauthorized', AppError.unauthorized()],
    ])('%s returns an operational AppError', (_name, err) => {
      expect(err).toBeInstanceOf(AppError);
      expect(err.isOperational).toBe(true);
      expect(err.name).toBe('AppError');
    });
  });
});
