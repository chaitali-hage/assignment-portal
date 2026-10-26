import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:5000/api' });

// automatically sends the login token with every request
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

export default api;