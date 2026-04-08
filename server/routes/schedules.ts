import express from 'express';
import { Schedule } from '../models/Schedule.js';
import { Course } from '../models/Course.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { Activity } from '../models/Activity.js';
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
    const { course, lecturer, date, dayOfWeek, startTime, endTime, room } = req.body;

    // Check for schedule conflicts (same room or same lecturer at the same time)
    const conflictQuery: any = {
      $or: [
        { room },
        { lecturer }
      ],
      $and: [
        { startTime: { $lt: endTime } },
        { endTime: { $gt: startTime } }
      ]
    };

    if (date) {
      conflictQuery.date = date;
    } else {
      conflictQuery.dayOfWeek = dayOfWeek;
    }

    const conflictingSchedule = await Schedule.findOne(conflictQuery).populate('course', 'title');

    if (conflictingSchedule) {
      const conflictType = conflictingSchedule.room === room ? 'Room' : 'Lecturer';
      const courseTitle = (conflictingSchedule.course as any)?.title || 'another course';
      return res.status(400).json({ 
        message: `Schedule conflict: ${conflictType} is already booked for ${courseTitle} during this time.` 
      });
    }

    const schedule = new Schedule({ course, lecturer, date, dayOfWeek, startTime, endTime, room });
    await schedule.save();

    // Notify students and lecturer
    const courseData = await Course.findById(course);
    if (courseData) {
      const notifications = [];
      const dateString = date ? `${date} (${dayOfWeek})` : dayOfWeek;
      
      // Notify enrolled students
      for (const studentId of courseData.studentsEnrolled) {
        notifications.push({
          recipient: studentId,
          message: `A new schedule has been added for ${courseData.title}: ${dateString} ${startTime}-${endTime} in ${room}`,
          type: 'schedule'
        });
      }

      // Notify lecturer
      if (lecturer) {
        notifications.push({
          recipient: lecturer,
          message: `You have been assigned a new schedule for ${courseData.title}: ${dateString} ${startTime}-${endTime} in ${room}`,
          type: 'schedule'
        });
      }

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    }

    await Activity.create({
      user: req.user?.id,
      action: 'Created a schedule',
      details: `${courseData?.title || 'Course'} on ${date || dayOfWeek} at ${startTime}`
    });

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

    await Activity.create({
      user: req.user?.id,
      action: 'Deleted a schedule',
      details: `Schedule on ${schedule.date || schedule.dayOfWeek} at ${schedule.startTime}`
    });

    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
