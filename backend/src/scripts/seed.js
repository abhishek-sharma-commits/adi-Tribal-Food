import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { connectDB, disconnectDB } from '../config/db.js';
import { env } from '../config/env.js';
import { Category, User } from '../models/index.js';
import { slugify } from '../utils/slugify.js';

const CATEGORIES = [
  'Rice Dishes',
  'Meat Dishes',
  'Vegetable Dishes',
  'Fermented Foods',
  'Beverages',
  'Snacks and Other Traditional Foods',
];

async function seedCategories() {
  for (const name of CATEGORIES) {
    const slug = slugify(name);
    if (!(await Category.exists({ slug }))) {
      await Category.create({ name, slug });
      console.log(`Category created: ${name}`);
    }
  }
}

async function seedAdmin() {
  const { ADMIN_NAME = 'Site Administrator', ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.log('ADMIN_EMAIL / ADMIN_PASSWORD not set - skipping admin creation');
    return;
  }
  const creds = z
    .object({
      email: z.string().trim().toLowerCase().email(),
      password: z.string().min(12, 'ADMIN_PASSWORD must be at least 12 characters').max(72),
    })
    .parse({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });

  const existing = await User.findOne({ email: creds.email });
  if (existing) {
    console.log(`User ${creds.email} already exists (role: ${existing.role}) - left unchanged`);
    return;
  }
  await User.create({
    fullName: ADMIN_NAME,
    email: creds.email,
    passwordHash: await bcrypt.hash(creds.password, env.BCRYPT_ROUNDS),
    role: 'admin',
  });
  console.log(`Admin created: ${creds.email}`);
}

try {
  await connectDB();
  await Promise.all([Category.init(), User.init()]);
  await seedCategories();
  await seedAdmin();
} finally {
  await disconnectDB();
}
