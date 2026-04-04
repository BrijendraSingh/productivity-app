import type { Request, Response, NextFunction } from 'express';
import { TextUtils, APP_CONFIG } from '@productivity-app/shared';
import type {
  CreateBlogPostRequest,
  UpdateBlogPostRequest,
  BlogPostWithRelations,
  Tag,
} from '@productivity-app/shared';
import { dbGet, dbAll, dbRun } from '../config/database';
import { AppError } from '../utils/AppError';

async function attachTags(postId: number): Promise<Tag[]> {
  return dbAll<Tag>(
    `SELECT t.id, t.user_id, t.name, t.color, t.created_at
     FROM tags t
     INNER JOIN blog_post_tags bpt ON bpt.tag_id = t.id
     WHERE bpt.blog_post_id = ?`,
    [postId]
  );
}

async function syncPostTags(postId: number, tagIds: number[]): Promise<void> {
  await dbRun('DELETE FROM blog_post_tags WHERE blog_post_id = ?', [postId]);
  for (const tagId of tagIds) {
    await dbRun('INSERT OR IGNORE INTO blog_post_tags (blog_post_id, tag_id) VALUES (?, ?)', [
      postId,
      tagId,
    ]);
  }
}

/**
 * Generate a unique slug for a blog post within a user's scope.
 * Appends -2, -3, etc. when the base slug is already taken.
 */
async function generateUniqueSlug(
  userId: number,
  title: string,
  excludeId?: number
): Promise<string> {
  const baseSlug = TextUtils.slugify(title);
  if (!baseSlug) return `post-${Date.now()}`;

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const params: unknown[] = [userId, slug];
    let query = 'SELECT id FROM blog_posts WHERE user_id = ? AND slug = ?';
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    const existing = await dbGet<{ id: number }>(query, params);
    if (!existing) return slug;
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
}

/**
 * GET /api/blog
 * Supports: ?search, ?status, ?category_id, ?sort, ?page, ?limit
 */
export async function getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { search, status, category_id, sort, page: pageStr, limit: limitStr } = req.query;

    const page = Math.max(1, parseInt(pageStr as string, 10) || 1);
    const limit = Math.min(
      APP_CONFIG.MAX_PAGE_SIZE,
      Math.max(1, parseInt(limitStr as string, 10) || APP_CONFIG.DEFAULT_PAGE_SIZE)
    );
    const offset = (page - 1) * limit;

    const conditions: string[] = ['bp.user_id = ?'];
    const params: unknown[] = [userId];

    if (search) {
      conditions.push('(bp.title LIKE ? OR bp.content LIKE ? OR bp.excerpt LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term);
    }
    if (status) {
      conditions.push('bp.status = ?');
      params.push(status);
    }
    if (category_id) {
      conditions.push('bp.category_id = ?');
      params.push(parseInt(category_id as string, 10));
    }

    const whereClause = conditions.join(' AND ');

    let orderClause = 'bp.created_at DESC';
    if (sort === 'updated') orderClause = 'bp.updated_at DESC';
    else if (sort === 'title') orderClause = 'bp.title ASC';
    else if (sort === 'views') orderClause = 'bp.view_count DESC';
    else if (sort === 'published')
      orderClause = 'CASE WHEN bp.published_at IS NULL THEN 1 ELSE 0 END, bp.published_at DESC';

    const countRow = await dbGet<{ total: number }>(
      `SELECT COUNT(*) as total FROM blog_posts bp WHERE ${whereClause}`,
      params
    );
    const total = countRow?.total ?? 0;

    const rows = await dbAll<BlogPostWithRelations>(
      `SELECT bp.*, bc.name as category_name
       FROM blog_posts bp
       LEFT JOIN blog_categories bc ON bc.id = bp.category_id
       WHERE ${whereClause}
       ORDER BY ${orderClause}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const posts: BlogPostWithRelations[] = [];
    for (const row of rows) {
      const tags = await attachTags(row.id);
      posts.push({ ...row, tags });
    }

    res.json({
      success: true,
      data: posts,
      meta: { page, limit, total },
    });
  } catch (error) {
    console.error('Get blog posts error:', error);
    next(error);
  }
}

/**
 * GET /api/blog/:id
 * Increments view_count on each access.
 */
export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const postId = parseInt(req.params.id as string, 10);

    const post = await dbGet<BlogPostWithRelations>(
      `SELECT bp.*, bc.name as category_name
       FROM blog_posts bp
       LEFT JOIN blog_categories bc ON bc.id = bp.category_id
       WHERE bp.id = ? AND bp.user_id = ?`,
      [postId, userId]
    );

    if (!post) {
      return next(AppError.notFound('Blog post not found.'));
    }

    await dbRun('UPDATE blog_posts SET view_count = view_count + 1 WHERE id = ?', [postId]);

    const tags = await attachTags(post.id);

    res.json({
      success: true,
      data: { ...post, view_count: post.view_count + 1, tags },
    });
  } catch (error) {
    console.error('Get blog post error:', error);
    next(error);
  }
}

/**
 * POST /api/blog
 * Auto-generates slug from title, computes word_count and reading_time.
 */
export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const body = req.body as CreateBlogPostRequest;

    const slug = await generateUniqueSlug(userId, body.title);
    const wordCount = TextUtils.wordCount(body.content);
    const readingTime = TextUtils.readingTime(body.content);

    const result = await dbRun(
      `INSERT INTO blog_posts
       (user_id, title, slug, content, content_type, status, excerpt,
        featured_image_path, category_id, reading_time, word_count,
        seo_title, seo_description, seo_keywords)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        body.title,
        slug,
        body.content ?? null,
        body.content_type ?? 'markdown',
        body.status ?? 'draft',
        body.excerpt ?? null,
        body.featured_image_path ?? null,
        body.category_id ?? null,
        readingTime,
        wordCount,
        body.seo_title ?? null,
        body.seo_description ?? null,
        body.seo_keywords ?? null,
      ]
    );

    if (body.tag_ids && body.tag_ids.length > 0) {
      await syncPostTags(result.lastID, body.tag_ids);
    }

    const post = await dbGet<BlogPostWithRelations>(
      `SELECT bp.*, bc.name as category_name
       FROM blog_posts bp
       LEFT JOIN blog_categories bc ON bc.id = bp.category_id
       WHERE bp.id = ?`,
      [result.lastID]
    );

    const tags = await attachTags(result.lastID);

    res.status(201).json({
      success: true,
      data: { ...post, tags },
      message: 'Blog post created successfully.',
    });
  } catch (error) {
    console.error('Create blog post error:', error);
    next(error);
  }
}

