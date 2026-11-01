import {
  createMedia,
  deleteMedia,
  getMediaById,
  listAdminMedia,
  setMediaFeatured,
  setMediaStatus,
  updateMedia,
} from '../services/mediaLibrary.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const { items, meta } = await listAdminMedia(req.query);
  res.json({ success: true, data: items, meta });
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await createMedia(req.body, req.user._id) });
});

export const get = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await getMediaById(req.params.id) });
});

export const update = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await updateMedia(req.params.id, req.body) });
});

export const publish = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await setMediaStatus(req.params.id, req.body.status) });
});

export const feature = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await setMediaFeatured(req.params.id, req.body.isFeatured) });
});

export const remove = asyncHandler(async (req, res) => {
  await deleteMedia(req.params.id);
  res.json({ success: true, data: null });
});
