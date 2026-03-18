import express from 'express';
import { User } from '../models/User.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get all users (Admin only)
router.get('/', [authenticate, authorize(['admin'])], async (req: AuthRequest, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get lecturers
router.get('/lecturers', authenticate, async (req: AuthRequest, res) => {
  try {
    const lecturers = await User.find({ role: 'lecturer' }).select('name email');
    res.json(lecturers);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user role (Admin only)
router.put('/:id/role', [authenticate, authorize(['admin'])], async (req: AuthRequest, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'student', 'lecturer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
