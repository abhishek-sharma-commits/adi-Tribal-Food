import { getUserById, listUsers, setAccountStatus } from '../services/user.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const { items, meta } = await listUsers(req.query);
  res.json({ success: true, data: items, meta });
});

export const get = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await getUserById(req.params.id) });
});

export const updateStatus = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await setAccountStatus(req.params.id, req.user, req.body.accountStatus) });
});
