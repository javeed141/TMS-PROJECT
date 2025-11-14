// schema/SecretarySchema.js (CommonJS)
const mongoose = require('mongoose');

const SecretarySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // hashed
  role: { type: String, default: "secretary" }, // role-based access
  assignedExecutives: [{ type: mongoose.Schema.Types.ObjectId, ref: "Executive" }],
}, { timestamps: true });

// Guard to avoid OverwriteModelError when using nodemon/hot reload
module.exports = mongoose.models?.Secretary || mongoose.model("Secretary", SecretarySchema);
