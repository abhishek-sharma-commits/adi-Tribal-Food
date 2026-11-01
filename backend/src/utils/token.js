import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const AUTH_COOKIE = 'adifood_token';
const ISSUER = 'adi-food';
const MAX_AGE_MS = env.SESSION_DAYS * 24 * 60 * 60 * 1000;

const secure = env.isProd || env.COOKIE_SAME_SITE === 'none';

const authCookieOptions = {
  httpOnly: true,
  secure,
  sameSite: env.COOKIE_SAME_SITE,
  path: '/',
};

export function signToken(userId, version = 0) {
  return jwt.sign({ v: version }, env.JWT_SECRET, {
    algorithm: 'HS256',
    issuer: ISSUER,
    subject: String(userId),
    expiresIn: `${env.SESSION_DAYS}d`,
  });
}

export function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'], issuer: ISSUER });
}

export function setAuthCookie(res, token) {
  res.cookie(AUTH_COOKIE, token, { ...authCookieOptions, maxAge: MAX_AGE_MS });
}

export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE, authCookieOptions);
}

export const csrfCookieOptions = {
  httpOnly: false,
  secure,
  sameSite: env.COOKIE_SAME_SITE,
  path: '/',
  maxAge: MAX_AGE_MS,
};
