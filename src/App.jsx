import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'https://email-service-backend-rp0g.onrender.com/api';

export default function App() {
  const [page, setPage] = useState('login'); // login, register, dashboard
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [inboxes, setInboxes] = useState([]);
  const [selectedInbox, setSelectedInbox] = useState(null);
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [newInboxName, setNewInboxName] = useState('');
  const [emailsLoading, setEmailsLoading] = useState(false);

  // ==================== AUTH ====================

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await axios.post(`${API_URL}/auth/register`, {
        username,
        email,
        password
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setPage('dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Greška pri registraciji');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setPage('dashboard');
      loadInboxes(data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Greška pri logiranju');
    } finally {
      setLoading(false);
    }
  };

  // ==================== INBOX ====================

  const loadInboxes = useCallback(async (authToken) => {
  try {
    const { data } = await axios.get(`${API_URL}/inbox/list`, {
      headers: { Authorization: `Bearer ${authToken || token}` }
    });
    setInboxes(data);
  } catch (err) {
    console.error('Greška pri učitavanju inboxa:', err);
  }
}, [token]);

  const createInbox = async (e) => {
    e.preventDefault();
    if (!newInboxName.trim()) return;

    try {
      const { data } = await axios.post(
        `${API_URL}/inbox/create`,
        { inboxName: newInboxName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInboxes([data, ...inboxes]);
      setNewInboxName('');
    } catch (err) {
      setError(err.response?.data?.error || 'Greška');
    }
  };

  const deleteInbox = async (inboxId) => {
    if (!window.confirm('Obriši inbox?')) return;

    try {
      await axios.delete(`${API_URL}/inbox/${inboxId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInboxes(inboxes.filter((i) => i._id !== inboxId));
      if (selectedInbox === inboxId) {
        setSelectedInbox(null);
        setEmails([]);
      }
    } catch (err) {
      alert('Greška pri brisanju');
    }
  };

  // ==================== EMAIL ====================

  const loadEmails = async (inboxId) => {
    setEmailsLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/emails/${inboxId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmails(data);
      setSelectedInbox(inboxId);
    } catch (err) {
      console.error('Greška pri učitavanju emaila:', err);
    } finally {
      setEmailsLoading(false);
    }
  };

  useEffect(() => {
  if (token && page === 'dashboard') {
    loadInboxes(token);
  }
}, [token, page, loadInboxes]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setPage('login');
    setInboxes([]);
    setEmails([]);
  };

  const currentInbox = inboxes.find((i) => i._id === selectedInbox);

  // ==================== UI ====================

  if (page === 'login') {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <h1>📧 Email Servis</h1>
          <p>Prijava</p>

          {error && <div className="error-box">{error}</div>}

          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Lozinka"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Učitavanje...' : 'Prijava'}
            </button>
          </form>

          <p className="auth-link">
            Nemaš račun?{' '}
            <span onClick={() => { setPage('register'); setError(''); }}>
              Registruj se
            </span>
          </p>
        </div>
      </div>
    );
  }

  if (page === 'register') {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <h1>📧 Email Servis</h1>
          <p>Registracija</p>

          {error && <div className="error-box">{error}</div>}

          <form onSubmit={handleRegister}>
            <input
              type="text"
              placeholder="Korisničko ime"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Lozinka"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Učitavanje...' : 'Registracija'}
            </button>
          </form>

          <p className="auth-link">
            Već imaš račun?{' '}
            <span onClick={() => { setPage('login'); setError(''); }}>
              Prijava
            </span>
          </p>
        </div>
      </div>
    );
  }

  if (page === 'dashboard') {
    return (
      <div className="dashboard">
        <div className="sidebar">
          <div className="sidebar-header">
            <h2>📧 Inboxi</h2>
            <button className="logout-btn" onClick={handleLogout}>
              Odjava
            </button>
          </div>

          <p className="user-info">Ulogovan kao: <b>{user?.username}</b></p>

          <form onSubmit={createInbox} className="create-inbox-form">
            <input
              type="text"
              placeholder="inbox_name"
              value={newInboxName}
              onChange={(e) => setNewInboxName(e.target.value)}
            />
            <button type="submit">+</button>
          </form>

          <div className="inboxes-list">
            {inboxes.length === 0 ? (
              <p className="no-inboxes">Nema inboxa. Kreiraj novi!</p>
            ) : (
              inboxes.map((inbox) => (
                <div
                  key={inbox._id}
                  className={`inbox-item ${selectedInbox === inbox._id ? 'active' : ''}`}
                  onClick={() => loadEmails(inbox._id)}
                >
                  <div className="inbox-info">
                    <p className="inbox-name">{inbox.inboxName}</p>
                    <p className="inbox-email">{inbox.emailAddress}</p>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteInbox(inbox._id);
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="main-content">
          {selectedInbox ? (
            <div className="inbox-view">
              <div className="inbox-header">
                <div>
                  <h3>📬 {currentInbox?.inboxName}</h3>
                  <p>{currentInbox?.emailAddress}</p>
                </div>
                <button className="refresh-btn" onClick={() => loadEmails(selectedInbox)}>
                  🔄 Osvježi
                </button>
              </div>

              {selectedEmail ? (
                <div className="email-detail">
                  <button className="back-btn" onClick={() => setSelectedEmail(null)}>
                    ← Nazad
                  </button>
                  <div className="email-header">
                    <p><b>Od:</b> {selectedEmail.from}</p>
                    <p><b>Za:</b> {selectedEmail.to}</p>
                    <p><b>Vrijeme:</b> {new Date(selectedEmail.timestamp).toLocaleString()}</p>
                    <h4>{selectedEmail.subject}</h4>
                  </div>
                  <div className="email-body">
                    {selectedEmail.html ? (
                      <div dangerouslySetInnerHTML={{ __html: selectedEmail.html }} />
                    ) : (
                      <p>{selectedEmail.text}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="emails-list">
                  {emailsLoading ? (
                    <p>Učitavanje emaila...</p>
                  ) : emails.length === 0 ? (
                    <p>Nema primljenih emaila</p>
                  ) : (
                    emails.map((email) => (
                      <div
                        key={email._id}
                        className="email-item"
                        onClick={() => setSelectedEmail(email)}
                      >
                        <div className="email-content">
                          <p className="from">{email.from}</p>
                          <p className="subject">{email.subject}</p>
                          <p className="preview">{email.text?.substring(0, 100)}...</p>
                        </div>
                        <p className="timestamp">
                          {new Date(email.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <p>📬</p>
              <p>Odaberi inbox sa lijeve strane</p>
            </div>
          )}
        </div>
      </div>
    );
  }
}
