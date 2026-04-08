import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  details: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export const Activity = mongoose.model('Activity', activitySchema);
