import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormField } from '../../components/FormField.jsx';
import { useAuth } from '../../features/auth/AuthContext.jsx';
import { passwordChangeSchema, profileSchema } from '../../features/auth/validation.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { formatDate } from '../../utils/format.js';
import { applyApiErrors } from '../../utils/forms.js';

function ProfileForm() {
  const { user, updateProfile } = useAuth();
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(profileSchema), defaultValues: { fullName: user.fullName } });

  const onSubmit = async (values) => {
    setMessage('');
    setFormError('');
    try {
      await updateProfile(values);
      setMessage('Profile updated.');
    } catch (err) {
      if (!applyApiErrors(err, setError, ['fullName'])) setFormError(err.message);
    }
  };

  return (
    <section aria-labelledby="profile-heading">
      <h2 id="profile-heading" className="text-xl font-bold tracking-tight">
        Your details
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4 max-w-md space-y-5">
        {message && (
          <p role="status" className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
            {message}
          </p>
        )}
        {formError && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {formError}
          </p>
        )}
        <FormField label="Full name" autoComplete="name" error={errors.fullName?.message} {...register('fullName')} />
        <div>
          <p className="label">Email</p>
          <p className="rounded-xl bg-surface px-4 py-3 text-sm">{user.email}</p>
          <p className="mt-1.5 text-sm text-ink-muted">Your email is your sign-in and can't be changed here.</p>
        </div>
        <p className="text-sm text-ink-muted">Member since {formatDate(user.createdAt)}</p>
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </section>
  );
}

function PasswordForm() {
  const { changePassword } = useAuth();
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(passwordChangeSchema), defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' } });

  const onSubmit = async (values) => {
    setMessage('');
    setFormError('');
    try {
      await changePassword(values);
      reset();
      setMessage('Password changed. You have been signed out on your other devices.');
    } catch (err) {
      if (err.code === 'INVALID_CURRENT_PASSWORD') setError('currentPassword', { type: 'server', message: err.message });
      else if (!applyApiErrors(err, setError, ['currentPassword', 'newPassword', 'confirmPassword'])) setFormError(err.message);
    }
  };

  return (
    <section aria-labelledby="password-heading" className="mt-12 border-t border-line pt-10">
      <h2 id="password-heading" className="text-xl font-bold tracking-tight">
        Change password
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4 max-w-md space-y-5">
        {message && (
          <p role="status" className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
            {message}
          </p>
        )}
        {formError && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {formError}
          </p>
        )}
        <FormField label="Current password" type="password" autoComplete="current-password" error={errors.currentPassword?.message} {...register('currentPassword')} />
        <FormField label="New password" type="password" autoComplete="new-password" hint="At least 8 characters, with a letter and a number." error={errors.newPassword?.message} {...register('newPassword')} />
        <FormField label="Confirm new password" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? 'Changing…' : 'Change password'}
        </button>
      </form>
    </section>
  );
}

export default function Profile() {
  useDocumentTitle('Profile');
  return (
    <div>
      <ProfileForm />
      <PasswordForm />
    </div>
  );
}
