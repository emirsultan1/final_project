import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import API from '../utils/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Analytics = () => {
  const [tasks, setTasks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [tasksRes, coursesRes, sessionsRes] = await Promise.all([
        API.get('/tasks'),
        API.get('/courses'),
        API.get('/sessions'),
      ]);
      setTasks(tasksRes.data);
      setCourses(coursesRes.data);
      setSessions(sessionsRes.data);
    } catch (err) {
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="dashboard"><p>Loading analytics...</p></div>;

  // ===== KPI calculations =====
  const completedCount = tasks.filter((t) => t.completed).length;
  const completionRate = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);
  const avgTasksPerCourse = courses.length === 0 ? 0 : (tasks.length / courses.length).toFixed(1);
  const totalFocusHours = (sessions.reduce((sum, s) => sum + s.duration, 0) / 3600).toFixed(1);

  // ===== Chart 1: Tasks by Course (doughnut) =====
  const tasksByCourse = courses.map((c) => ({
    name: c.name,
    color: c.color,
    count: tasks.filter((t) => t.course?._id === c._id).length,
  })).filter((c) => c.count > 0);

  const tasksByCourseData = {
    labels: tasksByCourse.map((c) => c.name),
    datasets: [{
      data: tasksByCourse.map((c) => c.count),
      backgroundColor: tasksByCourse.map((c) => c.color),
      borderWidth: 2,
      borderColor: '#fff',
    }],
  };

  // ===== Chart 2: Completion Status (doughnut) =====
  const now = new Date();
  const pendingCount = tasks.filter((t) => !t.completed && new Date(t.deadline) >= now).length;
  const overdueCount = tasks.filter((t) => !t.completed && new Date(t.deadline) < now).length;

  const statusData = {
    labels: ['Completed', 'Pending', 'Overdue'],
    datasets: [{
      data: [completedCount, pendingCount, overdueCount],
      backgroundColor: ['#16a34a', '#4f46e5', '#dc2626'],
      borderWidth: 2,
      borderColor: '#fff',
    }],
  };

  // ===== Chart 3: Tasks Completed Per Week (bar, last 8 weeks) =====
  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const weeks = [];
  for (let i = 7; i >= 0; i--) {
    const start = getWeekStart(new Date());
    start.setDate(start.getDate() - i * 7);
    weeks.push(start);
  }

  const weeklyCompletions = weeks.map((weekStart) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return tasks.filter((t) => {
      if (!t.completed) return false;
      const updated = new Date(t.updatedAt);
      return updated >= weekStart && updated < weekEnd;
    }).length;
  });

  const weeklyData = {
    labels: weeks.map((w) => w.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [{
      label: 'Tasks Completed',
      data: weeklyCompletions,
      backgroundColor: '#4f46e5',
      borderRadius: 4,
    }],
  };

  // ===== Chart 4: Study Minutes Per Day (line, last 14 days) =====
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }

  const dailyMinutes = days.map((day) => {
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);
    const dayTotal = sessions
      .filter((s) => {
        const completedAt = new Date(s.completedAt);
        return completedAt >= day && completedAt < nextDay;
      })
      .reduce((sum, s) => sum + s.duration, 0);
    return Math.round(dayTotal / 60);
  });

  const studyData = {
    labels: days.map((d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [{
      label: 'Minutes Studied',
      data: dailyMinutes,
      borderColor: '#0891b2',
      backgroundColor: 'rgba(8, 145, 178, 0.1)',
      fill: true,
      tension: 0.3,
      pointRadius: 4,
      pointBackgroundColor: '#0891b2',
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { padding: 12, font: { size: 12 } } },
    },
  };

  const barOptions = {
    ...chartOptions,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 } },
    },
  };

  const lineOptions = {
    ...chartOptions,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true },
    },
  };

  return (
    <div className="analytics-page">
      <h1>Analytics</h1>
      <p>Insights into your study habits and workload.</p>

      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-cards">
        <div className="card">
          <h3>Completion Rate</h3>
          <p>{completionRate}%</p>
          <span className="card-subtext">{completedCount} of {tasks.length} tasks</span>
        </div>
        <div className="card">
          <h3>Avg Tasks / Course</h3>
          <p>{avgTasksPerCourse}</p>
          <span className="card-subtext">{courses.length} courses tracked</span>
        </div>
        <div className="card">
          <h3>Total Focus Time</h3>
          <p>{totalFocusHours}h</p>
          <span className="card-subtext">{sessions.length} sessions logged</span>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>Tasks by Course</h3>
          <div className="chart-wrapper">
            {tasksByCourse.length === 0 ? (
              <p className="empty-state-small">No tasks yet.</p>
            ) : (
              <Doughnut data={tasksByCourseData} options={chartOptions} />
            )}
          </div>
        </div>

        <div className="analytics-card">
          <h3>Completion Status</h3>
          <div className="chart-wrapper">
            {tasks.length === 0 ? (
              <p className="empty-state-small">No tasks yet.</p>
            ) : (
              <Doughnut data={statusData} options={chartOptions} />
            )}
          </div>
        </div>

        <div className="analytics-card analytics-card-wide">
          <h3>Tasks Completed (Last 8 Weeks)</h3>
          <div className="chart-wrapper">
            <Bar data={weeklyData} options={barOptions} />
          </div>
        </div>

        <div className="analytics-card analytics-card-wide">
          <h3>Study Minutes (Last 14 Days)</h3>
          <div className="chart-wrapper">
            {sessions.length === 0 ? (
              <p className="empty-state-small">No sessions logged yet. Complete a Pomodoro to see your trend.</p>
            ) : (
              <Line data={studyData} options={lineOptions} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;