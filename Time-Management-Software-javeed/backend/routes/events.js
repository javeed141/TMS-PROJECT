const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/authMiddleware');
const Meeting = require('../schema/EventSchema');
const Executive = require('../schema/ExecutiveSchema');
const Conflict = require('../schema/ConflictSchema');
const { notifySecretariesForExecutives } = require('../services/notificationService');
const { sendMail } = require('../mail/mail');

function intervalsOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

async function buildConflictReport({ execs, start, end }) {
  if (!execs.length) return [];

  const startMs = start.getTime();
  const endMs = end.getTime();

  const execIds = execs.map((ex) => ex._id);
  const execEmails = execs
    .map((ex) => (ex.email ? ex.email.toLowerCase() : null))
    .filter(Boolean);

  const meetingConflicts = await Meeting.find({
    status: { $in: ['pending', 'scheduled', 'conflict'] },
    startTime: { $lt: end },
    endTime: { $gt: start },
    $or: [
      { participants: { $in: execIds } },
      { 'invited.execId': { $in: execIds } },
      { 'invited.email': { $in: execEmails } },
    ],
  })
    .select('title startTime endTime status participants invited project')
    .lean();

  return execs.reduce((acc, execDoc) => {
    const execIdStr = String(execDoc._id);
    const execEmail = execDoc.email?.toLowerCase() || null;

    const taskConflicts = (execDoc.tasks || []).filter((task) => {
      const taskStart = new Date(task.startTime).getTime();
      const taskEnd = new Date(task.endTime || task.startTime).getTime();
      return intervalsOverlap(startMs, endMs, taskStart, taskEnd);
    });

    const meetingHits = meetingConflicts.filter((meeting) => {
      const participates = Array.isArray(meeting.participants)
        ? meeting.participants.map((id) => String(id)).includes(execIdStr)
        : false;

      const invitedMatch = Array.isArray(meeting.invited)
        ? meeting.invited.some((entry) => {
            const entryExec = entry.execId ? String(entry.execId) === execIdStr : false;
            const entryEmail = entry.email ? entry.email.toLowerCase() === execEmail : false;
            return entryExec || entryEmail;
          })
        : false;

      return participates || invitedMatch;
    });

    if (!taskConflicts.length && !meetingHits.length) return acc;

    acc.push({
      executive: execDoc._id,
      executiveEmail: execDoc.email,
      conflicts: [
        ...taskConflicts.map((task) => ({
          type: 'task',
          refId: task._id,
          title: task.title,
          startTime: task.startTime,
          endTime: task.endTime,
          notes: task.description,
          status: task.status || 'scheduled',
        })),
        ...meetingHits.map((meeting) => ({
          type: 'meeting',
          refId: meeting._id,
          title: meeting.title,
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          status: meeting.status,
          notes: meeting.project,
        })),
      ],
    });

    return acc;
  }, []);
}

function normalizeConflictItem(raw, fallbackType = 'task') {
  if (!raw || typeof raw !== 'object') {
    return {
      type: fallbackType,
      refId: null,
      title: 'Busy',
      startTime: null,
      endTime: null,
      notes: null,
      status: null,
    };
  }

  const resolvedType = typeof raw.type === 'string' && raw.type.trim() ? raw.type.trim() : fallbackType;

  const start = raw.startTime ? new Date(raw.startTime) : null;
  const end = raw.endTime ? new Date(raw.endTime) : null;

  return {
    type: resolvedType,
    refId: raw.refId || raw._id || raw.meetingId || null,
    title: raw.title || raw.notes || raw.description || 'Busy',
    startTime: start && !Number.isNaN(start.getTime()) ? start : null,
    endTime: end && !Number.isNaN(end.getTime()) ? end : null,
    notes: raw.notes || raw.description || null,
    status: raw.status || null,
  };
}

// router.post('/create-and-addtasks', auth, async (req, res) => {
//   try {
//     const {
//       title,
//       startTime,
//       endTime,
//       venue,
//       project,
//       participantEmails = [],
//       invited: invitedFromPayload = [],
//       createdBy,
//     } = req.body || {};

//     if (!title || !startTime || !endTime || !Array.isArray(participantEmails) || participantEmails.length === 0) {
//       return res.status(400).json({ msg: 'Missing required fields' });
//     }

//   const creatorId = req.user?.id || (typeof createdBy === 'string' ? createdBy : createdBy?._id);
//   const creatorEmail = req.user?.email ? req.user.email.toLowerCase() : null;
//     if (!creatorId) {
//       return res.status(401).json({ msg: 'Unable to determine meeting creator' });
//     }

//     const parsedStart = new Date(startTime);
//     const parsedEnd = new Date(endTime);
//     if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime())) {
//       return res.status(400).json({ msg: 'Invalid startTime or endTime' });
//     }
//     if (parsedEnd.getTime() <= parsedStart.getTime()) {
//       return res.status(400).json({ msg: 'endTime must be after startTime' });
//     }

//     const normalizedEmails = Array.from(
//       new Set(
//         participantEmails
//           .map((email) => (typeof email === 'string' ? email.trim().toLowerCase() : ''))
//           .filter(Boolean)
//       )
//     );

//     if (!normalizedEmails.length) {
//       return res.status(400).json({ msg: 'No valid participant emails provided' });
//     }

