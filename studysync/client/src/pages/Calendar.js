import { useState, useEffect } from 'react';
import ReactCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import API from '../utils/api';

const CalendarPage = () => {
  const [tasks, setTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await API.get('/tasks');
      setTasks(res.data);
    } catch (err) {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // Helper: are two dates the same calendar day?
  const sameDay = (d1, d2) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  // Get tasks due on a specific date
  const tasksOnDate = (date) => {
    return tasks.filter((t) => sameDay(new Date(t.deadline), date));
  };

  // Render dots inside each calendar tile for days that have tasks
  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    const dayTasks = tasksOnDate(date);
    if (dayTasks.length === 0) return null;

    // Show up to 3 colored dots, one per task (capped to avoid clutter)
    const dots = dayTasks.slice(0, 3);
    return (
      <div className="calendar-dots">
        {dots.map((t) => (
          <span
            key={t._id}
            className="calendar-dot"
            style={{ backgroundColor: t.course?.color || '#4f46e5' }}
          />
        ))}
        {dayTasks.length > 3 && <span className="calendar-more">+{dayTasks.length - 3}</span>}
      </div>
    );
  };

  // Style overdue/today/etc. via class names on each tile
  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return null;
    const dayTasks = tasksOnDate(date);
    if (dayTasks.length === 0) return null;

    const hasOverdue = dayTasks.some(
      (t) => !t.completed && new Date(t.deadline) < new Date(new Date().toDateString())
    );
    const allCompleted = dayTasks.every((t) => t.completed);

    if (allCompleted) return 'tile-all-done';
    if (hasOverdue) return 'tile-overdue';
    return 'tile-has-tasks';
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const selectedTasks = tasksOnDate(selectedDate);

  if (loading) {
    return <div className="dashboard"><p>Loading calendar...</p></div>;
  }

  return (
    <div className="calendar-page">
      <h1>Calendar</h1>
      <p>Visualize your deadlines across the month.</p>

      {error && <div className="error-message">{error}</div>}

      <div className="calendar-layout">
        <div className="calendar-container">
          <ReactCalendar
            onChange={setSelectedDate}
            value={selectedDate}
            tileContent={tileContent}
            tileClassName={tileClassName}
          />

          <div className="calendar-legend">
            <span className="legend-item"><span className="legend-dot legend-tasks" /> Has tasks</span>
            <span className="legend-item"><span className="legend-dot legend-overdue" /> Overdue</span>
            <span className="legend-item"><span className="legend-dot legend-done" /> All completed</span>
          </div>
        </div>

        <div className="calendar-sidebar">
          <h3>{formatDate(selectedDate)}</h3>
          {selectedTasks.length === 0 ? (
            <p className="empty-state-small">No tasks on this day.</p>
          ) : (
            <div className="calendar-task-list">
              {selectedTasks.map((t) => (
                <div
                  key={t._id}
                  className={`calendar-task ${t.completed ? 'task-completed' : ''}`}
                >
                  <div
                    className="calendar-task-color"
                    style={{ backgroundColor: t.course?.color || '#4f46e5' }}
                  />
                  <div className="calendar-task-info">
                    <span className="calendar-task-title">{t.title}</span>
                    <div className="calendar-task-meta">
                      {t.course && <span>{t.course.name}</span>}
                      <span className={`task-priority priority-${t.priority}`}>
                        {t.priority}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;