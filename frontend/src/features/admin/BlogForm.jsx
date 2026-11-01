import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { applyApiErrors } from '../../utils/forms.js';
import MediaThumb from '../community/MediaThumb.jsx';
import MediaUploader from './MediaUploader.jsx';
import { blogSchema, toPayload } from './blogForm.js';
import RichTextEditor from './RichTextEditor.jsx';
import TagInput from './TagInput.jsx';

const TOP = ['title', 'slug', 'category', 'excerpt', 'coverImageUrl', 'tags', 'content'];

function Section({ id, title, hint, children }) {
  return (
    <section aria-labelledby={id} className="border-t border-line pt-8">
      <h3 id={id} className="text-lg font-bold tracking-tight">{title}</h3>
      {hint && <p className="mt-1 text-sm text-ink-muted">{hint}</p>}
      <div className="mt-4 space-y-5">{children}</div>
    </section>
  );
}

function Field({ id, label, error, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      {children}
      {error ? <p className="field-error" role="alert">{error}</p> : hint && <p className="mt-1.5 text-sm text-ink-muted">{hint}</p>}
    </div>
  );
}

export default function BlogForm({ defaults, categories, mode, onSave, cancelTo }) {
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, control, watch, setValue, setError, formState: { errors } } = useForm({ resolver: zodResolver(blogSchema), defaultValues: defaults });
  const cover = watch('coverImageUrl');
  const err = (n) => errors[n]?.message;
  const input = (name, extra = {}) => ({ className: `input ${errors[name] ? 'input-error' : ''}`, 'aria-invalid': Boolean(errors[name]), disabled: saving, ...register(name), ...extra });

  const submit = async (values) => {
    setFormError('');
    setSaving(true);
    try {
      await onSave(toPayload(values), values);
    } catch (e) {
      if (e.code === 'SLUG_TAKEN') setError('slug', { type: 'server', message: 'This web address is already used by another story' });
      else if (e.code === 'EMPTY_CONTENT') setError('content', { type: 'server', message: 'The body is empty once unsupported formatting is removed' });
      else if (e.code === 'CATEGORY_NOT_FOUND') setError('category', { type: 'server', message: e.message });
      else {
        const matched = applyApiErrors(e, setError, TOP);
        const rest = (e.details ?? []).filter((d) => !TOP.includes(d.path?.split('.')[0]));
        if (rest.length) setFormError(rest.slice(0, 4).map((d) => `${d.path}: ${d.message}`).join(' · '));
        else if (!matched) setFormError(e.message);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(submit, () => setFormError('Please fix the highlighted fields.'))} noValidate className="space-y-8">
      {formError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>}

      <Section id="bf-basics" title="Basics">
        <Field id="bf-title" label="Title" error={err('title')}><input id="bf-title" {...input('title')} /></Field>
        <Field id="bf-slug" label="Web address (slug)" error={err('slug')} hint="Optional. Generated from the title if left empty. Changing it changes the story's link.">
          <input id="bf-slug" placeholder="e.g. food-and-memory" {...input('slug')} />
        </Field>
        <Field id="bf-category" label="Category" error={err('category')}>
          <select id="bf-category" {...input('category')}>
            <option value="">No category</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </Field>
        <Field id="bf-excerpt" label="Excerpt" error={err('excerpt')} hint="Shown on story cards (up to 400 characters). Generated from the body if left empty.">
          <textarea id="bf-excerpt" rows={2} {...input('excerpt')} />
        </Field>
        <Field id="bf-tags" label="Tags" error={err('tags')} hint="Up to 10. Readers can click a tag to find related stories.">
          <Controller control={control} name="tags" render={({ field }) => <TagInput id="bf-tags" value={field.value} onChange={field.onChange} disabled={saving} />} />
        </Field>
      </Section>

      <Section id="bf-cover" title="Cover image">
        {cover ? (
          <div className="flex items-center gap-4">
            <MediaThumb item={{ mediaType: 'image', mediaUrl: cover }} className="h-24 w-36 rounded-xl" />
            <button type="button" disabled={saving} onClick={() => (setValue('coverImageUrl', ''), setValue('coverImageFileId', ''))} className="btn-secondary">Remove cover</button>
          </div>
        ) : <p className="text-sm text-ink-muted">No cover image yet.</p>}
        <MediaUploader kind="image" label={cover ? 'Replace cover image' : 'Upload cover image'} disabled={saving} onUploaded={(r) => (setValue('coverImageUrl', r.url, { shouldValidate: true }), setValue('coverImageFileId', r.fileId))} />
        <div className="max-w-xl">
          <label htmlFor="bf-cover-url" className="label">Or paste an image link</label>
          <input id="bf-cover-url" placeholder="https://…" {...input('coverImageUrl', { onChange: (e) => (setValue('coverImageUrl', e.target.value, { shouldValidate: true }), setValue('coverImageFileId', '')) })} />
          {err('coverImageUrl') && <p className="field-error" role="alert">{err('coverImageUrl')}</p>}
        </div>
      </Section>

      <Section id="bf-body" title="Article" hint="Headings, emphasis, lists, quotes, links and images are supported. The text is cleaned on the server, so unsupported formatting is removed.">
        <div>
          <label htmlFor="bf-content" className="label">Body</label>
          <Controller control={control} name="content" render={({ field }) => <RichTextEditor id="bf-content" value={field.value} onChange={field.onChange} disabled={saving} invalid={Boolean(errors.content)} />} />
          {err('content') && <p className="field-error" role="alert">{err('content')}</p>}
        </div>
      </Section>

      <Section id="bf-publish" title="Publishing">
        <fieldset>
          <legend className="label">Status</legend>
          <div className="flex flex-wrap gap-6">
            {[['draft', 'Draft (private)'], ['published', 'Published (public)'], ['archived', 'Archived (hidden)']].map(([value, text]) => (
              <label key={value} className="flex items-center gap-2 text-sm"><input type="radio" value={value} disabled={saving} className="accent-brand" {...register('status')} /> {text}</label>
            ))}
          </div>
        </fieldset>
      </Section>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-white px-4 py-4 sm:mx-0 sm:rounded-b-card">
        <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : mode === 'create' ? 'Create story' : 'Save changes'}</button>
        <Link to={cancelTo} className="btn-secondary">Cancel</Link>
      </div>
    </form>
  );
}
