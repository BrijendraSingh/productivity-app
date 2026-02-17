import { APP_CONFIG } from '../constants/index.js';

export class ValidationUtils {
  /**
   * Validate an email address format.
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate a URL-friendly slug.
   * Only lowercase letters, numbers, and hyphens allowed. Must not start/end with a hyphen.
   */
  static isValidSlug(slug: string): boolean {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(slug);
  }

  /**
   * Validate a date string in YYYY-MM-DD format.
   */
  static isValidDateString(dateString: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;

    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  }

  /**
   * Validate a todo title.
   * Must be non-empty after trimming, and at most 500 characters.
   */
  static isValidTodoTitle(title: string): boolean {
    const trimmed = title.trim();
    return trimmed.length > 0 && trimmed.length <= 500;
  }

  /**
   * Validate a blog post slug.
   * Must be a valid slug and between 1 and 200 characters.
   */
  static isValidBlogSlug(slug: string): boolean {
    return slug.length > 0 && slug.length <= 200 && ValidationUtils.isValidSlug(slug);
  }

  /**
   * Validate a password.
   * Must be at least PASSWORD_MIN_LENGTH characters.
   */
  static isValidPassword(password: string): boolean {
    return password.length >= APP_CONFIG.PASSWORD_MIN_LENGTH;
  }

  /**
   * Validate a username.
   * Must be 3-50 characters, only alphanumeric characters, underscores, and hyphens.
   */
  static isValidUsername(username: string): boolean {
    const usernameRegex = /^[a-zA-Z0-9_-]{3,50}$/;
    return usernameRegex.test(username);
  }

  /**
   * Validate that a number is within the urgency/importance range (1-10).
   */
  static isValidLevel(level: number): boolean {
    return Number.isInteger(level) && level >= 1 && level <= 10;
  }

  /**
   * Validate that a number is within a specific range.
   */
  static isInRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  }

  /**
   * Validate that a string is not empty after trimming.
   */
  static isNotEmpty(value: string | null | undefined): boolean {
    return value !== null && value !== undefined && value.trim().length > 0;
  }

  /**
   * Validate that a string does not exceed a maximum length.
   */
  static isWithinMaxLength(value: string, maxLength: number): boolean {
    return value.length <= maxLength;
  }

  /**
   * Validate a category or tag name.
   * Must be 1-100 characters, non-empty after trimming.
   */
  static isValidName(name: string): boolean {
    const trimmed = name.trim();
    return trimmed.length > 0 && trimmed.length <= 100;
  }

  /**
   * Validate a hex color string.
   */
  static isValidHexColor(color: string): boolean {
    const hexRegex = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/;
    return hexRegex.test(color);
  }

  /**
   * Validate a time string in HH:mm or HH:mm:ss format.
   */
  static isValidTimeString(time: string): boolean {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
    return timeRegex.test(time);
  }

  /**
   * Return an object with all validation errors for a registration request.
   * Returns null if valid.
   */
  static validateRegistration(data: { username: string; email: string; password: string }): Record<string, string> | null {
    const errors: Record<string, string> = {};

    if (!ValidationUtils.isValidUsername(data.username)) {
      errors.username = 'Username must be 3-50 characters (letters, numbers, underscores, hyphens)';
    }
    if (!ValidationUtils.isValidEmail(data.email)) {
      errors.email = 'Invalid email address';
    }
    if (!ValidationUtils.isValidPassword(data.password)) {
      errors.password = `Password must be at least ${APP_CONFIG.PASSWORD_MIN_LENGTH} characters`;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }
}
