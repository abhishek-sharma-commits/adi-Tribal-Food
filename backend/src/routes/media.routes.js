import { Router } from 'express';
import { listPublished, uploadAuth } from '../controllers/media.controller.js';
import { authenticate } from '../middleware/auth.js';
import { uploadAuthLimiter } from '../middleware/rateLimiters.js';
import { validate } from '../middleware/validate.js';
import { publicMediaListQuery, uploadAuthSchema } from '../validators/media.validators.js';

const router = Router();

router.get('/', validate(publicMediaListQuery, 'query'), listPublished);
router.post('/upload-auth', authenticate, uploadAuthLimiter, validate(uploadAuthSchema), uploadAuth);

export default router;
