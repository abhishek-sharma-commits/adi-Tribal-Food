import { Category, OfficialMedia } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { assertAllowedMediaUrl } from './community.service.js';
import { deleteFiles, OFFICIAL_FOLDER, verifyUploadedFile } from './media.service.js';

const CARD_FIELDS = 'title description category mediaType mediaUrl thumbnailUrl isFeatured publishedAt';
const ADMIN_FIELDS = '-__v';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const meta = (page, limit, total) => ({ page, limit, total, totalPages: Math.ceil(total / limit) });

async function assertCategoryExists(id) {
  if (id && !(await Category.exists({ _id: id }))) {
    throw ApiError.badRequest('Category does not exist', 'CATEGORY_NOT_FOUND');
  }
}

async function findOrThrow(id) {
  const media = await OfficialMedia.findById(id);
  if (!media) throw ApiError.notFound('Media not found', 'MEDIA_NOT_FOUND');
  return media;
}

async function paginate(filter, { page, limit, sort, select }) {
  const [items, total] = await Promise.all([
    OfficialMedia.find(filter)
      .select(select)
      .populate('category', 'name slug')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    OfficialMedia.countDocuments(filter),
  ]);
  return { items, meta: meta(page, limit, total) };
}

/* ------------------------------ public ------------------------------ */

export async function listPublishedMedia({ page, limit, mediaType, category, featured }) {
  const filter = { status: 'published' };
  if (mediaType) filter.mediaType = mediaType;
  if (featured !== undefined) filter.isFeatured = featured;
  if (category) {
    const cat = await Category.findOne({ slug: category }).select('_id').lean();
    if (!cat) return { items: [], meta: meta(page, limit, 0) };
    filter.category = cat._id;
  }
  return paginate(filter, { page, limit, sort: { isFeatured: -1, publishedAt: -1, _id: -1 }, select: CARD_FIELDS });
}

/* ------------------------------ admin ------------------------------ */

export async function listAdminMedia({ page, limit, q, status, mediaType, category, featured }) {
  const filter = {};
  if (status) filter.status = status;
  if (mediaType) filter.mediaType = mediaType;
  if (category) filter.category = category;
  if (featured !== undefined) filter.isFeatured = featured;
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ title: rx }, { description: rx }];
  }
  return paginate(filter, { page, limit, sort: { createdAt: -1, _id: -1 }, select: ADMIN_FIELDS });
}

export const getMediaById = (id) => findOrThrow(id);

export async function createMedia(data, adminId) {
  await assertCategoryExists(data.category);
  if (data.thumbnailUrl) assertAllowedMediaUrl(data.thumbnailUrl);
  if (await OfficialMedia.exists({ mediaFileId: data.mediaFileId })) {
    throw ApiError.conflict('This upload has already been added', 'MEDIA_ALREADY_USED');
  }
  await verifyUploadedFile({
    fileId: data.mediaFileId,
    url: data.mediaUrl,
    mediaType: data.mediaType,
    folder: OFFICIAL_FOLDER,
  });

  try {
    // `uploadedBy` is set from the authenticated admin, after the spread.
    return await OfficialMedia.create({ ...data, uploadedBy: adminId });
  } catch (err) {
    if (err?.code === 11000) throw ApiError.conflict('This upload has already been added', 'MEDIA_ALREADY_USED');
    throw err;
  }
}

export async function updateMedia(id, data) {
  const media = await findOrThrow(id);
  await assertCategoryExists(data.category);
  media.set(data);
  return media.save();
}

export async function setMediaStatus(id, status) {
  const media = await findOrThrow(id);
  media.status = status; // pre-validate hook maintains publishedAt
  return media.save();
}

export async function setMediaFeatured(id, isFeatured) {
  const media = await findOrThrow(id);
  media.isFeatured = isFeatured;
  return media.save();
}

export async function deleteMedia(id) {
  const media = await OfficialMedia.findByIdAndDelete(id);
  if (!media) throw ApiError.notFound('Media not found', 'MEDIA_NOT_FOUND');
  await deleteFiles([media.mediaFileId]);
}
