import rateLimit from 'express-rate-limit';
import { ApiError } from '../utils/ApiError.js';

const make = ({ windowMs, limit, skipSuccessfulRequests = false, ...options }) =>
  rateLimit({
    windowMs,
    limit,
    skipSuccessfulRequests,
    ...options,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, _res, next) =>
      next(new ApiError(429, 'Too many attempts. Please try again later.', 'RATE_LIMITED')),
  });

export const loginLimiter = make({ windowMs: 15 * 60 * 1000, limit: 10, skipSuccessfulRequests: true });
export const registerLimiter = make({ windowMs: 60 * 60 * 1000, limit: 10 });

// Authenticated routes only: keyed by user id, so `authenticate` must run first.
export const submissionLimiter = make({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  keyGenerator: (req) => String(req.user._id),
});

export const uploadAuthLimiter = make({
  windowMs: 60 * 60 * 1000,
  limit: 60,
  keyGenerator: (req) => String(req.user._id),
});

export const passwordLimiter = make({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  keyGenerator: (req) => String(req.user._id),
});