//     const invitedMap = new Map();
//     if (Array.isArray(invitedFromPayload)) {
//       invitedFromPayload.forEach((entry) => {
//         const email = typeof entry?.email === 'string' ? entry.email.trim().toLowerCase() : null;
//         if (!email) return;
//         invitedMap.set(email, {
//           email,
//           execId: entry.execId || null,
//           status: entry.status || 'invited',
//         });
//       });
//     }

//     normalizedEmails.forEach((email) => {
//       if (!invitedMap.has(email)) {
//         invitedMap.set(email, { email, execId: null, status: 'invited' });
//       }
//     });

//     const invited = Array.from(invitedMap.values());

//     const meetingPayload = {
//       title,
//       startTime: parsedStart,
//       endTime: parsedEnd,
//       venue: venue || '',
//       project: project || '',
//       createdBy: creatorId,
//       participants: [],
//       invited,
//       status: 'pending',
//       hasConflict: false,
//     };

//     // Ensure creator is part of the meeting and marked accepted if present in invited list
//     meetingPayload.participants.push(creatorId);
//     meetingPayload.invited = meetingPayload.invited.map((entry) => {
//       if (!entry) return entry;
//       const matchByExec = entry.execId && String(entry.execId) === String(creatorId);
//       const matchByEmail = entry.email && creatorEmail && entry.email === creatorEmail;
//       if (matchByExec || matchByEmail) {
//         return { ...entry, execId: entry.execId || creatorId, status: 'accepted' };
//       }
//       return entry;
//     });

//     const execs = await Executive.find({ email: { $in: normalizedEmails } });

//     if (meetingPayload.invited?.length) {
//       const emailToId = new Map(execs.map((ex) => [ex.email.toLowerCase(), ex._id]));
//       meetingPayload.invited = meetingPayload.invited.map((entry) => {
//         if (!entry) return entry;
//         if (!entry.execId && entry.email && emailToId.has(entry.email)) {
//           return { ...entry, execId: emailToId.get(entry.email) };
//         }
//         return entry;
//       });
//     }

//     const conflictReport = await buildConflictReport({ execs, start: parsedStart, end: parsedEnd });

//     // Conflict path: persist meeting + conflict ticket, skip task creation
//     if (conflictReport.length) {
//       const meetingDoc = await Meeting.create({
//         ...meetingPayload,
//         status: 'conflict',
//         hasConflict: true,
//         conflictStatus: 'open',
//         conflictNotes: 'Conflict requires secretary intervention',
//       });

//       const conflictDoc = await Conflict.create({
//         meeting: meetingDoc._id,
//         requestedBy: creatorId,
//         participantEmails: normalizedEmails,
//         participantIds: execs.map((ex) => ex._id),
//         overlaps: conflictReport,
//         history: [
//           {
//             action: 'conflict_detected',
//             notes: 'Scheduling conflict detected during meeting creation',
//             actor: creatorId,
//             actorRole: 'executive',
//           },
//         ],
//       });

//       const executiveIdsForNotification = new Set(execs.map((ex) => String(ex._id)));
//       executiveIdsForNotification.add(String(creatorId));

//       const participantNames = execs
//         .map((ex) => ex.name || ex.email)
//         .filter(Boolean)
//         .join(', ');

//       await notifySecretariesForExecutives({
//         executiveIds: Array.from(executiveIdsForNotification),
//         title: `Conflict detected: ${meetingPayload.title}`,
//         message: `No common slot was available for ${meetingPayload.title}${participantNames ? ` (${participantNames})` : ''}. Please review and coordinate a new time.`,
//         channel: 'conflict',
//         severity: 'warning',
//         meetingId: meetingDoc._id,
//         conflictId: conflictDoc._id,
//         metadata: {
//           meetingTitle: meetingPayload.title,
//           startTime: parsedStart,
//           endTime: parsedEnd,
//           participantEmails: normalizedEmails,
//         },
//         emailSubject: `Action required: meeting conflict for ${meetingPayload.title}`,
//         emailText: `The meeting "${meetingPayload.title}" could not be scheduled automatically.\nParticipants: ${participantNames || normalizedEmails.join(', ')}.\nPlease review the conflict queue to coordinate a new slot.`,
//       }).catch((err) => console.error('notifySecretariesForExecutives error:', err));

//       const populatedMeeting = await Meeting.findById(meetingDoc._id)
//         .populate('participants', 'name email department')
//         .populate('createdBy', 'name email')
//         .lean();

//       return res.status(202).json({
//         msg: 'Scheduling conflict detected. Secretary has been notified.',
//         meeting: populatedMeeting,
//         conflict: conflictDoc,
//       });
//     }

//     // No conflicts: finalize meeting and tasks
//     const meetingDoc = await Meeting.create(meetingPayload);

//     const execByEmail = {};
//     execs.forEach((ex) => {
//       execByEmail[ex.email.toLowerCase()] = ex;
//     });

//     const updatedExecs = [];
//     for (const execDoc of execs) {
//       const hasTask = Array.isArray(execDoc.tasks)
//         ? execDoc.tasks.some((task) => String(task.meetingId) === String(meetingDoc._id))
//         : false;

//       if (!hasTask) {
//         execDoc.tasks.push({
//           title: meetingDoc.title,
//           startTime: meetingDoc.startTime,
//           endTime: meetingDoc.endTime,
//           description: `Auto-added from meeting ${meetingDoc._id}`,
//           meetingId: meetingDoc._id,
//         });
//       }

