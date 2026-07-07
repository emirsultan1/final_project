const nodemailer = require('nodemailer');
const Task = require('../models/Task');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Fail fast so we see real errors instead of hanging forever
  connectionTimeout: 10000,   // 10s to connect
  greetingTimeout: 10000,     // 10s to receive greeting
  socketTimeout: 15000,       // 15s for any socket operation
});

const buildEmailHTML = (userName, tasks) => {
  const taskRows = tasks
    .map((t) => {
      const deadline = new Date(t.deadline).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            <strong>${t.title}</strong><br>
            <span style="color: #6b7280; font-size: 13px;">
              ${t.course?.name || 'No course'} · ${deadline} · ${t.priority} priority
            </span>
          </td>
        </tr>
      `;
    })
    .join('');

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #4f46e5; margin-bottom: 16px;">StudySync Reminder</h2>
      <p>Hi ${userName},</p>
      <p>You have <strong>${tasks.length}</strong> task${tasks.length === 1 ? '' : 's'} due within the next 24 hours:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #fff;">
        ${taskRows}
      </table>
      <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">
        Stay focused — you've got this.<br>
        — The StudySync Team
      </p>
    </div>
  `;
};

const sendReminders = async () => {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const tasks = await Task.find({
    completed: false,
    deadline: { $gte: now, $lte: in24h },
  })
    .populate('user', 'name email')
    .populate('course', 'name color');

  const tasksByUser = new Map();
  for (const task of tasks) {
    if (!task.user || !task.user.email) continue;
    const userId = task.user._id.toString();
    if (!tasksByUser.has(userId)) {
      tasksByUser.set(userId, { user: task.user, tasks: [] });
    }
    tasksByUser.get(userId).tasks.push(task);
  }

  let emailsSent = 0;
  let tasksReminded = 0;

  for (const { user, tasks: userTasks } of tasksByUser.values()) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: `You have ${userTasks.length} task${userTasks.length === 1 ? '' : 's'} due soon`,
        html: buildEmailHTML(user.name, userTasks),
      });
      emailsSent += 1;
      tasksReminded += userTasks.length;
      console.log(`[reminders] Sent to ${user.email} (${userTasks.length} tasks)`);
    } catch (err) {
      console.error(`[reminders] Failed to send to ${user.email}:`, err.message);
    }
  }

  return { emailsSent, tasksReminded };
};

module.exports = { sendReminders };