import { useState, useEffect } from 'react';
import API from '../utils/api';

const COLORS = [
  '#4f46e5', '#dc2626', '#16a34a', '#ca8a04',
  '#9333ea', '#0891b2', '#e11d48', '#ea580c',
];

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await API.get('/courses');
      setCourses(res.data);
    } catch (err) {
      setError('Failed to load courses');
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError('');
    try {
      const res = await API.post('/courses', { name, color });
      setCourses([res.data, ...courses]);
      setName('');
      setColor(COLORS[0]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add course');
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/courses/${id}`);
      setCourses(courses.filter((c) => c._id !== id));
    } catch (err) {
      setError('Failed to delete course');
    }
  };

  const handleEdit = async (id) => {
    if (!editName.trim()) return;
    try {
      const res = await API.put(`/courses/${id}`, { name: editName });
      setCourses(courses.map((c) => (c._id === id ? res.data : c)));
      setEditingId(null);
      setEditName('');
    } catch (err) {
      setError('Failed to update course');
    }
  };

  return (
    <div className="courses-page">
      <h1>My Courses</h1>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleAdd} className="course-form">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Course name (e.g. Data Structures)"
          required
        />
        <div className="color-picker">
          {COLORS.map((c) => (
            <button
              type="button"
              key={c}
              className={`color-dot ${color === c ? 'active' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
        <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '10px 24px' }}>
          Add Course
        </button>
      </form>

      <div className="course-list">
        {courses.length === 0 ? (
          <p className="empty-state">No courses yet. Add your first course above!</p>
        ) : (
          courses.map((course) => (
            <div key={course._id} className="course-item">
              <div className="course-color" style={{ backgroundColor: course.color }} />
              {editingId === course._id ? (
                <div className="course-edit">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                  />
                  <button onClick={() => handleEdit(course._id)} className="btn-small">Save</button>
                  <button onClick={() => setEditingId(null)} className="btn-small btn-cancel">Cancel</button>
                </div>
              ) : (
                <>
                  <span className="course-name">{course.name}</span>
                  <div className="course-actions">
                    <button
                      onClick={() => { setEditingId(course._id); setEditName(course.name); }}
                      className="btn-small"
                    >
                      Edit
                    </button>
                    <button onClick={() => handleDelete(course._id)} className="btn-small btn-danger">
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Courses;
