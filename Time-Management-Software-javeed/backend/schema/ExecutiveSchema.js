// schema/ExecutiveSchema.js
const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  description: { type: String },
  meetingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting' },
  status: {
    type: String,
    enum: ['scheduled', 'cancelled', 'completed'],
    default: 'scheduled',
  },
});

const LeaveSchema = new mongoose.Schema({
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  reason: { type: String },
});

const ExecutiveSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // hashed
  department: { type: String },
  role: { type: String, default: "executive" },
  leavePeriods: [LeaveSchema],
  tasks: [TaskSchema],
}, { timestamps: true });

// Prevent OverwriteModelError during hot reload
module.exports = mongoose.models?.Executive || mongoose.model("Executive", ExecutiveSchema);
