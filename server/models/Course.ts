import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  credits: { type: Number, required: true },
  lecturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  studentsEnrolled: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  maxCapacity: { type: Number, default: 30 },
  status: { type: String, enum: ['active', 'inactive', 'upcoming'], default: 'active' },
}, { timestamps: true });

export const Course = mongoose.model('Course', courseSchema);
