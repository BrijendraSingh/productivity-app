import {
  format,
  parseISO,
  isValid,
  isBefore,
  isAfter,
  isToday,
  isTomorrow,
  isYesterday,
  isPast,
  isFuture,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  subDays,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  eachDayOfInterval,
  formatDistanceToNow,
} from 'date-fns';
import { DATE_FORMATS } from '../constants/index.js';

export class DateUtils {
  // ─── Formatting ──────────────────────────────────────────────────────

  static formatDate(date: string | Date, dateFormat: string = DATE_FORMATS.DISPLAY_DATE): string {
    const parsed = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(parsed)) return 'Invalid date';
    return format(parsed, dateFormat);
  }

  static formatISODate(date: string | Date): string {
    return DateUtils.formatDate(date, DATE_FORMATS.ISO_DATE);
  }

  static formatDateTime(date: string | Date): string {
    return DateUtils.formatDate(date, DATE_FORMATS.DISPLAY_DATETIME);
  }

  static formatTime(date: string | Date): string {
    return DateUtils.formatDate(date, DATE_FORMATS.DISPLAY_TIME);
  }

  static formatRelative(date: string | Date): string {
    const parsed = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(parsed)) return 'Invalid date';
    return formatDistanceToNow(parsed, { addSuffix: true });
  }

  static formatDayOfWeek(date: string | Date): string {
    return DateUtils.formatDate(date, DATE_FORMATS.DAY_OF_WEEK);
  }

  static formatMonthYear(date: string | Date): string {
    return DateUtils.formatDate(date, DATE_FORMATS.MONTH_YEAR);
  }

  // ─── Parsing ─────────────────────────────────────────────────────────

  static parse(dateString: string): Date {
    return parseISO(dateString);
  }

  static isValidDate(dateString: string): boolean {
    const parsed = parseISO(dateString);
    return isValid(parsed);
  }

  static toISOString(date: Date): string {
    return date.toISOString();
  }

  static today(): string {
    return format(new Date(), DATE_FORMATS.ISO_DATE);
  }

  // ─── Comparisons ─────────────────────────────────────────────────────

  static isBefore(date1: string | Date, date2: string | Date): boolean {
    const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
    const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
    return isBefore(d1, d2);
  }

  static isAfter(date1: string | Date, date2: string | Date): boolean {
    const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
    const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
    return isAfter(d1, d2);
  }

  static isToday(date: string | Date): boolean {
    const parsed = typeof date === 'string' ? parseISO(date) : date;
    return isToday(parsed);
  }

  static isTomorrow(date: string | Date): boolean {
    const parsed = typeof date === 'string' ? parseISO(date) : date;
    return isTomorrow(parsed);
  }

  static isYesterday(date: string | Date): boolean {
    const parsed = typeof date === 'string' ? parseISO(date) : date;
    return isYesterday(parsed);
  }

  static isPast(date: string | Date): boolean {
    const parsed = typeof date === 'string' ? parseISO(date) : date;
    return isPast(parsed);
  }

  static isFuture(date: string | Date): boolean {
    const parsed = typeof date === 'string' ? parseISO(date) : date;
    return isFuture(parsed);
  }

  static isOverdue(dueDate: string | null): boolean {
    if (!dueDate) return false;
    const parsed = parseISO(dueDate);
    if (!isValid(parsed)) return false;
    return isBefore(endOfDay(parsed), new Date());
  }

  // ─── Ranges ──────────────────────────────────────────────────────────

  static startOfDay(date: string | Date): Date {
    const parsed = typeof date === 'string' ? parseISO(date) : date;
    return startOfDay(parsed);
  }

  static endOfDay(date: string | Date): Date {
    const parsed = typeof date === 'string' ? parseISO(date) : date;
    return endOfDay(parsed);
  }

  static startOfWeek(date: string | Date): Date {
    const parsed = typeof date === 'string' ? parseISO(date) : date;
    return startOfWeek(parsed, { weekStartsOn: 1 });
  }

  static endOfWeek(date: string | Date): Date {
    const parsed = typeof date === 'string' ? parseISO(date) : date;
    return endOfWeek(parsed, { weekStartsOn: 1 });
  }

  static startOfMonth(date: string | Date): Date {
    const parsed = typeof date === 'string' ? parseISO(date) : date;
    return startOfMonth(parsed);
  }

  static endOfMonth(date: string | Date): Date {
    const parsed = typeof date === 'string' ? parseISO(date) : date;
    return endOfMonth(parsed);
  }

  static addDays(date: string | Date, days: number): Date {
    const parsed = typeof date === 'string' ? parseISO(date) : date;
    return addDays(parsed, days);
  }

  static subDays(date: string | Date, days: number): Date {
    const parsed = typeof date === 'string' ? parseISO(date) : date;
    return subDays(parsed, days);
  }

  static daysBetween(date1: string | Date, date2: string | Date): number {
    const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
    const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
    return differenceInDays(d2, d1);
  }

  static hoursBetween(date1: string | Date, date2: string | Date): number {
    const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
    const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
    return differenceInHours(d2, d1);
  }

  static minutesBetween(date1: string | Date, date2: string | Date): number {
    const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
    const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
    return differenceInMinutes(d2, d1);
  }

  static getDateRange(start: string | Date, end: string | Date): Date[] {
    const startDate = typeof start === 'string' ? parseISO(start) : start;
    const endDate = typeof end === 'string' ? parseISO(end) : end;
    return eachDayOfInterval({ start: startDate, end: endDate });
  }

  // ─── Display Helpers ─────────────────────────────────────────────────

  static getDueDateLabel(dueDate: string | null): string | null {
    if (!dueDate) return null;
    const parsed = parseISO(dueDate);
    if (!isValid(parsed)) return null;

    if (isToday(parsed)) return 'Today';
    if (isTomorrow(parsed)) return 'Tomorrow';
    if (isYesterday(parsed)) return 'Yesterday';

    const days = differenceInDays(parsed, new Date());
    if (days > 0 && days <= 7) return `In ${days} days`;
    if (days < 0) return `${Math.abs(days)} days overdue`;

    return format(parsed, DATE_FORMATS.DISPLAY_DATE_SHORT);
  }

  static formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}m`;
  }
}
