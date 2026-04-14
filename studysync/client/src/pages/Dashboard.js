import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard">
      <h1>Welcome, {user?.name}!</h1>
      <p>Your StudySync dashboard. We'll add charts and stats here soon.</p>
      <div className="dashboard-cards">
        <div className="card">
          <h3>Courses</h3>
          <p>0 courses</p>
        </div>
        <div className="card">
          <h3>Tasks</h3>
          <p>0 pending</p>
        </div>
        <div className="card">
          <h3>Study time</h3>
          <p>0 hours this week</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
