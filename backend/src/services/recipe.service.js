import mongoose from 'mongoose';
import { Category, Recipe } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { slugify } from '../utils/slugify.js';
import { deleteFiles } from './media.service.js';

const CARD_FIELDS = 'title slug shortDescription category coverImageUrl preparationTime cookingTime servings isFeatured publishedAt';
const ADMIN_LIST_FIELDS = 'title slug shortDescription category coverImageUrl status isFeatured publishedAt createdAt updatedAt';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function searchClause(q) {
  if (!q) return null;
  const rx = new RegExp(escapeRegex(q), 'i');
  return { $or: [{ title: rx }, { shortDescription: rx }, { description: rx }, { 'ingredients.name': rx }] };
}

const meta = (page, limit, total) => ({ page, limit, total, totalPages: Math.ceil(total / limit) });

async function paginate(filter, { page, limit, sort, select }) {
  const [items, total] = await Promise.all([
    Recipe.find(filter)
      .select(select)
      .populate('category', 'name slug')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Recipe.countDocuments(filter),
  ]);
  return { items, meta: meta(page, limit, total) };
}

const mapDuplicate = (err) =>
  err?.code === 11000 ? ApiError.conflict('This slug is already in use', 'SLUG_TAKEN') : err;

async function assertCategoryExists(id) {
  if (!(await Category.exists({ _id: id }))) {
    throw ApiError.badRequest('Category does not exist', 'CATEGORY_NOT_FOUND');
  }
}

async function findOrThrow(id) {
  const recipe = await Recipe.findById(id);
  if (!recipe) throw ApiError.notFound('Recipe not found', 'RECIPE_NOT_FOUND');
  return recipe;
}

async function uniqueSlug(base) {
  let candidate = base;
  for (let i = 2; await Recipe.exists({ slug: candidate }); i += 1) candidate = `${base}-${i}`;
  return candidate;
}

/* ------------------------------ public ------------------------------ */

export async function listPublicRecipes({ page, limit, q, category, featured, sort }) {
  const filter = { status: 'published' };

  if (category) {
    const cat = await Category.findOne({ slug: category }).select('_id').lean();
    if (!cat) return { items: [], meta: meta(page, limit, 0) };
    filter.category = cat._id;
  }
  if (featured !== undefined) filter.isFeatured = featured;
  Object.assign(filter, searchClause(q));

  const order =
    sort === 'featured'
      ? { isFeatured: -1, publishedAt: -1, _id: -1 }
      : { publishedAt: -1, _id: -1 };

  return paginate(filter, { page, limit, sort: order, select: CARD_FIELDS });
}

export async function getPublicRecipeBySlug(slug) {
  const recipe = await Recipe.findOne({ slug, status: 'published' })
    .select('-author -status -__v')
    .populate('category', 'name slug')
    .lean();
  if (!recipe) throw ApiError.notFound('Recipe not found', 'RECIPE_NOT_FOUND');

  const related = recipe.category
    ? await Recipe.find({
        status: 'published',
        category: recipe.category._id,
        _id: mongoose.trusted({ $ne: recipe._id }),
      })
        .select(CARD_FIELDS)
        .populate('category', 'name slug')
        .sort({ publishedAt: -1, _id: -1 })
        .limit(4)
        .lean()
    : [];

  return { recipe, related };
}

/* ------------------------------ admin ------------------------------ */

export async function listAdminRecipes({ page, limit, q, status, category, featured, sort }) {
  const filter = {};
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (featured !== undefined) filter.isFeatured = featured;
  Object.assign(filter, searchClause(q));

  const order = { newest: { createdAt: -1, _id: -1 }, oldest: { createdAt: 1, _id: 1 }, title: { title: 1 } }[sort];
  return paginate(filter, { page, limit, sort: order, select: ADMIN_LIST_FIELDS });
}

export const getRecipeById = (id) => findOrThrow(id);

export async function createRecipe(data, authorId) {
  await assertCategoryExists(data.category);

  const slug = data.slug ?? (await uniqueSlug(slugify(data.title) || ''));
  if (!slug) throw ApiError.badRequest('Could not derive a slug from the title; please provide one', 'SLUG_REQUIRED');

  try {
    // `author` is set from the authenticated admin, after the spread, so it can never be overridden.
    return await Recipe.create({ ...data, slug, author: authorId });
  } catch (err) {
    throw mapDuplicate(err);
  }
}

const fileIdsOf = (recipe) => [recipe.coverImageFileId, ...(recipe.media ?? []).map((m) => m.fileId)].filter(Boolean);

export async function updateRecipe(id, data) {
  const recipe = await findOrThrow(id);
  if (data.category) await assertCategoryExists(data.category);
  const before = fileIdsOf(recipe);
  recipe.set(data);
  let saved;
  try {
    saved = await recipe.save();
  } catch (err) {
    throw mapDuplicate(err);
  }
  // Files that were replaced or removed by this edit are deleted from the provider (best-effort).
  const kept = new Set(fileIdsOf(saved));
  await deleteFiles(before.filter((fileId) => !kept.has(fileId)));
  return saved;
}

export async function setRecipeStatus(id, status) {
  const recipe = await findOrThrow(id);
  recipe.status = status; // pre-validate hook maintains publishedAt
  return recipe.save();
}

export async function setRecipeFeatured(id, isFeatured) {
  const recipe = await findOrThrow(id);
  recipe.isFeatured = isFeatured;
  return recipe.save();
}

export async function deleteRecipe(id) {
  const recipe = await Recipe.findByIdAndDelete(id);
  if (!recipe) throw ApiError.notFound('Recipe not found', 'RECIPE_NOT_FOUND');
  await deleteFiles(fileIdsOf(recipe));
}
