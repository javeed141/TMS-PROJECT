// backend/middleware/auth.js (CommonJS)
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function (req, res, next) {
  try {
    const header = req.header('Authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

  const secret = process.env.JWT_SECRET || 'dev_secret';
  const decoded = jwt.verify(token, secret);

  // Normalise id/email: check common names used in tokens
  const id = decoded?.id || decoded?._id || decoded?.userId || decoded?.sub;
  const email = decoded?.email || decoded?.mail || decoded?.upn || null;

    if (!id) {
      // token valid but doesn't have an id — treat as unauthorized
      return res.status(401).json({ msg: 'Token missing user id' });
    }

    // attach minimal user object to req
  req.user = { id, role: decoded.role || decoded?.r || null, email };
    // optional: keep original payload if you want
    // req.userRaw = decoded;

    return next();
  } catch (err) {
    // jwt.verify throws on invalid/expired tokens
    return res.status(401).json({ msg: 'Token is not valid', error: err.message });
  }
};
