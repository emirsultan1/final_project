import { useState, useEffect } from 'react';
import API from '../utils/api';

const Admin = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Reminder trigger state
  const [sendingReminders, setSendingReminders] = useState(false);
  const [reminderResult, setReminderResult] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes] = await Promise.all([
        API.get('/admin/stats'),
        API.get('/admin/users'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete user "${name}" and all their data? This cannot be undone.`)) {
      return;
    }
    try {
      await API.delete(`/admin/users/${id}`);
      setUsers(users.filter((u) => u._id !== id));
      const statsRes = await API.get('/admin/stats');
      setStats(statsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleToggleRole = async (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      const res = await API.put(`/admin/users/${user._id}/role`, { role: newRole });
      setUsers(users.map((u) => (u._id === user._id ? { ...u, role: res.data.role } : u)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleSendReminders = async () => {
    setSendingReminders(true);
    setReminderResult(null);
    setError('');
    try {
      const res = await API.post('/admin/send-reminders');
      setReminderResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reminders');
    } finally {
      setSendingReminders(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return <div className="dashboard"><p>Loading admin panel...</p></div>;
  }

  return (
    <div className="dashboard">
      <h1>Admin Panel</h1>
      <p>Platform overview and user management.</p>

      {error && <div className="error-message">{error}</div>}

      {reminderResult && (
        <div className="success-message">
          ✓ Sent {reminderResult.emailsSent} reminder{reminderResult.emailsSent === 1 ? '' : 's'} covering {reminderResult.tasksReminded} task{reminderResult.tasksReminded === 1 ? '' : 's'}.
        </div>
      )}

      <div className="admin-actions">
        <button
          onClick={handleSendReminders}
          disabled={sendingReminders}
          className="btn-small"
        >
          {sendingReminders ? 'Sending...' : 'Send Reminder Emails Now'}
        </button>
        <span className="admin-action-hint">
          Emails users about tasks due in the next 24 hours.
        </span>
      </div>

      {stats && (
        <div className="dashboard-cards">
          <div className="card">
            <h3>Total Users</h3>
            <p>{stats.totalUsers}</p>
          </div>
          <div className="card">
            <h3>Admins</h3>
            <p>{stats.totalAdmins}</p>
          </div>
          <div className="card">
            <h3>Signups (7d)</h3>
            <p>{stats.recentSignups}</p>
          </div>
          <div className="card">
            <h3>Total Courses</h3>
            <p>{stats.totalCourses}</p>
          </div>
          <div className="card">
            <h3>Total Tasks</h3>
            <p>{stats.totalTasks}</p>
          </div>
          <div className="card">
            <h3>Completed Tasks</h3>
            <p>{stats.completedTasks}</p>
          </div>
        </div>
      )}

      <h2 style={{ marginTop: '40px' }}>All Users</h2>
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Courses</th>
              <th>Tasks</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`role-badge role-${u.role}`}>{u.role}</span>
                </td>
                <td>{formatDate(u.createdAt)}</td>
                <td>{u.courseCount}</td>
                <td>{u.taskCount}</td>
                <td>
                  <button
                    onClick={() => handleToggleRole(u)}
                    className="btn-small"
                    style={{ marginRight: '8px' }}
                  >
                    {u.role === 'admin' ? 'Demote' : 'Promote'}
                  </button>
                  <button
                    onClick={() => handleDelete(u._id, u.name)}
                    className="btn-small btn-danger"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Admin;