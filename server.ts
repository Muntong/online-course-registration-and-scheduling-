import express from 'express';
import { createServer as createViteServer } from 'vite';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Import routes
import authRoutes from './server/routes/auth.js';
import courseRoutes from './server/routes/courses.js';
import scheduleRoutes from './server/routes/schedules.js';
import userRoutes from './server/routes/users.js';
import departmentRoutes from './server/routes/departments.js';
import notificationRoutes from './server/routes/notifications.js';
import activityRoutes from './server/routes/activities.js';
import aiRoutes from './server/routes/ai.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Connect to MongoDB
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/course-registration';
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.log('Falling back to mock data or running without DB connection.');
  }

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/courses', courseRoutes);
  app.use('/api/schedules', scheduleRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/departments', departmentRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/activities', activityRoutes);
  app.use('/api/ai', aiRoutes);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', dbConnected: mongoose.connection.readyState === 1 });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
