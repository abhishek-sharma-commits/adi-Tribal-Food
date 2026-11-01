import { z } from 'zod';

const email = z.string().trim().toLowerCase().email('Enter a valid email address').max(254);

const newPassword = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/\d/, 'Password must contain a number');

// .strict() rejects unknown keys, so `role`, `accountStatus`, etc. can never be mass-assigned.
export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Full name is required').max(80),
    email,
    password: newPassword,
    confirmPassword: z.string(),
  })
  .strict()
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export const loginSchema = z
  .object({
    email,
    password: z.string().min(1, 'Password is required').max(72),
  })
  .strict();

export const updateProfileSchema = z
  .object({ fullName: z.string().trim().min(2, 'Full name is required').max(80) })
  .strict();

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required').max(72),
    newPassword,
    confirmPassword: z.string(),
  })
  .strict()
  .refine((d) => d.newPassword === d.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' })
  .refine((d) => d.newPassword !== d.currentPassword, { path: ['newPassword'], message: 'New password must be different from the current one' });
