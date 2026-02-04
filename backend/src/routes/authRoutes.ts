// server/routes/authRoutes.ts
import { Router } from 'express';
import { register, login } from '../controllers/authController';

const router = Router();

router.post('/login', login);

export default router;