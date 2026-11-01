import { z } from 'zod';

const httpsOrEmpty = z.string().trim().max(2000).refine((v) => v === '' || /^https:\/\/\S+$/i.test(v), 'Use a link starting with https://');

export const blogSchema = z.object({
  title: z.string().trim().min(1, 'Add a title').max(200, 'Keep the title under 200 characters'),
  slug: z.string().trim().toLowerCase().max(200).refine((v) => v === '' || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v), 'Use lowercase letters, numbers and single hyphens'),
  category: z.string(),
  excerpt: z.string().trim().max(400, 'Keep the excerpt under 400 characters'),
  coverImageUrl: httpsOrEmpty,
  coverImageFileId: z.string(),
  tags: z.array(z.string().trim().min(1).max(30)).max(10, 'At most 10 tags'),
  content: z.string().refine((v) => v.replace(/<[^>]*>/g, '').trim() !== '' || /<img\b/i.test(v), 'Write the article body'),
  status: z.enum(['draft', 'published', 'archived']),
});

export const emptyBlog = { title: '', slug: '', category: '', excerpt: '', coverImageUrl: '', coverImageFileId: '', tags: [], content: '', status: 'draft' };

export const toFormValues = (b) => ({
  title: b.title ?? '', slug: b.slug ?? '', category: b.category?._id ?? b.category ?? '', excerpt: b.excerpt ?? '',
  coverImageUrl: b.coverImageUrl ?? '', coverImageFileId: b.coverImageFileId ?? '', tags: b.tags ?? [], content: b.content ?? '', status: b.status ?? 'draft',
});

export const toPayload = (v) => ({
  title: v.title,
  ...(v.slug ? { slug: v.slug } : {}),
  category: v.category || null,
  excerpt: v.excerpt,
  coverImageUrl: v.coverImageUrl,
  coverImageFileId: v.coverImageUrl ? v.coverImageFileId : '',
  tags: v.tags,
  content: v.content,
  status: v.status,
});
