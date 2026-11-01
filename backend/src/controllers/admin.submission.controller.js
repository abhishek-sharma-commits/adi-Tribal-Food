import { deleteSubmission, listAdminSubmissions, reviewSubmission } from '../services/moderation.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const { items, meta } = await listAdminSubmissions(req.query);
  res.json({ success: true, data: items, meta });
});

export const review = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await reviewSubmission(req.params.id, req.user, req.body) });
});

export const remove = asyncHandler(async (req, res) => {
  await deleteSubmission(req.params.id);
  res.json({ success: true, data: null });
});
