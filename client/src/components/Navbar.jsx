import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const nav = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const [dark, setDark] = useState(localStorage.getItem('theme') === 'dark');

  const toggle = () => {
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
    setDark(!dark);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    nav('/');
  };

  return (
    <div className="navbar">
      <div className="brand">🎓 AssignHub</div>
      <div className="nav-right">
        <button className="ghost" onClick={toggle}>{dark ? '☀️' : '🌙'}</button>
        <div className="avatar">{user.name?.[0]?.toUpperCase()}</div>
        <div className="who">
          <b>{user.name}</b>
          <small>{user.role === 'faculty' ? 'Faculty' : 'Student'}</small>
        </div>
        <button className="ghost" onClick={logout}>Logout</button>
      </div>
    </div>
  );
}