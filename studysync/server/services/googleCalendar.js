const { google } = require('googleapis');

// Build an OAuth2 client. We construct a fresh one each time so we can
// inject the right user's tokens without state leaking between requests.
const buildOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

// Scopes — we only need write access to Calendar events.
const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

// Generate the Google consent URL the user will visit.
// `state` carries the StudySync user ID so we know who is authorizing when
// Google redirects back to our callback.
const getAuthUrl = (userId) => {
  const oauth2Client = buildOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',     // gives us a refresh_token
    prompt: 'consent',           // forces refresh_token even on re-auth
    scope: SCOPES,
    state: userId.toString(),
  });
};

// Exchange the authorization code for tokens.
const exchangeCodeForTokens = async (code) => {
  const oauth2Client = buildOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

// Returns a Calendar API client authenticated as the given user.
// Auto-handles access-token refresh via the stored refresh_token.
const getCalendarClient = (user) => {
  const oauth2Client = buildOAuth2Client();
  oauth2Client.setCredentials({
    access_token: user.googleTokens?.access_token,
    refresh_token: user.googleTokens?.refresh_token,
    scope: user.googleTokens?.scope,
    token_type: user.googleTokens?.token_type,
    expiry_date: user.googleTokens?.expiry_date,
  });
  return google.calendar({ version: 'v3', auth: oauth2Client });
};

// Convert a StudySync task into a Google Calendar event payload.
// Tasks don't have a duration, so we represent them as 1-hour blocks
// ending at the deadline.
const taskToEvent = (task) => {
  const deadline = new Date(task.deadline);
  const start = new Date(deadline.getTime() - 60 * 60 * 1000); // 1h before

  const courseName = task.course?.name || 'No course';
  const priority = task.priority || 'medium';

  return {
    summary: `📚 ${task.title}`,
    description:
      `StudySync task\n\n` +
      `Course: ${courseName}\n` +
      `Priority: ${priority}\n\n` +
      `Managed by StudySync — edits in Google Calendar will not sync back.`,
    start: { dateTime: start.toISOString() },
    end: { dateTime: deadline.toISOString() },
    colorId: priority === 'high' ? '11' : priority === 'low' ? '2' : '5',
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 60 },
        { method: 'popup', minutes: 24 * 60 },
      ],
    },
  };
};

// Create event in Google Calendar. Returns the event ID so we can store
// it on the task for future edits/deletes.
const createCalendarEvent = async (user, task) => {
  const calendar = getCalendarClient(user);
  const res = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: taskToEvent(task),
  });
  return res.data.id;
};

// Update an existing event.
const updateCalendarEvent = async (user, eventId, task) => {
  const calendar = getCalendarClient(user);
  await calendar.events.update({
    calendarId: 'primary',
    eventId,
    requestBody: taskToEvent(task),
  });
};

// Delete an event. Swallows "Resource has been deleted" / 410 errors so
// we don't crash if the user manually deleted the event in Google.
const deleteCalendarEvent = async (user, eventId) => {
  const calendar = getCalendarClient(user);
  try {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });
  } catch (err) {
    if (err.code === 410 || err.code === 404) {
      // Event was already deleted — that's fine
      return;
    }
    throw err;
  }
};

module.exports = {
  getAuthUrl,
  exchangeCodeForTokens,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
};