const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return cb(null, true);
    }
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/google', require('./routes/google'));
app.use('/api/groups', require('./routes/groups'));

app.get('/', (req, res) => {
  res.json({ message: 'StudySync API is running', status: 'ok' });
});

// Daily reminder cron — runs every day at 8:00 AM (server time)
const { sendReminders } = require('./utils/sendReminders');
cron.schedule('0 8 * * *', async () => {
  console.log('[cron] Running daily reminder job...');
  try {
    const result = await sendReminders();
    console.log(`[cron] Done. Sent ${result.emailsSent} emails covering ${result.tasksReminded} tasks.`);
  } catch (err) {
    console.error('[cron] Failed:', err);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});