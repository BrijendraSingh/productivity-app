/**
 * Production security configuration helpers.
 */

export function isRegistrationEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return process.env.ALLOW_REGISTRATION === 'true';
  }
  return process.env.ALLOW_REGISTRATION !== 'false';
}

export function isDevLoginEnabled(): boolean {
  return process.env.NODE_ENV !== 'production';
}

export function validateProductionConfig(): void {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const frontendUrl = process.env.FRONTEND_URL || '';
  if (!frontendUrl || frontendUrl.includes('localhost')) {
    throw new Error(
      'FRONTEND_URL must be set to a non-localhost HTTPS URL when NODE_ENV=production.'
    );
  }
}
