import { listCategories } from '../services/category.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getCategories = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await listCategories() });
});
