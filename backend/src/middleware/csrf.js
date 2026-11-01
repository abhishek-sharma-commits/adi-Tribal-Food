import crypto from 'node:crypto';
import { ApiError } from '../utils/ApiError.js';
import { csrfCookieOptions } from '../utils/token.js';

export const CSRF_COOKIE = 'adifood_csrf';
export const CSRF_HEADER = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function issueCsrfToken(res) {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie(CSRF_COOKIE, token, csrfCookieOptions);
  return token;
}

const safeEqual = (a, b) => {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
};

/** Double-submit cookie: unsafe requests must echo the CSRF cookie value in the X-CSRF-Token header. */
export function csrfProtection(req, _res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.get(CSRF_HEADER);
  if (!cookieToken || !headerToken || !safeEqual(cookieToken, headerToken)) {
    return next(ApiError.forbidden('Invalid or missing CSRF token', 'CSRF_INVALID'));
  }
  next();
}
