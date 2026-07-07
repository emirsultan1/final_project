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

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('deadline-asc');

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCourseId, setEditCourseId] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editPriority, setEditPriority] = useState('medium');

  // Subtask state
  const [expandedId, setExpandedId] = useState(null);
  const [subtaskInputs, setSubtaskInputs] = useState({}); // { [taskId]: "draft text" }

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
      setTasks([...tasks, res.data]);
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

  const startEdit = (task) => {
    setEditingId(task._id);
    setEditTitle(task.title);
    setEditCourseId(task.course?._id || '');
    setEditDeadline(new Date(task.deadline).toISOString().split('T')[0]);
    setEditPriority(task.priority);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditCourseId('');
    setEditDeadline('');
    setEditPriority('medium');
  };

  const handleSaveEdit = async (id) => {
    if (!editTitle.trim() || !editCourseId || !editDeadline) return;
    try {
      const res = await API.put(`/tasks/${id}`, {
        title: editTitle,
        course: editCourseId,
        deadline: editDeadline,
        priority: editPriority,
      });
      setTasks(tasks.map((t) => (t._id === id ? res.data : t)));
      cancelEdit();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task');
    }
  };

  // ===== Subtask handlers =====
  const toggleExpand = (taskId) => {
    setExpandedId(expandedId === taskId ? null : taskId);
  };

  const handleAddSubtask = async (taskId) => {
    const text = (subtaskInputs[taskId] || '').trim();
    if (!text) return;
    try {
      const res = await API.post(`/tasks/${taskId}/subtasks`, { title: text });
      setTasks(tasks.map((t) => (t._id === taskId ? res.data : t)));
      setSubtaskInputs({ ...subtaskInputs, [taskId]: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add subtask');
    }
  };

  const handleToggleSubtask = async (taskId, subtaskId) => {
    try {
      const res = await API.put(`/tasks/${taskId}/subtasks/${subtaskId}`);
      setTasks(tasks.map((t) => (t._id === taskId ? res.data : t)));
    } catch (err) {
      setError('Failed to update subtask');
    }
  };

  const handleDeleteSubtask = async (taskId, subtaskId) => {
    try {
      const res = await API.delete(`/tasks/${taskId}/subtasks/${subtaskId}`);
      setTasks(tasks.map((t) => (t._id === taskId ? res.data : t)));
    } catch (err) {
      setError('Failed to delete subtask');
    }
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

  const subtaskProgress = (task) => {
    if (!task.subtasks || task.subtasks.length === 0) return null;
    const done = task.subtasks.filter((s) => s.completed).length;
    return `${done}/${task.subtasks.length}`;
  };

  const visibleTasks = (() => {
    let list = [...tasks];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q));
    }
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    list.sort((a, b) => {
      switch (sortBy) {
        case 'deadline-asc':
          return new Date(a.deadline) - new Date(b.deadline);
        case 'deadline-desc':
          return new Date(b.deadline) - new Date(a.deadline);
        case 'priority':
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'created-desc':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'created-asc':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'completed':
          return Number(a.completed) - Number(b.completed);
        default:
          return 0;
      }
    });
    return list;
  })();

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

          <div className="task-controls">
            <input
              type="text"
              className="task-search"
              placeholder="Search tasks by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="task-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="deadline-asc">Deadline (earliest first)</option>
              <option value="deadline-desc">Deadline (latest first)</option>
              <option value="priority">Priority (high → low)</option>
              <option value="created-desc">Newest first</option>
              <option value="created-asc">Oldest first</option>
              <option value="completed">Pending first</option>
            </select>
          </div>

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
            {visibleTasks.length === 0 ? (
              <p className="empty-state">
                {tasks.length === 0
                  ? 'No tasks yet. Add your first task above!'
                  : 'No tasks match your search.'}
              </p>
            ) : (
              visibleTasks.map((task) => (
                <div
                  key={task._id}
                  className={`task-item-wrapper ${expandedId === task._id ? 'expanded' : ''}`}
                >
                  <div
                    className={`task-item ${task.completed ? 'task-completed' : ''} ${isOverdue(task.deadline, task.completed) ? 'task-overdue' : ''}`}
                  >
                    {editingId === task._id ? (
                      <div className="task-edit">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          autoFocus
                        />
                        <select value={editCourseId} onChange={(e) => setEditCourseId(e.target.value)}>
                          {courses.map((c) => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                          ))}
                        </select>
                        <input
                          type="date"
                          value={editDeadline}
                          onChange={(e) => setEditDeadline(e.target.value)}
                        />
                        <select value={editPriority} onChange={(e) => setEditPriority(e.target.value)}>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                        <button onClick={() => handleSaveEdit(task._id)} className="btn-small">Save</button>
                        <button onClick={cancelEdit} className="btn-small btn-cancel">Cancel</button>
                      </div>
                    ) : (
                      <>
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
                            {subtaskProgress(task) && (
                              <span className="subtask-count">☑ {subtaskProgress(task)}</span>
                            )}
                          </div>
                        </div>
                        <div className="task-actions">
                          <button onClick={() => toggleExpand(task._id)} className="btn-small">
                            {expandedId === task._id ? 'Hide' : 'Subtasks'}
                          </button>
                          <button onClick={() => startEdit(task)} className="btn-small">
                            Edit
                          </button>
                          <button onClick={() => handleDelete(task._id)} className="btn-small btn-danger">
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {expandedId === task._id && editingId !== task._id && (
                    <div className="subtask-panel">
                      {task.subtasks && task.subtasks.length > 0 ? (
                        <div className="subtask-list">
                          {task.subtasks.map((st) => (
                            <div key={st._id} className={`subtask-item ${st.completed ? 'subtask-completed' : ''}`}>
                              <input
                                type="checkbox"
                                checked={st.completed}
                                onChange={() => handleToggleSubtask(task._id, st._id)}
                                className="subtask-checkbox"
                              />
                              <span className="subtask-title">{st.title}</span>
                              <button
                                onClick={() => handleDeleteSubtask(task._id, st._id)}
                                className="subtask-delete"
                                title="Delete subtask"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="subtask-empty">No subtasks yet. Add one below.</p>
                      )}

                      <div className="subtask-add">
                        <input
                          type="text"
                          placeholder="Add a subtask..."
                          value={subtaskInputs[task._id] || ''}
                          onChange={(e) =>
                            setSubtaskInputs({ ...subtaskInputs, [task._id]: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSubtask(task._id);
                            }
                          }}
                        />
                        <button onClick={() => handleAddSubtask(task._id)} className="btn-small">
                          Add
                        </button>
                      </div>
                    </div>
                  )}
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