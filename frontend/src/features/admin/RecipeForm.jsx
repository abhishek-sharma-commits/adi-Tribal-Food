import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { applyApiErrors } from '../../utils/forms.js';
import MediaThumb from '../community/MediaThumb.jsx';
import MediaUploader from './MediaUploader.jsx';
import { recipeSchema, toPayload } from './recipeForm.js';

const TOP_FIELDS = ['title', 'slug', 'category', 'shortDescription', 'description', 'culturalNotes', 'coverImageUrl', 'preparationTime', 'cookingTime', 'servings'];

function Section({ id, title, hint, children }) {
  return (
    <section aria-labelledby={id} className="border-t border-line pt-8">
      <h3 id={id} className="text-lg font-bold tracking-tight">
        {title}
      </h3>
      {hint && <p className="mt-1 text-sm text-ink-muted">{hint}</p>}
      <div className="mt-4 space-y-5">{children}</div>
    </section>
  );
}

function Field({ id, label, error, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children}
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-sm text-ink-muted">{hint}</p>
      )}
    </div>
  );
}

/** Create / edit form for a recipe. `onSave(payload, values)` performs the API calls and returns the saved recipe. */
export default function RecipeForm({ defaults, categories, mode, onSave, cancelTo }) {
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const form = useForm({ resolver: zodResolver(recipeSchema), defaultValues: defaults });
  const { register, handleSubmit, control, watch, setValue, setError, formState: { errors } } = form;
  const ingredients = useFieldArray({ control, name: 'ingredients' });
  const steps = useFieldArray({ control, name: 'instructions' });
  const media = useFieldArray({ control, name: 'media' });
  const cover = watch('coverImageUrl');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState('image');
  const [mediaUrlError, setMediaUrlError] = useState('');

  const err = (name) => errors[name]?.message;
  const input = (name, extra = {}) => ({ className: `input ${errors[name] ? 'input-error' : ''}`, 'aria-invalid': Boolean(errors[name]), disabled: saving, ...register(name), ...extra });

  const submit = async (values) => {
    setFormError('');
    setSaving(true);
    try {
      await onSave(toPayload(values), values);
    } catch (e) {
      if (e.code === 'SLUG_TAKEN') setError('slug', { type: 'server', message: 'This web address is already used by another recipe' });
      else if (e.code === 'CATEGORY_NOT_FOUND') setError('category', { type: 'server', message: e.message });
      else {
        const matched = applyApiErrors(e, setError, TOP_FIELDS);
        const rest = (e.details ?? []).filter((d) => !TOP_FIELDS.includes(d.path?.split('.')[0]));
        if (rest.length) setFormError(rest.slice(0, 4).map((d) => `${d.path}: ${d.message}`).join(' · '));
        else if (!matched) setFormError(e.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const addMediaByUrl = () => {
    const url = mediaUrl.trim();
    if (!/^https:\/\/\S+$/i.test(url)) return setMediaUrlError('Use a link starting with https://');
    setMediaUrlError('');
    media.append({ type: mediaType, url, thumbnailUrl: '', fileId: '', caption: '' });
    setMediaUrl('');
  };

  const rowBtn = 'flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface disabled:opacity-40';

  return (
    <form onSubmit={handleSubmit(submit, () => setFormError('Please fix the highlighted fields.'))} noValidate className="space-y-8">
      {formError && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError}
        </div>
      )}

      <Section id="basics" title="Basics">
        <Field id="rf-title" label="Recipe title" error={err('title')}>
          <input id="rf-title" {...input('title')} />
        </Field>
        <Field id="rf-slug" label="Web address (slug)" error={err('slug')} hint="Optional. Generated from the title if left empty. Changing it changes the recipe's link.">
          <input id="rf-slug" placeholder="e.g. apong-rice-beer" {...input('slug')} />
        </Field>
        <Field id="rf-category" label="Category" error={err('category')}>
          <select id="rf-category" {...input('category')}>
            <option value="">Choose a category</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field id="rf-short" label="Short description" error={err('shortDescription')} hint="Shown on recipe cards (up to 300 characters).">
          <textarea id="rf-short" rows={2} {...input('shortDescription')} />
        </Field>
        <Field id="rf-desc" label="Full description" error={err('description')} hint="Separate paragraphs with a blank line.">
          <textarea id="rf-desc" rows={6} {...input('description')} />
        </Field>
      </Section>

      <Section id="images" title="Cover image and media" hint="Uploads go to the official media library. Only document what is known; leave the rest out.">
        <div>
          <p className="label">Cover image</p>
          {cover ? (
            <div className="flex items-center gap-4">
              <MediaThumb item={{ mediaType: 'image', mediaUrl: cover }} className="h-24 w-36 rounded-xl" />
              <button type="button" disabled={saving} onClick={() => (setValue('coverImageUrl', ''), setValue('coverImageFileId', ''))} className="btn-secondary">
                Remove cover
              </button>
            </div>
          ) : (
            <p className="text-sm text-ink-muted">No cover image yet.</p>
          )}
          <div className="mt-3 flex flex-wrap items-start gap-4">
            <MediaUploader kind="image" label={cover ? 'Replace cover image' : 'Upload cover image'} disabled={saving} onUploaded={(r) => (setValue('coverImageUrl', r.url, { shouldValidate: true }), setValue('coverImageFileId', r.fileId))} />
          </div>
          <div className="mt-3 max-w-xl">
            <label htmlFor="rf-cover-url" className="label">
              Or paste an image link
            </label>
            <input id="rf-cover-url" placeholder="https://…" {...input('coverImageUrl', { onChange: (e) => (setValue('coverImageUrl', e.target.value, { shouldValidate: true }), setValue('coverImageFileId', '')) })} />
            {err('coverImageUrl') && (
              <p className="field-error" role="alert">
                {err('coverImageUrl')}
              </p>
            )}
          </div>
        </div>

        <div>
          <p className="label">Additional photos and videos</p>
          {media.fields.length === 0 && <p className="text-sm text-ink-muted">None added.</p>}
          <ul className="space-y-3">
            {media.fields.map((f, i) => (
              <li key={f.id} className="flex items-start gap-3 rounded-card border border-line p-3">
                <MediaThumb item={{ mediaType: f.type, mediaUrl: f.url, thumbnailUrl: f.thumbnailUrl }} className="h-16 w-16 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-ink-muted">
                    {f.type === 'video' ? 'Video' : 'Photo'} · {f.url}
                  </p>
                  <label htmlFor={`rf-media-${i}`} className="sr-only">
                    Caption for item {i + 1}
                  </label>
                  <input id={`rf-media-${i}`} placeholder="Caption (optional)" className="input mt-1.5" disabled={saving} {...register(`media.${i}.caption`)} />
                  {errors.media?.[i]?.caption && (
                    <p className="field-error" role="alert">
                      {errors.media[i].caption.message}
                    </p>
                  )}
                </div>
                <button type="button" className={rowBtn} disabled={saving} onClick={() => media.remove(i)} aria-label={`Remove media item ${i + 1}`}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          {errors.media?.message && (
            <p className="field-error" role="alert">
              {errors.media.message}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-start gap-4">
            <MediaUploader kind="any" label="Upload photo or video" disabled={saving} onUploaded={(r) => media.append({ ...r, caption: '' })} />
          </div>
          <div className="mt-3 flex max-w-xl flex-wrap items-end gap-2">
            <div>
              <label htmlFor="rf-media-type" className="label">
                Type
              </label>
              <select id="rf-media-type" value={mediaType} onChange={(e) => setMediaType(e.target.value)} className="input">
                <option value="image">Photo</option>
                <option value="video">Video</option>
              </select>
            </div>
            <div className="min-w-[200px] flex-1">
              <label htmlFor="rf-media-url" className="label">
                Or add by link
              </label>
              <input id="rf-media-url" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://…" className="input" />
            </div>
            <button type="button" onClick={addMediaByUrl} className="btn-secondary">
              Add
            </button>
          </div>
          {mediaUrlError && (
            <p className="field-error" role="alert">
              {mediaUrlError}
            </p>
          )}
        </div>
      </Section>

      <Section id="ingredients" title="Ingredients">
        <ul className="space-y-3">
          {ingredients.fields.map((f, i) => (
            <li key={f.id} className="grid grid-cols-[1fr_auto] items-start gap-2 sm:grid-cols-[1fr_110px_110px_auto]">
              <div className="col-span-2 sm:col-span-1">
                <label htmlFor={`rf-ing-${i}`} className="sr-only">
                  Ingredient {i + 1} name
                </label>
                <input id={`rf-ing-${i}`} placeholder="Ingredient" className={`input ${errors.ingredients?.[i]?.name ? 'input-error' : ''}`} disabled={saving} {...register(`ingredients.${i}.name`)} />
                {errors.ingredients?.[i]?.name && (
                  <p className="field-error" role="alert">
                    {errors.ingredients[i].name.message}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor={`rf-qty-${i}`} className="sr-only">
                  Ingredient {i + 1} quantity
                </label>
                <input id={`rf-qty-${i}`} placeholder="Quantity" className="input" disabled={saving} {...register(`ingredients.${i}.quantity`)} />
              </div>
              <div>
                <label htmlFor={`rf-unit-${i}`} className="sr-only">
                  Ingredient {i + 1} unit
                </label>
                <input id={`rf-unit-${i}`} placeholder="Unit" className="input" disabled={saving} {...register(`ingredients.${i}.unit`)} />
              </div>
              <div className="flex">
                <button type="button" className={rowBtn} disabled={saving || i === 0} onClick={() => ingredients.move(i, i - 1)} aria-label={`Move ingredient ${i + 1} up`}>
                  <ArrowUp className="h-4 w-4" aria-hidden="true" />
                </button>
                <button type="button" className={rowBtn} disabled={saving || i === ingredients.fields.length - 1} onClick={() => ingredients.move(i, i + 1)} aria-label={`Move ingredient ${i + 1} down`}>
                  <ArrowDown className="h-4 w-4" aria-hidden="true" />
                </button>
                <button type="button" className={rowBtn} disabled={saving} onClick={() => ingredients.remove(i)} aria-label={`Remove ingredient ${i + 1}`}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
        <button type="button" disabled={saving} onClick={() => ingredients.append({ name: '', quantity: '', unit: '' })} className="btn-secondary">
          <Plus className="h-4 w-4" aria-hidden="true" /> Add ingredient
        </button>
      </Section>

      <Section id="method" title="Method" hint="One step per box, in order. Empty steps are ignored.">
        <ol className="space-y-3">
          {steps.fields.map((f, i) => (
            <li key={f.id} className="flex items-start gap-3">
              <span className="mt-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white" aria-hidden="true">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <label htmlFor={`rf-step-${i}`} className="sr-only">
                  Step {i + 1}
                </label>
                <textarea id={`rf-step-${i}`} rows={2} className={`input ${errors.instructions?.[i]?.text ? 'input-error' : ''}`} disabled={saving} {...register(`instructions.${i}.text`)} />
                {errors.instructions?.[i]?.text && (
                  <p className="field-error" role="alert">
                    {errors.instructions[i].text.message}
                  </p>
                )}
              </div>
              <div className="flex">
                <button type="button" className={rowBtn} disabled={saving || i === 0} onClick={() => steps.move(i, i - 1)} aria-label={`Move step ${i + 1} up`}>
                  <ArrowUp className="h-4 w-4" aria-hidden="true" />
                </button>
                <button type="button" className={rowBtn} disabled={saving || i === steps.fields.length - 1} onClick={() => steps.move(i, i + 1)} aria-label={`Move step ${i + 1} down`}>
                  <ArrowDown className="h-4 w-4" aria-hidden="true" />
                </button>
                <button type="button" className={rowBtn} disabled={saving} onClick={() => steps.remove(i)} aria-label={`Remove step ${i + 1}`}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ol>
        <button type="button" disabled={saving} onClick={() => steps.append({ text: '' })} className="btn-secondary">
          <Plus className="h-4 w-4" aria-hidden="true" /> Add step
        </button>
      </Section>

      <Section id="details" title="Times and servings" hint="Leave blank if not documented.">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="rf-prep" label="Preparation (minutes)" error={err('preparationTime')}>
            <input id="rf-prep" inputMode="numeric" {...input('preparationTime')} />
          </Field>
          <Field id="rf-cook" label="Cooking (minutes)" error={err('cookingTime')}>
            <input id="rf-cook" inputMode="numeric" {...input('cookingTime')} />
          </Field>
          <Field id="rf-serves" label="Serves" error={err('servings')}>
            <input id="rf-serves" inputMode="numeric" {...input('servings')} />
          </Field>
        </div>
      </Section>

      <Section id="culture" title="Cultural background" hint="Only include context you can document. Leave empty rather than guess.">
        <Field id="rf-culture" label="Cultural notes" error={err('culturalNotes')}>
          <textarea id="rf-culture" rows={5} {...input('culturalNotes')} />
        </Field>
      </Section>

      <Section id="publishing" title="Publishing">
        <fieldset>
          <legend className="label">Status</legend>
          <div className="flex gap-6">
            {[['draft', 'Draft (private)'], ['published', 'Published (public)']].map(([value, text]) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <input type="radio" value={value} disabled={saving} className="accent-brand" {...register('status')} /> {text}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" disabled={saving} className="h-4 w-4 accent-brand" {...register('isFeatured')} /> Feature on the homepage
        </label>
      </Section>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-white px-4 py-4 sm:mx-0 sm:rounded-b-card">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : mode === 'create' ? 'Create recipe' : 'Save changes'}
        </button>
        <Link to={cancelTo} className="btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}