//       await execDoc.save();

//       if (!meetingDoc.participants.map(String).includes(String(execDoc._id))) {
//         meetingDoc.participants.push(execDoc._id);
//       }

//       const invitedIndex = meetingDoc.invited.findIndex(
//         (entry) => entry?.email && entry.email.toLowerCase() === execDoc.email.toLowerCase()
//       );
//       if (invitedIndex !== -1) {
//         meetingDoc.invited[invitedIndex].execId = execDoc._id;
//       }

//       updatedExecs.push({ id: execDoc._id, name: execDoc.name, email: execDoc.email });
//     }

//     await meetingDoc.save();

//     const populatedMeeting = await Meeting.findById(meetingDoc._id)
//       .populate('participants', 'name email department tasks')
//       .populate('createdBy', 'name email')
//       .lean();

//     // Send notification emails to all participants when meeting is scheduled
//     try {
//       const participantEmails = new Set();

//       // include populated participants
//       if (Array.isArray(populatedMeeting.participants)) {
//         populatedMeeting.participants.forEach((p) => {
//           if (p && p.email) participantEmails.add(String(p.email).toLowerCase());
//         });
//       }

//       // include invited subdocs with emails
//       if (Array.isArray(meetingDoc.invited)) {
//         meetingDoc.invited.forEach((inv) => {
//           if (inv && inv.email) participantEmails.add(String(inv.email).toLowerCase());
//         });
//       }

//       // remove empty
//       const recipients = Array.from(participantEmails).filter(Boolean);

//       if (recipients.length) {
//         const subject = `Scheduled: ${meetingDoc.title}`;
//         const startStr = new Date(meetingDoc.startTime).toLocaleString();
//         const endStr = new Date(meetingDoc.endTime).toLocaleString();
//         const organizer = (populatedMeeting && populatedMeeting.createdBy && (populatedMeeting.createdBy.name || populatedMeeting.createdBy.email)) || '';
//         const text = `The meeting "${meetingDoc.title}" has been scheduled for ${startStr} — ${endStr} at ${meetingDoc.venue || 'N/A'}.

// Organizer: ${organizer}

// This meeting has been added to your calendar.`;

//         // send separately to each recipient so addresses are not exposed
//         const results = await Promise.allSettled(recipients.map((to) => sendMail({ to, subject, text })));
//         const failed = results.filter((r) => r.status === 'rejected');
//         if (failed.length) console.warn('Some schedule emails failed to send', failed.map((f) => (f.reason && f.reason.message) || f));
//       }
//     } catch (mailErr) {
//       console.error('Error sending scheduled emails:', mailErr);
//     }

//     const notFoundEmails = normalizedEmails.filter((email) => !execByEmail[email]);

//     return res.status(201).json({
//       meeting: populatedMeeting,
//       addedTasksTo: updatedExecs,
//       notFoundEmails,
//     });
//   } catch (err) {
//     console.error('create-and-addtasks error:', err);
//     return res.status(500).json({ msg: 'Server error', error: err.message });
//   }
// });


//cancel 
// POST /api/meetings/:id/cancel
// backend/routes/meetings.js (or events.js) — replace existing POST /:id/cancel handler with this
// backend/routes/meetings.js (or events.js)
// POST /api/meetings/:id/cancel
// at top of file (make sure this is present)

// Replace your route with this
// routes/events.js (or wherever your route is)
// make sure this require is near top of the file:

 // <-- require the mail helper
// keep auth, Executive, Meeting, Conflict, notifySecretariesForExecutives, etc.

