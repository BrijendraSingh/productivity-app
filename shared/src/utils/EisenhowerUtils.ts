import type { EisenhowerQuadrant, Todo } from '../types/index.js';
import { EISENHOWER_QUADRANTS } from '../constants/index.js';
import type { QuadrantInfo } from '../types/index.js';

const URGENCY_THRESHOLD = 7;
const IMPORTANCE_THRESHOLD = 7;

export class EisenhowerUtils {
  /**
   * Calculate the Eisenhower quadrant based on urgency and importance levels.
   *
   * Business rules:
   *   urgency >= 7 AND importance >= 7 → Q1 (Do First)
   *   urgency <  7 AND importance >= 7 → Q2 (Schedule)
   *   urgency >= 7 AND importance <  7 → Q3 (Delegate)
   *   urgency <  7 AND importance <  7 → Q4 (Eliminate)
   */
  static calculateQuadrant(urgency: number, importance: number): EisenhowerQuadrant {
    const isUrgent = urgency >= URGENCY_THRESHOLD;
    const isImportant = importance >= IMPORTANCE_THRESHOLD;

    if (isUrgent && isImportant) return 'Q1';
    if (!isUrgent && isImportant) return 'Q2';
    if (isUrgent && !isImportant) return 'Q3';
    return 'Q4';
  }

  static getQuadrantInfo(quadrant: EisenhowerQuadrant): QuadrantInfo {
    return EISENHOWER_QUADRANTS[quadrant];
  }

  static getQuadrantLabel(quadrant: EisenhowerQuadrant): string {
    return EISENHOWER_QUADRANTS[quadrant].label;
  }

  static getQuadrantColor(quadrant: EisenhowerQuadrant): string {
    return EISENHOWER_QUADRANTS[quadrant].color;
  }

  static getQuadrantDescription(quadrant: EisenhowerQuadrant): string {
    return EISENHOWER_QUADRANTS[quadrant].description;
  }

  /**
   * Group an array of todos by their Eisenhower quadrant.
   */
  static groupByQuadrant(todos: Todo[]): Record<EisenhowerQuadrant, Todo[]> {
    const grouped: Record<EisenhowerQuadrant, Todo[]> = {
      Q1: [],
      Q2: [],
      Q3: [],
      Q4: [],
    };

    for (const todo of todos) {
      const quadrant = todo.eisenhower_quadrant ?? EisenhowerUtils.calculateQuadrant(
        todo.urgency_level,
        todo.importance_level,
      );
      grouped[quadrant].push(todo);
    }

    return grouped;
  }

  /**
   * Count todos per quadrant.
   */
  static getQuadrantCounts(todos: Todo[]): Record<EisenhowerQuadrant, number> {
    const grouped = EisenhowerUtils.groupByQuadrant(todos);
    return {
      Q1: grouped.Q1.length,
      Q2: grouped.Q2.length,
      Q3: grouped.Q3.length,
      Q4: grouped.Q4.length,
    };
  }

  /**
   * Validate urgency/importance values are within the expected 1-10 range.
   */
  static isValidLevel(level: number): boolean {
    return Number.isInteger(level) && level >= 1 && level <= 10;
  }

  /**
   * Clamp a level value to the 1-10 range.
   */
  static clampLevel(level: number): number {
    return Math.max(1, Math.min(10, Math.round(level)));
  }

  /**
   * Get all quadrant info entries as an ordered array (Q1 → Q4).
   */
  static getAllQuadrants(): QuadrantInfo[] {
    return (['Q1', 'Q2', 'Q3', 'Q4'] as const).map(q => EISENHOWER_QUADRANTS[q]);
  }
}
