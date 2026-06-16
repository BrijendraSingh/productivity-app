import { describe, it, expect } from 'vitest';
import { body } from 'express-validator';
import { EMAIL_NORMALIZE_OPTIONS } from '@productivity-app/shared';

const emailValidation = body('email').trim().isEmail().normalizeEmail(EMAIL_NORMALIZE_OPTIONS);

describe('auth registration email validation', () => {
  it('preserves Gmail plus-addressing during normalization', async () => {
    const req = { body: { email: 'bps.brijendra+1@gmail.com' } };

    await emailValidation.run(req as never);

    expect(req.body.email).toBe('bps.brijendra+1@gmail.com');
  });

  it('preserves plus-addressing for other providers', async () => {
    const req = { body: { email: 'user+tag@example.org' } };

    await emailValidation.run(req as never);

    expect(req.body.email).toBe('user+tag@example.org');
  });
});
