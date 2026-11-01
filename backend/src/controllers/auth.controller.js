import { issueCsrfToken } from '../middleware/csrf.js';
import { authenticateUser, changePassword, registerUser, updateProfile } from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { clearAuthCookie, setAuthCookie, signToken } from '../utils/token.js';

const toPublicUser = (u) => ({
  id: u.id,
  fullName: u.fullName,
  email: u.email,
  role: u.role,
  accountStatus: u.accountStatus,
  profileImageUrl: u.profileImageUrl,
  createdAt: u.createdAt,
});

export const getCsrfToken = (_req, res) => {
  res.json({ success: true, data: { csrfToken: issueCsrfToken(res) } });
};

export const register = asyncHandler(async (req, res) => {
  const user = await registerUser(req.body);
  setAuthCookie(res, signToken(user.id, user.tokenVersion));
  res.status(201).json({ success: true, data: { user: toPublicUser(user), csrfToken: issueCsrfToken(res) } });
});

export const login = asyncHandler(async (req, res) => {
  const user = await authenticateUser(req.body);
  setAuthCookie(res, signToken(user.id, user.tokenVersion));
  res.json({ success: true, data: { user: toPublicUser(user), csrfToken: issueCsrfToken(res) } });
});

export const logout = (_req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, data: null });
};

export const me = (req, res) => {
  res.json({ success: true, data: { user: toPublicUser(req.user) } });
};

export const updateMe = asyncHandler(async (req, res) => {
  const user = await updateProfile(req.user, req.body);
  res.json({ success: true, data: { user: toPublicUser(user) } });
});

export const changeMyPassword = asyncHandler(async (req, res) => {
  const user = await changePassword(req.user._id, req.body);
  setAuthCookie(res, signToken(user.id, user.tokenVersion)); // keeps the current session signed in
  res.json({ success: true, data: { user: toPublicUser(user), csrfToken: issueCsrfToken(res) } });
});
