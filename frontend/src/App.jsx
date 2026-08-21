import { useEffect, useState } from 'react';
import { api } from './api.js';
import Login from './components/Login.jsx';
import Feed from './components/Feed.jsx';

export default function App() {
  const [status, setStatus] = useState('checking'); // checking | authed | anon

  useEffect(() => {
    api
      .session()
      .then((res) => setStatus(res.authenticated ? 'authed' : 'anon'))
      .catch(() => setStatus('anon'));
  }, []);

  async function handleLogin(pin) {
    await api.login(pin);
    setStatus('authed');
  }

  async function handleLogout() {
    await api.logout();
    setStatus('anon');
  }

  if (status === 'checking') return null;
  if (status === 'anon') return <Login onLogin={handleLogin} />;
  return <Feed onLogout={handleLogout} />;
}
