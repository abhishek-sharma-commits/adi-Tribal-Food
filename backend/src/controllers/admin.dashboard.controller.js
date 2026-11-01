import { getDashboardStats } from '../services/dashboard.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getDashboard = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await getDashboardStats() });
});
