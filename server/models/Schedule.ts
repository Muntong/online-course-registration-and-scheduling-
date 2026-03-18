import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  lecturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dayOfWeek: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], required: true },
  startTime: { type: String, required: true }, // HH:mm format
  endTime: { type: String, required: true }, // HH:mm format
  room: { type: String, required: true },
}, { timestamps: true });

export const Schedule = mongoose.model('Schedule', scheduleSchema);