router.post('/create-and-addtasks', auth, async (req, res) => {
  try {
    const {
      title,
      startTime,
      endTime,
      venue,
      project,
      participantEmails = [],
      invited: invitedFromPayload = [],
      createdBy,
    } = req.body || {};

    if (!title || !startTime || !endTime || !Array.isArray(participantEmails) || participantEmails.length === 0) {
      return res.status(400).json({ msg: 'Missing required fields' });
    }

    const creatorId = req.user?.id || (typeof createdBy === 'string' ? createdBy : createdBy?._id);
    const creatorEmail = req.user?.email ? req.user.email.toLowerCase() : null;
    if (!creatorId) {
      return res.status(401).json({ msg: 'Unable to determine meeting creator' });
    }

    const parsedStart = new Date(startTime);
    const parsedEnd = new Date(endTime);
    if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime())) {
      return res.status(400).json({ msg: 'Invalid startTime or endTime' });
    }
    if (parsedEnd.getTime() <= parsedStart.getTime()) {
      return res.status(400).json({ msg: 'endTime must be after startTime' });
    }

    const normalizedEmails = Array.from(
      new Set(
        participantEmails
          .map((email) => (typeof email === 'string' ? email.trim().toLowerCase() : ''))
          .filter(Boolean)
      )
    );

    if (!normalizedEmails.length) {
      return res.status(400).json({ msg: 'No valid participant emails provided' });
    }

    const invitedMap = new Map();
    if (Array.isArray(invitedFromPayload)) {
      invitedFromPayload.forEach((entry) => {
        const email = typeof entry?.email === 'string' ? entry.email.trim().toLowerCase() : null;
        if (!email) return;
        invitedMap.set(email, {
          email,
          execId: entry.execId || null,
          status: entry.status || 'invited',
        });
      });
    }

    normalizedEmails.forEach((email) => {
      if (!invitedMap.has(email)) {
        invitedMap.set(email, { email, execId: null, status: 'invited' });
      }
    });

    const invited = Array.from(invitedMap.values());

    const meetingPayload = {
      title,
      startTime: parsedStart,
      endTime: parsedEnd,
      venue: venue || '',
      project: project || '',
      createdBy: creatorId,
      participants: [],
      invited,
      status: 'pending',
      hasConflict: false,
      notified: false, // optional flag to mark email sent later
    };

    // Ensure creator is part of the meeting and marked accepted if present in invited list
    meetingPayload.participants.push(creatorId);
    meetingPayload.invited = meetingPayload.invited.map((entry) => {
      if (!entry) return entry;
      const matchByExec = entry.execId && String(entry.execId) === String(creatorId);
      const matchByEmail = entry.email && creatorEmail && entry.email === creatorEmail;
      if (matchByExec || matchByEmail) {
        return { ...entry, execId: entry.execId || creatorId, status: 'accepted' };
      }
      return entry;
    });

    const execs = await Executive.find({ email: { $in: normalizedEmails } });

    if (meetingPayload.invited?.length) {
      const emailToId = new Map(execs.map((ex) => [ex.email.toLowerCase(), ex._id]));
      meetingPayload.invited = meetingPayload.invited.map((entry) => {
        if (!entry) return entry;
        if (!entry.execId && entry.email && emailToId.has(entry.email)) {
          return { ...entry, execId: emailToId.get(entry.email) };
        }
        return entry;
      });
    }

    const conflictReport = await buildConflictReport({ execs, start: parsedStart, end: parsedEnd });

    // Conflict path: persist meeting + conflict ticket, skip task creation
    if (conflictReport.length) {
      const meetingDoc = await Meeting.create({
        ...meetingPayload,
        status: 'conflict',
        hasConflict: true,
        conflictStatus: 'open',
        conflictNotes: 'Conflict requires secretary intervention',
      });

      const conflictDoc = await Conflict.create({
        meeting: meetingDoc._id,
        requestedBy: creatorId,
        participantEmails: normalizedEmails,
        participantIds: execs.map((ex) => ex._id),
        overlaps: conflictReport,
        history: [
          {
            action: 'conflict_detected',
            notes: 'Scheduling conflict detected during meeting creation',
            actor: creatorId,
            actorRole: 'executive',
          },
        ],
      });

      const executiveIdsForNotification = new Set(execs.map((ex) => String(ex._id)));
      executiveIdsForNotification.add(String(creatorId));

      const participantNames = execs
        .map((ex) => ex.name || ex.email)
        .filter(Boolean)
        .join(', ');

      await notifySecretariesForExecutives({
        executiveIds: Array.from(executiveIdsForNotification),
        title: `Conflict detected: ${meetingPayload.title}`,
        message: `No common slot was available for ${meetingPayload.title}${participantNames ? ` (${participantNames})` : ''}. Please review and coordinate a new time.`,
        channel: 'conflict',
        severity: 'warning',
        meetingId: meetingDoc._id,
        conflictId: conflictDoc._id,
        metadata: {
          meetingTitle: meetingPayload.title,
          startTime: parsedStart,
          endTime: parsedEnd,
          participantEmails: normalizedEmails,
        },
        emailSubject: `Action required: meeting conflict for ${meetingPayload.title}`,
        emailText: `The meeting "${meetingPayload.title}" could not be scheduled automatically.\nParticipants: ${participantNames || normalizedEmails.join(', ')}.\nPlease review the conflict queue to coordinate a new slot.`,
      }).catch((err) => console.error('notifySecretariesForExecutives error:', err));

      // Send emails to participants notifying of the conflict (non-blocking)
      (async () => {
        try {
          const conflictSubject = `Scheduling conflict: ${meetingPayload.title}`;
          const conflictText = `We could not automatically find a common time slot for "${meetingPayload.title}" scheduled for ${parsedStart.toISOString()} - ${parsedEnd.toISOString()}.
Secretaries have been notified to coordinate a new time.`;
          // send only to valid normalized emails
          await sendMail({
            to: normalizedEmails,
            subject: conflictSubject,
            text: conflictText,
          });
        } catch (mailErr) {
          console.error('Error sending conflict email to participants:', mailErr);
        }
      })();

      const populatedMeeting = await Meeting.findById(meetingDoc._1)
        .populate('participants', 'name email department')
        .populate('createdBy', 'name email')
        .lean();

      return res.status(202).json({
        msg: 'Scheduling conflict detected. Secretary has been notified.',
        meeting: populatedMeeting,
        conflict: conflictDoc,
      });
    }

    // No conflicts: finalize meeting and tasks
    const meetingDoc = await Meeting.create(meetingPayload);

    const execByEmail = {};
    execs.forEach((ex) => {
      execByEmail[ex.email.toLowerCase()] = ex;
    });

    const updatedExecs = [];
    for (const execDoc of execs) {
      const hasTask = Array.isArray(execDoc.tasks)
        ? execDoc.tasks.some((task) => String(task.meetingId) === String(meetingDoc._id))
        : false;

      if (!hasTask) {
        execDoc.tasks.push({
          title: meetingDoc.title,
          startTime: meetingDoc.startTime,
          endTime: meetingDoc.endTime,
          description: `Auto-added from meeting ${meetingDoc._id}`,
          meetingId: meetingDoc._id,
        });
      }

      await execDoc.save();

      if (!meetingDoc.participants.map(String).includes(String(execDoc._id))) {
        meetingDoc.participants.push(execDoc._id);
      }

      const invitedIndex = meetingDoc.invited.findIndex(
        (entry) => entry?.email && entry.email.toLowerCase() === execDoc.email.toLowerCase()
      );
      if (invitedIndex !== -1) {
        meetingDoc.invited[invitedIndex].execId = execDoc._id;
      }

      updatedExecs.push({ id: execDoc._id, name: execDoc.name, email: execDoc.email });
    }

    await meetingDoc.save();

    // Send meeting notification emails (non-blocking)
   (async () => {
  try {
    const meetingDate = new Date(meetingDoc.startTime).toLocaleDateString();
    const meetingStart = new Date(meetingDoc.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const meetingEnd = new Date(meetingDoc.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const participantList = normalizedEmails.join(', ');

    const subject = `📅 Meeting Scheduled: ${meetingDoc.title} — ${meetingDate} ${meetingStart}`;

    const text =
`Dear Participant,

You are invited to the meeting:

📝 Title: ${meetingDoc.title}
📅 Date: ${meetingDate}
⏰ Time: ${meetingStart} – ${meetingEnd}
📍 Venue: ${meetingDoc.venue || "TBD"}
📂 Project: ${meetingDoc.project || "N/A"}

Please open the TMS app to view full details or RSVP.

Thank you,
TMS – Meeting Scheduler`;

    await sendMail({
      to: normalizedEmails,
      subject,
      text,
    });

    meetingDoc.notified = true;
    await meetingDoc.save();
  } catch (mailErr) {
    console.error("Error sending meeting notification emails:", mailErr);
  }
})();


    const populatedMeeting = await Meeting.findById(meetingDoc._id)
      .populate('participants', 'name email department tasks')
      .populate('createdBy', 'name email')
      .lean();

    const notFoundEmails = normalizedEmails.filter((email) => !execByEmail[email]);

    return res.status(201).json({
      meeting: populatedMeeting,
      addedTasksTo: updatedExecs,
      notFoundEmails,
      emailsSent: !!meetingDoc.notified, // best-effort status
    });
  } catch (err) {
    console.error('create-and-addtasks error:', err);
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
});




// router.post('/:id/cancel', auth, async (req, res) => {
//   try {
//     const meetingId = req.params.id;
//     const userId = req.user?.id;
//     const userEmail = (req.user?.email || '').toLowerCase();

//     const meeting = await Meeting.findById(meetingId);
//     if (!meeting) return res.status(404).json({ msg: 'Meeting not found' });

//     // Only creator can cancel
//     if (!meeting.createdBy || String(meeting.createdBy) !== String(userId)) {
//       return res.status(403).json({ msg: 'Only the meeting creator may cancel the meeting' });
//     }

//     // If already cancelled — return populated meeting
//     if (meeting.status === 'cancelled') {
//       const populatedAgain = await Meeting.findById(meeting._id)
//         .populate('participants', 'name email')
//         .populate('createdBy', 'name email')
//         .lean();
//       return res.json({ meeting: populatedAgain, msg: 'Already cancelled' });
//     }

//     // Mark meeting cancelled + metadata
//     meeting.status = 'cancelled';
//     meeting.cancelledAt = new Date();
//     meeting.cancelledBy = userId;
//     meeting.cancelledByEmail = userEmail;

//     // Update invited subdocs in-place so Mongoose validates & persists
//     if (Array.isArray(meeting.invited)) {
//       meeting.invited.forEach(inv => {
//         inv.status = 'cancelled';
//       });
//     }

//     await meeting.save();

//     // OPTIONAL: update Executive.tasks entries tied to this meeting (if you store meetingId in tasks)
//     try {
//       const execIds = new Set();

//       if (Array.isArray(meeting.invited)) {
//         meeting.invited.forEach(inv => { if (inv.execId) execIds.add(String(inv.execId)); });
//       }
//       if (Array.isArray(meeting.participants)) {
//         meeting.participants.forEach(p => { if (p) execIds.add(String(p)); });
//       }

//       if (execIds.size > 0) {
//         const execArray = Array.from(execIds);
//         const execs = await Executive.find({ _id: { $in: execArray } });

//         for (const ex of execs) {
//           let changed = false;
//           if (Array.isArray(ex.tasks)) {
//             ex.tasks = ex.tasks.map(task => {
//               if (String(task.meetingId) === String(meeting._id)) {
//                 changed = true;
//                 return { ...task, status: 'cancelled', cancelledAt: new Date(), cancelledBy: userId };
//               }
//               return task;
//             });
//           }
//           if (changed) await ex.save();
//         }
//       }
//     } catch (errTasks) {
//       console.error('Error updating Executive.tasks after meeting cancel:', errTasks);
//     }

//     const populated = await Meeting.findById(meeting._id)
//       .populate('participants', 'name email')
//       .populate('createdBy', 'name email')
//       .lean();

//     return res.json({ msg: 'Meeting cancelled', meeting: populated });
//   } catch (err) {
//     console.error('cancel meeting error', err);
//     return res.status(500).json({ error: err.message });
//   }
// });
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const meetingId = req.params.id;
    const userId = req.user?.id;
    const userEmail = (req.user?.email || '').toLowerCase();
    const userName = req.user?.name || req.user?.email || 'Organizer';

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) return res.status(404).json({ msg: 'Meeting not found' });

    // Only creator can cancel
    if (!meeting.createdBy || String(meeting.createdBy) !== String(userId)) {
      return res.status(403).json({ msg: 'Only the meeting creator may cancel the meeting' });
    }

    // If already cancelled — return populated meeting
    if (meeting.status === 'cancelled') {
      const populatedAgain = await Meeting.findById(meeting._id)
        .populate('participants', 'name email')
        .populate('createdBy', 'name email')
        .lean();
      return res.json({ meeting: populatedAgain, msg: 'Already cancelled' });
    }

    // Mark meeting cancelled + metadata
    meeting.status = 'cancelled';
    meeting.cancelledAt = new Date();
    meeting.cancelledBy = userId;
    meeting.cancelledByEmail = userEmail;

    if (Array.isArray(meeting.invited)) {
      meeting.invited.forEach(inv => { inv.status = 'cancelled'; });
    }

    await meeting.save();

    // OPTIONAL: update Executive.tasks entries tied to this meeting
    try {
      const execIds = new Set();
      if (Array.isArray(meeting.invited)) meeting.invited.forEach(inv => { if (inv.execId) execIds.add(String(inv.execId)); });
      if (Array.isArray(meeting.participants)) meeting.participants.forEach(p => { if (p) execIds.add(String(p)); });

      if (execIds.size > 0) {
        const execArray = Array.from(execIds);
        const execs = await Executive.find({ _id: { $in: execArray } });
        for (const ex of execs) {
          let changed = false;
          if (Array.isArray(ex.tasks)) {
            ex.tasks = ex.tasks.map(task => {
              if (String(task.meetingId) === String(meeting._id)) {
                changed = true;
                return { ...task, status: 'cancelled', cancelledAt: new Date(), cancelledBy: userId };
              }
              return task;
            });
          }
          if (changed) await ex.save();
        }
      }
    } catch (errTasks) {
      console.error('Error updating Executive.tasks after meeting cancel:', errTasks);
    }

    // Build recipient list: invited emails + participants' emails + creator
    const invitedEmailsFromPayload = Array.isArray(meeting.invited)
      ? meeting.invited.map(i => (i && i.email ? i.email.toLowerCase() : null)).filter(Boolean)
      : [];

    // participants may be ObjectIds; try to fetch emails for participants in DB
    let participantEmailsFromDocs = [];
    if (Array.isArray(meeting.participants) && meeting.participants.length) {
      try {
        const participantDocs = await Executive.find({ _id: { $in: meeting.participants } }, 'email');
        participantEmailsFromDocs = participantDocs.map(p => p.email && p.email.toLowerCase()).filter(Boolean);
      } catch (pErr) {
        console.error('Error fetching participant emails for cancellation:', pErr);
      }
    }

    const creatorEmail = meeting.createdByEmail || userEmail;
    const allEmailsSet = new Set([...invitedEmailsFromPayload, ...participantEmailsFromDocs]);
    if (creatorEmail) allEmailsSet.add(creatorEmail);
    const allEmails = Array.from(allEmailsSet).filter(Boolean);

    // Send cancellation email (best-effort)
    if (allEmails.length) {
     const subject = `❗ Meeting Cancelled: ${meeting.title} — ${meetingDate} ${meetingStart}`;

const text =
`Dear Participant,

The following meeting has been cancelled:

📝 Title: ${meeting.title}
📅 Date: ${meetingDate}
⏰ Time: ${meetingStart} – ${meetingEnd}
📍 Venue: ${meeting.venue || "TBD"}
❗ Cancelled By: ${userName}
💬 Reason: ${meeting.cancellationReason || "Not Provided"}

Please open the TMS app for more details.

Thank you,
TMS – Meeting Scheduler`;

      try {
        await sendMail({ to: allEmails, subject, text });
      } catch (mailErr) {
        console.error('Error sending cancellation emails:', mailErr);
        // do not undo cancellation because of email failure
      }
    }

    const populated = await Meeting.findById(meeting._id)
      .populate('participants', 'name email')
      .populate('createdBy', 'name email')
      .lean();

    return res.json({ msg: 'Meeting cancelled', meeting: populated });
  } catch (err) {
    console.error('cancel meeting error', err);
    return res.status(500).json({ error: err.message });
  }
});


