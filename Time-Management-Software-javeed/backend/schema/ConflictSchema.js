const mongoose = require('mongoose');

const ConflictOverlapSchema = new mongoose.Schema({
  executive: { type: mongoose.Schema.Types.ObjectId, ref: 'Executive' },
  executiveEmail: { type: String },
  conflicts: [
    {
      type: {
        type: String,
        enum: ['meeting', 'task'],
        required: true,
      },
      refId: { type: mongoose.Schema.Types.ObjectId },
      title: { type: String },
      startTime: { type: Date },
      endTime: { type: Date },
      notes: { type: String },
      status: { type: String },
    },
  ],
});

const ConflictProposalSchema = new mongoose.Schema({
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Secretary', required: true },
  createdAt: { type: Date, default: Date.now },
});

const ConflictHistorySchema = new mongoose.Schema({
  action: { type: String, required: true },
  notes: { type: String },
  actor: { type: mongoose.Schema.Types.ObjectId, required: true },
  actorRole: { type: String, enum: ['executive', 'secretary'], required: true },
  createdAt: { type: Date, default: Date.now },
});

const ConflictConsultationSchema = new mongoose.Schema(
  {
    executive: { type: mongoose.Schema.Types.ObjectId, ref: 'Executive' },
    executiveName: { type: String },
    executiveEmail: { type: String },
    decision: {
      type: String,
      enum: ['pending', 'approved', 'declined'],
      default: 'pending',
    },
    notes: { type: String },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Secretary', required: true },
    recordedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const ConflictSchema = new mongoose.Schema(
  {
    meeting: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting', required: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Executive', required: true },
    participantEmails: [{ type: String }],
    participantIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Executive' }],
    conflictReason: { type: String, default: 'Scheduling overlap detected' },
    overlaps: [ConflictOverlapSchema],
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'escalated'],
      default: 'open',
    },
    proposedOptions: [ConflictProposalSchema],
    resolutionNotes: { type: String },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Secretary' },
    consultations: [ConflictConsultationSchema],
    history: [ConflictHistorySchema],
  },
  { timestamps: true }
);

module.exports = mongoose.models?.Conflict || mongoose.model('Conflict', ConflictSchema);
