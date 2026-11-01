import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const slug = z
  .string()
  .trim()
  .toLowerCase()
  .max(150)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug may contain lowercase letters, numbers and single hyphens only');
const httpsUrl = z
  .string()
  .trim()
  .max(2000)
  .url()
  .refine((u) => u.startsWith('https://'), 'URL must use https');
const optionalUrl = z.union([httpsUrl, z.literal('')]);
const minutes = z.number().int().min(0).max(100000).nullable();

const ingredient = z
  .object({
    name: z.string().trim().min(1, 'Ingredient name is required').max(120),
    quantity: z.string().trim().max(50).default(''),
    unit: z.string().trim().max(30).default(''),
  })
  .strict();

const media = z
  .object({
    type: z.enum(['image', 'video']),
    url: httpsUrl,
    thumbnailUrl: optionalUrl.default(''),
    fileId: z.string().trim().max(200).default(''),
    caption: z.string().trim().max(300).default(''),
  })
  .strict();

const step = z.object({ text: z.string().trim().min(1, 'Step text is required').max(2000) }).strict();

// `author`, `publishedAt` and timestamps are intentionally absent: they are never client-controlled.
const shape = {
  title: z.string().trim().min(1, 'Title is required').max(150),
  slug: slug.optional(),
  shortDescription: z.string().trim().max(300).default(''),
  description: z.string().trim().max(10000).default(''),
  category: objectId,
  coverImageUrl: optionalUrl.default(''),
  coverImageFileId: z.string().trim().regex(/^[A-Za-z0-9_-]{0,100}$/, 'Invalid file id').default(''),
  media: z.array(media).max(20).default([]),
  ingredients: z.array(ingredient).max(100).default([]),
  preparationTime: minutes.optional(),
  cookingTime: minutes.optional(),
  servings: z.number().int().min(1).max(1000).nullable().optional(),
  instructions: z.array(step).max(100).default([]),
  culturalNotes: z.string().trim().max(5000).default(''),
};

export const createRecipeSchema = z
  .object({
    ...shape,
    status: z.enum(['draft', 'published']).default('draft'),
    isFeatured: z.boolean().default(false),
  })
  .strict();

// Status and featured flag change only through their dedicated endpoints.
export const updateRecipeSchema = z
  .object(shape)
  .partial()
  .strict()
  .refine((d) => Object.keys(d).length > 0, 'No fields to update');

export const publishRecipeSchema = z.object({ status: z.enum(['draft', 'published']) }).strict();
export const featureRecipeSchema = z.object({ isFeatured: z.boolean() }).strict();

const page = z.coerce.number().int().min(1).default(1);
const limit = (max, def) => z.coerce.number().int().min(1).max(max).default(def);
const boolString = z.enum(['true', 'false']).transform((v) => v === 'true');
const search = z.string().trim().max(80).optional();

export const publicRecipeListQuery = z.object({
  page,
  limit: limit(50, 12),
  q: search,
  category: slug.optional(), // category slug
  featured: boolString.optional(),
  sort: z.enum(['newest', 'featured']).default('newest'),
});

export const adminRecipeListQuery = z.object({
  page,
  limit: limit(100, 20),
  q: search,
  status: z.enum(['draft', 'published']).optional(),
  category: objectId.optional(),
  featured: boolString.optional(),
  sort: z.enum(['newest', 'oldest', 'title']).default('newest'),
});

export const slugParam = z.object({ slug });
