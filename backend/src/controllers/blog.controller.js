import { getPublicBlogBySlug, listPublicBlogs } from '../services/blog.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listBlogs = asyncHandler(async (req, res) => {
  const { items, meta } = await listPublicBlogs(req.query);
  res.json({ success: true, data: items, meta });
});

export const getBlog = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await getPublicBlogBySlug(req.params.slug) });
});
