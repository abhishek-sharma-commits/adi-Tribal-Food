import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Modal from '../../components/Modal.jsx';
import { createCategory, updateCategory } from '../../services/adminCategories.js';
import { applyApiErrors } from '../../utils/forms.js';

const schema = z.object({
  name: z.string().trim().min(1, 'Add a name').max(80, 'Keep the name under 80 characters'),
  slug: z.string().trim().toLowerCase().max(80).refine((v) => v === '' || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v), 'Use lowercase letters, numbers and single hyphens'),
  description: z.string().trim().max(500, 'Keep the description under 500 characters'),
  imageUrl: z.string().trim().max(2000).refine((v) => v === '' || /^https:\/\/\S+$/i.test(v), 'Use a link starting with https://'),
});

export default function CategoryDialog({ category, onClose, onSaved }) {
  const editing = Boolean(category);
  const [formError, setFormError] = useState('');
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { name: category?.name ?? '', slug: category?.slug ?? '', description: category?.description ?? '', imageUrl: category?.imageUrl ?? '' } });

  const onSubmit = async (v) => {
    setFormError('');
    const body = { name: v.name, description: v.description, imageUrl: v.imageUrl, ...(v.slug ? { slug: v.slug } : {}) };
    try {
      if (editing) await updateCategory(category._id, body);
      else await createCategory(body);
      onSaved(editing ? `“${v.name}” saved.` : `“${v.name}” created.`);
    } catch (err) {
      if (err.code === 'NAME_TAKEN') setError('name', { type: 'server', message: err.message });
      else if (err.code === 'SLUG_TAKEN') setError('slug', { type: 'server', message: err.message });
      else if (!applyApiErrors(err, setError, ['name', 'slug', 'description', 'imageUrl'])) setFormError(err.message);
    }
  };

  const slugChanged = editing && category.slug;
  return (
    <Modal title={editing ? 'Edit category' : 'New category'} onClose={onClose} locked={isSubmitting} size="max-w-xl">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {formError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p>}
        <div>
          <label htmlFor="cd-name" className="label">Name</label>
          <input id="cd-name" className={`input ${errors.name ? 'input-error' : ''}`} aria-invalid={Boolean(errors.name)} {...register('name')} />
          {errors.name && <p className="field-error" role="alert">{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="cd-slug" className="label">Web address (slug)</label>
          <input id="cd-slug" placeholder="e.g. rice-dishes" className={`input ${errors.slug ? 'input-error' : ''}`} aria-invalid={Boolean(errors.slug)} {...register('slug')} />
          {errors.slug ? <p className="field-error" role="alert">{errors.slug.message}</p> : <p className="mt-1.5 text-sm text-ink-muted">{slugChanged ? 'Changing this changes the category’s filter links.' : 'Optional. Generated from the name if left empty.'}</p>}
        </div>
        <div>
          <label htmlFor="cd-description" className="label">Description <span className="font-normal text-ink-muted">(optional)</span></label>
          <textarea id="cd-description" rows={3} className={`input ${errors.description ? 'input-error' : ''}`} {...register('description')} />
          {errors.description && <p className="field-error" role="alert">{errors.description.message}</p>}
        </div>
        <div>
          <label htmlFor="cd-image" className="label">Image link <span className="font-normal text-ink-muted">(optional)</span></label>
          <input id="cd-image" placeholder="https://…" className={`input ${errors.imageUrl ? 'input-error' : ''}`} {...register('imageUrl')} />
          {errors.imageUrl && <p className="field-error" role="alert">{errors.imageUrl.message}</p>}
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="btn-primary">{isSubmitting ? 'Saving…' : editing ? 'Save category' : 'Create category'}</button>
        </div>
      </form>
    </Modal>
  );
}
