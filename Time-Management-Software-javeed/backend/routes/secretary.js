// routes/secretary.js (CommonJS)
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const Secretary = require('../schema/SecretarySchema');
const Meeting = require('../schema/EventSchema');
const Conflict = require('../schema/ConflictSchema');
const Executive = require('../schema/ExecutiveSchema');
const Notification = require('../schema/NotificationSchema');
const auth = require('../middleware/authMiddleware');

console.log('Secretary imported:', typeof Secretary === 'function' ? 'Model OK' : Secretary);

function requireSecretary(req, res, next) {
  if (req.user?.role !== 'secretary') {
    return res.status(403).json({ msg: 'Secretary credentials required' });
  }
  return next();
}

async function populateConflict(conflictId) {
  return Conflict.findById(conflictId)
    .populate('meeting', 'title startTime endTime status project hasConflict conflictStatus participants invited createdBy venue')
    .populate('requestedBy', 'name email department')
    .populate('overlaps.executive', 'name email department')
    .populate('proposedOptions.createdBy', 'name email')
    .populate('resolvedBy', 'name email')
    .populate('consultations.executive', 'name email department')
    .populate('consultations.recordedBy', 'name email')
    .lean();
}

function normaliseRange(range, customStart, customEnd) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);

  switch ((range || '').toLowerCase()) {
    case 'today':
      end.setDate(start.getDate() + 1);
      break;
    case 'this-week': {
      const day = start.getDay();
      const diff = (day === 0 ? -6 : 1) - day; // move to Monday
      start.setDate(start.getDate() + diff);
      end.setTime(start.getTime());
      end.setDate(start.getDate() + 7);
      break;
    }
    case 'last-week': {
      const day = start.getDay();
      const diff = (day === 0 ? -6 : 1) - day;
      start.setDate(start.getDate() + diff - 7);
      end.setTime(start.getTime());
      end.setDate(start.getDate() + 7);
      break;
    }
    case 'this-quarter': {
      const month = start.getMonth();
      const quarterStartMonth = Math.floor(month / 3) * 3;
      start.setMonth(quarterStartMonth, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(quarterStartMonth + 3, 1);
      end.setHours(0, 0, 0, 0);
      break;
    }
    case 'last-month': {
      start.setDate(1);
      start.setMonth(start.getMonth() - 1);
      end.setTime(start.getTime());
      end.setMonth(start.getMonth() + 1);
      break;
    }
    case 'custom': {
      const parsedStart = customStart ? new Date(customStart) : null;
      const parsedEnd = customEnd ? new Date(customEnd) : null;
      if (parsedStart && !Number.isNaN(parsedStart.getTime())) {
        parsedStart.setHours(0, 0, 0, 0);
        start.setTime(parsedStart.getTime());
      }
      if (parsedEnd && !Number.isNaN(parsedEnd.getTime())) {
        parsedEnd.setHours(0, 0, 0, 0);
        end.setTime(parsedEnd.getTime());
      } else {
        end.setTime(start.getTime());
        end.setDate(start.getDate() + 1);
      }
      break;
    }
    case 'this-month':
    default:
      start.setDate(1);
      end.setTime(start.getTime());
      end.setMonth(start.getMonth() + 1);
      break;
  }

  return { start, end };
}
// POST /api/secretary/register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ msg: 'Missing fields' });

  try {
    const existing = await Secretary.findOne({ email });
    if (existing) return res.status(400).json({ msg: 'Secretary already exists' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const secretary = new Secretary({ name, email, password: hash });
    await secretary.save();

    const payload = { id: secretary._id, role: secretary.role, email: secretary.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '5h' });

    res.status(201).json({ token, secretary: { id: secretary._id, name: secretary.name, email: secretary.email } });
  } catch (err) {
    console.error('Error registering secretary:', err);
    res.status(500).send('Server error');
  }
});

// POST /api/secretary/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ msg: 'Missing fields' });

  try {
    const secretary = await Secretary.findOne({ email });
    if (!secretary) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, secretary.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const payload = { id: secretary._id, role: secretary.role, email: secretary.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '5h' });

    res.json({ token, secretary: { id: secretary._id, name: secretary.name, email: secretary.email } });
  } catch (err) {
    console.error('Error logging in secretary:', err);
    res.status(500).send('Server error');
  }
});

router.use(auth);
router.use(requireSecretary);

