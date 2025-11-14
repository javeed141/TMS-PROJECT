
const mongoose = require('mongoose');

// Schema for invited executives
const InvitedSchema = new mongoose.Schema({
  email: { type: String, required: true },
  execId: { type: mongoose.Schema.Types.ObjectId, ref: 'Executive', default: null },
  status: {
    type: String,
    enum: ['invited', 'accepted', 'declined', 'cancelled'], // <-- added 'cancelled'
    default: 'invited',
  },
}, { _id: false });

// Main meeting schema
const MeetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  venue: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Executive", default: null },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "Executive" }],
  invited: [InvitedSchema],
  status: {
    type: String,
    enum: ['pending', 'scheduled', 'cancelled', 'completed', 'conflict'],
    default: 'pending',
  },
  project: { type: String },
  hasConflict: { type: Boolean, default: false },
  conflictStatus: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'escalated'],
    default: undefined,
  },
  conflictNotes: { type: String },
}, { timestamps: true });

module.exports = mongoose.models?.Meeting || mongoose.model('Meeting', MeetingSchema);
