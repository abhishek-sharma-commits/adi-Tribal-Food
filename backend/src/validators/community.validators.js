import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const slug = z
  .string()
  .trim()
  .toLowerCase()
  .max(150)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug');
const httpsUrl = z
  .string()
  .trim()
  .max(2000)
  .url()
  .refine((u) => u.startsWith('https://'), 'URL must use https');
const optionalUrl = z.union([httpsUrl, z.literal('')]);
const page = z.coerce.number().int().min(1).default(1);
const limit = (max, def) => z.coerce.number().int().min(1).max(max).default(def);
const search = z.string().trim().max(80).optional();

// `status`, `uploadedBy`, review fields and publishedAt are never accepted from the client.
export const createSubmissionSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(120),
    description: z.string().trim().max(2000).default(''),
    caption: z.string().trim().max(500).default(''),
    category: objectId,
    mediaType: z.enum(['image', 'video']),
    mediaUrl: httpsUrl,
    mediaFileId: z.string().trim().regex(/^[A-Za-z0-9_-]{1,100}$/, 'Invalid mediaFileId'),
    thumbnailUrl: optionalUrl.default(''),
    consent: z.literal(true, { message: 'You must confirm consent to submit' }),
  })
  .strict();

// Metadata only. The media file itself cannot be swapped (delete and resubmit instead).
export const updateSubmissionSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(2000),
    caption: z.string().trim().max(500),
    category: objectId,
  })
  .partial()
  .strict()
  .refine((d) => Object.keys(d).length > 0, 'No fields to update');

export const mySubmissionsQuery = z.object({
  page,
  limit: limit(50, 12),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  mediaType: z.enum(['image', 'video']).optional(),
});

export const galleryQuery = z.object({
  page,
  limit: limit(60, 24),
  q: search,
  mediaType: z.enum(['image', 'video']).optional(),
  category: slug.optional(), // category slug
});

export const adminSubmissionsQuery = z.object({
  page,
  limit: limit(100, 20),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  mediaType: z.enum(['image', 'video']).optional(),
  q: search,
});

export const reviewSubmissionSchema = z
  .object({
    status: z.enum(['approved', 'rejected']),
    reason: z.string().trim().max(500).optional(),
  })
  .strict()
  .superRefine((d, ctx) => {
    if (d.status === 'rejected' && !d.reason) {
      ctx.addIssue({ code: 'custom', path: ['reason'], message: 'A reason is required when rejecting' });
    }
  });
