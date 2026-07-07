import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

const Groups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Create / join form state
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  // Goal input
  const [goalInput, setGoalInput] = useState('');

  useEffect(() => {
    fetchGroups();
  }, []);

  const clearAlerts = () => {
    setError('');
    setMessage('');
  };

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await API.get('/groups');
      setGroups(res.data);
      // Keep selected group fresh if it still exists
      if (selectedGroup) {
        const updated = res.data.find((g) => g._id === selectedGroup._id);
        setSelectedGroup(updated || null);
      }
    } catch (err) {
      setError('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    clearAlerts();
    try {
      const res = await API.post('/groups', { name: newGroupName });
      setGroups([res.data, ...groups]);
      setSelectedGroup(res.data);
      setNewGroupName('');
      setMessage(`Group created! Share code: ${res.data.joinCode}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group');
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    clearAlerts();
    try {
      const res = await API.post('/groups/join', { code: joinCode });
      setGroups([res.data, ...groups]);
      setSelectedGroup(res.data);
      setJoinCode('');
      setMessage(`Joined "${res.data.name}"!`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join group');
    }
  };

  const handleLeave = async (group) => {
    if (!window.confirm(`Leave "${group.name}"?`)) return;
    clearAlerts();
    try {
      await API.post(`/groups/${group._id}/leave`);
      setGroups(groups.filter((g) => g._id !== group._id));
      if (selectedGroup?._id === group._id) setSelectedGroup(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to leave group');
    }
  };

  const handleDeleteGroup = async (group) => {
    if (!window.confirm(`Delete "${group.name}" for everyone? This cannot be undone.`)) return;
    clearAlerts();
    try {
      await API.delete(`/groups/${group._id}`);
      setGroups(groups.filter((g) => g._id !== group._id));
      if (selectedGroup?._id === group._id) setSelectedGroup(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete group');
    }
  };

  const handleAddGoal = async () => {
    if (!goalInput.trim() || !selectedGroup) return;
    try {
      const res = await API.post(`/groups/${selectedGroup._id}/goals`, { title: goalInput });
      updateGroupInState(res.data);
      setGoalInput('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add goal');
    }
  };

  const handleToggleGoal = async (goalId) => {
    try {
      const res = await API.put(`/groups/${selectedGroup._id}/goals/${goalId}`);
      updateGroupInState(res.data);
    } catch (err) {
      setError('Failed to update goal');
    }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      const res = await API.delete(`/groups/${selectedGroup._id}/goals/${goalId}`);
      updateGroupInState(res.data);
    } catch (err) {
      setError('Failed to delete goal');
    }
  };

  const updateGroupInState = (updatedGroup) => {
    setGroups(groups.map((g) => (g._id === updatedGroup._id ? updatedGroup : g)));
    setSelectedGroup(updatedGroup);
  };

  const isOwner = (group) => group.owner?._id === user?._id;

  const goalProgress = (group) => {
    if (!group.goals || group.goals.length === 0) return null;
    const done = group.goals.filter((g) => g.completed).length;
    return `${done}/${group.goals.length}`;
  };

  if (loading) {
    return <div className="dashboard"><p>Loading groups...</p></div>;
  }

  return (
    <div className="groups-page">
      <h1>Study Groups</h1>
      <p>Create or join a group to share study goals with classmates.</p>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="group-forms">
        <form onSubmit={handleCreate} className="group-form">
          <input
            type="text"
            placeholder="New group name (e.g. Calculus Finals Squad)"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
          <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '9px 20px' }}>
            Create
          </button>
        </form>

        <form onSubmit={handleJoin} className="group-form">
          <input
            type="text"
            placeholder="Join code (e.g. X7K2M)"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={5}
            style={{ textTransform: 'uppercase' }}
          />
          <button type="submit" className="btn-small" style={{ padding: '9px 20px' }}>
            Join
          </button>
        </form>
      </div>

      <div className="groups-layout">
        <div className="groups-list">
          {groups.length === 0 ? (
            <p className="empty-state">No groups yet. Create one or join with a code.</p>
          ) : (
            groups.map((g) => (
              <div
                key={g._id}
                className={`group-card ${selectedGroup?._id === g._id ? 'active' : ''}`}
                onClick={() => { setSelectedGroup(g); clearAlerts(); }}
              >
                <div className="group-card-main">
                  <span className="group-name">{g.name}</span>
                  <div className="group-meta">
                    <span>{g.members.length} member{g.members.length === 1 ? '' : 's'}</span>
                    {goalProgress(g) && <span>· ☑ {goalProgress(g)}</span>}
                    {isOwner(g) && <span className="owner-badge">Owner</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {selectedGroup && (
          <div className="group-detail">
            <div className="group-detail-header">
              <div>
                <h2>{selectedGroup.name}</h2>
                <div className="join-code-row">
                  <span className="join-code-label">Join code:</span>
                  <span className="join-code">{selectedGroup.joinCode}</span>
                </div>
              </div>
              {isOwner(selectedGroup) ? (
                <button onClick={() => handleDeleteGroup(selectedGroup)} className="btn-small btn-danger">
                  Delete Group
                </button>
              ) : (
                <button onClick={() => handleLeave(selectedGroup)} className="btn-small btn-danger">
                  Leave
                </button>
              )}
            </div>

            <h3 className="group-section-title">Members</h3>
            <div className="member-list">
              {selectedGroup.members.map((m) => (
                <span key={m._id} className="member-chip">
                  {m.name}
                  {selectedGroup.owner?._id === m._id && ' 👑'}
                </span>
              ))}
            </div>

            <h3 className="group-section-title">Shared Goals</h3>
            {selectedGroup.goals.length === 0 ? (
              <p className="subtask-empty">No goals yet. Add the first one below.</p>
            ) : (
              <div className="goal-list">
                {selectedGroup.goals.map((goal) => (
                  <div key={goal._id} className={`goal-item ${goal.completed ? 'goal-completed' : ''}`}>
                    <input
                      type="checkbox"
                      checked={goal.completed}
                      onChange={() => handleToggleGoal(goal._id)}
                      className="subtask-checkbox"
                    />
                    <div className="goal-info">
                      <span className="goal-title">{goal.title}</span>
                      <span className="goal-meta">
                        added by {goal.addedBy?.name || 'someone'}
                        {goal.completed && goal.completedBy && ` · done by ${goal.completedBy.name}`}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteGoal(goal._id)}
                      className="subtask-delete"
                      title="Delete goal"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="subtask-add" style={{ marginTop: '12px' }}>
              <input
                type="text"
                placeholder="Add a shared goal..."
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddGoal();
                  }
                }}
              />
              <button onClick={handleAddGoal} className="btn-small">Add</button>
            </div>

            <button onClick={fetchGroups} className="btn-small" style={{ marginTop: '16px' }}>
              ↻ Refresh
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Groups;