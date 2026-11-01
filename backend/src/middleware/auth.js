import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AUTH_COOKIE, verifyToken } from '../utils/token.js';

/**
 * Requires a valid session. The user is re-loaded from the database on every request,
 * so role changes and suspensions take effect immediately (nothing authoritative lives in the JWT).
 */
export const authenticate = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.[AUTH_COOKIE];
  if (!token) throw ApiError.unauthorized();

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw ApiError.unauthorized('Session expired or invalid', 'INVALID_SESSION');
  }
  if (!mongoose.isValidObjectId(payload.sub)) {
    throw ApiError.unauthorized('Session expired or invalid', 'INVALID_SESSION');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('Session expired or invalid', 'INVALID_SESSION');
  if (user.accountStatus !== 'active') throw ApiError.forbidden('This account has been suspended', 'ACCOUNT_SUSPENDED');
  if ((payload.v ?? 0) !== user.tokenVersion) throw ApiError.unauthorized('Session expired or invalid', 'INVALID_SESSION');

  req.user = user;
  next();
});

export const requireRole =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
    next();
  };

/** Use on every /api/admin route: `router.use(requireAdmin)`. */
export const requireAdmin = [authenticate, requireRole('admin')];
