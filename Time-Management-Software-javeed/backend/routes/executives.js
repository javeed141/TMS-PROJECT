// routes/executive.js (CommonJS)
const express = require('express');
const router = express.Router();
const Executive = require('../schema/ExecutiveSchema');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

console.log('Executive imported:', typeof Executive === 'function' ? 'Model OK' : Executive);
const auth = require('../middleware/authMiddleware');

// Apply protection to all routes below
router.use(auth);

// POST /api/executive/register
router.post('/register', async (req, res) => {
  const { name, email, password, department } = req.body;
  if (!name || !email || !password) return res.status(400).json({ msg: 'Missing fields' });

  try {
    const existing = await Executive.findOne({ email });
    if (existing) return res.status(400).json({ msg: 'Executive already exists' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const executive = new Executive({ name, email, password: hash, department });
    await executive.save();

  const payload = { id: executive._id, role: executive.role, email: executive.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '5h' });

    res.status(201).json({ token, executive: { id: executive._id, name: executive.name, email: executive.email } });
  } catch (err) {
    console.error('Error registering executive:', err);
    res.status(500).send('Server error');
  }
});

// POST /api/executive/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ msg: 'Missing fields' });

  try {
    const executive = await Executive.findOne({ email });
    if (!executive) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, executive.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

  const payload = { id: executive._id, role: executive.role, email: executive.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '5h' });

    res.json({ token, executive: { id: executive._id, name: executive.name, email: executive.email } });
  } catch (err) {
    console.error('Error logging in executive:', err);
    res.status(500).send('Server error');
  }
});


router.get('/info', auth, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ msg: 'Unauthorized' });

    const user = await Executive.findById(userId)
      .select('-password -__v') // hide sensitive fields (adjust if your schema differs)
      .lean();

    if (!user) return res.status(404).json({ msg: 'User not found' });

    return res.json({ user });
  } catch (err) {
    console.error('GET /api/auth/me error:', err);
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
});


function buildTaskFromPayload(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Invalid task payload');
  const { title, startTime, endTime, description } = payload;
  if (!title) throw new Error('Task title is required');
  if (!startTime) throw new Error('Task startTime is required');

  const s = new Date(startTime);
  if (Number.isNaN(s.getTime())) throw new Error('Invalid startTime');

  let e = null;
  if (endTime) {
    e = new Date(endTime);
    if (Number.isNaN(e.getTime())) throw new Error('Invalid endTime');
    if (e <= s) throw new Error('endTime must be after startTime');
  } else {
    // default duration: 30 minutes
    e = new Date(s.getTime() + 30 * 60 * 1000);
  }

  return {
    title: String(title),
    startTime: s,
    endTime: e,
    description: description ? String(description) : '',
  };
}

/**
 * POST /api/executive/:id/tasks
 * Create one or many tasks for an executive.
 * Body: {
 *   tasks: { title, startTime, endTime?, description? } | [ ...same... ]
 * }
 * If :id === "me" uses req.user.id
 */
router.post('/:id/tasks', auth, async (req, res) => {
  try {
    const targetId = req.params.id === 'me' ? req.user?.id : req.params.id;
    if (!targetId) return res.status(400).json({ msg: 'Missing target executive id' });

    const payload = req.body.tasks;
    if (!payload) return res.status(400).json({ msg: 'Body must include "tasks" field' });

    const items = Array.isArray(payload) ? payload : [payload];

    const normalized = [];
    for (const p of items) {
      try {
        normalized.push(buildTaskFromPayload(p));
      } catch (err) {
        return res.status(400).json({ msg: `Invalid task payload: ${err.message}`, payload: p });
      }
    }

    const exec = await Executive.findById(targetId);
    if (!exec) return res.status(404).json({ msg: 'Executive not found' });

    // push tasks into exec.tasks
    for (const t of normalized) exec.tasks.push(t);

    await exec.save();

    // return the appended tasks (Mongo will have assigned _id + timestamps if schema uses them)
    const appended = exec.tasks.slice(-normalized.length);

    return res.status(201).json({ msg: 'Tasks added', executiveId: exec._id, tasks: appended });
  } catch (err) {
    console.error('create tasks error:', err);
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

router.get('/me/tasks', auth, async (req, res) => {
  try {
    const exec = await Executive.findById(req.user.id).select('tasks').lean();
    if (!exec) return res.status(404).json({ msg: 'Executive not found' });
    return res.json({ tasks: exec.tasks || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/executive/me/tasks -> create tasks (single or array)
router.post('/me/tasks', auth, async (req, res) => {
  try {
    const payload = req.body.tasks;
    if (!payload) return res.status(400).json({ msg: 'Missing tasks payload' });
    const items = Array.isArray(payload) ? payload : [payload];

    function parseTask(p) {
      if (!p.title || !p.startTime) throw new Error('title and startTime required');
      const s = new Date(p.startTime);
      if (isNaN(s.getTime())) throw new Error('invalid startTime');
      const e = p.endTime ? new Date(p.endTime) : new Date(s.getTime() + 30*60000);
      if (isNaN(e.getTime())) throw new Error('invalid endTime');
      if (e <= s) throw new Error('endTime must be after startTime');
      return { title: p.title, startTime: s, endTime: e, description: p.description || '', createdBy: req.user.id };
    }

    const parsed = items.map(parseTask);
    const exec = await Executive.findById(req.user.id);
    if (!exec) return res.status(404).json({ msg: 'Executive not found' });

    for (const t of parsed) exec.tasks.push(t);
    await exec.save();

    const appended = exec.tasks.slice(-parsed.length);
    return res.status(201).json({ msg: 'Tasks added', tasks: appended });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ msg: err.message });
  }
});

// POST /api/executive/check-availability
router.post('/check-availability', auth, async (req, res) => {
  try {
    const { email, startTime, endTime } = req.body;
    if (!email || !startTime || !endTime) {
      return res.status(400).json({ msg: 'email, startTime, and endTime are required' });
    }

    const exec = await Executive.findOne({ email: email.toLowerCase().trim() }).select('tasks').lean();
    if (!exec) return res.status(404).json({ msg: 'Executive not found' });

    const s = new Date(startTime);
    const e = new Date(endTime);
    if (isNaN(s) || isNaN(e)) return res.status(400).json({ msg: 'Invalid start or end time' });

    // simple overlap check: [a,b) overlaps [c,d) if a < d && c < b
    const overlaps = (exec.tasks || []).filter((t) => {
      const ts = new Date(t.startTime).getTime();
      const te = new Date(t.endTime).getTime();
      return s.getTime() < te && ts < e.getTime();
    });

    if (overlaps.length > 0) {
      return res.json({ free: false, conflicts: overlaps });
    }

    return res.json({ free: true });
  } catch (err) {
    console.error('check-availability error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});


module.exports = router;
