import { z } from 'zod';

export const uploadAuthSchema = z
  .object({ purpose: z.enum(['community', 'official']).default('community') })
  .strict();

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const httpsUrl = z
  .string()
  .trim()
  .max(2000)
  .url()
  .refine((u) => u.startsWith('https://'), 'URL must use https');
const page = z.coerce.number().int().min(1).default(1);
const limit = (max, def) => z.coerce.number().int().min(1).max(max).default(def);
const boolString = z.enum(['true', 'false']).transform((v) => v === 'true');
const search = z.string().trim().max(80).optional();

// `uploadedBy` and `publishedAt` are never client-controlled.
export const createMediaSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(120),
    description: z.string().trim().max(2000).default(''),
    category: objectId.nullable().optional(),
    mediaType: z.enum(['image', 'video']),
    mediaUrl: httpsUrl,
    mediaFileId: z.string().trim().regex(/^[A-Za-z0-9_-]{1,100}$/, 'Invalid mediaFileId'),
    thumbnailUrl: z.union([httpsUrl, z.literal('')]).default(''),
    status: z.enum(['draft', 'published']).default('draft'),
    isFeatured: z.boolean().default(false),
  })
  .strict();

// Metadata only; status and featured flag have their own endpoints, the file itself cannot be swapped.
export const updateMediaSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(2000),
    category: objectId.nullable(),
  })
  .partial()
  .strict()
  .refine((d) => Object.keys(d).length > 0, 'No fields to update');

export const publishMediaSchema = z.object({ status: z.enum(['draft', 'published']) }).strict();
export const featureMediaSchema = z.object({ isFeatured: z.boolean() }).strict();

export const adminMediaListQuery = z.object({
  page,
  limit: limit(100, 20),
  q: search,
  status: z.enum(['draft', 'published']).optional(),
  mediaType: z.enum(['image', 'video']).optional(),
  category: objectId.optional(),
  featured: boolString.optional(),
});

export const publicMediaListQuery = z.object({
  page,
  limit: limit(50, 12),
  mediaType: z.enum(['image', 'video']).optional(),
  category: z
    .string()
    .trim()
    .toLowerCase()
    .max(150)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug')
    .optional(), // category slug
  featured: boolString.optional(),
});
