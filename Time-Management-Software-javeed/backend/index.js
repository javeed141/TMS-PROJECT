// index.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const secretaryRoutes = require('./routes/secretary');
const executiveRoutes = require('./routes/executives'); // 👈 NEW

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


// connect DB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/yourdb')
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// routes
app.use('/api/auth', require('./routes/auth')); // <-- universal login

app.use('/api/secretary', secretaryRoutes);
app.use('/api/executive', executiveRoutes); // 👈 NEW
app.use('/api/meetings', require('./routes/events'));

app.get('/', (req, res) => res.send('Server is running and operational!'));

// app.use("/api/email", require("./routes/email"));



const authRoutes = require('./routes/auth');
const ExecutiveSchema = require('./schema/ExecutiveSchema');
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
