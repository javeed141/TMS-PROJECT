const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    recipientSecretary: { type: mongoose.Schema.Types.ObjectId, ref: 'Secretary', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    channel: {
      type: String,
      enum: ['conflict', 'meeting', 'system'],
      default: 'system',
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'info',
    },
    meeting: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting' },
    conflict: { type: mongoose.Schema.Types.ObjectId, ref: 'Conflict' },
    metadata: { type: Object, default: {} },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

NotificationSchema.virtual('isRead').get(function virtualIsRead() {
  return Boolean(this.readAt);
});

module.exports = mongoose.models?.Notification || mongoose.model('Notification', NotificationSchema);
