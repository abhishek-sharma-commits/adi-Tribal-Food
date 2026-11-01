import { getPublicRecipeBySlug, listPublicRecipes } from '../services/recipe.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listRecipes = asyncHandler(async (req, res) => {
  const { items, meta } = await listPublicRecipes(req.query);
  res.json({ success: true, data: items, meta });
});

export const getRecipe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await getPublicRecipeBySlug(req.params.slug) });
});
