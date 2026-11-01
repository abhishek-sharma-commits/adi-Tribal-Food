import {
  createSubmission,
  deleteMine,
  getMine,
  listGallery,
  listMine,
  updateMine,
} from '../services/community.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const gallery = asyncHandler(async (req, res) => {
  const { items, meta } = await listGallery(req.query);
  res.json({ success: true, data: items, meta });
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await createSubmission(req.body, req.user._id) });
});

export const mine = asyncHandler(async (req, res) => {
  const { items, meta } = await listMine(req.user._id, req.query);
  res.json({ success: true, data: items, meta });
});

export const mineById = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await getMine(req.user._id, req.params.id) });
});

export const update = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await updateMine(req.user._id, req.params.id, req.body) });
});

export const remove = asyncHandler(async (req, res) => {
  await deleteMine(req.user._id, req.params.id);
  res.json({ success: true, data: null });
});
