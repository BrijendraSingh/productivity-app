import { describe, it, expect } from 'vitest';
import { EisenhowerUtils } from './EisenhowerUtils.js';
import { EISENHOWER_QUADRANTS } from '../constants/index.js';
import type { Todo } from '../types/index.js';

describe('EisenhowerUtils', () => {
  describe('calculateQuadrant', () => {
    it('returns Q1 when both urgency and importance >= 7', () => {
      expect(EisenhowerUtils.calculateQuadrant(7, 7)).toBe('Q1');
      expect(EisenhowerUtils.calculateQuadrant(10, 10)).toBe('Q1');
      expect(EisenhowerUtils.calculateQuadrant(8, 9)).toBe('Q1');
    });

    it('returns Q2 when urgency < 7 and importance >= 7', () => {
      expect(EisenhowerUtils.calculateQuadrant(6, 7)).toBe('Q2');
      expect(EisenhowerUtils.calculateQuadrant(1, 10)).toBe('Q2');
      expect(EisenhowerUtils.calculateQuadrant(3, 8)).toBe('Q2');
    });

    it('returns Q3 when urgency >= 7 and importance < 7', () => {
      expect(EisenhowerUtils.calculateQuadrant(7, 6)).toBe('Q3');
      expect(EisenhowerUtils.calculateQuadrant(10, 1)).toBe('Q3');
      expect(EisenhowerUtils.calculateQuadrant(9, 3)).toBe('Q3');
    });

    it('returns Q4 when both urgency and importance < 7', () => {
      expect(EisenhowerUtils.calculateQuadrant(6, 6)).toBe('Q4');
      expect(EisenhowerUtils.calculateQuadrant(1, 1)).toBe('Q4');
      expect(EisenhowerUtils.calculateQuadrant(3, 4)).toBe('Q4');
    });

    it('handles boundary value 7 correctly as the threshold', () => {
      expect(EisenhowerUtils.calculateQuadrant(7, 7)).toBe('Q1');
      expect(EisenhowerUtils.calculateQuadrant(6, 7)).toBe('Q2');
      expect(EisenhowerUtils.calculateQuadrant(7, 6)).toBe('Q3');
      expect(EisenhowerUtils.calculateQuadrant(6, 6)).toBe('Q4');
    });
  });

  describe('getQuadrantInfo', () => {
    it('returns correct info for each quadrant', () => {
      expect(EisenhowerUtils.getQuadrantInfo('Q1')).toEqual(EISENHOWER_QUADRANTS.Q1);
      expect(EisenhowerUtils.getQuadrantInfo('Q2')).toEqual(EISENHOWER_QUADRANTS.Q2);
      expect(EisenhowerUtils.getQuadrantInfo('Q3')).toEqual(EISENHOWER_QUADRANTS.Q3);
      expect(EisenhowerUtils.getQuadrantInfo('Q4')).toEqual(EISENHOWER_QUADRANTS.Q4);
    });
  });

  describe('getQuadrantLabel', () => {
    it('returns the correct label for each quadrant', () => {
      expect(EisenhowerUtils.getQuadrantLabel('Q1')).toBe('Do First');
      expect(EisenhowerUtils.getQuadrantLabel('Q2')).toBe('Schedule');
      expect(EisenhowerUtils.getQuadrantLabel('Q3')).toBe('Delegate');
      expect(EisenhowerUtils.getQuadrantLabel('Q4')).toBe('Eliminate');
    });
  });

  describe('getQuadrantColor', () => {
    it('returns the correct color for each quadrant', () => {
      expect(EisenhowerUtils.getQuadrantColor('Q1')).toBe('#d32f2f');
      expect(EisenhowerUtils.getQuadrantColor('Q2')).toBe('#1976d2');
      expect(EisenhowerUtils.getQuadrantColor('Q3')).toBe('#ed6c02');
      expect(EisenhowerUtils.getQuadrantColor('Q4')).toBe('#757575');
    });
  });

  describe('getQuadrantDescription', () => {
    it('returns the correct description for each quadrant', () => {
      expect(EisenhowerUtils.getQuadrantDescription('Q1')).toContain('Urgent and important');
      expect(EisenhowerUtils.getQuadrantDescription('Q2')).toContain('Not urgent but important');
      expect(EisenhowerUtils.getQuadrantDescription('Q3')).toContain('Urgent but not important');
      expect(EisenhowerUtils.getQuadrantDescription('Q4')).toContain(
        'Neither urgent nor important'
      );
    });
  });

  describe('isValidLevel', () => {
    it('returns true for integers 1 through 10', () => {
      for (let i = 1; i <= 10; i++) {
        expect(EisenhowerUtils.isValidLevel(i)).toBe(true);
      }
    });

    it('returns false for values outside 1-10 range', () => {
      expect(EisenhowerUtils.isValidLevel(0)).toBe(false);
      expect(EisenhowerUtils.isValidLevel(11)).toBe(false);
      expect(EisenhowerUtils.isValidLevel(-1)).toBe(false);
    });

    it('returns false for non-integers', () => {
      expect(EisenhowerUtils.isValidLevel(1.5)).toBe(false);
      expect(EisenhowerUtils.isValidLevel(7.9)).toBe(false);
    });
  });

  describe('clampLevel', () => {
    it('returns the same value for values in 1-10 range', () => {
      expect(EisenhowerUtils.clampLevel(1)).toBe(1);
      expect(EisenhowerUtils.clampLevel(5)).toBe(5);
      expect(EisenhowerUtils.clampLevel(10)).toBe(10);
    });

    it('clamps values below 1 to 1', () => {
      expect(EisenhowerUtils.clampLevel(0)).toBe(1);
      expect(EisenhowerUtils.clampLevel(-5)).toBe(1);
    });

    it('clamps values above 10 to 10', () => {
      expect(EisenhowerUtils.clampLevel(11)).toBe(10);
      expect(EisenhowerUtils.clampLevel(100)).toBe(10);
    });

    it('rounds non-integers before clamping', () => {
      expect(EisenhowerUtils.clampLevel(1.4)).toBe(1);
      expect(EisenhowerUtils.clampLevel(5.6)).toBe(6);
      expect(EisenhowerUtils.clampLevel(10.8)).toBe(10);
    });
  });

  describe('groupByQuadrant', () => {
    const makeTodo = (overrides: Partial<Todo>): Todo =>
      ({
        id: 1,
        title: 'Test',
        status: 'pending',
        priority: 'medium',
        urgency_level: 5,
        importance_level: 5,
        eisenhower_quadrant: null,
        ...overrides,
      }) as Todo;

    it('groups todos into correct quadrants based on calculated quadrant', () => {
      const todos = [
        makeTodo({ id: 1, urgency_level: 8, importance_level: 8 }),
        makeTodo({ id: 2, urgency_level: 3, importance_level: 9 }),
        makeTodo({ id: 3, urgency_level: 9, importance_level: 3 }),
        makeTodo({ id: 4, urgency_level: 2, importance_level: 2 }),
      ];

      const grouped = EisenhowerUtils.groupByQuadrant(todos);
      expect(grouped.Q1).toHaveLength(1);
      expect(grouped.Q2).toHaveLength(1);
      expect(grouped.Q3).toHaveLength(1);
      expect(grouped.Q4).toHaveLength(1);
      expect(grouped.Q1[0].id).toBe(1);
      expect(grouped.Q2[0].id).toBe(2);
    });

    it('uses eisenhower_quadrant field when present', () => {
      const todos = [
        makeTodo({ id: 1, urgency_level: 1, importance_level: 1, eisenhower_quadrant: 'Q1' }),
      ];

      const grouped = EisenhowerUtils.groupByQuadrant(todos);
      expect(grouped.Q1).toHaveLength(1);
    });

    it('returns empty arrays when given no todos', () => {
      const grouped = EisenhowerUtils.groupByQuadrant([]);
      expect(grouped.Q1).toHaveLength(0);
      expect(grouped.Q2).toHaveLength(0);
      expect(grouped.Q3).toHaveLength(0);
      expect(grouped.Q4).toHaveLength(0);
    });
  });

  describe('getQuadrantCounts', () => {
    const makeTodo = (urgency: number, importance: number): Todo =>
      ({
        id: 1,
        title: 'Test',
        status: 'pending',
        priority: 'medium',
        urgency_level: urgency,
        importance_level: importance,
        eisenhower_quadrant: null,
      }) as Todo;

    it('returns correct counts per quadrant', () => {
      const todos = [makeTodo(8, 8), makeTodo(9, 9), makeTodo(3, 9), makeTodo(9, 3)];

      const counts = EisenhowerUtils.getQuadrantCounts(todos);
      expect(counts.Q1).toBe(2);
      expect(counts.Q2).toBe(1);
      expect(counts.Q3).toBe(1);
      expect(counts.Q4).toBe(0);
    });
  });

  describe('getAllQuadrants', () => {
    it('returns an array of 4 quadrant info objects in order', () => {
      const all = EisenhowerUtils.getAllQuadrants();
      expect(all).toHaveLength(4);
      expect(all[0].id).toBe('Q1');
      expect(all[1].id).toBe('Q2');
      expect(all[2].id).toBe('Q3');
      expect(all[3].id).toBe('Q4');
    });
  });
});
