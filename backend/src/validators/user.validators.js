import { z } from 'zod';

export const adminUsersQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(80).optional(),
  role: z.enum(['user', 'admin']).optional(),
  accountStatus: z.enum(['active', 'suspended']).optional(),
});

export const userStatusSchema = z.object({ accountStatus: z.enum(['active', 'suspended']) }).strict();
