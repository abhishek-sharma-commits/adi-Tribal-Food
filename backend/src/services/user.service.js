import { User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export async function listUsers({ page, limit, q, role, accountStatus }) {
  const filter = {};
  if (role) filter.role = role;
  if (accountStatus) filter.accountStatus = accountStatus;
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ fullName: rx }, { email: rx }];
  }

  // passwordHash is `select: false` in the schema and never returned.
  const [items, total] = await Promise.all([
    User.find(filter)
      .select('-__v')
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);
  return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getUserById(id) {
  const user = await User.findById(id).select('-__v').lean();
  if (!user) throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
  return user;
}

export async function setAccountStatus(id, actingAdmin, accountStatus) {
  if (String(id) === String(actingAdmin._id)) {
    throw ApiError.forbidden('You cannot change your own account status', 'SELF_STATUS_CHANGE');
  }
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
  if (user.role === 'admin') {
    throw ApiError.forbidden('Administrator accounts cannot be suspended here', 'ADMIN_ACCOUNT_PROTECTED');
  }
  user.accountStatus = accountStatus;
  await user.save();
  return user;
}
