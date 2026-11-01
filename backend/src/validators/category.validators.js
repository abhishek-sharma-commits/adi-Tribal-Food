import { z } from 'zod';

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug may contain lowercase letters, numbers and single hyphens only');
const imageUrl = z.union([
  z.string().trim().max(2000).url().refine((u) => u.startsWith('https://'), 'URL must use https'),
  z.literal(''),
]);

const shape = {
  name: z.string().trim().min(1, 'Name is required').max(80),
  slug: slug.optional(),
  description: z.string().trim().max(500).default(''),
  imageUrl: imageUrl.default(''),
};

export const createCategorySchema = z.object(shape).strict();
export const updateCategorySchema = z
  .object(shape)
  .partial()
  .strict()
  .refine((d) => Object.keys(d).length > 0, 'No fields to update');
