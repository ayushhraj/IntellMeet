import { Router } from 'express';
import { signup, login, refreshToken, getMe, updateProfile, logout } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.post('/logout', authenticate, logout);

export default router;
