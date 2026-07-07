import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

const Settings = () => {
  const { user, refreshUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [message, setMessage] = useState(null);
  const [error, setError] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Handle redirect query params after OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const googleStatus = params.get('google');

    if (googleStatus === 'connected') {
      setMessage('✓ Google Calendar connected successfully.');
      refreshUser();
      // Clean up URL
      navigate('/settings', { replace: true });
    } else if (googleStatus === 'denied') {
      setError('You denied access to Google Calendar.');
      navigate('/settings', { replace: true });
    } else if (googleStatus === 'error') {
      setError('Something went wrong connecting Google Calendar. Try again.');
      navigate('/settings', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const handleConnect = async () => {
    setConnecting(true);
    setError('');
    try {
      const res = await API.get('/google/auth-url');
      // Redirect the entire browser to Google's consent page
      window.location.href = res.data.url;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start Google connection');
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect Google Calendar? Future task changes will no longer sync.')) {
      return;
    }
    setDisconnecting(true);
    setError('');
    try {
      await API.post('/google/disconnect');
      await refreshUser();
      setMessage('Google Calendar disconnected.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to disconnect');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="settings-page">
      <h1>Settings</h1>
      <p>Manage integrations and account preferences.</p>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="settings-section">
        <h2>Integrations</h2>

        <div className="integration-card">
          <div className="integration-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>

          <div className="integration-info">
            <div className="integration-title">
              Google Calendar
              {user?.googleConnected && (
                <span className="status-pill status-connected">Connected</span>
              )}
            </div>
            <p className="integration-desc">
              {user?.googleConnected
                ? 'Your tasks automatically sync to your Google Calendar. Edits in StudySync push to Google in real time.'
                : 'Push your StudySync tasks to your Google Calendar. Create, edit, or delete tasks in StudySync and they mirror to your calendar automatically.'}
            </p>
          </div>

          <div className="integration-action">
            {user?.googleConnected ? (
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="btn-small btn-danger"
              >
                {disconnecting ? 'Disconnecting...' : 'Disconnect'}
              </button>
            ) : (
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="btn-primary"
                style={{ width: 'auto', padding: '10px 20px' }}
              >
                {connecting ? 'Redirecting...' : 'Connect Google Calendar'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h2>Account</h2>
        <div className="account-info">
          <div className="account-row">
            <span className="account-label">Name</span>
            <span className="account-value">{user?.name}</span>
          </div>
          <div className="account-row">
            <span className="account-label">Email</span>
            <span className="account-value">{user?.email}</span>
          </div>
          <div className="account-row">
            <span className="account-label">Role</span>
            <span className="account-value" style={{ textTransform: 'capitalize' }}>{user?.role}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;