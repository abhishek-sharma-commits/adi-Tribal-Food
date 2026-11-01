import { CommunitySubmission, ModerationLog } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { deleteFiles } from './media.service.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export async function statusCounts() {
  const rows = await CommunitySubmission.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]);
  const counts = { pending: 0, approved: 0, rejected: 0 };
  for (const r of rows) counts[r._id] = r.n;
  return { ...counts, total: counts.pending + counts.approved + counts.rejected };
}

export async function listAdminSubmissions({ page, limit, status, mediaType, q }) {
  const filter = { status };
  if (mediaType) filter.mediaType = mediaType;
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ title: rx }, { description: rx }];
  }
  // Review queue is first-in-first-out; the other tabs show most recently reviewed first.
  const order = status === 'pending' ? { createdAt: 1, _id: 1 } : { reviewedAt: -1, _id: -1 };

  const [items, total, counts] = await Promise.all([
    CommunitySubmission.find(filter)
      .select('-__v')
      .populate('category', 'name slug')
      .populate('uploadedBy', 'fullName email')
      .populate('reviewedBy', 'fullName')
      .sort(order)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    CommunitySubmission.countDocuments(filter),
    statusCounts(),
  ]);
  return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit), counts } };
}

export async function reviewSubmission(id, admin, { status, reason }) {
  const sub = await CommunitySubmission.findById(id);
  if (!sub) throw ApiError.notFound('Submission not found', 'SUBMISSION_NOT_FOUND');
  if (sub.status === status) throw ApiError.conflict(`Submission is already ${status}`, 'ALREADY_REVIEWED');

  const previousStatus = sub.status;
  const now = new Date();
  sub.status = status;
  sub.reviewedBy = admin._id;
  sub.reviewedAt = now;
  if (status === 'approved') {
    sub.publishedAt = now;
    sub.rejectionReason = '';
  } else {
    sub.publishedAt = null; // a previously approved item is removed from the gallery
    sub.rejectionReason = reason;
  }
  await sub.save();

  await ModerationLog.create({
    submission: sub._id,
    admin: admin._id,
    previousStatus,
    newStatus: status,
    reason: reason ?? '',
  });
  return sub;
}

export async function deleteSubmission(id) {
  // Moderation logs are kept for audit purposes.
  const sub = await CommunitySubmission.findByIdAndDelete(id);
  if (!sub) throw ApiError.notFound('Submission not found', 'SUBMISSION_NOT_FOUND');
  await deleteFiles([sub.mediaFileId]);
}
