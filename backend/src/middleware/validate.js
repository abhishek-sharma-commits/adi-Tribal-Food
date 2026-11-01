import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';

export const formatZodIssues = (error) =>
  error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));

export const validate =
  (schema, source = 'body') =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(ApiError.badRequest('Validation failed', 'VALIDATION_ERROR', formatZodIssues(result.error)));
    }
    req[source] = result.data;
    next();
  };

export const validateObjectId =
  (param = 'id') =>
  (req, _res, next) => {
    const value = String(req.params[param]);
    if (!mongoose.isValidObjectId(value) || value.length !== 24) {
      return next(ApiError.badRequest(`Invalid ${param}`, 'INVALID_ID'));
    }
    next();
  };
