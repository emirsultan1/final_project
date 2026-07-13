import { useState, useEffect, useRef } from 'react';
import API from '../utils/api';

const MODES = {
  focus: { label: 'Focus', duration: 25 * 60, color: '#4f46e5' },
  short: { label: 'Short Break', duration: 5 * 60, color: '#16a34a' },
  long: { label: 'Long Break', duration: 15 * 60, color: '#0891b2' },
};

const Pomodoro = () => {
  const [mode, setMode] = useState('focus');
  const [secondsLeft, setSecondsLeft] = useState(MODES.focus.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalMinutes: 0,
    todaySessions: 0,
    todayMinutes: 0,
  });
  const [error, setError] = useState('');

  const intervalRef = useRef(null);

  useEffect(() => {
    fetchCourses();
    fetchSessions();
    fetchStats();
  }, []);

  // Reset timer when mode changes
  useEffect(() => {
    setSecondsLeft(MODES[mode].duration);
    setIsRunning(false);
  }, [mode]);

  // Tick the timer
  useEffect(() => {
    if (!isRunning) {
      clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          // Finished
          clearInterval(intervalRef.current);
          handleComplete();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  const fetchCourses = async () => {
    try {
      const res = await API.get('/courses');
      setCourses(res.data);
    } catch (err) {
      console.error('Failed to load courses');
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await API.get('/sessions');
      setSessions(res.data);
    } catch (err) {
      console.error('Failed to load sessions');
    }
  };

  const fetchStats = async () => {
    try {
      const res = await API.get('/sessions/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load stats');
    }
  };

  const handleComplete = async () => {
    setIsRunning(false);

    // Only log focus sessions, not breaks
    if (mode === 'focus') {
      try {
        await API.post('/sessions', {
          course: selectedCourse || null,
          duration: MODES.focus.duration,
        });
        fetchSessions();
        fetchStats();

        // Play a sound cue if available
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ==');
          audio.play().catch(() => {});
        } catch (e) {}

        // Auto-switch to short break
        setMode('short');
      } catch (err) {
        setError('Failed to save session');
      }
    } else {
      // Break finished, switch back to focus
      setMode('focus');
    }
  };

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(MODES[mode].duration);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const formatSessionTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Progress for the circle (0 to 1)
  const progress = 1 - secondsLeft / MODES[mode].duration;
  const circumference = 2 * Math.PI * 120;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="pomodoro-page">
      <h1>Pomodoro Timer</h1>
      <p>Focus in 25-minute blocks. Completed sessions are saved.</p>

      {error && <div className="error-message">{error}</div>}

      <div className="pomodoro-modes">
        {Object.keys(MODES).map((key) => (
          <button
            key={key}
            className={`mode-btn ${mode === key ? 'active' : ''}`}
            data-testid={`mode-${key}`}
            onClick={() => setMode(key)}
          >
            {MODES[key].label}
          </button>
        ))}
      </div>

      <div className="pomodoro-timer-wrapper">
        <svg className="pomodoro-circle" width="280" height="280" viewBox="0 0 280 280">
          <circle
            cx="140"
            cy="140"
            r="120"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="10"
          />
          <circle
            cx="140"
            cy="140"
            r="120"
            fill="none"
            stroke={MODES[mode].color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 140 140)"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
          <text
            x="140"
            y="140"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="48"
            fontWeight="700"
            fill="#18181b"
            data-testid="timer-display"
            style={{ letterSpacing: '-0.02em' }}
          >
            {formatTime(secondsLeft)}
          </text>
          <text
            x="140"
            y="180"
            textAnchor="middle"
            fontSize="13"
            fill="#71717a"
            style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
          >
            {MODES[mode].label}
          </text>
        </svg>
      </div>

      {mode === 'focus' && (
        <div className="pomodoro-course-select">
          <label>Studying: </label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            disabled={isRunning}
          >
            <option value="">General study</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="pomodoro-controls">
        {!isRunning ? (
          <button onClick={handleStart} className="btn-primary" data-testid="timer-start" style={{ width: 'auto', padding: '12px 32px' }}>
            Start
          </button>
        ) : (
          <button onClick={handlePause} className="btn-primary" data-testid="timer-pause" style={{ width: 'auto', padding: '12px 32px', background: '#6b7280' }}>
            Pause
          </button>
        )}
        <button onClick={handleReset} className="btn-small" data-testid="timer-reset" style={{ padding: '12px 24px' }}>
          Reset
        </button>
      </div>

      <div className="pomodoro-stats">
        <div className="card">
          <h3>Today</h3>
          <p>{stats.todaySessions} sessions</p>
          <span className="card-subtext">{stats.todayMinutes} min focused</span>
        </div>
        <div className="card">
          <h3>All Time</h3>
          <p>{stats.totalSessions} sessions</p>
          <span className="card-subtext">{stats.totalMinutes} min total</span>
        </div>
      </div>

      <h2 style={{ marginTop: '40px' }}>Recent Sessions</h2>
      {sessions.length === 0 ? (
        <p className="empty-state">No sessions yet. Complete your first 25-minute focus block to log one.</p>
      ) : (
        <div className="session-list">
          {sessions.slice(0, 10).map((s) => (
            <div key={s._id} className="session-item">
              <div
                className="session-color"
                style={{ backgroundColor: s.course?.color || '#9ca3af' }}
              />
              <div className="session-info">
                <span className="session-title">
                  {s.course ? s.course.name : 'General study'}
                </span>
                <span className="session-meta">
                  {Math.round(s.duration / 60)} min · {formatSessionTime(s.completedAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Pomodoro;