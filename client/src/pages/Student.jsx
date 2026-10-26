import { useState, useEffect } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';

// "Due in 3d", "Due in 5h" ...
const dueText = d => {
  const ms = new Date(d) - new Date();
  if (ms <= 0) return null;
  const h = Math.floor(ms / 36e5);
  if (h < 1) return { text: 'Due in less than 1h', soon: true };
  if (h < 24) return { text: `Due in ${h}h`, soon: true };
  const days = Math.floor(h / 24);
  return { text: `Due in ${days}d`, soon: days < 2 };
};

export default function Student() {
  const user = JSON.parse(localStorage.getItem('user'));

  const [list, setList] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [form, setForm] = useState({ projectLink: '', notes: '' });
  const [msg, setMsg] = useState({});
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const load = async () => {
    const { data } = await api.get('/assignments');
    setList(data);
  };
  useEffect(() => { load(); }, []);

  const openForm = a => {
    if (openId === a._id) { setOpenId(null); return; }
    setOpenId(a._id);
    setForm({
      projectLink: a.submission?.projectLink || '',
      notes: a.submission?.notes || ''
    });
    setMsg({});
  };

  const submit = async a => {
    try {
      await api.post(`/submissions/${a._id}`, form);
      setMsg({ [a._id]: { ok: true, text: 'Submitted successfully!' } });
      setOpenId(null);
      load();
    } catch (err) {
      setMsg({
        [a._id]: { ok: false, text: err.response?.data?.message || 'Something went wrong' }
      });
    }
  };

  const count = s => list.filter(a => a.status === s).length;
  const graded = list.filter(a => a.status === 'Graded');
  const avg = graded.length
    ? Math.round(graded.reduce((sum, a) => sum + (a.submission.marks / a.maxMarks) * 100, 0) / graded.length)
    : null;

  const shown = list.filter(a => {
    const q = search.toLowerCase();
    const matches = a.title.toLowerCase().includes(q) || a.subject.toLowerCase().includes(q);
    return matches && (filter === 'All' || a.status === filter);
  });

  return (
    <>
      <Navbar />
      <div className="page">
        <div className="page-title">
          <h2>Hello, {user.name} 👋</h2>
          <p>Submit your work before the deadline and track your grades.</p>
        </div>

        <div className="stats">
          <div className="stat warn"><b>{count('Pending')}</b><span>Pending</span></div>
          <div className="stat blue"><b>{count('Submitted')}</b><span>Submitted</span></div>
          <div className="stat green"><b>{count('Graded')}</b><span>Graded</span></div>
          <div className="stat"><b>{avg === null ? '–' : avg + '%'}</b><span>Average score</span></div>
        </div>

        <h3 className="list-title">📚 Assignments</h3>
        <div className="toolbar">
          <input
            placeholder="🔍 Search by title or subject"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option>All</option>
            <option>Pending</option>
            <option>Submitted</option>
            <option>Graded</option>
          </select>
        </div>

        {shown.length === 0 && (
          <div className="empty">
            {list.length === 0 ? 'No assignments yet.' : 'No assignments match your search.'}
          </div>
        )}

        {shown.map(a => {
          const closed = new Date() > new Date(a.dueDate);
          const due = dueText(a.dueDate);
          const canSubmit = !closed && (a.status === 'Pending' || a.allowResubmit);
          const pct = a.status === 'Graded'
            ? Math.round((a.submission.marks / a.maxMarks) * 100) : 0;

          return (
            <div className="item" key={a._id}>
              <div className="item-head">
                <b>{a.title}</b>
                <div>
                  <span className="tag">{a.subject}</span>
                  <span className={`tag status-${a.status}`}>{a.status}</span>
                  {closed && <span className="tag status-Closed">Closed</span>}
                  {due && a.status === 'Pending' && (
                    <span className={`tag ${due.soon ? 'soon' : ''}`}>⏰ {due.text}</span>
                  )}
                </div>
              </div>
              {a.description && <p>{a.description}</p>}
              <div className="meta">
                <span>📅 Due: {new Date(a.dueDate).toLocaleString()}</span>
                <span>🎯 Max marks: {a.maxMarks}</span>
              </div>

              {a.submission && (
                <div className="meta">
                  <span>
                    🔗 <a href={a.submission.projectLink} target="_blank" rel="noreferrer">
                      {a.submission.projectLink}
                    </a>
                  </span>
                  {a.submission.notes && <span>📝 {a.submission.notes}</span>}
                </div>
              )}

              {a.status === 'Graded' && (
                <div className="marks">
                  <strong>{a.submission.marks} / {a.maxMarks}</strong> ({pct}%)
                  {a.submission.remarks && <p>💬 {a.submission.remarks}</p>}
                  <div className="bar">
                    <div
                      className={`fill ${pct >= 75 ? 'good' : pct >= 40 ? 'mid' : 'low'}`}
                      style={{ width: pct + '%' }}
                    />
                  </div>
                </div>
              )}

              {canSubmit && (
                <button className="small" onClick={() => openForm(a)}>
                  {openId === a._id ? 'Cancel' : a.status === 'Pending' ? 'Submit work' : 'Resubmit'}
                </button>
              )}
              {closed && a.status === 'Pending' && (
                <div className="error">Due date passed. You can no longer submit.</div>
              )}

              {openId === a._id && (
                <form onSubmit={e => { e.preventDefault(); submit(a); }}>
                  <input
                    placeholder="Project link (https://...)"
                    value={form.projectLink}
                    onChange={e => setForm({ ...form, projectLink: e.target.value })}
                  />
                  <textarea
                    placeholder="Work notes"
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                  />
                  <button type="submit">Send</button>
                </form>
              )}

              {msg[a._id] && (
                <div className={msg[a._id].ok ? 'ok' : 'error'}>{msg[a._id].text}</div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}