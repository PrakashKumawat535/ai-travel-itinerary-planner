import { Router } from 'express';
import { createTrip, getTripHistory, getSharedTrip, addSharedComment } from '../controllers/tripController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Protected paths
router.post('/upload', authMiddleware as any, createTrip as any);
router.get('/history', authMiddleware as any, getTripHistory as any);

// Publicly shareable paths
router.get('/share/:id', getSharedTrip as any);
router.post('/share/:id/comment', addSharedComment as any);

export default router;
