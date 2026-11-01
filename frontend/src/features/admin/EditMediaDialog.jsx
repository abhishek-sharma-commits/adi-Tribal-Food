import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Modal from '../../components/Modal.jsx';
import { updateMedia } from '../../services/adminMedia.js';
import { applyApiErrors } from '../../utils/forms.js';
import MediaThumb from '../community/MediaThumb.jsx';

const schema = z.object({
  title: z.string().trim().min(1, 'Add a title').max(120, 'Keep the title under 120 characters'),
  description: z.string().trim().max(2000, 'Keep the description under 2000 characters'),
  category: z.string(),
});

/** Edit an official media item's details (the file itself is fixed; delete and re-upload to change it). */
export default function EditMediaDialog({ item, categories, onClose, onSaved, notice }) {
  const [formError, setFormError] = useState('');
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { title: item.title, description: item.description ?? '', category: item.category?._id ?? '' } });

  const onSubmit = async (v) => {
    setFormError('');
    try {
      await updateMedia(item._id, { title: v.title, description: v.description, category: v.category || null });
      onSaved(`“${v.title}” saved.`);
    } catch (err) {
      if (!applyApiErrors(err, setError, ['title', 'description', 'category'])) setFormError(err.message);
    }
  };

  return (
    <Modal title="Edit media details" onClose={onClose} locked={isSubmitting} size="max-w-xl">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {notice && <p role="status" className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</p>}
        {formError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p>}
        <div className="flex items-center gap-4">
          <MediaThumb item={item} className="h-20 w-20 shrink-0 rounded-xl" />
          <p className="text-sm text-ink-muted">{item.mediaType === 'video' ? 'Video' : 'Photo'} in the official library</p>
        </div>
        <div>
          <label htmlFor="em-title" className="label">Title</label>
          <input id="em-title" className={`input ${errors.title ? 'input-error' : ''}`} aria-invalid={Boolean(errors.title)} {...register('title')} />
          {errors.title && <p className="field-error" role="alert">{errors.title.message}</p>}
        </div>
        <div>
          <label htmlFor="em-category" className="label">Category</label>
          <select id="em-category" className="input" {...register('category')}>
            <option value="">No category</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          {errors.category && <p className="field-error" role="alert">{errors.category.message}</p>}
        </div>
        <div>
          <label htmlFor="em-description" className="label">Description <span className="font-normal text-ink-muted">(optional)</span></label>
          <textarea id="em-description" rows={3} className={`input ${errors.description ? 'input-error' : ''}`} {...register('description')} />
          {errors.description && <p className="field-error" role="alert">{errors.description.message}</p>}
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="btn-primary">{isSubmitting ? 'Saving…' : 'Save details'}</button>
        </div>
      </form>
    </Modal>
  );
}
