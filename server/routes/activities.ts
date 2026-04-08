import express from 'express';
import { Activity } from '../models/Activity.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get recent activities
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const activities = await Activity.find()
      .populate('user', 'name role')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
