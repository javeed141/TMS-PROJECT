// src/controllers/taskController.js
import { User, Meeting } from '../models/index.js'; // User model includes embedded TaskSchema
import mongoose from 'mongoose';

/**
 * Helper: check if an interval overlaps an array of intervals
 */
function overlapsAny(start, end, intervals) {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  for (const it of intervals) {
    const a = new Date(it.startTime || it.start).getTime();
    const b = new Date(it.endTime || it.end).getTime();
    if (s < b && a < e) return true;
  }
  return false;
}

/**
 * POST /api/tasks
 * body: { title, startTime, endTime, description }
 */
export async function createTask(req, res) {
  try {
    const userId = req.user.id;
    const { title, startTime, endTime, description } = req.body;

    if (!title || !startTime) return res.status(400).json({ error: 'title and startTime required' });

    // Ensure endTime (if provided) is after startTime
    if (endTime && new Date(endTime) <= new Date(startTime)) {
      return res.status(400).json({ error: 'endTime must be after startTime' });
    }

    // Optional: prevent exact duplicate tasks
    const user = await User.findById(userId).select('+tasks').exec();
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Optional: check overlap with user's existing tasks
    if (overlapsAny(startTime, endTime || startTime, user.tasks)) {
      // You can choose to reject, warn, or allow. We'll return 409 conflict here.
      return res.status(409).json({ error: 'Task overlaps with existing task' });
    }

    // Optional: also check overlap with meetings the user participates in
    const meetingConflict = await Meeting.findOne({
      participants: userId,
      status: 'scheduled',
      $or: [
        { startTime: { $lt: endTime || startTime, $gte: startTime } },
        { endTime: { $gt: startTime, $lte: endTime || startTime } },
        { startTime: { $lte: startTime }, endTime: { $gte: endTime || startTime } }
      ]
    }).lean();

    if (meetingConflict) {
      return res.status(409).json({ error: 'Task overlaps with an existing meeting', meeting: meetingConflict._id });
    }

    // Insert task into user's embedded tasks array
    const newTask = {
      _id: new mongoose.Types.ObjectId(),
      title,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : undefined,
      description
    };

    user.tasks.push(newTask);
    await user.save();

    // Return the created task
    res.status(201).json({ task: newTask });
  } catch (err) {
    console.error('createTask error', err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/tasks/my-day?date=2025-11-09
 * returns tasks for the authenticated user that overlap that day
 */
export async function getMyTasksForDay(req, res) {
  try {
    const userId = req.user.id;
    const dateStr = req.query.date || new Date().toISOString().slice(0,10);
    const start = new Date(dateStr);
    start.setHours(0,0,0,0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);

    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const tasks = (user.tasks || []).filter(t => {
      const s = new Date(t.startTime).getTime();
      const e = t.endTime ? new Date(t.endTime).getTime() : s;
      return s < end.getTime() && e > start.getTime();
    });

    res.json({ tasks });
  } catch (err) {
    console.error('getMyTasksForDay', err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * DELETE /api/tasks/:taskId
 */
export async function deleteTask(req, res) {
  try {
    const userId = req.user.id;
    const { taskId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const before = user.tasks.length;
    user.tasks = user.tasks.filter(t => String(t._id) !== String(taskId));
    if (user.tasks.length === before) return res.status(404).json({ error: 'Task not found' });

    await user.save();
    res.json({ ok: true });
  } catch (err) {
    console.error('deleteTask error', err);
    res.status(500).json({ error: err.message });
  }
}
