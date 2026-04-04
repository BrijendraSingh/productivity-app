import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { APP_CONFIG } from '@productivity-app/shared';
import type { SafeUser, AuthResponse } from '@productivity-app/shared';
import { dbGet, dbRun } from '../config/database';
import { AppError } from '../utils/AppError';

const DEV_LOGIN_ENABLED = process.env.NODE_ENV !== 'production';
const DEV_USERNAME = 'dev';
const DEV_PASSWORD = 'dev';
const DEV_TOKEN = 'dev-token';

if (DEV_LOGIN_ENABLED) {
  console.warn(
    '[AUTH] Dev login shortcut is ACTIVE (username: dev, password: dev). Disable by setting NODE_ENV=production.'
  );
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function toSafeUser(row: Record<string, unknown>): SafeUser {
  return {
    id: row.id as number,
    username: row.username as string,
    email: row.email as string,
    is_active: row.is_active as number,
    profile_data: (row.profile_data as string | null) ?? null,
    preferences: (row.preferences as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

/**
 * POST /api/auth/register
 * Creates a new user account and returns a Bearer token.
 */
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, email, password } = req.body as {
      username: string;
      email: string;
      password: string;
    };

    const existingUser = await dbGet('SELECT id FROM users WHERE username = ? OR email = ?', [
      username,
      email,
    ]);

    if (existingUser) {
      return next(AppError.conflict('Username or email already exists.'));
    }

    const passwordHash = await bcrypt.hash(password, APP_CONFIG.BCRYPT_SALT_ROUNDS);
    const apiToken = generateToken();

    const result = await dbRun(
      `INSERT INTO users (username, email, password_hash, api_token)
       VALUES (?, ?, ?, ?)`,
      [username, email, passwordHash, apiToken]
    );

    const user = await dbGet<Record<string, unknown>>('SELECT * FROM users WHERE id = ?', [
      result.lastID,
    ]);

    if (!user) {
      throw new AppError(500, 'Failed to retrieve created user.');
    }

    const response: AuthResponse = {
      user: toSafeUser(user),
      token: apiToken,
    };

    res.status(201).json({
      success: true,
      data: response,
      message: 'Registration successful.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    next(error);
  }
}

/**
 * POST /api/auth/login
 * Authenticates a user by username+password and returns a Bearer token.
 * Dev shortcut: username=dev, password=dev → token=dev-token.
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, password } = req.body as {
      username: string;
      password: string;
    };

    if (DEV_LOGIN_ENABLED && username === DEV_USERNAME && password === DEV_PASSWORD) {
      let devUser = await dbGet<Record<string, unknown>>('SELECT * FROM users WHERE username = ?', [
        DEV_USERNAME,
      ]);

      if (!devUser) {
        const hash = await bcrypt.hash(DEV_PASSWORD, APP_CONFIG.BCRYPT_SALT_ROUNDS);
        await dbRun(
          `INSERT INTO users (username, email, password_hash, api_token)
           VALUES (?, ?, ?, ?)`,
          [DEV_USERNAME, 'dev@productivity.app', hash, DEV_TOKEN]
        );
        devUser = await dbGet<Record<string, unknown>>('SELECT * FROM users WHERE username = ?', [
          DEV_USERNAME,
        ]);
      } else {
        await dbRun('UPDATE users SET api_token = ? WHERE username = ?', [DEV_TOKEN, DEV_USERNAME]);
        devUser = await dbGet<Record<string, unknown>>('SELECT * FROM users WHERE username = ?', [
          DEV_USERNAME,
        ]);
      }

      if (!devUser) {
        throw new AppError(500, 'Failed to create dev user.');
      }

      const response: AuthResponse = {
        user: toSafeUser(devUser),
        token: DEV_TOKEN,
      };

      res.json({ success: true, data: response, message: 'Dev login successful.' });
      return;
    }

    const user = await dbGet<Record<string, unknown>>(
      'SELECT * FROM users WHERE username = ? AND is_active = 1',
      [username]
    );

    if (!user) {
      return next(AppError.unauthorized('Invalid username or password.'));
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash as string);

    if (!passwordValid) {
      return next(AppError.unauthorized('Invalid username or password.'));
    }

    const newToken = generateToken();
    await dbRun('UPDATE users SET api_token = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
      newToken,
      user.id,
    ]);

    const response: AuthResponse = {
      user: toSafeUser(user),
      token: newToken,
    };

    res.json({ success: true, data: response, message: 'Login successful.' });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
}

/**
 * POST /api/auth/logout
 * Invalidates the current user's API token.
 */
export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      return next(AppError.unauthorized('Not authenticated.'));
    }

    await dbRun('UPDATE users SET api_token = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
      req.user.id,
    ]);

    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    console.error('Logout error:', error);
    next(error);
  }
}

/**
 * GET /api/auth/verify
 * Verifies the current Bearer token is valid.
 */
export async function verify(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      return next(AppError.unauthorized('Not authenticated.'));
    }

    res.json({
      success: true,
      data: { user: req.user },
      message: 'Token is valid.',
    });
  } catch (error) {
    console.error('Verify error:', error);
    next(error);
  }
}

/**
 * GET /api/auth/profile
 * Returns the authenticated user's full profile.
 */
export async function profile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      return next(AppError.unauthorized('Not authenticated.'));
    }

    const user = await dbGet<Record<string, unknown>>(
      `SELECT id, username, email, is_active, profile_data, preferences, created_at, updated_at
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (!user) {
      return next(AppError.notFound('User not found.'));
    }

    res.json({
      success: true,
      data: { user: toSafeUser(user) },
    });
  } catch (error) {
    console.error('Profile error:', error);
    next(error);
  }
}
