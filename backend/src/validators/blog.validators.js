import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const slug = z
  .string()
  .trim()
  .toLowerCase()
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug may contain lowercase letters, numbers and single hyphens only');
const httpsUrl = z
  .string()
  .trim()
  .max(2000)
  .url()
  .refine((u) => u.startsWith('https://'), 'URL must use https');
const optionalUrl = z.union([httpsUrl, z.literal('')]);
const tag = z.string().trim().toLowerCase().min(1).max(30);
const page = z.coerce.number().int().min(1).default(1);
const limit = (max, def) => z.coerce.number().int().min(1).max(max).default(def);
const search = z.string().trim().max(80).optional();

// `author` and `publishedAt` are never client-controlled.
const shape = {
  title: z.string().trim().min(1, 'Title is required').max(200),
  slug: slug.optional(),
  excerpt: z.string().trim().max(400).default(''),
  coverImageUrl: optionalUrl.default(''),
  coverImageFileId: z.string().trim().regex(/^[A-Za-z0-9_-]{0,100}$/, 'Invalid file id').default(''),
  content: z.string().min(1, 'Content is required').max(200000),
  category: objectId.nullable().optional(),
  tags: z
    .array(tag)
    .max(10)
    .transform((t) => [...new Set(t)])
    .default([]),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
};

export const createBlogSchema = z.object(shape).strict();
export const updateBlogSchema = z
  .object(shape)
  .partial()
  .strict()
  .refine((d) => Object.keys(d).length > 0, 'No fields to update');

export const publicBlogListQuery = z.object({
  page,
  limit: limit(50, 9),
  q: search,
  category: slug.optional(), // category slug
  tag: tag.optional(),
});

export const adminBlogListQuery = z.object({
  page,
  limit: limit(100, 20),
  q: search,
  status: z.enum(['draft', 'published', 'archived']).optional(),
  category: objectId.optional(),
  sort: z.enum(['newest', 'oldest', 'title']).default('newest'),
});

export const blogSlugParam = z.object({ slug });
