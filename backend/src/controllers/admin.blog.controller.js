import { createBlog, deleteBlog, getBlogById, listAdminBlogs, updateBlog } from '../services/blog.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const { items, meta } = await listAdminBlogs(req.query);
  res.json({ success: true, data: items, meta });
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await createBlog(req.body, req.user._id) });
});

export const get = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await getBlogById(req.params.id) });
});

export const update = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await updateBlog(req.params.id, req.body) });
});

export const remove = asyncHandler(async (req, res) => {
  await deleteBlog(req.params.id);
  res.json({ success: true, data: null });
});
