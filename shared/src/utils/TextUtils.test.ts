import { describe, it, expect } from 'vitest';
import { TextUtils } from './TextUtils.js';

describe('TextUtils', () => {
  describe('wordCount', () => {
    it('returns 0 for empty string', () => {
      expect(TextUtils.wordCount('')).toBe(0);
    });

    it('returns 0 for null and undefined', () => {
      expect(TextUtils.wordCount(null)).toBe(0);
      expect(TextUtils.wordCount(undefined)).toBe(0);
    });

    it('returns 0 for whitespace-only string', () => {
      expect(TextUtils.wordCount('   ')).toBe(0);
      expect(TextUtils.wordCount('\t\n')).toBe(0);
    });

    it('returns 1 for a single word', () => {
      expect(TextUtils.wordCount('hello')).toBe(1);
    });

    it('counts words separated by various whitespace', () => {
      expect(TextUtils.wordCount('hello world')).toBe(2);
      expect(TextUtils.wordCount('one  two   three')).toBe(3);
      expect(TextUtils.wordCount('word1\nword2\tword3')).toBe(3);
    });

    it('handles leading and trailing whitespace', () => {
      expect(TextUtils.wordCount('  hello world  ')).toBe(2);
    });
  });

  describe('readingTime', () => {
    it('returns 0 for empty or null text', () => {
      expect(TextUtils.readingTime('')).toBe(0);
      expect(TextUtils.readingTime(null)).toBe(0);
    });

    it('returns 1 for text with fewer than 200 words', () => {
      const text = Array(100).fill('word').join(' ');
      expect(TextUtils.readingTime(text)).toBe(1);
    });

    it('returns exact minutes for 200-word multiples', () => {
      const text = Array(400).fill('word').join(' ');
      expect(TextUtils.readingTime(text)).toBe(2);
    });

    it('rounds up to the nearest minute', () => {
      const text = Array(201).fill('word').join(' ');
      expect(TextUtils.readingTime(text)).toBe(2);
    });
  });

  describe('readingTimeLabel', () => {
    it('returns "< 1 min read" for empty text', () => {
      expect(TextUtils.readingTimeLabel('')).toBe('< 1 min read');
    });

    it('returns "1 min read" for short text', () => {
      expect(TextUtils.readingTimeLabel('hello world')).toBe('1 min read');
    });

    it('returns plural minutes for longer text', () => {
      const text = Array(500).fill('word').join(' ');
      expect(TextUtils.readingTimeLabel(text)).toBe('3 min read');
    });
  });

  describe('slugify', () => {
    it('converts text to lowercase', () => {
      expect(TextUtils.slugify('Hello World')).toBe('hello-world');
    });

    it('replaces spaces with hyphens', () => {
      expect(TextUtils.slugify('foo bar baz')).toBe('foo-bar-baz');
    });

    it('removes special characters', () => {
      expect(TextUtils.slugify('hello! @world# $test')).toBe('hello-world-test');
    });

    it('collapses consecutive hyphens', () => {
      expect(TextUtils.slugify('hello---world')).toBe('hello-world');
    });

    it('trims leading and trailing hyphens', () => {
      expect(TextUtils.slugify('  hello world  ')).toBe('hello-world');
    });

    it('replaces underscores with hyphens', () => {
      expect(TextUtils.slugify('hello_world')).toBe('hello-world');
    });

    it('handles empty string', () => {
      expect(TextUtils.slugify('')).toBe('');
    });
  });

  describe('excerpt', () => {
    it('returns empty string for null or undefined', () => {
      expect(TextUtils.excerpt(null)).toBe('');
      expect(TextUtils.excerpt(undefined)).toBe('');
    });

    it('returns the full text if shorter than maxLength', () => {
      expect(TextUtils.excerpt('short text')).toBe('short text');
    });

    it('truncates long text and appends ellipsis', () => {
      const text = 'a '.repeat(150).trim();
      const result = TextUtils.excerpt(text, 20);
      expect(result.endsWith('...')).toBe(true);
      expect(result.length).toBeLessThanOrEqual(23);
    });

    it('strips markdown formatting', () => {
      const md = '**bold** and *italic* text';
      expect(TextUtils.excerpt(md)).toBe('bold and italic text');
    });

    it('uses custom maxLength', () => {
      const text = 'This is a somewhat long sentence that should be truncated at a word boundary.';
      const result = TextUtils.excerpt(text, 30);
      expect(result.endsWith('...')).toBe(true);
    });
  });

  describe('stripMarkdown', () => {
    it('removes heading markers', () => {
      expect(TextUtils.stripMarkdown('## Heading')).toBe('Heading');
    });

    it('removes bold formatting', () => {
      expect(TextUtils.stripMarkdown('**bold**')).toBe('bold');
    });

    it('removes italic formatting', () => {
      expect(TextUtils.stripMarkdown('*italic*')).toBe('italic');
    });

    it('removes link formatting but keeps text', () => {
      expect(TextUtils.stripMarkdown('[link text](http://example.com)')).toBe('link text');
    });

    it('removes image formatting', () => {
      expect(TextUtils.stripMarkdown('before ![alt](image.png) after')).not.toContain(
        '(image.png)'
      );
    });

    it('removes inline code backticks', () => {
      expect(TextUtils.stripMarkdown('use `code` here')).toBe('use code here');
    });

    it('removes horizontal rules', () => {
      expect(TextUtils.stripMarkdown('text\n---\nmore')).toBe('text\n\nmore');
    });
  });

  describe('truncate', () => {
    it('returns empty string for null/undefined', () => {
      expect(TextUtils.truncate(null)).toBe('');
      expect(TextUtils.truncate(undefined)).toBe('');
    });

    it('returns full text if shorter than maxLength', () => {
      expect(TextUtils.truncate('short', 100)).toBe('short');
    });

    it('truncates and adds ellipsis', () => {
      const text = 'This is a long string that needs truncation';
      const result = TextUtils.truncate(text, 10);
      expect(result).toBe('This is a...');
    });
  });

  describe('capitalize', () => {
    it('capitalizes the first letter', () => {
      expect(TextUtils.capitalize('hello')).toBe('Hello');
    });

    it('returns empty string for empty input', () => {
      expect(TextUtils.capitalize('')).toBe('');
    });

    it('handles single character', () => {
      expect(TextUtils.capitalize('a')).toBe('A');
    });

    it('does not change already capitalized text', () => {
      expect(TextUtils.capitalize('Hello')).toBe('Hello');
    });
  });

  describe('titleCase', () => {
    it('capitalizes the first letter of each word', () => {
      expect(TextUtils.titleCase('hello world')).toBe('Hello World');
    });

    it('handles mixed case input', () => {
      expect(TextUtils.titleCase('hELLO wORLD')).toBe('Hello World');
    });

    it('handles single word', () => {
      expect(TextUtils.titleCase('hello')).toBe('Hello');
    });
  });
});
