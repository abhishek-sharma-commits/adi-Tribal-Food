import mongoose from 'mongoose';
import { Blog, Category } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { makeExcerpt, htmlToText, sanitizeBlogHtml } from '../utils/sanitizeHtml.js';
import { slugify } from '../utils/slugify.js';
import { deleteFiles } from './media.service.js';

const CARD_FIELDS = 'title slug excerpt coverImageUrl category tags author publishedAt';
const ADMIN_LIST_FIELDS = 'title slug excerpt coverImageUrl category tags status publishedAt createdAt updatedAt';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const meta = (page, limit, total) => ({ page, limit, total, totalPages: Math.ceil(total / limit) });
const mapDuplicate = (err) => (err?.code === 11000 ? ApiError.conflict('This slug is already in use', 'SLUG_TAKEN') : err);

function searchClause(q) {
  if (!q) return null;
  const rx = new RegExp(escapeRegex(q), 'i');
  return { $or: [{ title: rx }, { excerpt: rx }, { tags: rx }] };
}

async function paginate(filter, { page, limit, sort, select }) {
  const [items, total] = await Promise.all([
    Blog.find(filter)
      .select(select)
      .populate('category', 'name slug')
      .populate('author', 'fullName')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Blog.countDocuments(filter),
  ]);
  return { items, meta: meta(page, limit, total) };
}

async function assertCategoryExists(id) {
  if (id && !(await Category.exists({ _id: id }))) {
    throw ApiError.badRequest('Category does not exist', 'CATEGORY_NOT_FOUND');
  }
}

async function uniqueSlug(base) {
  let candidate = base;
  for (let i = 2; await Blog.exists({ slug: candidate }); i += 1) candidate = `${base}-${i}`;
  return candidate;
}

function cleanContent(html) {
  const clean = sanitizeBlogHtml(html);
  if (!htmlToText(clean) && !/<img\b/i.test(clean)) {
    throw ApiError.badRequest('Content is empty after removing unsupported markup', 'EMPTY_CONTENT');
  }
  return clean;
}

async function findOrThrow(id) {
  const blog = await Blog.findById(id);
  if (!blog) throw ApiError.notFound('Blog not found', 'BLOG_NOT_FOUND');
  return blog;
}

/* ------------------------------ public ------------------------------ */

export async function listPublicBlogs({ page, limit, q, category, tag }) {
  const filter = { status: 'published' };
  if (category) {
    const cat = await Category.findOne({ slug: category }).select('_id').lean();
    if (!cat) return { items: [], meta: meta(page, limit, 0) };
    filter.category = cat._id;
  }
  if (tag) filter.tags = tag;
  Object.assign(filter, searchClause(q));
  return paginate(filter, { page, limit, sort: { publishedAt: -1, _id: -1 }, select: CARD_FIELDS });
}

export async function getPublicBlogBySlug(slug) {
  const blog = await Blog.findOne({ slug, status: 'published' })
    .select('-status -__v')
    .populate('category', 'name slug')
    .populate('author', 'fullName')
    .lean();
  if (!blog) throw ApiError.notFound('Blog not found', 'BLOG_NOT_FOUND');

  const signals = [];
  if (blog.category) signals.push({ category: blog.category._id });
  if (blog.tags?.length) signals.push({ tags: mongoose.trusted({ $in: blog.tags }) });

  const related = signals.length
    ? await Blog.find({ status: 'published', _id: mongoose.trusted({ $ne: blog._id }), $or: signals })
        .select(CARD_FIELDS)
        .populate('author', 'fullName')
        .sort({ publishedAt: -1, _id: -1 })
        .limit(3)
        .lean()
    : [];

  return { blog, related };
}

/* ------------------------------ admin ------------------------------ */

export async function listAdminBlogs({ page, limit, q, status, category, sort }) {
  const filter = {};
  if (status) filter.status = status;
  if (category) filter.category = category;
  Object.assign(filter, searchClause(q));
  const order = { newest: { createdAt: -1, _id: -1 }, oldest: { createdAt: 1, _id: 1 }, title: { title: 1 } }[sort];
  return paginate(filter, { page, limit, sort: order, select: ADMIN_LIST_FIELDS });
}

export const getBlogById = (id) => findOrThrow(id);

export async function createBlog(data, authorId) {
  await assertCategoryExists(data.category);
  const content = cleanContent(data.content);
  const slug = data.slug ?? (await uniqueSlug(slugify(data.title) || ''));
  if (!slug) throw ApiError.badRequest('Could not derive a slug from the title; please provide one', 'SLUG_REQUIRED');

  try {
    // `author` is set after the spread so a client can never override it.
    return await Blog.create({ ...data, slug, content, excerpt: data.excerpt || makeExcerpt(content), author: authorId });
  } catch (err) {
    throw mapDuplicate(err);
  }
}

export async function updateBlog(id, data) {
  const blog = await findOrThrow(id);
  await assertCategoryExists(data.category);

  const previousCover = blog.coverImageFileId;
  const changes = { ...data };
  if (data.content !== undefined) changes.content = cleanContent(data.content);
  blog.set(changes);
  if (!blog.excerpt) blog.excerpt = makeExcerpt(blog.content);

  let saved;
  try {
    saved = await blog.save();
  } catch (err) {
    throw mapDuplicate(err);
  }
  if (previousCover && previousCover !== saved.coverImageFileId) await deleteFiles([previousCover]); // best-effort
  return saved;
}

export async function deleteBlog(id) {
  const blog = await Blog.findByIdAndDelete(id);
  if (!blog) throw ApiError.notFound('Blog not found', 'BLOG_NOT_FOUND');
  await deleteFiles([blog.coverImageFileId]);
}
