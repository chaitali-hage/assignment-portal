import { useState, useEffect } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';

const empty = {
  title: '', subject: '', description: '',
  dueDate: '', maxMarks: '', allowResubmit: false
};

export default function Faculty() {
  const user = JSON.parse(localStorage.getItem('user'));

  const [form, setForm] = useState(empty);
  const [formMsg, setFormMsg] = useState('');
  const [formErr, setFormErr] = useState('');
  const [list, setList] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [subs, setSubs] = useState([]);
  const [grades, setGrades] = useState({});
  const [gradeMsg, setGradeMsg] = useState({});
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const loadList = async () => {
    const { data } = await api.get('/assignments');
    setList(data);
  };
  useEffect(() => { loadList(); }, []);

  const change = e => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const createAssignment = async e => {
    e.preventDefault();
    setFormMsg(''); setFormErr('');
    try {
      await api.post('/assignments', form);
      setForm(empty);
      setFormMsg('Assignment created!');
      loadList();
    } catch (err) {
      setFormErr(err.response?.data?.message || 'Something went wrong');
    }
  };

  const remove = async a => {
    if (!window.confirm(`Delete "${a.title}" and all its submissions?`)) return;
    try {
      await api.delete(`/assignments/${a._id}`);
      if (openId === a._id) setOpenId(null);
      loadList();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete');
    }
  };

  const loadSubs = async id => {
    const { data } = await api.get(`/submissions/assignment/${id}`);
    setSubs(data);
    const g = {};
    data.forEach(s => { g[s._id] = { marks: s.marks ?? '', remarks: s.remarks || '' }; });
    setGrades(g);
  };

  const toggleSubs = async id => {
    if (openId === id) { setOpenId(null); return; }
    setOpenId(id);
    setGradeMsg({});
    await loadSubs(id);
  };

  const changeGrade = (id, field, value) =>
    setGrades({ ...grades, [id]: { ...grades[id], [field]: value } });

  const saveGrade = async s => {
    try {
      await api.put(`/submissions/${s._id}/grade`, grades[s._id]);
      setGradeMsg({ ...gradeMsg, [s._id]: { ok: true, text: 'Saved!' } });
      loadSubs(openId);
      loadList();
    } catch (err) {
      setGradeMsg({
        ...gradeMsg,
        [s._id]: { ok: false, text: err.response?.data?.message || 'Error' }
      });
    }
  };

  const now = new Date();
  const isClosed = a => now > new Date(a.dueDate);
  const openCount = list.filter(a => !isClosed(a)).length;
  const toGrade = list.reduce((n, a) => n + (a.submissionCount - a.gradedCount), 0);

  const shown = list.filter(a => {
    const q = search.toLowerCase();
    const matches = a.title.toLowerCase().includes(q) || a.subject.toLowerCase().includes(q);
    const status = filter === 'All' || (filter === 'Open' ? !isClosed(a) : isClosed(a));
    return matches && status;
  });

  return (
    <>
      <Navbar />
      <div className="page">
        <div className="page-title">
          <h2>Hello, {user.name} 👋</h2>
          <p>Create assignments and grade your students' work.</p>
        </div>

        <div className="stats">
          <div className="stat"><b>{list.length}</b><span>Total assignments</span></div>
          <div className="stat green"><b>{openCount}</b><span>Open</span></div>
          <div className="stat warn"><b>{list.length - openCount}</b><span>Closed</span></div>
          <div className="stat blue"><b>{toGrade}</b><span>Waiting for grading</span></div>
        </div>

        <div className="grid2">
          <div className="panel">
            <h3>➕ New assignment</h3>
            <form onSubmit={createAssignment}>
              <input name="title" placeholder="Title" value={form.title} onChange={change} />
              <input name="subject" placeholder="Subject" value={form.subject} onChange={change} />
              <textarea name="description" placeholder="Description" value={form.description} onChange={change} />
              <label>Due date and time</label>
              <input name="dueDate" type="datetime-local" value={form.dueDate} onChange={change} />
              <input name="maxMarks" type="number" placeholder="Max marks" value={form.maxMarks} onChange={change} />
              <label>
                <input name="allowResubmit" type="checkbox" checked={form.allowResubmit} onChange={change} />
                Allow students to resubmit
              </label>
              {formErr && <div className="error">{formErr}</div>}
              {formMsg && <div className="ok">{formMsg}</div>}
              <button type="submit">Post assignment</button>
            </form>
          </div>

          <div>
            <h3 className="list-title">📚 My assignments</h3>
            <div className="toolbar">
              <input
                placeholder="🔍 Search by title or subject"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <select value={filter} onChange={e => setFilter(e.target.value)}>
                <option>All</option>
                <option>Open</option>
                <option>Closed</option>
              </select>
            </div>

            {shown.length === 0 && (
              <div className="empty">
                {list.length === 0 ? 'No assignments yet. Create your first one!' : 'No assignments match your search.'}
              </div>
            )}

            {shown.map(a => {
              const closed = isClosed(a);
              return (
                <div className="item" key={a._id}>
                  <div className="item-head">
                    <b>{a.title}</b>
                    <div>
                      <span className="tag">{a.subject}</span>
                      <span className={`tag ${closed ? 'status-Closed' : 'status-Open'}`}>
                        {closed ? 'Closed' : 'Open'}
                      </span>
                    </div>
                  </div>
                  {a.description && <p>{a.description}</p>}
                  <div className="meta">
                    <span>📅 {new Date(a.dueDate).toLocaleString()}</span>
                    <span>🎯 Max marks: {a.maxMarks}</span>
                    {a.allowResubmit && <span>🔁 Resubmit allowed</span>}
                  </div>
                  <div className="meta">
                    <span className="tag count">📥 {a.submissionCount} submitted</span>
                    <span className="tag count">✅ {a.gradedCount} graded</span>
                  </div>
                  <div className="actions">
                    <button className="small" onClick={() => toggleSubs(a._id)}>
                      {openId === a._id ? 'Hide submissions' : 'View submissions'}
                    </button>
                    <button className="small danger" onClick={() => remove(a)}>Delete</button>
                  </div>

                  {openId === a._id && (
                    <div>
                      {subs.length === 0 && <p>No submissions yet.</p>}
                      {subs.map(s => (
                        <div className="item" key={s._id}>
                          <div className="item-head">
                            <b>{s.student?.name} <small>({s.student?.email})</small></b>
                            {s.marks !== null && (
                              <span className="tag status-Graded">Graded: {s.marks}/{a.maxMarks}</span>
                            )}
                          </div>
                          <p>🔗 <a href={s.projectLink} target="_blank" rel="noreferrer">{s.projectLink}</a></p>
                          {s.notes && <p>📝 {s.notes}</p>}
                          <div className="meta"><span>Submitted: {new Date(s.createdAt).toLocaleString()}</span></div>
                          <input
                            type="number"
                            placeholder={`Marks (0 to ${a.maxMarks})`}
                            value={grades[s._id]?.marks ?? ''}
                            onChange={e => changeGrade(s._id, 'marks', e.target.value)}
                          />
                          <input
                            placeholder="Remarks"
                            value={grades[s._id]?.remarks ?? ''}
                            onChange={e => changeGrade(s._id, 'remarks', e.target.value)}
                          />
                          <button className="small green" onClick={() => saveGrade(s)}>Save grade</button>
                          {gradeMsg[s._id] && (
                            <div className={gradeMsg[s._id].ok ? 'ok' : 'error'}>{gradeMsg[s._id].text}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}