import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Auth() {
  const nav = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [error, setError] = useState('');

  const change = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setError('');
    try {
      const url = mode === 'login' ? '/auth/login' : '/auth/register';
      const { data } = await api.post(url, form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      nav(data.user.role === 'faculty' ? '/faculty' : '/student');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-hero">
        <h1>🎓 AssignHub</h1>
        <p>Post assignments, submit your work and track grades, all in one place.</p>
        <ul>
          <li>✅ Faculty post and grade assignments</li>
          <li>✅ Students submit before the deadline</li>
          <li>✅ Instant marks and feedback</li>
        </ul>
      </div>

      <div className="auth-side">
        <div className="auth-box">
          <h2>{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
          <p className="sub">
            {mode === 'login' ? 'Login to continue' : 'Register to get started'}
          </p>
          <form onSubmit={submit}>
            {mode === 'register' && (
              <>
                <input name="name" placeholder="Full name" value={form.name} onChange={change} />
                <select name="role" value={form.role} onChange={change}>
                  <option value="student">I am a Student</option>
                  <option value="faculty">I am Faculty</option>
                </select>
              </>
            )}
            <input name="email" type="email" placeholder="Email" value={form.email} onChange={change} />
            <input name="password" type="password" placeholder="Password" value={form.password} onChange={change} />
            {error && <div className="error">{error}</div>}
            <button type="submit">{mode === 'login' ? 'Login' : 'Create account'}</button>
          </form>
          <p className="switch" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
            {mode === 'login' ? 'New here? Register' : 'Already have an account? Login'}
          </p>
        </div>
      </div>
    </div>
  );
}