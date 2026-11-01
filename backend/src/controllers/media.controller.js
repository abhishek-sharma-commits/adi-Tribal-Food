import { listPublishedMedia } from '../services/mediaLibrary.service.js';
import { createUploadAuth } from '../services/media.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const uploadAuth = (req, res) => {
  res.json({ success: true, data: createUploadAuth({ purpose: req.body.purpose, user: req.user }) });
};

export const listPublished = asyncHandler(async (req, res) => {
  const { items, meta } = await listPublishedMedia(req.query);
  res.json({ success: true, data: items, meta });
});
