import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);
router.get('/me', authenticate, authController.getMe);
router.post('/logout', authController.logout);
router.post('/dev-login', authController.devLogin);

export const authRouter = router;
