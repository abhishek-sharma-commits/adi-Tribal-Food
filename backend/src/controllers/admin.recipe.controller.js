import {
  createRecipe,
  deleteRecipe,
  getRecipeById,
  listAdminRecipes,
  setRecipeFeatured,
  setRecipeStatus,
  updateRecipe,
} from '../services/recipe.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const { items, meta } = await listAdminRecipes(req.query);
  res.json({ success: true, data: items, meta });
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await createRecipe(req.body, req.user._id) });
});

export const get = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await getRecipeById(req.params.id) });
});

export const update = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await updateRecipe(req.params.id, req.body) });
});

export const publish = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await setRecipeStatus(req.params.id, req.body.status) });
});

export const feature = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await setRecipeFeatured(req.params.id, req.body.isFeatured) });
});

export const remove = asyncHandler(async (req, res) => {
  await deleteRecipe(req.params.id);
  res.json({ success: true, data: null });
});