router.post('/conflicts/manual', auth, async (req, res) => {
  try {
    const {
      title,
      startTime,
      endTime,
      participantEmails = [],
      venue = '',
      project = '',
      notes = '',
      overlaps = [],
    } = req.body || {};

    if (!title || !startTime || !endTime) {
      return res.status(400).json({ msg: 'title, startTime, and endTime are required' });
    }

    const parsedStart = new Date(startTime);
    const parsedEnd = new Date(endTime);
    if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime())) {
      return res.status(400).json({ msg: 'Invalid startTime or endTime' });
    }
    if (parsedEnd.getTime() <= parsedStart.getTime()) {
      return res.status(400).json({ msg: 'endTime must be after startTime' });
    }

    const normalizedEmails = Array.from(
      new Set(
        (Array.isArray(participantEmails) ? participantEmails : [])
          .map((email) => (typeof email === 'string' ? email.trim().toLowerCase() : ''))
          .filter(Boolean)
      )
    );

    const creatorId = req.user?.id || null;
    const creatorEmail = typeof req.user?.email === 'string' ? req.user.email.toLowerCase() : null;
    if (creatorEmail && !normalizedEmails.includes(creatorEmail)) {
      normalizedEmails.push(creatorEmail);
    }

    if (!normalizedEmails.length) {
      return res.status(400).json({ msg: 'At least one participant email is required' });
    }

    const execs = await Executive.find({ email: { $in: normalizedEmails } }).lean();

    const conflictReport = await buildConflictReport({ execs, start: parsedStart, end: parsedEnd });

    const overlapsMap = new Map();

    const addOverlap = ({ execDoc, email, conflicts }) => {
      const resolvedEmail = email || (execDoc?.email ? execDoc.email.toLowerCase() : null);
      const key = execDoc ? String(execDoc._id) : resolvedEmail;
      if (!key) return;

      if (!overlapsMap.has(key)) {
        overlapsMap.set(key, {
          executive: execDoc ? execDoc._id : undefined,
          executiveEmail: resolvedEmail,
          conflicts: [],
        });
      }

      const target = overlapsMap.get(key);
      (conflicts || []).forEach((item) => {
        const prepared = normalizeConflictItem(item, item?.type || 'task');
        if (prepared) {
          target.conflicts.push(prepared);
        }
      });
    };

    conflictReport.forEach((entry) => {
      const execDoc = execs.find((ex) => String(ex._id) === String(entry.executive));
      addOverlap({
        execDoc,
        email: entry.executiveEmail || (execDoc?.email ? execDoc.email.toLowerCase() : null),
        conflicts: entry.conflicts,
      });
    });

    const providedOverlaps = Array.isArray(overlaps) ? overlaps : [];
    providedOverlaps.forEach((entry) => {
      const emailCandidate =
        typeof entry?.executiveEmail === 'string'
          ? entry.executiveEmail.trim().toLowerCase()
          : typeof entry?.email === 'string'
          ? entry.email.trim().toLowerCase()
          : null;
      const execDoc = emailCandidate
        ? execs.find((ex) => ex.email && ex.email.toLowerCase() === emailCandidate)
        : null;
      addOverlap({
        execDoc,
        email: emailCandidate,
        conflicts: Array.isArray(entry?.conflicts) ? entry.conflicts : [],
      });
    });

    const overlapsPayload = Array.from(overlapsMap.values())
      .map((entry) => ({
        executive: entry.executive,
        executiveEmail: entry.executiveEmail,
        conflicts: entry.conflicts,
      }))
      .filter((entry) => entry.conflicts.length > 0);

    if (!overlapsPayload.length) {
      return res.status(409).json({ msg: 'No conflicts detected for the provided time range.' });
    }

    const invited = normalizedEmails.map((email) => {
      const execDoc = execs.find((ex) => ex.email && ex.email.toLowerCase() === email);
      return {
        email,
        execId: execDoc ? execDoc._id : null,
        status: 'invited',
      };
    });

    const meetingDoc = await Meeting.create({
      title,
      startTime: parsedStart,
      endTime: parsedEnd,
      venue,
      project,
      createdBy: creatorId,
      participants: creatorId ? [creatorId] : [],
      invited,
      status: 'conflict',
      hasConflict: true,
      conflictStatus: 'open',
      conflictNotes: notes || 'Awaiting secretary coordination',
    });

    const conflictDoc = await Conflict.create({
      meeting: meetingDoc._id,
      requestedBy: creatorId,
      participantEmails: normalizedEmails,
      participantIds: execs.map((ex) => ex._id),
      conflictReason: notes || 'Scheduling overlap reported by executive',
      overlaps: overlapsPayload,
      history: [
        {
          action: 'manual_conflict_logged',
          notes: notes || 'Conflict logged via executive request',
          actor: creatorId,
          actorRole: 'executive',
        },
      ],
    });

    const executiveIdsForNotification = new Set(execs.map((ex) => String(ex._id)));
    if (creatorId) executiveIdsForNotification.add(String(creatorId));

    const participantNames = execs
      .map((ex) => ex.name || ex.email)
      .filter(Boolean)
      .join(', ');

    await notifySecretariesForExecutives({
      executiveIds: Array.from(executiveIdsForNotification),
      title: `Manual conflict: ${title}`,
      message: `A manual conflict has been logged for ${title}. Please review the conflict queue.`,
      channel: 'conflict',
      severity: 'warning',
      meetingId: meetingDoc._id,
      conflictId: conflictDoc._id,
      metadata: {
        meetingTitle: title,
        startTime: parsedStart,
        endTime: parsedEnd,
        participantEmails: normalizedEmails,
      },
      emailSubject: `Manual conflict logged for ${title}`,
      emailText: `The meeting "${title}" could not be scheduled automatically. Participants: ${
        participantNames || normalizedEmails.join(', ')
      }.`,
    }).catch((err) => console.error('notifySecretariesForExecutives manual conflict error:', err));

    const populatedConflict = await Conflict.findById(conflictDoc._id)
      .populate('meeting', 'title startTime endTime status conflictStatus venue project')
      .populate('requestedBy', 'name email')
      .populate('overlaps.executive', 'name email')
      .lean();

    const populatedMeeting = await Meeting.findById(meetingDoc._id)
      .populate('participants', 'name email')
      .lean();

    return res.status(201).json({
      msg: 'Conflict logged and secretary notified.',
      meeting: populatedMeeting,
      conflict: populatedConflict,
    });
  } catch (err) {
    console.error('POST /api/events/conflicts/manual error:', err);
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
});




  // backend/routes/meetings.js (or events.js) - update my-day route
