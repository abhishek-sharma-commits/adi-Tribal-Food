import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { formatZodIssues } from './validate.js';

export const notFound = (_req, _res, next) => next(ApiError.notFound('Route not found', 'ROUTE_NOT_FOUND'));

function normalize(err) {
  if (err instanceof ApiError) return err;
  if (err instanceof ZodError) return ApiError.badRequest('Validation failed', 'VALIDATION_ERROR', formatZodIssues(err));
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({ path: e.path, message: e.message }));
    return ApiError.badRequest('Validation failed', 'VALIDATION_ERROR', details);
  }
  if (err instanceof mongoose.Error.CastError) return ApiError.badRequest('Invalid identifier or value', 'INVALID_ID');
  if (err?.code === 11000) {
    const fields = Object.keys(err.keyPattern ?? {});
    return ApiError.conflict(`Duplicate value${fields.length ? ` for: ${fields.join(', ')}` : ''}`, 'DUPLICATE_KEY');
  }
  if (err?.type === 'entity.parse.failed') return ApiError.badRequest('Malformed JSON body', 'INVALID_JSON');
  if (err?.type === 'entity.too.large') return new ApiError(413, 'Request body too large', 'PAYLOAD_TOO_LARGE');
  return null;
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  const known = normalize(err);
  if (!known) console.error(err);

  const status = known?.statusCode ?? 500;
  const body = {
    success: false,
    error: {
      code: known?.code ?? 'INTERNAL_ERROR',
      message: known ? known.message : env.isProd ? 'Something went wrong' : err.message,
    },
  };
  if (known?.details) body.error.details = known.details;
  res.status(status).json(body);
}
