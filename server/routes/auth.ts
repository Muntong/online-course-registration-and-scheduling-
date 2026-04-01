import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already registered.' });

    const userCount = await User.countDocuments();
    const assignedRole = userCount === 0 ? 'admin' : 'student';

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashedPassword,
      role: assignedRole
    });

    await user.save();

    // Notify admin if a student registers
    if (assignedRole === 'student') {
      const admins = await User.find({ role: 'admin' });
      const notifications = admins.map(admin => ({
        recipient: admin._id,
        message: `A new student has registered: ${user.name} (${user.email})`,
        type: 'registration'
      }));
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'supersecretjwtkey', { expiresIn: '1h' });
    res.header('Authorization', token).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password.' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: 'Invalid email or password.' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'supersecretjwtkey', { expiresIn: '1h' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.user?.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/change-password', authenticate, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user?.id);
    
    if (!user) return res.status(404).json({ message: 'User not found' });

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) return res.status(400).json({ message: 'Invalid current password' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
