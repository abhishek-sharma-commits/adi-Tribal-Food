import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

// Compared against when the email is unknown so response time doesn't reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('timing-equalisation-placeholder', env.BCRYPT_ROUNDS);

export async function registerUser({ fullName, email, password }) {
  const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
  try {
    // role and accountStatus are deliberately not passed: schema defaults ('user', 'active') always apply.
    return await User.create({ fullName, email, passwordHash });
  } catch (err) {
    if (err?.code === 11000) throw ApiError.conflict('An account with this email already exists', 'EMAIL_TAKEN');
    throw err;
  }
}

export async function updateProfile(user, { fullName }) {
  user.fullName = fullName;
  return user.save();
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw ApiError.badRequest('Current password is incorrect', 'INVALID_CURRENT_PASSWORD');
  }
  user.passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
  user.tokenVersion += 1; // every other session stops working
  return user.save();
}

export async function authenticateUser({ email, password }) {
  const user = await User.findOne({ email }).select('+passwordHash');
  const matches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !matches) throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  if (user.accountStatus !== 'active') throw ApiError.forbidden('This account has been suspended', 'ACCOUNT_SUSPENDED');
  return user;
}
