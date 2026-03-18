import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  faculty: { type: String, required: true },
  headOfDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export const Department = mongoose.model('Department', departmentSchema);
