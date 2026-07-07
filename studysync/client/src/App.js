import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import Tasks from './pages/Tasks';
import Calendar from './pages/Calendar';
import Pomodoro from './pages/Pomodoro';
import Analytics from './pages/Analytics';
import Groups from './pages/Groups';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import './App.css';

const Layout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (!user || isAuthPage) {
    return <div className="auth-layout">{children}</div>;
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/courses" element={<PrivateRoute><Courses /></PrivateRoute>} />
            <Route path="/tasks" element={<PrivateRoute><Tasks /></PrivateRoute>} />
            <Route path="/calendar" element={<PrivateRoute><Calendar /></PrivateRoute>} />
            <Route path="/timer" element={<PrivateRoute><Pomodoro /></PrivateRoute>} />
            <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
            <Route path="/groups" element={<PrivateRoute><Groups /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;