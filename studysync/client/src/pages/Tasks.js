import { useState, useEffect } from 'react';
import API from '../utils/api';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState('medium');
  const [filterCourse, setFilterCourse] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCourses();
    fetchTasks();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await API.get('/courses');
      setCourses(res.data);
    } catch (err) {
      console.error('Failed to load courses');
    }
  };

  const fetchTasks = async (courseFilter) => {
    try {
      const url = courseFilter ? `/tasks?course=${courseFilter}` : '/tasks';
      const res = await API.get(url);
      setTasks(res.data);
    } catch (err) {
      setError('Failed to load tasks');
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title.trim() || !courseId || !deadline) return;
    setError('');
    try {
      const res = await API.post('/tasks', {
        title,
        course: courseId,
        deadline,
        priority,
      });
      setTasks([...tasks, res.data].sort((a, b) => new Date(a.deadline) - new Date(b.deadline)));
      setTitle('');
      setDeadline('');
      setPriority('medium');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add task');
    }
  };

  const handleToggle = async (task) => {
    try {
      const res = await API.put(`/tasks/${task._id}`, {
        completed: !task.completed,
      });
      setTasks(tasks.map((t) => (t._id === task._id ? res.data : t)));
    } catch (err) {
      setError('Failed to update task');
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/tasks/${id}`);
      setTasks(tasks.filter((t) => t._id !== id));
    } catch (err) {
      setError('Failed to delete task');
    }
  };

  const handleFilter = (courseId) => {
    setFilterCourse(courseId);
    fetchTasks(courseId);
  };

  const getPriorityClass = (priority) => {
    if (priority === 'high') return 'priority-high';
    if (priority === 'low') return 'priority-low';
    return 'priority-medium';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isOverdue = (deadline, completed) => {
    return !completed && new Date(deadline) < new Date();
  };

  return (
    <div className="tasks-page">
      <h1>My Tasks</h1>

      {error && <div className="error-message">{error}</div>}

      {courses.length === 0 ? (
        <div className="empty-state">
          <p>You need to add courses first before creating tasks.</p>
          <a href="/courses" className="btn-primary" style={{ display: 'inline-block', width: 'auto', padding: '10px 24px', textDecoration: 'none', textAlign: 'center' }}>
            Go to Courses
          </a>
        </div>
      ) : (
        <>
          <form onSubmit={handleAdd} className="task-form">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title (e.g. Finish homework 3)"
              required
            />
            <select value={courseId} onChange={(e) => setCourseId(e.target.value)} required>
              <option value="">Select course</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '10px 24px' }}>
              Add Task
            </button>
          </form>

          <div className="task-filters">
            <button
              className={`filter-btn ${filterCourse === '' ? 'active' : ''}`}
              onClick={() => handleFilter('')}
            >
              All
            </button>
            {courses.map((c) => (
              <button
                key={c._id}
                className={`filter-btn ${filterCourse === c._id ? 'active' : ''}`}
                onClick={() => handleFilter(c._id)}
                style={{ borderColor: c.color }}
              >
                <span className="filter-dot" style={{ backgroundColor: c.color }} />
                {c.name}
              </button>
            ))}
          </div>

          <div className="task-list">
            {tasks.length === 0 ? (
              <p className="empty-state">No tasks yet. Add your first task above!</p>
            ) : (
              tasks.map((task) => (
                <div
                  key={task._id}
                  className={`task-item ${task.completed ? 'task-completed' : ''} ${isOverdue(task.deadline, task.completed) ? 'task-overdue' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleToggle(task)}
                    className="task-checkbox"
                  />
                  <div className="task-info">
                    <span className="task-title">{task.title}</span>
                    <div className="task-meta">
                      {task.course && (
                        <span className="task-course" style={{ color: task.course.color }}>
                          {task.course.name}
                        </span>
                      )}
                      <span className={`task-deadline ${isOverdue(task.deadline, task.completed) ? 'overdue-text' : ''}`}>
                        {formatDate(task.deadline)}
                      </span>
                      <span className={`task-priority ${getPriorityClass(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(task._id)} className="btn-small btn-danger">
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Tasks;
