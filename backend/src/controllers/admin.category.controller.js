import { createCategory, deleteCategory, listCategoriesWithUsage, updateCategory } from '../services/category.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const list = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await listCategoriesWithUsage() });
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await createCategory(req.body) });
});

export const update = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await updateCategory(req.params.id, req.body) });
});

export const remove = asyncHandler(async (req, res) => {
  await deleteCategory(req.params.id);
  res.json({ success: true, data: null });
});