router.get('/my-day', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const userEmail = (req.user?.email || '').toLowerCase();

    if (!userId && !userEmail) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }

    // Parse and normalize the target date
    const dateStr = req.query.date || new Date().toISOString().slice(0, 10);
    const start = new Date(dateStr);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);

    // ✅ Proper conditions — include:
    //  1. participant in meeting
    //  2. invited by execId or email
    //  3. meeting created by this user
    const orConditions = [
      { participants: userId },
      { 'invited.execId': userId },
      { createdBy: userId }, // FIX: match ObjectId reference instead of createdBy.id
    ];

    if (userEmail) {
      orConditions.push({ 'invited.email': userEmail });
      // createdBy is an ObjectId ref, not an email field
    }

    const query = {
      startTime: { $lt: end },
      endTime: { $gt: start },
      $or: orConditions,
    };

    // ✅ Populate both participants and creator so frontend sees all names/emails
    const meetings = await Meeting.find(query)
      .populate('participants', 'name email')
      .populate('createdBy', 'name email') // added this
      .sort('startTime')
      .lean();

    return res.json({ meetings });
  } catch (err) {
    console.error('my-day route error:', err);
    return res.status(500).json({ error: err.message });
  }
});




const ALLOWED = new Set(['accepted', 'declined', 'tentative']);

