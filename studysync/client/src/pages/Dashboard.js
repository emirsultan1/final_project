import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    courses: 0,
    totalTasks: 0,
    pending: 0,
    overdue: 0,
    completed: 0,
    todayMinutes: 0,
    totalSessions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [coursesRes, tasksRes, sessionStatsRes] = await Promise.all([
          API.get('/courses'),
          API.get('/tasks'),
          API.get('/sessions/stats'),
        ]);

        const tasks = tasksRes.data;
        const now = new Date();

        setStats({
          courses: coursesRes.data.length,
          totalTasks: tasks.length,
          pending: tasks.filter((t) => !t.completed).length,
          overdue: tasks.filter((t) => !t.completed && new Date(t.deadline) < now).length,
          completed: tasks.filter((t) => t.completed).length,
          todayMinutes: sessionStatsRes.data.todayMinutes,
          totalSessions: sessionStatsRes.data.totalSessions,
        });
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="dashboard"><p>Loading...</p></div>;
  }

  return (
    <div className="dashboard">
      <h1>Welcome, {user?.name}!</h1>
      <p>Here's an overview of your academic workload.</p>
      <div className="dashboard-cards">
        <div className="card">
          <h3>Courses</h3>
          <p>{stats.courses}</p>
        </div>
        <div className="card">
          <h3>Pending Tasks</h3>
          <p>{stats.pending}</p>
        </div>
        <div className="card">
          <h3>Overdue</h3>
          <p style={{ color: stats.overdue > 0 ? '#dc2626' : 'inherit' }}>
            {stats.overdue}
          </p>
        </div>
        <div className="card">
          <h3>Completed</h3>
          <p>{stats.completed}</p>
        </div>
        <div className="card">
          <h3>Today's Focus</h3>
          <p>{stats.todayMinutes} min</p>
        </div>
        <div className="card">
          <h3>Study Sessions</h3>
          <p>{stats.totalSessions}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;