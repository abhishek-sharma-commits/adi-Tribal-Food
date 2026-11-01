import { z } from 'zod';

const httpsOrEmpty = z.string().trim().max(2000).refine((v) => v === '' || /^https:\/\/\S+$/i.test(v), 'Use a link starting with https://');
const wholeNumber = (min, max) =>
  z
    .string()
    .trim()
    .refine((v) => v === '' || /^\d+$/.test(v), 'Enter a whole number')
    .refine((v) => v === '' || (Number(v) >= min && Number(v) <= max), `Enter a number from ${min} to ${max}`);

export const recipeSchema = z
  .object({
    title: z.string().trim().min(1, 'Add a title').max(150, 'Keep the title under 150 characters'),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .max(150)
      .refine((v) => v === '' || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v), 'Use lowercase letters, numbers and single hyphens'),
    category: z.string().min(1, 'Choose a category'),
    shortDescription: z.string().trim().max(300, 'Keep this under 300 characters'),
    description: z.string().trim().max(10000, 'Keep this under 10,000 characters'),
    culturalNotes: z.string().trim().max(5000, 'Keep this under 5,000 characters'),
    coverImageUrl: httpsOrEmpty,
    coverImageFileId: z.string(),
    media: z
      .array(
        z.object({
          type: z.enum(['image', 'video']),
          url: z.string().trim().min(1, 'Add a link').pipe(httpsOrEmpty),
          thumbnailUrl: z.string(),
          fileId: z.string(),
          caption: z.string().trim().max(300, 'Keep captions under 300 characters'),
        })
      )
      .max(20, 'At most 20 photos and videos'),
    ingredients: z
      .array(z.object({ name: z.string().trim().max(120), quantity: z.string().trim().max(50), unit: z.string().trim().max(30) }))
      .max(100)
      .superRefine((rows, ctx) => {
        rows.forEach((r, i) => {
          if (!r.name && (r.quantity || r.unit)) ctx.addIssue({ code: 'custom', path: [i, 'name'], message: 'Add the ingredient name' });
        });
      }),
    instructions: z.array(z.object({ text: z.string().trim().max(2000, 'Keep each step under 2,000 characters') })).max(100),
    preparationTime: wholeNumber(0, 100000),
    cookingTime: wholeNumber(0, 100000),
    servings: wholeNumber(1, 1000),
    status: z.enum(['draft', 'published']),
    isFeatured: z.boolean(),
  });

export const emptyRecipe = {
  title: '', slug: '', category: '', shortDescription: '', description: '', culturalNotes: '',
  coverImageUrl: '', coverImageFileId: '', media: [], ingredients: [{ name: '', quantity: '', unit: '' }], instructions: [{ text: '' }],
  preparationTime: '', cookingTime: '', servings: '', status: 'draft', isFeatured: false,
};

const str = (v) => (v == null ? '' : String(v));

/** API recipe -> form values. */
export function toFormValues(r) {
  return {
    title: r.title ?? '', slug: r.slug ?? '', category: str(r.category?._id ?? r.category), shortDescription: r.shortDescription ?? '', description: r.description ?? '', culturalNotes: r.culturalNotes ?? '',
    coverImageUrl: r.coverImageUrl ?? '', coverImageFileId: r.coverImageFileId ?? '',
    media: (r.media ?? []).map((m) => ({ type: m.type, url: m.url, thumbnailUrl: m.thumbnailUrl ?? '', fileId: m.fileId ?? '', caption: m.caption ?? '' })),
    ingredients: r.ingredients?.length ? r.ingredients.map((i) => ({ name: i.name, quantity: i.quantity ?? '', unit: i.unit ?? '' })) : [{ name: '', quantity: '', unit: '' }],
    instructions: r.instructions?.length ? r.instructions.map((s) => ({ text: s.text })) : [{ text: '' }],
    preparationTime: str(r.preparationTime), cookingTime: str(r.cookingTime), servings: str(r.servings),
    status: r.status ?? 'draft', isFeatured: Boolean(r.isFeatured),
  };
}

const num = (v) => (v === '' ? null : Number(v));

/** Form values -> API body (blank rows dropped, empty numbers become null). Status/featured are handled separately on edit. */
export function toPayload(v) {
  return {
    title: v.title,
    ...(v.slug ? { slug: v.slug } : {}),
    category: v.category,
    shortDescription: v.shortDescription,
    description: v.description,
    culturalNotes: v.culturalNotes,
    coverImageUrl: v.coverImageUrl,
    coverImageFileId: v.coverImageUrl ? v.coverImageFileId : '',
    media: v.media.map((m) => ({ type: m.type, url: m.url, thumbnailUrl: m.thumbnailUrl, fileId: m.fileId, caption: m.caption })),
    ingredients: v.ingredients.filter((i) => i.name).map((i) => ({ name: i.name, quantity: i.quantity, unit: i.unit })),
    instructions: v.instructions.filter((s) => s.text).map((s) => ({ text: s.text })),
    preparationTime: num(v.preparationTime),
    cookingTime: num(v.cookingTime),
    servings: num(v.servings),
  };
}
