const mongoose = require('mongoose');
const Notification = require('../schema/NotificationSchema');
const Secretary = require('../schema/SecretarySchema');
const { sendMail } = require('../utils/mailer');

function toObjectIds(values = []) {
  return values
    .map((value) => {
      try {
        return new mongoose.Types.ObjectId(value);
      } catch (err) {
        return null;
      }
    })
    .filter(Boolean);
}

async function dispatchSecretaryNotifications(options = {}) {
  const {
    secretaryIds,
    title,
    message,
    channel = 'system',
    severity = 'info',
    meetingId,
    conflictId,
    metadata = {},
    emailSubject,
    emailText,
    emailHtml,
    skipEmail = false,
  } = options;

  if (!Array.isArray(secretaryIds) || !secretaryIds.length) {
    return { inserted: 0 };
  }

  if (!title || !message) {
    throw new Error('Notification requires title and message');
  }

  const ids = toObjectIds(secretaryIds);
  if (!ids.length) {
    return { inserted: 0 };
  }

  const secretaries = await Secretary.find({ _id: { $in: ids } })
    .select('_id name email')
    .lean();

  if (!secretaries.length) {
    return { inserted: 0 };
  }

  const docs = secretaries.map((secretary) => ({
    recipientSecretary: secretary._id,
    title,
    message,
    channel,
    severity,
    meeting: meetingId || null,
    conflict: conflictId || null,
    metadata,
  }));

  await Notification.insertMany(docs, { ordered: false });

  if (!skipEmail) {
    const recipients = secretaries.map((secretary) => secretary.email).filter(Boolean);
    if (recipients.length) {
      await sendMail({
        to: recipients,
        subject: emailSubject || title,
        text: emailText || message,
        html:
          emailHtml ||
          `<p>${message}</p>${meetingId ? `<p><strong>Meeting ID:</strong> ${meetingId}</p>` : ''}`,
      });
    }
  }

  return { inserted: docs.length };
}

async function notifySecretariesForExecutives(options = {}) {
  const { executiveIds, ...rest } = options;
  if (!Array.isArray(executiveIds) || !executiveIds.length) {
    return { inserted: 0 };
  }

  const execIds = toObjectIds(executiveIds);
  if (!execIds.length) {
    return { inserted: 0 };
  }

  const secretaryDocs = await Secretary.find({ assignedExecutives: { $in: execIds } })
    .select('_id')
    .lean();

  if (!secretaryDocs.length) {
    return { inserted: 0 };
  }

  const secretaryIds = secretaryDocs.map((doc) => doc._id);
  return dispatchSecretaryNotifications({ secretaryIds, ...rest });
}

module.exports = { dispatchSecretaryNotifications, notifySecretariesForExecutives };
