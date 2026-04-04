import { APP_CONFIG } from '../constants/index.js';

export class TextUtils {
  /**
   * Count words in a string.
   */
  static wordCount(text: string | null | undefined): number {
    if (!text || text.trim().length === 0) return 0;
    return text.trim().split(/\s+/).length;
  }

  /**
   * Estimate reading time in minutes based on word count.
   * Uses the configured reading speed (default: 200 wpm), rounded up.
   */
  static readingTime(text: string | null | undefined): number {
    const words = TextUtils.wordCount(text);
    if (words === 0) return 0;
    return Math.ceil(words / APP_CONFIG.READING_SPEED_WPM);
  }

  /**
   * Format reading time as a human-readable string.
   */
  static readingTimeLabel(text: string | null | undefined): string {
    const minutes = TextUtils.readingTime(text);
    if (minutes === 0) return '< 1 min read';
    if (minutes === 1) return '1 min read';
    return `${minutes} min read`;
  }

  /**
   * Generate a URL-friendly slug from a string.
   * Lowercases, replaces non-alphanumeric chars with hyphens,
   * collapses consecutive hyphens, trims leading/trailing hyphens.
   */
  static slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Generate an excerpt from longer text.
   * Truncates at maxLength, breaking at the last word boundary, and appends "...".
   */
  static excerpt(text: string | null | undefined, maxLength: number = 200): string {
    if (!text) return '';
    const stripped = TextUtils.stripMarkdown(text);
    if (stripped.length <= maxLength) return stripped;

    const truncated = stripped.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    const breakPoint = lastSpace > maxLength * 0.5 ? lastSpace : maxLength;
    return truncated.substring(0, breakPoint).trim() + '...';
  }

  /**
   * Strip basic markdown formatting from text.
   */
  static stripMarkdown(text: string): string {
    return text
      .replace(/#{1,6}\s/g, '') // headings
      .replace(/\*\*(.+?)\*\*/g, '$1') // bold
      .replace(/\*(.+?)\*/g, '$1') // italic
      .replace(/__(.+?)__/g, '$1') // bold underline
      .replace(/_(.+?)_/g, '$1') // italic underline
      .replace(/~~(.+?)~~/g, '$1') // strikethrough
      .replace(/`(.+?)`/g, '$1') // inline code
      .replace(/\[(.+?)\]\(.+?\)/g, '$1') // links
      .replace(/!\[.*?\]\(.+?\)/g, '') // images
      .replace(/^>\s/gm, '') // blockquotes
      .replace(/^[-*+]\s/gm, '') // unordered lists
      .replace(/^\d+\.\s/gm, '') // ordered lists
      .replace(/---+/g, '') // horizontal rules
      .replace(/\n{3,}/g, '\n\n') // excessive newlines
      .trim();
  }

  /**
   * Truncate text to a maximum length with an ellipsis.
   */
  static truncate(text: string | null | undefined, maxLength: number = 100): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }

  /**
   * Capitalize the first letter of a string.
   */
  static capitalize(text: string): string {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  /**
   * Convert a string to title case.
   */
  static titleCase(text: string): string {
    return text
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
