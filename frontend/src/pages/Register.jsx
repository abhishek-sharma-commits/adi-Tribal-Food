import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FormField } from '../components/FormField.jsx';
import { useAuth } from '../features/auth/AuthContext.jsx';
import { registerSchema } from '../features/auth/validation.js';
import { applyApiErrors } from '../utils/forms.js';

const FIELDS = ['fullName', 'email', 'password', 'confirmPassword'];

export default function Register() {
  const { register: signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState('');
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (values) => {
    setFormError('');
    try {
      await signUp(values);
      navigate(location.state?.from ?? '/', { replace: true });
    } catch (err) {
      if (err.code === 'EMAIL_TAKEN') setError('email', { type: 'server', message: err.message });
      else if (!applyApiErrors(err, setError, FIELDS)) setFormError(err.message);
    }
  };

  return (
    <div className="container-page flex justify-center py-12 sm:py-16">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold tracking-tight">Join the community</h1>
        <p className="mt-2 text-ink-muted">Create an account to share your food photos and videos with the Adi Food community.</p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-5">
          {formError && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}
          <FormField label="Full name" autoComplete="name" error={errors.fullName?.message} {...register('fullName')} />
          <FormField label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
          <FormField label="Password" type="password" autoComplete="new-password" hint="At least 8 characters, with a letter and a number." error={errors.password?.message} {...register('password')} />
          <FormField label="Confirm password" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3">
            {isSubmitting ? 'Creating account…' : 'Sign up'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Already have an account?{' '}
          <Link to="/login" state={location.state} className="font-semibold text-ink underline underline-offset-4">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
