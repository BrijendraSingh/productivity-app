import type { Request, Response, NextFunction } from 'express';
import type {
  CreateBlogCategoryRequest,
  UpdateBlogCategoryRequest,
  BlogCategory,
} from '@productivity-app/shared';
import { dbGet, dbAll, dbRun } from '../config/database';
import { AppError } from '../utils/AppError';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

export async function getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;

    const categories = await dbAll<BlogCategory & { post_count: number }>(
      `SELECT bc.*,
              COUNT(bp.id) as post_count
       FROM blog_categories bc
       LEFT JOIN blog_posts bp ON bp.category_id = bc.id
       WHERE bc.user_id = ?
       GROUP BY bc.id
       ORDER BY bc.name ASC`,
      [userId]
    );

    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Get blog categories error:', error);
    next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const categoryId = parseInt(req.params.id as string, 10);

    const category = await dbGet<BlogCategory & { post_count: number }>(
      `SELECT bc.*,
              COUNT(bp.id) as post_count
       FROM blog_categories bc
       LEFT JOIN blog_posts bp ON bp.category_id = bc.id
       WHERE bc.id = ? AND bc.user_id = ?
       GROUP BY bc.id`,
      [categoryId, userId]
    );

    if (!category) {
      return next(AppError.notFound('Blog category not found.'));
    }

    res.json({ success: true, data: category });
  } catch (error) {
    console.error('Get blog category error:', error);
    next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const body = req.body as CreateBlogCategoryRequest;

    const slug = body.slug || slugify(body.name);

    const result = await dbRun(
      `INSERT INTO blog_categories (user_id, name, slug, description, color, icon, parent_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        body.name,
        slug,
        body.description ?? null,
        body.color ?? null,
        body.icon ?? null,
        body.parent_id ?? null,
      ]
    );

    const category = await dbGet<BlogCategory>('SELECT * FROM blog_categories WHERE id = ?', [
      result.lastID,
    ]);

    res.status(201).json({
      success: true,
      data: category,
      message: 'Blog category created successfully.',
    });
  } catch (error) {
    console.error('Create blog category error:', error);
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return next(AppError.conflict('A blog category with this slug already exists.'));
    }
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const categoryId = parseInt(req.params.id as string, 10);
    const body = req.body as UpdateBlogCategoryRequest;

    const existing = await dbGet<Record<string, unknown>>(
      'SELECT * FROM blog_categories WHERE id = ? AND user_id = ?',
      [categoryId, userId]
    );

    if (!existing) {
      return next(AppError.notFound('Blog category not found.'));
    }

    const newName = body.name ?? existing.name;
    const newSlug = body.slug ?? (body.name ? slugify(body.name as string) : existing.slug);

    await dbRun(
      `UPDATE blog_categories SET
        name = ?,
        slug = ?,
        description = ?,
        color = ?,
        icon = ?,
        parent_id = ?
       WHERE id = ? AND user_id = ?`,
      [
        newName,
        newSlug,
        body.description !== undefined ? body.description : existing.description,
        body.color !== undefined ? body.color : existing.color,
        body.icon !== undefined ? body.icon : existing.icon,
        body.parent_id !== undefined ? body.parent_id : existing.parent_id,
        categoryId,
        userId,
      ]
    );

    const updated = await dbGet<BlogCategory>('SELECT * FROM blog_categories WHERE id = ?', [
      categoryId,
    ]);

    res.json({
      success: true,
      data: updated,
      message: 'Blog category updated successfully.',
    });
  } catch (error) {
    console.error('Update blog category error:', error);
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return next(AppError.conflict('A blog category with this slug already exists.'));
    }
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const categoryId = parseInt(req.params.id as string, 10);

    const result = await dbRun('DELETE FROM blog_categories WHERE id = ? AND user_id = ?', [
      categoryId,
      userId,
    ]);

    if (result.changes === 0) {
      return next(AppError.notFound('Blog category not found.'));
    }

    res.json({ success: true, message: 'Blog category deleted successfully.' });
  } catch (error) {
    console.error('Delete blog category error:', error);
    next(error);
  }
}
