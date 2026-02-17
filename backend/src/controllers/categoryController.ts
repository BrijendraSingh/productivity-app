import type { Request, Response } from 'express';
import type {
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategoryWithCount,
} from '@productivity-app/shared';
import { dbGet, dbAll, dbRun } from '../config/database';

/**
 * GET /api/categories
 * Returns all categories for the authenticated user, each with a todo_count.
 */
export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;

    const categories = await dbAll<CategoryWithCount>(
      `SELECT c.*,
              COUNT(t.id) as todo_count
       FROM categories c
       LEFT JOIN todos t ON t.category_id = c.id
       WHERE c.user_id = ?
       GROUP BY c.id
       ORDER BY c.name ASC`,
      [userId],
    );

    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

/**
 * GET /api/categories/:id
 */
export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const categoryId = parseInt(req.params.id as string, 10);

    const category = await dbGet<CategoryWithCount>(
      `SELECT c.*,
              COUNT(t.id) as todo_count
       FROM categories c
       LEFT JOIN todos t ON t.category_id = c.id
       WHERE c.id = ? AND c.user_id = ?
       GROUP BY c.id`,
      [categoryId, userId],
    );

    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found.' });
      return;
    }

    res.json({ success: true, data: category });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

/**
 * POST /api/categories
 * Enforces UNIQUE(user_id, name).
 */
export async function create(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const body = req.body as CreateCategoryRequest;

    const result = await dbRun(
      `INSERT INTO categories (user_id, name, color, icon, description)
       VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        body.name,
        body.color ?? '#1976d2',
        body.icon ?? null,
        body.description ?? null,
      ],
    );

    const category = await dbGet<CategoryWithCount>(
      `SELECT c.*, 0 as todo_count
       FROM categories c WHERE c.id = ?`,
      [result.lastID],
    );

    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully.',
    });
  } catch (error) {
    console.error('Create category error:', error);
    if (
      error instanceof Error &&
      error.message.includes('UNIQUE constraint failed')
    ) {
      res.status(409).json({
        success: false,
        message: 'A category with this name already exists.',
      });
      return;
    }
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

/**
 * PUT /api/categories/:id
 */
export async function update(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const categoryId = parseInt(req.params.id as string, 10);
    const body = req.body as UpdateCategoryRequest;

    const existing = await dbGet<Record<string, unknown>>(
      'SELECT * FROM categories WHERE id = ? AND user_id = ?',
      [categoryId, userId],
    );

    if (!existing) {
      res.status(404).json({ success: false, message: 'Category not found.' });
      return;
    }

    await dbRun(
      `UPDATE categories SET
        name = ?,
        color = ?,
        icon = ?,
        description = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [
        body.name ?? existing.name,
        body.color ?? existing.color,
        body.icon !== undefined ? body.icon : existing.icon,
        body.description !== undefined ? body.description : existing.description,
        categoryId,
        userId,
      ],
    );

    const updated = await dbGet<CategoryWithCount>(
      `SELECT c.*,
              COUNT(t.id) as todo_count
       FROM categories c
       LEFT JOIN todos t ON t.category_id = c.id
       WHERE c.id = ?
       GROUP BY c.id`,
      [categoryId],
    );

    res.json({
      success: true,
      data: updated,
      message: 'Category updated successfully.',
    });
  } catch (error) {
    console.error('Update category error:', error);
    if (
      error instanceof Error &&
      error.message.includes('UNIQUE constraint failed')
    ) {
      res.status(409).json({
        success: false,
        message: 'A category with this name already exists.',
      });
      return;
    }
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

/**
 * DELETE /api/categories/:id
 */
export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const categoryId = parseInt(req.params.id as string, 10);

    const result = await dbRun(
      'DELETE FROM categories WHERE id = ? AND user_id = ?',
      [categoryId, userId],
    );

    if (result.changes === 0) {
      res.status(404).json({ success: false, message: 'Category not found.' });
      return;
    }

    res.json({ success: true, message: 'Category deleted successfully.' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}
