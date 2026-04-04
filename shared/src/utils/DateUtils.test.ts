import { describe, it, expect, vi, afterEach } from 'vitest';
import { DateUtils } from './DateUtils.js';

describe('DateUtils', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('formatDate', () => {
    it('formats a date string with default format', () => {
      const result = DateUtils.formatDate('2024-03-15');
      expect(result).toBe('Mar 15, 2024');
    });

    it('formats a Date object', () => {
      const result = DateUtils.formatDate(new Date(2024, 2, 15));
      expect(result).toBe('Mar 15, 2024');
    });

    it('returns "Invalid date" for invalid input', () => {
      expect(DateUtils.formatDate('not-a-date')).toBe('Invalid date');
    });

    it('accepts a custom format', () => {
      const result = DateUtils.formatDate('2024-03-15', 'yyyy/MM/dd');
      expect(result).toBe('2024/03/15');
    });
  });

  describe('formatISODate', () => {
    it('formats to yyyy-MM-dd', () => {
      expect(DateUtils.formatISODate('2024-03-15')).toBe('2024-03-15');
    });
  });

  describe('formatDateTime', () => {
    it('formats date and time', () => {
      const result = DateUtils.formatDateTime(new Date(2024, 2, 15, 14, 30));
      expect(result).toBe('Mar 15, 2024 2:30 PM');
    });
  });

  describe('formatTime', () => {
    it('formats time only', () => {
      const result = DateUtils.formatTime(new Date(2024, 2, 15, 14, 30));
      expect(result).toBe('2:30 PM');
    });
  });

  describe('formatRelative', () => {
    it('returns "Invalid date" for invalid input', () => {
      expect(DateUtils.formatRelative('not-a-date')).toBe('Invalid date');
    });

    it('returns a relative time string with suffix', () => {
      const recent = new Date();
      recent.setMinutes(recent.getMinutes() - 5);
      const result = DateUtils.formatRelative(recent);
      expect(result).toContain('ago');
    });
  });

  describe('formatDayOfWeek', () => {
    it('returns the day name', () => {
      const result = DateUtils.formatDayOfWeek('2024-03-15');
      expect(result).toBe('Friday');
    });
  });

  describe('formatMonthYear', () => {
    it('returns month and year', () => {
      expect(DateUtils.formatMonthYear('2024-03-15')).toBe('March 2024');
    });
  });

  describe('parse', () => {
    it('parses an ISO date string into a Date', () => {
      const date = DateUtils.parse('2024-03-15');
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(2);
      expect(date.getDate()).toBe(15);
    });
  });

  describe('isValidDate', () => {
    it('returns true for valid date strings', () => {
      expect(DateUtils.isValidDate('2024-03-15')).toBe(true);
      expect(DateUtils.isValidDate('2024-01-01T00:00:00')).toBe(true);
    });

    it('returns false for invalid date strings', () => {
      expect(DateUtils.isValidDate('not-a-date')).toBe(false);
    });
  });

  describe('today', () => {
    it('returns todays date in yyyy-MM-dd format', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2024, 2, 15));
      expect(DateUtils.today()).toBe('2024-03-15');
    });
  });

  describe('isBefore / isAfter', () => {
    it('isBefore returns true when first date is earlier', () => {
      expect(DateUtils.isBefore('2024-01-01', '2024-12-31')).toBe(true);
    });

    it('isBefore returns false when first date is later', () => {
      expect(DateUtils.isBefore('2024-12-31', '2024-01-01')).toBe(false);
    });

    it('isAfter returns true when first date is later', () => {
      expect(DateUtils.isAfter('2024-12-31', '2024-01-01')).toBe(true);
    });

    it('isAfter returns false when first date is earlier', () => {
      expect(DateUtils.isAfter('2024-01-01', '2024-12-31')).toBe(false);
    });

    it('works with Date objects', () => {
      const d1 = new Date(2024, 0, 1);
      const d2 = new Date(2024, 11, 31);
      expect(DateUtils.isBefore(d1, d2)).toBe(true);
      expect(DateUtils.isAfter(d1, d2)).toBe(false);
    });
  });

  describe('isToday / isTomorrow / isYesterday', () => {
    it('detects today correctly', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2024, 2, 15, 12, 0));
      expect(DateUtils.isToday(new Date(2024, 2, 15))).toBe(true);
      expect(DateUtils.isToday(new Date(2024, 2, 14))).toBe(false);
    });

    it('detects tomorrow correctly', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2024, 2, 15, 12, 0));
      expect(DateUtils.isTomorrow(new Date(2024, 2, 16))).toBe(true);
      expect(DateUtils.isTomorrow(new Date(2024, 2, 15))).toBe(false);
    });

    it('detects yesterday correctly', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2024, 2, 15, 12, 0));
      expect(DateUtils.isYesterday(new Date(2024, 2, 14))).toBe(true);
      expect(DateUtils.isYesterday(new Date(2024, 2, 15))).toBe(false);
    });
  });

  describe('isPast / isFuture', () => {
    it('isPast returns true for past dates', () => {
      expect(DateUtils.isPast('2020-01-01')).toBe(true);
    });

    it('isFuture returns true for future dates', () => {
      expect(DateUtils.isFuture('2099-01-01')).toBe(true);
    });
  });

  describe('isOverdue', () => {
    it('returns false for null due date', () => {
      expect(DateUtils.isOverdue(null)).toBe(false);
    });

    it('returns true for past due date', () => {
      expect(DateUtils.isOverdue('2020-01-01')).toBe(true);
    });

    it('returns false for future due date', () => {
      expect(DateUtils.isOverdue('2099-12-31')).toBe(false);
    });
  });

  describe('daysBetween', () => {
    it('calculates the difference in days', () => {
      expect(DateUtils.daysBetween('2024-01-01', '2024-01-10')).toBe(9);
    });

    it('returns negative when second date is earlier', () => {
      expect(DateUtils.daysBetween('2024-01-10', '2024-01-01')).toBe(-9);
    });
  });

  describe('hoursBetween', () => {
    it('calculates the difference in hours', () => {
      const d1 = new Date(2024, 0, 1, 0, 0);
      const d2 = new Date(2024, 0, 1, 5, 0);
      expect(DateUtils.hoursBetween(d1, d2)).toBe(5);
    });
  });

  describe('minutesBetween', () => {
    it('calculates the difference in minutes', () => {
      const d1 = new Date(2024, 0, 1, 0, 0);
      const d2 = new Date(2024, 0, 1, 0, 45);
      expect(DateUtils.minutesBetween(d1, d2)).toBe(45);
    });
  });

  describe('addDays / subDays', () => {
    it('adds days to a date', () => {
      const result = DateUtils.addDays('2024-01-01', 10);
      expect(result.getDate()).toBe(11);
    });

    it('subtracts days from a date', () => {
      const result = DateUtils.subDays('2024-01-11', 10);
      expect(result.getDate()).toBe(1);
    });
  });

  describe('getDateRange', () => {
    it('returns an array of dates for the interval', () => {
      const range = DateUtils.getDateRange('2024-01-01', '2024-01-05');
      expect(range).toHaveLength(5);
    });

    it('returns a single date when start equals end', () => {
      const range = DateUtils.getDateRange('2024-01-01', '2024-01-01');
      expect(range).toHaveLength(1);
    });
  });

  describe('getDueDateLabel', () => {
    it('returns null for null due date', () => {
      expect(DateUtils.getDueDateLabel(null)).toBeNull();
    });

    it('returns "Today" for todays date', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2024, 2, 15, 12, 0));
      expect(DateUtils.getDueDateLabel('2024-03-15')).toBe('Today');
    });

    it('returns "Tomorrow" for tomorrows date', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2024, 2, 15, 12, 0));
      expect(DateUtils.getDueDateLabel('2024-03-16')).toBe('Tomorrow');
    });

    it('returns "Yesterday" for yesterdays date', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2024, 2, 15, 12, 0));
      expect(DateUtils.getDueDateLabel('2024-03-14')).toBe('Yesterday');
    });

    it('returns "In X days" for near-future dates within 7 days', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2024, 2, 15, 0, 0));
      expect(DateUtils.getDueDateLabel('2024-03-18')).toBe('In 3 days');
    });

    it('returns "X days overdue" for past dates', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2024, 2, 15, 12, 0));
      expect(DateUtils.getDueDateLabel('2024-03-10')).toBe('5 days overdue');
    });
  });

  describe('formatDuration', () => {
    it('formats minutes less than 60', () => {
      expect(DateUtils.formatDuration(30)).toBe('30m');
    });

    it('formats exact hours', () => {
      expect(DateUtils.formatDuration(60)).toBe('1h');
      expect(DateUtils.formatDuration(120)).toBe('2h');
    });

    it('formats hours and minutes', () => {
      expect(DateUtils.formatDuration(90)).toBe('1h 30m');
      expect(DateUtils.formatDuration(150)).toBe('2h 30m');
    });
  });

  describe('startOfDay / endOfDay', () => {
    it('returns start of day', () => {
      const result = DateUtils.startOfDay('2024-03-15');
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
    });

    it('returns end of day', () => {
      const result = DateUtils.endOfDay('2024-03-15');
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
    });
  });

  describe('startOfWeek / endOfWeek', () => {
    it('starts on Monday (weekStartsOn: 1)', () => {
      const result = DateUtils.startOfWeek('2024-03-15');
      expect(result.getDay()).toBe(1);
    });

    it('ends on Sunday', () => {
      const result = DateUtils.endOfWeek('2024-03-15');
      expect(result.getDay()).toBe(0);
    });
  });

  describe('startOfMonth / endOfMonth', () => {
    it('returns first day of the month', () => {
      const result = DateUtils.startOfMonth('2024-03-15');
      expect(result.getDate()).toBe(1);
    });

    it('returns last day of the month', () => {
      const result = DateUtils.endOfMonth('2024-03-15');
      expect(result.getDate()).toBe(31);
    });

    it('handles February in a leap year', () => {
      const result = DateUtils.endOfMonth('2024-02-15');
      expect(result.getDate()).toBe(29);
    });
  });

  describe('toISOString', () => {
    it('returns the ISO string of a Date', () => {
      const date = new Date('2024-03-15T00:00:00.000Z');
      expect(DateUtils.toISOString(date)).toBe('2024-03-15T00:00:00.000Z');
    });
  });
});
