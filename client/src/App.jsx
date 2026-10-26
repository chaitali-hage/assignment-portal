import { Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Faculty from './pages/Faculty';
import Student from './pages/Student';

const getUser = () => {
  try { return JSON.parse(localStorage.getItem('user')); }
  catch { return null; }
};

// only lets the right role open a page
function Guard({ role, children }) {
  const user = getUser();
  if (!user) return <Navigate to="/" />;
  if (user.role !== role)
    return <Navigate to={user.role === 'faculty' ? '/faculty' : '/student'} />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Auth />} />
      <Route path="/faculty" element={<Guard role="faculty"><Faculty /></Guard>} />
      <Route path="/student" element={<Guard role="student"><Student /></Guard>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}