router.post('/rsvp', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ msg: 'Unauthorized' });

    const { meetingId, response } = req.body;
    if (!meetingId || !response) return res.status(400).json({ msg: 'meetingId and response required' });

    const normalized = String(response).trim().toLowerCase();
    if (!ALLOWED.has(normalized)) {
      return res.status(400).json({ msg: 'Invalid response. Allowed: accepted, declined, tentative' });
    }

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) return res.status(404).json({ msg: 'Meeting not found' });

// BLOCK RSVPs for cancelled meetings
if (meeting.status === 'cancelled') {
  return res.status(400).json({ msg: 'Meeting has been cancelled by the creator; RSVPs are closed.' });
}
    if (!meeting) return res.status(404).json({ msg: 'Meeting not found' });

    const exec = await Executive.findById(userId).select('email name');
    if (!exec) return res.status(404).json({ msg: 'Executive not found' });

    // find invited entry by execId or email
    let invitedEntry = meeting.invited.find(i => i.execId && String(i.execId) === String(userId));
    if (!invitedEntry) {
      invitedEntry = meeting.invited.find(i => i.email && i.email.toLowerCase() === exec.email.toLowerCase());
      if (invitedEntry) invitedEntry.execId = exec._id;
    }

    if (!invitedEntry) {
      // not explicitly invited earlier — add as invited with response
      meeting.invited.push({
        email: exec.email,
        execId: exec._id,
        status: normalized
      });
    } else {
      invitedEntry.status = normalized;
    }

    // manage participants
    if (normalized === 'accepted') {
      if (!meeting.participants.map(String).includes(String(userId))) {
        meeting.participants.push(userId);
      }
    } else if (normalized === 'declined') {
      meeting.participants = meeting.participants.filter(id => String(id) !== String(userId));
    }
    // tentative -> do not modify participants

    // --- key: update meeting.status based on invited statuses ---
    // If there is at least one invited person and ALL invited entries are 'accepted', mark scheduled.
    // Otherwise keep as 'pending' (we do NOT auto-set to 'cancelled' here).
    const invitedList = Array.isArray(meeting.invited) ? meeting.invited : [];
    if (invitedList.length > 0 && invitedList.every(i => i.status === 'accepted')) {
      meeting.status = 'scheduled';
    } else {
      meeting.status = 'pending';
    }

    await meeting.save();

    const updatedMeeting = await Meeting.findById(meeting._id)
      .populate('participants', 'name email')
      .populate('createdBy', 'name email')
      .lean();

    return res.json({ msg: 'RSVP updated', meeting: updatedMeeting });
  } catch (err) {
    console.error('RSVP error:', err);
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
});




//status changing function by creator only 
// POST /api/meetings/:id/complete
router.post('/:id/complete', auth, async (req, res) => {
  try {
    const meetingId = req.params.id;
    const userId = req.user?.id;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) return res.status(404).json({ msg: 'Meeting not found' });

    // Only creator can mark completed
    if (!meeting.createdBy || String(meeting.createdBy) !== String(userId)) {
      return res.status(403).json({ msg: 'Only the meeting creator may mark it completed' });
    }

    // Must be past endTime
    if (meeting.endTime && new Date(meeting.endTime).getTime() > Date.now()) {
      return res.status(400).json({ msg: 'Meeting end time not reached yet' });
    }

    meeting.status = 'completed';
    meeting.completedAt = new Date();
    await meeting.save();

    const populated = await Meeting.findById(meeting._id)
      .populate('participants', 'name email')
      .populate('createdBy', 'name email')
      .lean();

    return res.json({ meeting: populated });
  } catch (err) {
    console.error('complete meeting error', err);
    return res.status(500).json({ error: err.message });
  }
});



module.exports = router;
