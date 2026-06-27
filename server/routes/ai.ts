import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { Course } from '../models/Course.js';
import { Schedule } from '../models/Schedule.js';
import { User } from '../models/User.js';

const router = express.Router();

let aiClient: GoogleGenAI | null = null;
const getAiClient = () => {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY || ''; // Replace '' with your actual key if not using env variables
    if (apiKey) {
      try {
        aiClient = new GoogleGenAI({ 
          apiKey: apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
      } catch (e) {
        console.error("Failed to initialize GoogleGenAI:", e);
      }
    }
  }
  return aiClient;
};

// Chat API for EduSync AI Assistant
router.post('/chat', authenticate, async (req: AuthRequest, res) => {
  try {
    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({ message: 'AI service is currently unavailable (Missing API Key)' });
    }

    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const user = await User.findById(req.user?.id).select('-password');
    
    // Gather context
    const courses = await Course.find().populate('lecturer', 'name');
    const schedules = await Schedule.find().populate('course', 'title code').populate('lecturer', 'name');

    let contextData = '';
    
    if (user?.role === 'admin') {
      contextData = `You are chatting with an Admin named ${user.name}. There are ${courses.length} courses and ${schedules.length} schedules in the system.`;
    } else if (user?.role === 'lecturer') {
      const myCourses = courses.filter(c => (c.lecturer as any)?._id?.toString() === user._id.toString());
      const mySchedules = schedules.filter(s => (s.lecturer as any)?._id?.toString() === user._id.toString());
      contextData = `You are chatting with a Lecturer named ${user.name}. They teach ${myCourses.length} courses and have ${mySchedules.length} schedules.`;
    } else if (user?.role === 'student') {
      const enrolledCoursesIds = user?.enrolledCourses?.map(id => id.toString()) || [];
      const myCourses = courses.filter(c => enrolledCoursesIds.includes(c._id.toString()));
      contextData = `You are chatting with a Student named ${user.name}. They are enrolled in ${myCourses.length} courses.`;
    }

    let systemInstruction = `You are EduSync AI, a helpful, polite, and intelligent AI assistant for the EduSync Course Registration and Scheduling platform. 
Keep your answers relatively concise, friendly, and informative. Use markdown formatting.

Current System Context:
${contextData}

All Courses available in the system:
${courses.map((c: any) => `- ${c.title} (${c.code}): ${c.credits} credits, taught by ${c.lecturer?.name || 'Unknown'}. Capacity: ${c.studentsEnrolled?.length || 0}/${c.maxCapacity}`).join('\n')}

All Schedules:
${schedules.map((s: any) => `- ${s.course?.title} (${s.course?.code}): ${s.date || s.dayOfWeek} ${s.startTime}-${s.endTime} in ${s.room}, taught by ${s.lecturer?.name || 'Unknown'}`).join('\n')}`;

    if (user?.role === 'student') {
      systemInstruction += `\n\nSince you are chatting with a student, you should also act as an AI Tutor. In addition to answering questions about their schedule and courses, offer to help them study or understand concepts related to the courses they are enrolled in. If they ask academic questions, provide clear explanations, examples, and step-by-step guidance to help them learn effectively.`;
    } else {
      systemInstruction += `\n\nAnswer the user's question accurately based ONLY on the data provided above. If you don't know the answer based on the data, say you don't have that information.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: message,
      config: {
        systemInstruction,
        temperature: 0.2
      }
    });

    res.json({ reply: response.text });
  } catch (error) {
    console.error('Error in AI chat:', error);
    res.status(500).json({ message: 'Error processing your request' });
  }
});

export default router;
