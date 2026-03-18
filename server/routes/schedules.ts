import express from 'express';
import { Schedule } from '../models/Schedule.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get all schedules
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const schedules = await Schedule.find().populate('course', 'title code').populate('lecturer', 'name email');
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a schedule (Admin only)
router.post('/', [authenticate, authorize(['admin'])], async (req: AuthRequest, res) => {
  try {
    const { course, lecturer, dayOfWeek, startTime, endTime, room } = req.body;
    const schedule = new Schedule({ course, lecturer, dayOfWeek, startTime, endTime, room });
    await schedule.save();
    res.status(201).json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a schedule (Admin only)
router.delete('/:id', [authenticate, authorize(['admin'])], async (req: AuthRequest, res) => {
  try {
    const schedule = await Schedule.findByIdAndDelete(req.params.id);
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
