import React, { useEffect, useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

function App() {
  const [accounts, setAccounts] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;

    fetch(`${API_URL}/api/accounts`)
      .then((res) => {
        if (!res.ok) throw new Error(`Backend responded with ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setAccounts(data);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('unreachable');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: 480 }}>
      <h1>DevBank</h1>

      {status === 'loading' && <p>Loading accounts…</p>}

      {status === 'ready' && (
        <>
          <p style={{ color: '#2e7d32' }}>Connected to backend</p>
          <ul>
            {accounts.map((a) => (
              <li key={a.id}>
                {a.name}: ${a.balance.toFixed(2)}
              </li>
            ))}
          </ul>
        </>
      )}

      {status === 'unreachable' && (
        <div
          style={{
            background: '#fff3e0',
            border: '1px solid #ffb74d',
            borderRadius: 8,
            padding: '1rem',
          }}
        >
          <p style={{ margin: 0, fontWeight: 'bold' }}>Backend not reachable</p>
          <p style={{ margin: '0.5rem 0 0' }}>
            The frontend is running, but it couldn't reach the backend API at{' '}
            <code>{API_URL}</code>. This is expected if the backend service
            isn't deployed yet, or if <code>REACT_APP_API_URL</code> was set
            incorrectly at build time.
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