/**
 * PUT /api/blog/:id
 * Re-generates slug when title changes; recalculates word_count and reading_time.
 */
export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const postId = parseInt(req.params.id as string, 10);
    const body = req.body as UpdateBlogPostRequest;

    const existing = await dbGet<Record<string, unknown>>(
      'SELECT * FROM blog_posts WHERE id = ? AND user_id = ?',
      [postId, userId]
    );

    if (!existing) {
      return next(AppError.notFound('Blog post not found.'));
    }

    let slug = existing.slug as string;
    if (body.title && body.title !== existing.title) {
      slug = await generateUniqueSlug(userId, body.title, postId);
    }

    const content = body.content !== undefined ? body.content : (existing.content as string | null);
    const wordCount = TextUtils.wordCount(content);
    const readingTime = TextUtils.readingTime(content);

    await dbRun(
      `UPDATE blog_posts SET
        title = ?,
        slug = ?,
        content = ?,
        content_type = ?,
        status = ?,
        excerpt = ?,
        featured_image_path = ?,
        category_id = ?,
        reading_time = ?,
        word_count = ?,
        seo_title = ?,
        seo_description = ?,
        seo_keywords = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [
        body.title ?? existing.title,
        slug,
        content,
        body.content_type ?? existing.content_type,
        body.status ?? existing.status,
        body.excerpt !== undefined ? body.excerpt : existing.excerpt,
        body.featured_image_path !== undefined
          ? body.featured_image_path
          : existing.featured_image_path,
        body.category_id !== undefined ? body.category_id : existing.category_id,
        readingTime,
        wordCount,
        body.seo_title !== undefined ? body.seo_title : existing.seo_title,
        body.seo_description !== undefined ? body.seo_description : existing.seo_description,
        body.seo_keywords !== undefined ? body.seo_keywords : existing.seo_keywords,
        postId,
        userId,
      ]
    );

    if (body.tag_ids !== undefined) {
      await syncPostTags(postId, body.tag_ids);
    }

    const updated = await dbGet<BlogPostWithRelations>(
      `SELECT bp.*, bc.name as category_name
       FROM blog_posts bp
       LEFT JOIN blog_categories bc ON bc.id = bp.category_id
       WHERE bp.id = ?`,
      [postId]
    );

    const tags = await attachTags(postId);

    res.json({
      success: true,
      data: { ...updated, tags },
      message: 'Blog post updated successfully.',
    });
  } catch (error) {
    console.error('Update blog post error:', error);
    next(error);
  }
}

/**
 * DELETE /api/blog/:id
 */
export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const postId = parseInt(req.params.id as string, 10);

    const result = await dbRun('DELETE FROM blog_posts WHERE id = ? AND user_id = ?', [
      postId,
      userId,
    ]);

    if (result.changes === 0) {
      return next(AppError.notFound('Blog post not found.'));
    }

    res.json({ success: true, message: 'Blog post deleted successfully.' });
  } catch (error) {
    console.error('Delete blog post error:', error);
    next(error);
  }
}

/**
 * PATCH /api/blog/:id/publish
 * Sets status to 'published' and records published_at timestamp.
 */
export async function publish(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const postId = parseInt(req.params.id as string, 10);

    const existing = await dbGet<Record<string, unknown>>(
      'SELECT * FROM blog_posts WHERE id = ? AND user_id = ?',
      [postId, userId]
    );

    if (!existing) {
      return next(AppError.notFound('Blog post not found.'));
    }

    if (existing.status === 'published') {
      return next(AppError.badRequest('Blog post is already published.'));
    }

    await dbRun(
      `UPDATE blog_posts SET
        status = 'published',
        published_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [postId, userId]
    );

    const updated = await dbGet<BlogPostWithRelations>(
      `SELECT bp.*, bc.name as category_name
       FROM blog_posts bp
       LEFT JOIN blog_categories bc ON bc.id = bp.category_id
       WHERE bp.id = ?`,
      [postId]
    );

    const tags = await attachTags(postId);

    res.json({
      success: true,
      data: { ...updated, tags },
      message: 'Blog post published successfully.',
    });
  } catch (error) {
    console.error('Publish blog post error:', error);
    next(error);
  }
}
