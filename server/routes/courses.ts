import express from 'express';
import { Course } from '../models/Course.js';
import { User } from '../models/User.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get all courses
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const courses = await Course.find().populate('lecturer', 'name email');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a course (Admin only)
router.post('/', [authenticate, authorize(['admin'])], async (req: AuthRequest, res) => {
  try {
    const { title, code, description, credits, lecturer, maxCapacity } = req.body;
    const course = new Course({ title, code, description, credits, lecturer, maxCapacity });
    await course.save();
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Enroll in a course (Student only)
router.post('/:id/enroll', [authenticate, authorize(['student'])], async (req: AuthRequest, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (course.studentsEnrolled.length >= course.maxCapacity) {
      return res.status(400).json({ message: 'Course is full' });
    }

    if (course.studentsEnrolled.includes(req.user?.id as any)) {
      return res.status(400).json({ message: 'Already enrolled' });
    }

    course.studentsEnrolled.push(req.user?.id as any);
    await course.save();

    const user = await User.findById(req.user?.id);
    if (user) {
      user.enrolledCourses.push(course._id as any);
      await user.save();
    }

    res.json({ message: 'Enrolled successfully', course });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Drop a course (Student only)
router.post('/:id/drop', [authenticate, authorize(['student'])], async (req: AuthRequest, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    course.studentsEnrolled = course.studentsEnrolled.filter(id => id.toString() !== req.user?.id);
    await course.save();

    const user = await User.findById(req.user?.id);
    if (user) {
      user.enrolledCourses = user.enrolledCourses.filter(id => id.toString() !== course._id.toString());
      await user.save();
    }

    res.json({ message: 'Dropped successfully', course });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin enroll student
router.post('/:id/admin-enroll', [authenticate, authorize(['admin'])], async (req: AuthRequest, res) => {
  try {
    const { studentId } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (course.studentsEnrolled.includes(studentId as any)) {
      return res.status(400).json({ message: 'Already enrolled' });
    }

    course.studentsEnrolled.push(studentId as any);
    await course.save();

    const user = await User.findById(studentId);
    if (user) {
      user.enrolledCourses.push(course._id as any);
      await user.save();
    }

    res.json({ message: 'Enrolled successfully', course });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin drop student
router.post('/:id/admin-drop', [authenticate, authorize(['admin'])], async (req: AuthRequest, res) => {
  try {
    const { studentId } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    course.studentsEnrolled = course.studentsEnrolled.filter(id => id.toString() !== studentId);
    await course.save();

    const user = await User.findById(studentId);
    if (user) {
      user.enrolledCourses = user.enrolledCourses.filter(id => id.toString() !== course._id.toString());
      await user.save();
    }

    res.json({ message: 'Dropped successfully', course });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a course (Admin only)
router.delete('/:id', [authenticate, authorize(['admin'])], async (req: AuthRequest, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get students enrolled in a course (Lecturer and Admin only)
router.get('/:id/students', [authenticate, authorize(['admin', 'lecturer'])], async (req: AuthRequest, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('studentsEnrolled', 'name email role');
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // If lecturer, ensure they are the lecturer for this course
    if (req.user?.role === 'lecturer' && course.lecturer?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view students for this course' });
    }

    res.json(course.studentsEnrolled);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