router.get('/me', async (req, res) => {
  try {
    const secretary = await Secretary.findById(req.user.id).select('-password -__v').lean();
    if (!secretary) return res.status(404).json({ msg: 'Secretary not found' });
    return res.json({ secretary });
  } catch (err) {
    console.error('GET /api/secretary/me error:', err);
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

router.get('/notifications', async (req, res) => {
  try {
    const { status = 'all', limit = 20, skip = 0 } = req.query || {};
    const parsedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const parsedSkip = Math.max(Number(skip) || 0, 0);

    const filter = { recipientSecretary: req.user.id };
    if (status === 'unread') {
      filter.readAt = null;
    } else if (status === 'read') {
      filter.readAt = { $ne: null };
    }

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(parsedSkip)
        .limit(parsedLimit)
        .lean(),
      Notification.countDocuments({ recipientSecretary: req.user.id, readAt: null }),
    ]);

    return res.json({ notifications, unreadCount });
  } catch (err) {
    console.error('GET /api/secretary/notifications error:', err);
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

router.patch('/notifications/:id/read', async (req, res) => {
  try {
    const { mark = 'read' } = req.body || {};
    const update =
      mark === 'unread'
        ? { $set: { readAt: null } }
        : { $set: { readAt: new Date() } };

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientSecretary: req.user.id },
      update,
      { new: true }
    )
      .populate('meeting', 'title startTime endTime project')
      .populate('conflict', 'status meeting')
      .lean();

    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found' });
    }

    const unreadCount = await Notification.countDocuments({ recipientSecretary: req.user.id, readAt: null });
    return res.json({ notification, unreadCount });
  } catch (err) {
    console.error('PATCH /api/secretary/notifications/:id/read error:', err);
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

router.post('/notifications/mark-all-read', async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipientSecretary: req.user.id, readAt: null },
      { $set: { readAt: new Date() } }
    );
    return res.json({ updated: result.modifiedCount || 0 });
  } catch (err) {
    console.error('POST /api/secretary/notifications/mark-all-read error:', err);
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

router.get('/reports/summary', async (req, res) => {
  try {
    const { range = 'this-month', start: customStart, end: customEnd } = req.query || {};

    const secretary = await Secretary.findById(req.user.id).select('assignedExecutives').lean();
    if (!secretary) {
      return res.status(404).json({ msg: 'Secretary not found' });
    }

    const assignedIds = (secretary.assignedExecutives || [])
      .map((id) => {
        try {
          return new mongoose.Types.ObjectId(id);
        } catch (err) {
          return null;
        }
      })
      .filter(Boolean);

    const { start, end } = normaliseRange(range, customStart, customEnd);

    if (!assignedIds.length) {
      return res.json({
        range: { start: start.toISOString(), end: end.toISOString(), label: range },
        summary: {
          totalMeetings: 0,
          totalHours: 0,
          activeProjects: 0,
          avgHoursPerExecutive: 0,
          meetingsByStatus: {},
        },
        projects: [],
        executives: [],
        tasks: { total: 0, completed: 0, pending: 0, scheduled: 0, overdue: 0 },
      });
    }

    const assignedSet = new Set(assignedIds.map((id) => String(id)));

    const meetingQuery = {
      startTime: { $gte: start, $lt: end },
      endTime: { $ne: null },
      status: { $nin: ['cancelled'] },
      $or: [
        { participants: { $in: assignedIds } },
        { 'invited.execId': { $in: assignedIds } },
      ],
    };

    const meetings = await Meeting.find(meetingQuery)
      .select('title startTime endTime project status participants invited')
      .lean();

    const executives = await Executive.find({ _id: { $in: assignedIds } })
      .select('name email department tasks')
      .lean();

    const execMeta = new Map();
    executives.forEach((exec) => {
      execMeta.set(String(exec._id), exec);
    });

    const summary = {
      totalMeetings: meetings.length,
      totalHours: 0,
      activeProjects: 0,
      meetingsByStatus: {},
    };

    const projectMap = new Map();
    const execStats = new Map();

    const projectKeyFor = (value) => {
      if (!value || typeof value !== 'string') return 'Unassigned';
      const trimmed = value.trim();
      return trimmed.length ? trimmed : 'Unassigned';
    };

    meetings.forEach((meeting) => {
      if (!meeting?.startTime || !meeting?.endTime) return;
      const startTime = new Date(meeting.startTime);
      const endTime = new Date(meeting.endTime);
      if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) return;
      const ms = endTime.getTime() - startTime.getTime();
      if (ms <= 0) return;
      const durationHours = ms / (1000 * 60 * 60);

      summary.totalHours += durationHours;
      const statusKey = meeting.status || 'unknown';
      summary.meetingsByStatus[statusKey] = (summary.meetingsByStatus[statusKey] || 0) + 1;

      const pKey = projectKeyFor(meeting.project);
      if (!projectMap.has(pKey)) {
        projectMap.set(pKey, {
          project: pKey,
          meetings: 0,
          hours: 0,
          participants: new Set(),
        });
      }
      const projectEntry = projectMap.get(pKey);
      projectEntry.meetings += 1;
      projectEntry.hours += durationHours;

      const involvedIds = new Set();
      (meeting.participants || []).forEach((id) => {
        if (!id) return;
        involvedIds.add(String(id));
      });
      (meeting.invited || []).forEach((entry) => {
        if (entry?.execId) involvedIds.add(String(entry.execId));
      });

      involvedIds.forEach((idStr) => {
        if (!assignedSet.has(idStr)) return;
        projectEntry.participants.add(idStr);
        if (!execStats.has(idStr)) {
          const meta = execMeta.get(idStr) || {};
          execStats.set(idStr, {
            id: idStr,
            name: meta.name || 'Executive',
            email: meta.email || null,
            meetings: 0,
            hours: 0,
          });
        }
        const execEntry = execStats.get(idStr);
        execEntry.meetings += 1;
        execEntry.hours += durationHours;
      });
    });

    summary.totalHours = Number(summary.totalHours.toFixed(2));
    summary.activeProjects = projectMap.size;

    const executivesCount = executives.length || 0;
    const avgHoursPerExecutive = executivesCount
      ? Number((summary.totalHours / executivesCount).toFixed(2))
      : 0;

    const projects = Array.from(projectMap.values()).map((entry) => ({
      project: entry.project,
      meetings: entry.meetings,
      hours: Number(entry.hours.toFixed(2)),
      uniqueExecutives: entry.participants.size,
    }));

    const executiveStats = Array.from(execStats.values())
      .map((entry) => ({
        id: entry.id,
        name: entry.name,
        email: entry.email,
        meetings: entry.meetings,
        hours: Number(entry.hours.toFixed(2)),
      }))
      .sort((a, b) => b.hours - a.hours || b.meetings - a.meetings);

    const now = new Date();
    const tasksSummary = { total: 0, completed: 0, pending: 0, scheduled: 0, overdue: 0 };
    executives.forEach((exec) => {
      (exec.tasks || []).forEach((task) => {
        tasksSummary.total += 1;
        const status = (task.status || '').toLowerCase();
        if (status === 'completed' || status === 'done') {
          tasksSummary.completed += 1;
        } else if (status === 'scheduled') {
          tasksSummary.scheduled += 1;
          if (task.endTime && new Date(task.endTime) < now) {
            tasksSummary.overdue += 1;
          }
        } else {
          tasksSummary.pending += 1;
          if (task.endTime && new Date(task.endTime) < now) {
            tasksSummary.overdue += 1;
          }
        }
      });
    });

    return res.json({
      range: { start: start.toISOString(), end: end.toISOString(), label: range },
      summary: {
        totalMeetings: summary.totalMeetings,
        totalHours: summary.totalHours,
        activeProjects: summary.activeProjects,
        avgHoursPerExecutive,
        meetingsByStatus: summary.meetingsByStatus,
      },
      projects,
      executives: executiveStats,
      tasks: tasksSummary,
    });
  } catch (err) {
    console.error('GET /api/secretary/reports/summary error:', err);
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

router.get('/conflicts', async (req, res) => {
  try {
    const { status, limit = 25, summary } = req.query;

    if (summary === 'true') {
      const stats = await Conflict.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);

      const summaryPayload = { open: 0, in_progress: 0, resolved: 0, escalated: 0 };
      stats.forEach((entry) => {
        if (entry?._id && Object.prototype.hasOwnProperty.call(summaryPayload, entry._id)) {
          summaryPayload[entry._id] = entry.count;
        }
      });

      const latestConflict = await Conflict.findOne().sort({ updatedAt: -1 }).select('updatedAt').lean();
      const openMeetings = await Meeting.countDocuments({ hasConflict: true, conflictStatus: 'open' });

      return res.json({
        summary: summaryPayload,
        lastUpdated: latestConflict?.updatedAt || null,
        openMeetings,
      });
    }

    const query = {};
    if (status) query.status = status;

    const parsedLimit = Number(limit) > 0 ? Math.min(Number(limit), 100) : 25;

    const conflicts = await Conflict.find(query)
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .populate('meeting', 'title startTime endTime status project hasConflict conflictStatus')
      .populate('requestedBy', 'name email department')
      .lean();

    return res.json({ conflicts });
  } catch (err) {
    console.error('GET /api/secretary/conflicts error:', err);
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

router.get('/conflicts/:id', async (req, res) => {
  try {
    const conflict = await populateConflict(req.params.id);
    if (!conflict) return res.status(404).json({ msg: 'Conflict not found' });
    return res.json({ conflict });
  } catch (err) {
    console.error('GET /api/secretary/conflicts/:id error:', err);
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

router.patch('/conflicts/:id/proposals', async (req, res) => {
  try {
    const { startTime, endTime, notes } = req.body || {};
    if (!startTime || !endTime) {
      return res.status(400).json({ msg: 'startTime and endTime are required' });
    }

    const parsedStart = new Date(startTime);
    const parsedEnd = new Date(endTime);
    if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime())) {
      return res.status(400).json({ msg: 'Invalid start or end time' });
    }
    if (parsedEnd.getTime() <= parsedStart.getTime()) {
      return res.status(400).json({ msg: 'endTime must be after startTime' });
    }

    const conflict = await Conflict.findById(req.params.id);
    if (!conflict) return res.status(404).json({ msg: 'Conflict not found' });

    conflict.proposedOptions.push({
      startTime: parsedStart,
      endTime: parsedEnd,
      notes,
      createdBy: req.user.id,
    });

    if (conflict.status === 'open') {
      conflict.status = 'in_progress';
    }

    conflict.history.push({
      action: 'proposal_added',
      notes,
      actor: req.user.id,
      actorRole: 'secretary',
    });

    await conflict.save();

    const populated = await populateConflict(conflict._id);
    return res.json({ conflict: populated });
  } catch (err) {
    console.error('PATCH /api/secretary/conflicts/:id/proposals error:', err);
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

router.patch('/conflicts/:id/consultations', async (req, res) => {
  try {
    const {
      executiveId,
      executiveEmail,
      executiveName,
      decision = 'pending',
      notes,
    } = req.body || {};

    if (!executiveId && !executiveEmail) {
      return res.status(400).json({ msg: 'executiveId or executiveEmail is required' });
    }

    const normalizedEmail = typeof executiveEmail === 'string' ? executiveEmail.trim().toLowerCase() : null;
    const validDecisions = ['pending', 'approved', 'declined'];
    const resolvedDecision = validDecisions.includes(decision) ? decision : 'pending';

    let execObjectId = null;
    if (executiveId) {
      try {
        execObjectId = new mongoose.Types.ObjectId(executiveId);
      } catch (err) {
        return res.status(400).json({ msg: 'Invalid executiveId' });
      }
    }

    const conflict = await Conflict.findById(req.params.id);
    if (!conflict) return res.status(404).json({ msg: 'Conflict not found' });

    let consultation = null;
    if (execObjectId) {
      consultation = (conflict.consultations || []).find((entry) => entry.executive && String(entry.executive) === String(execObjectId));
    }
    if (!consultation && normalizedEmail) {
      consultation = (conflict.consultations || []).find((entry) => (entry.executiveEmail || '').toLowerCase() === normalizedEmail);
    }

    const now = new Date();

    if (consultation) {
      consultation.decision = resolvedDecision;
      consultation.notes = notes || consultation.notes;
      consultation.recordedBy = req.user.id;
      consultation.updatedAt = now;
      if (executiveName) consultation.executiveName = executiveName;
      if (normalizedEmail) consultation.executiveEmail = normalizedEmail;
      if (execObjectId) consultation.executive = execObjectId;
    } else {
      conflict.consultations = conflict.consultations || [];
      conflict.consultations.push({
        executive: execObjectId,
        executiveName: executiveName || null,
        executiveEmail: normalizedEmail,
        decision: resolvedDecision,
        notes,
        recordedBy: req.user.id,
        recordedAt: now,
        updatedAt: now,
      });
    }

    conflict.history.push({
      action: 'consultation_recorded',
      notes: notes || `Consultation logged (${resolvedDecision})`,
      actor: req.user.id,
      actorRole: 'secretary',
    });

    await conflict.save();

    const populated = await populateConflict(conflict._id);
    return res.json({ conflict: populated });
  } catch (err) {
    console.error('PATCH /api/secretary/conflicts/:id/consultations error:', err);
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

router.patch('/conflicts/:id/resolve', async (req, res) => {
  try {
    const { startTime, endTime, resolutionNotes } = req.body || {};
    if (!startTime || !endTime) return res.status(400).json({ msg: 'startTime and endTime are required' });

    const parsedStart = new Date(startTime);
    const parsedEnd = new Date(endTime);
    if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime())) {
      return res.status(400).json({ msg: 'Invalid start or end time' });
    }
    if (parsedEnd.getTime() <= parsedStart.getTime()) {
      return res.status(400).json({ msg: 'endTime must be after startTime' });
    }

    const conflict = await Conflict.findById(req.params.id);
    if (!conflict) return res.status(404).json({ msg: 'Conflict not found' });

    const meeting = await Meeting.findById(conflict.meeting);
    if (!meeting) return res.status(404).json({ msg: 'Linked meeting not found' });

    meeting.startTime = parsedStart;
    meeting.endTime = parsedEnd;
    meeting.status = 'pending';
    meeting.hasConflict = false;
    meeting.conflictStatus = 'resolved';
    meeting.conflictNotes = resolutionNotes || 'Conflict resolved by secretary';

    if (!Array.isArray(meeting.participants)) meeting.participants = [];

    const participantSet = new Set(meeting.participants.map((id) => String(id)));
    (conflict.participantIds || []).forEach((id) => participantSet.add(String(id)));
    if (conflict.requestedBy) participantSet.add(String(conflict.requestedBy));

    meeting.participants = Array.from(participantSet)
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    meeting.invited = Array.isArray(meeting.invited)
      ? meeting.invited.map((entry) => {
          if (!entry) return entry;
          const isCreator = conflict.requestedBy && entry.execId && String(entry.execId) === String(conflict.requestedBy);
          if (isCreator) return { ...entry, status: 'accepted' };
          return { ...entry, status: entry.status === 'cancelled' ? 'cancelled' : 'invited' };
        })
      : [];

    await meeting.save();

    const execIds = Array.from(
      new Set([
        ...(conflict.participantIds || []).map((id) => String(id)),
        conflict.requestedBy ? String(conflict.requestedBy) : null,
      ].filter(Boolean))
    );

    if (execIds.length) {
      const execs = await Executive.find({ _id: { $in: execIds } });
      for (const exec of execs) {
        let updatedExisting = false;

        exec.tasks = (exec.tasks || []).map((task) => {
          if (task.meetingId && String(task.meetingId) === String(meeting._id)) {
            updatedExisting = true;
            task.startTime = parsedStart;
            task.endTime = parsedEnd;
            task.status = 'scheduled';
            task.description = resolutionNotes || task.description;
          }
          return task;
        });

        if (!updatedExisting) {
          exec.tasks.push({
            title: meeting.title,
            startTime: parsedStart,
            endTime: parsedEnd,
            description: resolutionNotes || `Meeting ${meeting._id} rescheduled`,
            meetingId: meeting._id,
            status: 'scheduled',
          });
        }

        await exec.save();
      }
    }

    conflict.status = 'resolved';
    conflict.resolutionNotes = resolutionNotes;
    conflict.resolvedBy = req.user.id;
    conflict.history.push({
      action: 'conflict_resolved',
      notes: resolutionNotes,
      actor: req.user.id,
      actorRole: 'secretary',
    });

    await conflict.save();

    const populatedConflict = await populateConflict(conflict._id);
    const populatedMeeting = await Meeting.findById(meeting._id)
      .populate('participants', 'name email department')
      .populate('createdBy', 'name email')
      .lean();

    return res.json({ conflict: populatedConflict, meeting: populatedMeeting });
  } catch (err) {
    console.error('PATCH /api/secretary/conflicts/:id/resolve error:', err);
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

router.post('/conflicts/:id/escalate', async (req, res) => {
  try {
    const { reason } = req.body || {};
    const conflict = await Conflict.findById(req.params.id);
    if (!conflict) return res.status(404).json({ msg: 'Conflict not found' });

    conflict.status = 'escalated';
    conflict.history.push({
      action: 'conflict_escalated',
      notes: reason,
      actor: req.user.id,
      actorRole: 'secretary',
    });

    await conflict.save();

    await Meeting.findByIdAndUpdate(conflict.meeting, {
      conflictStatus: 'escalated',
      conflictNotes: reason || 'Escalated by secretary',
    }).exec();

    const populated = await populateConflict(conflict._id);
    return res.json({ conflict: populated });
  } catch (err) {
    console.error('POST /api/secretary/conflicts/:id/escalate error:', err);
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router;
