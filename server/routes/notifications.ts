import express from 'express';
import { Notification } from '../models/Notification.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get user's notifications
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user?.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark notification as read
router.put('/:id/read', authenticate, async (req: AuthRequest, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user?.id },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all as read
router.put('/read-all', authenticate, async (req: AuthRequest, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user?.id, read: false },
      { read: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
