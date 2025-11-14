// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Executive = require('../schema/ExecutiveSchema');
const Secretary = require('../schema/SecretarySchema');

// LOGIN route for both executive and secretary
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ msg: 'Please enter both email and password' });

  try {
    // Try to find Executive first
    let user = await Executive.findOne({ email });
    let role = 'executive';

    // If not found, try Secretary
    if (!user) {
      user = await Secretary.findOne({ email });
      role = 'secretary';
    }

    if (!user) return res.status(400).json({ msg: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid password' });

  // Create token
  const payload = { id: user._id, role: user.role, email: user.email };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });


    res.json({
      msg: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ msg: 'Server error during login' });
  }
});

const auth=require("../middleware/authMiddleware")

router.post("/google-login", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ msg: "Email is required" });

  try {
    // 1️⃣ Check Executive first
    let user = await Executive.findOne({ email });
    let role = "executive";

    // 2️⃣ If not found, check Secretary
    if (!user) {
      user = await Secretary.findOne({ email });
      role = "secretary";
    }

    // 3️⃣ If not found in either, return error
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // 4️⃣ Create JWT token (same as normal login)
    const token = jwt.sign(
      { id: user._id, email: user.email, role },
      process.env.JWT_SECRET || "yoursecretkey",
      { expiresIn: "7d" }
    );

    // 5️⃣ Return token + user info
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role,
      },
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});


module.exports = router;
