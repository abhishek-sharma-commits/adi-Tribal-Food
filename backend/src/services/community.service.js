import { env } from '../config/env.js';
import { Category, CommunitySubmission } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { communityFolder, deleteFiles, verifyUploadedFile } from './media.service.js';

const MAX_PENDING_PER_USER = 20;

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const meta = (page, limit, total, extra = {}) => ({ page, limit, total, totalPages: Math.ceil(total / limit), ...extra });

/** Owner-facing view: hides the reviewing admin and the provider file id. */
const ownerView = (doc) => {
  const o = doc.toObject();
  delete o.__v;
  delete o.reviewedBy;
  delete o.mediaFileId;
  return o;
};

export function assertAllowedMediaUrl(url) {
  if (!env.mediaUrlPrefixes.length) {
    throw new ApiError(503, 'Media uploads are not configured', 'MEDIA_NOT_CONFIGURED');
  }
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw ApiError.badRequest('Invalid media URL', 'MEDIA_URL_NOT_ALLOWED');
  }
  if (parsed.username || parsed.password || !env.mediaUrlPrefixes.some((p) => parsed.href.startsWith(p))) {
    throw ApiError.badRequest('Media must be uploaded through the site media provider', 'MEDIA_URL_NOT_ALLOWED');
  }
}

async function statusCounts(match) {
  const rows = await CommunitySubmission.aggregate([{ $match: match }, { $group: { _id: '$status', n: { $sum: 1 } } }]);
  const counts = { pending: 0, approved: 0, rejected: 0 };
  for (const r of rows) counts[r._id] = r.n;
  return { ...counts, total: counts.pending + counts.approved + counts.rejected };
}

async function findOwned(userId, id) {
  const sub = await CommunitySubmission.findOne({ _id: id, uploadedBy: userId });
  if (!sub) throw ApiError.notFound('Submission not found', 'SUBMISSION_NOT_FOUND');
  return sub;
}

export async function createSubmission(data, userId) {
  assertAllowedMediaUrl(data.mediaUrl);
  if (data.thumbnailUrl) assertAllowedMediaUrl(data.thumbnailUrl);

  if (!(await Category.exists({ _id: data.category }))) {
    throw ApiError.badRequest('Category does not exist', 'CATEGORY_NOT_FOUND');
  }
  if ((await CommunitySubmission.countDocuments({ uploadedBy: userId, status: 'pending' })) >= MAX_PENDING_PER_USER) {
    throw new ApiError(429, 'You have too many submissions awaiting review', 'PENDING_LIMIT');
  }

  if (await CommunitySubmission.exists({ mediaFileId: data.mediaFileId })) {
    throw ApiError.conflict('This upload has already been submitted', 'MEDIA_ALREADY_USED');
  }
  await verifyUploadedFile({
    fileId: data.mediaFileId,
    url: data.mediaUrl,
    mediaType: data.mediaType,
    folder: communityFolder(userId),
  });

  // Explicit field list: status is always the schema default ('pending').
  const sub = await CommunitySubmission.create({
    title: data.title,
    description: data.description,
    caption: data.caption,
    category: data.category,
    mediaType: data.mediaType,
    mediaUrl: data.mediaUrl,
    mediaFileId: data.mediaFileId,
    thumbnailUrl: data.thumbnailUrl,
    uploadedBy: userId,
    consentGivenAt: new Date(),
  });
  return ownerView(sub);
}

export async function listMine(userId, { page, limit, status, mediaType }) {
  const filter = { uploadedBy: userId };
  if (status) filter.status = status;
  if (mediaType) filter.mediaType = mediaType;

  const [items, total, counts] = await Promise.all([
    CommunitySubmission.find(filter)
      .select('-__v -reviewedBy -mediaFileId')
      .populate('category', 'name slug')
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    CommunitySubmission.countDocuments(filter),
    statusCounts({ uploadedBy: userId }),
  ]);
  return { items, meta: meta(page, limit, total, { counts }) };
}

export async function getMine(userId, id) {
  const sub = await findOwned(userId, id);
  await sub.populate('category', 'name slug');
  return ownerView(sub);
}

export async function updateMine(userId, id, data) {
  const sub = await findOwned(userId, id);
  if (sub.status === 'approved') {
    throw ApiError.conflict('Approved submissions cannot be edited. Delete it and submit again.', 'SUBMISSION_LOCKED');
  }
  if (data.category && !(await Category.exists({ _id: data.category }))) {
    throw ApiError.badRequest('Category does not exist', 'CATEGORY_NOT_FOUND');
  }

  sub.set(data);
  if (sub.status === 'rejected') {
    // Editing a rejected submission sends it back to the moderation queue.
    sub.status = 'pending';
    sub.rejectionReason = '';
    sub.reviewedBy = null;
    sub.reviewedAt = null;
  }
  await sub.save();
  return ownerView(sub);
}

export async function deleteMine(userId, id) {
  const sub = await CommunitySubmission.findOneAndDelete({ _id: id, uploadedBy: userId });
  if (!sub) throw ApiError.notFound('Submission not found', 'SUBMISSION_NOT_FOUND');
  await deleteFiles([sub.mediaFileId]);
}

export async function listGallery({ page, limit, q, mediaType, category }) {
  const filter = { status: 'approved' };
  if (mediaType) filter.mediaType = mediaType;
  if (category) {
    const cat = await Category.findOne({ slug: category }).select('_id').lean();
    if (!cat) return { items: [], meta: meta(page, limit, 0) };
    filter.category = cat._id;
  }
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ title: rx }, { description: rx }];
  }

  const [items, total] = await Promise.all([
    CommunitySubmission.find(filter)
      .select('title description caption category mediaType mediaUrl thumbnailUrl uploadedBy publishedAt')
      .populate('category', 'name slug')
      .populate('uploadedBy', 'fullName')
      .sort({ publishedAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    CommunitySubmission.countDocuments(filter),
  ]);
  return { items, meta: meta(page, limit, total) };
}
