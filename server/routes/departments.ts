import express from 'express';
import { Department } from '../models/Department.js';
import { Activity } from '../models/Activity.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get all departments
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const departments = await Department.find().populate('headOfDepartment', 'name email');
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create department (Admin only)
router.post('/', [authenticate, authorize(['admin'])], async (req: AuthRequest, res) => {
  try {
    const { name, code, faculty, headOfDepartment } = req.body;
    const existing = await Department.findOne({ code });
    if (existing) return res.status(400).json({ message: 'Department code already exists' });

    const newDepartment = new Department({ name, code, faculty, headOfDepartment });
    await newDepartment.save();
    
    await Activity.create({
      user: req.user?.id,
      action: 'Created a department',
      details: `${name} (${code})`
    });

    const populated = await newDepartment.populate('headOfDepartment', 'name email');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update department (Admin only)
router.put('/:id', [authenticate, authorize(['admin'])], async (req: AuthRequest, res) => {
  try {
    const { name, code, faculty, headOfDepartment } = req.body;
    
    const existing = await Department.findOne({ code, _id: { $ne: req.params.id } });
    if (existing) return res.status(400).json({ message: 'Department code already exists' });

    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { name, code, faculty, headOfDepartment },
      { new: true }
    ).populate('headOfDepartment', 'name email');
    
    if (!department) return res.status(404).json({ message: 'Department not found' });

    await Activity.create({
      user: req.user?.id,
      action: 'Updated a department',
      details: `${name} (${code})`
    });

    res.json(department);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete department (Admin only)
router.delete('/:id', [authenticate, authorize(['admin'])], async (req: AuthRequest, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) return res.status(404).json({ message: 'Department not found' });

    await Activity.create({
      user: req.user?.id,
      action: 'Deleted a department',
      details: `${department.name} (${department.code})`
    });

    res.json({ message: 'Department deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
