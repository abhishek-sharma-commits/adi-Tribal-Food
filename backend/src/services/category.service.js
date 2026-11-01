import mongoose from 'mongoose';
import { Blog, Category, CommunitySubmission, OfficialMedia, Recipe } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { slugify } from '../utils/slugify.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const listCategories = () => Category.find().sort({ name: 1 }).lean();

const EMPTY_USAGE = { recipes: 0, blogs: 0, submissions: 0, media: 0 };

async function usageByCategory() {
  const group = (Model) => Model.aggregate([{ $group: { _id: '$category', n: { $sum: 1 } } }]);
  const [recipes, blogs, submissions, media] = await Promise.all([group(Recipe), group(Blog), group(CommunitySubmission), group(OfficialMedia)]);
  const usage = new Map();
  const add = (rows, key) => {
    for (const row of rows) {
      if (!row._id) continue;
      const id = String(row._id);
      usage.set(id, { ...(usage.get(id) ?? EMPTY_USAGE), [key]: row.n });
    }
  };
  add(recipes, 'recipes');
  add(blogs, 'blogs');
  add(submissions, 'submissions');
  add(media, 'media');
  return usage;
}

/** Admin view: every category with how many items use it. */
export async function listCategoriesWithUsage() {
  const [categories, usage] = await Promise.all([listCategories(), usageByCategory()]);
  return categories.map((c) => ({ ...c, usage: usage.get(String(c._id)) ?? EMPTY_USAGE }));
}

const duplicateError = (field) =>
  field === 'slug'
    ? ApiError.conflict('This web address is already used by another category', 'SLUG_TAKEN')
    : ApiError.conflict('A category with this name already exists', 'NAME_TAKEN');

async function assertUnique({ name, slug }, exceptId) {
  const notSelf = exceptId ? { _id: mongoose.trusted({ $ne: exceptId }) } : {};
  if (name && (await Category.exists({ name: new RegExp(`^${escapeRegex(name)}$`, 'i'), ...notSelf }))) throw duplicateError('name');
  if (slug && (await Category.exists({ slug, ...notSelf }))) throw duplicateError('slug');
}

async function uniqueSlug(base) {
  let candidate = base;
  for (let i = 2; await Category.exists({ slug: candidate }); i += 1) candidate = `${base}-${i}`;
  return candidate;
}

const mapDuplicate = (err) => (err?.code === 11000 ? duplicateError(Object.keys(err.keyPattern ?? {})[0]) : err);

export async function createCategory(data) {
  await assertUnique({ name: data.name, slug: data.slug });
  const slug = data.slug ?? (await uniqueSlug(slugify(data.name) || ''));
  if (!slug) throw ApiError.badRequest('Could not derive a slug from the name; please provide one', 'SLUG_REQUIRED');
  try {
    return await Category.create({ ...data, slug });
  } catch (err) {
    throw mapDuplicate(err);
  }
}

export async function updateCategory(id, data) {
  const category = await Category.findById(id);
  if (!category) throw ApiError.notFound('Category not found', 'CATEGORY_NOT_FOUND');
  await assertUnique({ name: data.name, slug: data.slug }, category._id);
  category.set(data);
  try {
    return await category.save();
  } catch (err) {
    throw mapDuplicate(err);
  }
}

/** A category that is still used by any content cannot be deleted (it would orphan that content). */
export async function deleteCategory(id) {
  const category = await Category.findById(id);
  if (!category) throw ApiError.notFound('Category not found', 'CATEGORY_NOT_FOUND');
  const [recipes, blogs, submissions, media] = await Promise.all([
    Recipe.countDocuments({ category: category._id }),
    Blog.countDocuments({ category: category._id }),
    CommunitySubmission.countDocuments({ category: category._id }),
    OfficialMedia.countDocuments({ category: category._id }),
  ]);
  if (recipes + blogs + submissions + media > 0) {
    throw new ApiError(409, 'This category is still in use. Move or delete its content first.', 'CATEGORY_IN_USE', { recipes, blogs, submissions, media });
  }
  await category.deleteOne();
}
