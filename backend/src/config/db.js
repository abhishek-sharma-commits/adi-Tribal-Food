import mongoose from 'mongoose';
import { env } from './env.js';

// Wraps any `$` operators inside query filter values in $eq (NoSQL injection defence in depth).
mongoose.set('sanitizeFilter', true);
mongoose.set('strictQuery', true);

export async function connectDB() {
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log('MongoDB connected');
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
