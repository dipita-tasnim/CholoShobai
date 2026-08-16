import { useState, useEffect, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import './AdminDashboard.css';
import { API_BASE } from '../config';

const PAGE_SIZE = 8;

// ---- helpers -------------------------------------------------------------

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const fetchJson = async (url, options = {}) => {
  const headers = { ...authHeaders(), ...(options.headers || {}) };
  if (options.body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
  if (!res.ok) {
    let msg = 'Request failed';
    try { const d = await res.json(); msg = d.message || msg; } catch (e) { /* ignore */ }
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  try { return await res.json(); } catch (e) { return null; }
};

const formatName = (u) => {
  if (!u) return 'Unknown';
  const f = u.fullname || {};
  const name = `${f.firstname || ''} ${f.lastname || ''}`.trim();
  return name || u.email || 'Unknown';
};

const fmtDate = (x) => {
  if (!x) return '—';
  const d = new Date(x);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtDateTime = (x) => {
  if (!x) return '—';
  const d = new Date(x);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const shortDay = (dateStr) =>
  new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short' });

const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

const exportCSV = (filename, rows) => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ].join('\n');
  // "﻿" keeps Excel from mangling non-ASCII text in the export.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  // Firefox only honours a programmatic click on a link that is in the
  // document, and it needs the object URL to outlive the click, so the
  // revoke is deferred instead of running straight away.
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// ---- small presentational components ------------------------------------

const Pagination = ({ page, total, onPage }) => {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (pages <= 1) return null;
  return (
    <div className="ac-pagination">
      <button className="ac-btn" disabled={page <= 1} onClick={() => onPage(page - 1)}>Prev</button>
      <span className="ac-page-info">Page {page} of {pages}</span>
      <button className="ac-btn" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
    </div>
  );
};

const StatCard = ({ label, value, sub, accent }) => (
  <div className={`ac-stat-card ${accent || ''}`}>
    <div className="ac-stat-label">{label}</div>
    <div className="ac-stat-value">{value}</div>
    {sub && <div className="ac-stat-sub">{sub}</div>}
  </div>
);

// ---- main ---------------------------------------------------------------

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isAdmin, setIsAdmin] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [rides, setRides] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [logs, setLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifEmail, setNotifEmail] = useState(false);
  const [sendingNotif, setSendingNotif] = useState(false);
  const [notifResult, setNotifResult] = useState(null);

  // search / filter / page state
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [rideSearch, setRideSearch] = useState('');
  const [rideStatusFilter, setRideStatusFilter] = useState('all');
  const [ridePage, setRidePage] = useState(1);
  const [ratingSearch, setRatingSearch] = useState('');
  const [ratingScoreFilter, setRatingScoreFilter] = useState('all');
  const [ratingPage, setRatingPage] = useState(1);
  const [logSearch, setLogSearch] = useState('');
  const [logPage, setLogPage] = useState(1);

  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const statsData = await fetchJson('/admin/stats');
        setStats(statsData);
        const [u, r, rd, lg, nt] = await Promise.all([
          fetchJson('/admin/users'),
          fetchJson('/admin/ratings'),
          fetchJson('/admin/rides'),
          fetchJson('/admin/audit'),
          fetchJson('/admin/notifications'),
        ]);
        setUsers(u || []);
        setRatings(r || []);
        setRides(rd || []);
        setLogs(lg || []);
        setNotifications(nt || []);
      } catch (e) {
        if (e.status === 403) setIsAdmin(false);
        else setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const refreshStats = async () => {
    try { setStats(await fetchJson('/admin/stats')); } catch (e) { /* non critical */ }
  };
  const refreshLogs = async () => {
    try { setLogs(await fetchJson('/admin/audit') || []); } catch (e) { /* non critical */ }
  };

  // ---- actions ----
  const toggleRole = async (user) => {
    const makeAdmin = user.role !== 'admin';
    const path = makeAdmin ? 'make-admin' : 'remove-admin';
    try {
      const { user: updated } = await fetchJson(`/admin/users/${user._id}/${path}`, { method: 'PUT' });
      setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, role: updated.role } : u)));
      refreshStats(); refreshLogs();
    } catch (e) { setError(e.message); }
  };

  const changeStatus = async (user, status) => {
    try {
      const { user: updated } = await fetchJson(`/admin/users/${user._id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, status: updated.status } : u)));
      refreshStats(); refreshLogs();
    } catch (e) { setError(e.message); }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Delete ${formatName(user)}? This removes their rides and ratings and cannot be undone.`)) return;
    try {
      await fetchJson(`/admin/users/${user._id}`, { method: 'DELETE' });
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
      setRatings((prev) => prev.filter((r) => r.ratedUserId?._id !== user._id && r.raterUserId?._id !== user._id));
      setRides((prev) => prev.filter((r) => r.user_id?._id !== user._id));
      refreshStats(); refreshLogs();
    } catch (e) { setError(e.message); }
  };

  const toggleRideStatus = async (ride) => {
    const status = ride.status === 'open' ? 'closed' : 'open';
    try {
      await fetchJson(`/admin/rides/${ride._id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
      setRides((prev) => prev.map((r) => (r._id === ride._id ? { ...r, status } : r)));
      refreshStats(); refreshLogs();
    } catch (e) { setError(e.message); }
  };

  const deleteRide = async (ride) => {
    if (!window.confirm(`Delete the ride ${ride.startingPoint} to ${ride.destination}? Its chat messages will also be removed.`)) return;
    try {
      await fetchJson(`/admin/rides/${ride._id}`, { method: 'DELETE' });
      setRides((prev) => prev.filter((r) => r._id !== ride._id));
      refreshStats(); refreshLogs();
    } catch (e) { setError(e.message); }
  };

  const deleteRating = async (rating) => {
    if (!window.confirm('Delete this rating?')) return;
    try {
      await fetchJson(`/admin/ratings/${rating._id}`, { method: 'DELETE' });
      setRatings((prev) => prev.filter((r) => r._id !== rating._id));
      refreshStats(); refreshLogs();
    } catch (e) { setError(e.message); }
  };

  const sendNotification = async (e) => {
    e.preventDefault();
    if (!notifMessage.trim()) return;
    setSendingNotif(true);
    setNotifResult(null);
    try {
      const res = await fetchJson('/admin/notifications', {
        method: 'POST',
        body: JSON.stringify({ title: notifTitle.trim(), message: notifMessage.trim(), sendEmail: notifEmail }),
      });
      setNotifications((prev) => [res.notification, ...prev]);
      setNotifTitle('');
      setNotifMessage('');
      let msg = 'Notification sent to all users.';
      if (notifEmail && res.emailResult) {
        if (res.emailResult.error) msg += ` Email failed: ${res.emailResult.error}`;
        else msg += ` Email delivered to ${res.emailResult.delivered} of ${res.emailResult.total}.`;
      }
      setNotifResult(msg);
      setNotifEmail(false);
      refreshLogs();
    } catch (err) {
      setNotifResult(err.message || 'Failed to send notification.');
    } finally {
      setSendingNotif(false);
    }
  };

  const deleteNotificationItem = async (n) => {
    if (!window.confirm('Delete this notification?')) return;
    try {
      await fetchJson(`/admin/notifications/${n._id}`, { method: 'DELETE' });
      setNotifications((prev) => prev.filter((x) => x._id !== n._id));
      refreshLogs();
    } catch (e) { setError(e.message); }
  };

  const viewUser = async (user) => {
    setDetailLoading(true);
    setSelectedUser({ loading: true, base: user });
    try {
      const data = await fetchJson(`/admin/users/${user._id}/detail`);
      setSelectedUser(data);
    } catch (e) {
      setError(e.message);
      setSelectedUser(null);
    } finally {
      setDetailLoading(false);
    }
  };

  // ---- derived lists ----
  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return users.filter((u) => !q || formatName(u).toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q));
  }, [users, userSearch]);

  const filteredRides = useMemo(() => {
    const q = rideSearch.trim().toLowerCase();
    return rides.filter((r) => {
      const matchesStatus = rideStatusFilter === 'all' || r.status === rideStatusFilter;
      const text = `${r.startingPoint} ${r.destination} ${formatName(r.user_id)}`.toLowerCase();
      return matchesStatus && (!q || text.includes(q));
    });
  }, [rides, rideSearch, rideStatusFilter]);

  const filteredRatings = useMemo(() => {
    const q = ratingSearch.trim().toLowerCase();
    return ratings.filter((r) => {
      const matchesScore = ratingScoreFilter === 'all' || String(r.rating) === ratingScoreFilter;
      const text = `${formatName(r.ratedUserId)} ${formatName(r.raterUserId)} ${r.comment || ''}`.toLowerCase();
      return matchesScore && (!q || text.includes(q));
    });
  }, [ratings, ratingSearch, ratingScoreFilter]);

  const filteredLogs = useMemo(() => {
    const q = logSearch.trim().toLowerCase();
    return logs.filter((l) => !q || `${l.action} ${l.details || ''} ${l.performedByName || ''}`.toLowerCase().includes(q));
  }, [logs, logSearch]);

  const pageSlice = (list, page) => list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (!isAdmin) return <Navigate to="/home" />;
  if (loading) return <div className="ac-root"><div className="ac-loading">Loading admin console...</div></div>;

  const uPage = Math.min(userPage, Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE)));
  const rPage = Math.min(ridePage, Math.max(1, Math.ceil(filteredRides.length / PAGE_SIZE)));
  const rtPage = Math.min(ratingPage, Math.max(1, Math.ceil(filteredRatings.length / PAGE_SIZE)));
  const lPage = Math.min(logPage, Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE)));

  const tabs = [
    ['overview', 'Overview'],
    ['users', 'Users'],
    ['rides', 'Rides'],
    ['ratings', 'Ratings'],
    ['notifications', 'Notifications'],
    ['audit', 'Audit Log'],
  ];

  return (
    <div className="ac-root">
      <div className="ac-header">
        <h1>Admin Console</h1>
        <p>Manage users, rides, ratings and platform activity for CholoShobai.</p>
      </div>

      {error && <div className="ac-error" onClick={() => setError(null)}>{error} (click to dismiss)</div>}

      <div className="ac-tabs">
        {tabs.map(([key, label]) => (
          <button key={key} className={`ac-tab ${activeTab === key ? 'active' : ''}`} onClick={() => setActiveTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && stats && (
        <>
          <div className="ac-stats-grid">
            <StatCard label="Total Users" value={stats.totalUsers} sub={`${stats.totalAdmins} admin(s)`} accent="ac-accent-blue" />
            <StatCard label="Total Rides" value={stats.totalRides} sub={`${stats.openRides} open, ${stats.closedRides} closed`} accent="ac-accent-green" />
            <StatCard label="Open Rides" value={stats.openRides} accent="ac-accent-green" />
            <StatCard label="Ratings" value={stats.totalRatings} accent="ac-accent-blue" />
            <StatCard label="Average Rating" value={stats.averageRating || '—'} sub="out of 5" accent="ac-accent-amber" />
            <StatCard label="Messages" value={stats.totalMessages} accent="ac-accent-blue" />
            <StatCard label="Flagged Accounts" value={stats.flaggedUsers} sub="suspended or banned" accent="ac-accent-red" />
          </div>

          <div className="ac-panels">
            <div className="ac-panel">
              <h3>Rides created in the last 7 days</h3>
              <div className="ac-bars">
                {(() => {
                  const max = Math.max(1, ...stats.ridesLast7Days.map((d) => d.count));
                  return stats.ridesLast7Days.map((d) => (
                    <div className="ac-bar-col" key={d.date}>
                      <div className="ac-bar-wrap">
                        <div className="ac-bar" style={{ height: `${(d.count / max) * 100}%` }} title={`${d.count} rides`} />
                      </div>
                      <span className="ac-bar-val">{d.count}</span>
                      <span className="ac-bar-label">{shortDay(d.date)}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>

            <div className="ac-panel">
              <h3>Rating distribution</h3>
              {(() => {
                const max = Math.max(1, ...stats.ratingDistribution.map((r) => r.count));
                return stats.ratingDistribution.slice().reverse().map((r) => (
                  <div className="ac-dist-row" key={r.score}>
                    <span className="ac-dist-label">{r.score}★</span>
                    <div className="ac-dist-track">
                      <div className="ac-dist-fill" style={{ width: `${(r.count / max) * 100}%` }} />
                    </div>
                    <span className="ac-dist-count">{r.count}</span>
                  </div>
                ));
              })()}
            </div>
          </div>

          <div className="ac-panel">
            <h3>Top routes</h3>
            {stats.topRoutes.length ? (
              stats.topRoutes.map((rt, i) => (
                <div className="ac-route-row" key={i}>
                  <span>{rt.from} &rarr; {rt.to}</span>
                  <span className="ac-badge ac-badge-muted">{rt.count} ride(s)</span>
                </div>
              ))
            ) : (
              <p className="ac-empty">No rides yet.</p>
            )}
          </div>
        </>
      )}

      {/* USERS */}
      {activeTab === 'users' && (
        <>
          <div className="ac-toolbar">
            <input className="ac-search" placeholder="Search by name or email" value={userSearch}
              onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }} />
            <button className="ac-btn" onClick={() => exportCSV('users.csv', filteredUsers.map((u) => ({
              name: formatName(u), email: u.email, role: u.role, status: u.status || 'active', joined: fmtDate(u.createdAt),
            })))}>Export CSV</button>
            <span className="ac-count">{filteredUsers.length} user(s)</span>
          </div>
          <div className="ac-table-card">
            <div className="ac-table-scroll">
              <table className="ac-table">
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 && (
                    <tr><td colSpan="6"><div className="ac-empty">No users found.</div></td></tr>
                  )}
                  {pageSlice(filteredUsers, uPage).map((u) => (
                    <tr key={u._id}>
                      <td className="ac-strong">{formatName(u)}</td>
                      <td className="ac-muted-text">{u.email}</td>
                      <td><span className={`ac-badge ac-badge-${u.role}`}>{u.role}</span></td>
                      <td><span className={`ac-badge ac-badge-${u.status || 'active'}`}>{u.status || 'active'}</span></td>
                      <td className="ac-muted-text">{fmtDate(u.createdAt)}</td>
                      <td>
                        <div className="ac-actions">
                          <button className="ac-btn ac-btn-ghost" onClick={() => viewUser(u)}>View</button>
                          <button className="ac-btn" onClick={() => toggleRole(u)}>
                            {u.role === 'admin' ? 'Make User' : 'Make Admin'}
                          </button>
                          {u.role !== 'admin' && (
                            <select className="ac-select" value={u.status || 'active'}
                              onChange={(e) => changeStatus(u, e.target.value)}>
                              <option value="active">Active</option>
                              <option value="suspended">Suspended</option>
                              <option value="banned">Banned</option>
                            </select>
                          )}
                          {u.role !== 'admin' && (
                            <button className="ac-btn ac-btn-danger" onClick={() => deleteUser(u)}>Delete</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={uPage} total={filteredUsers.length} onPage={setUserPage} />
          </div>
        </>
      )}

      {/* RIDES */}
      {activeTab === 'rides' && (
        <>
          <div className="ac-toolbar">
            <input className="ac-search" placeholder="Search by route or owner" value={rideSearch}
              onChange={(e) => { setRideSearch(e.target.value); setRidePage(1); }} />
            <select className="ac-select" value={rideStatusFilter}
              onChange={(e) => { setRideStatusFilter(e.target.value); setRidePage(1); }}>
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
            <button className="ac-btn" onClick={() => exportCSV('rides.csv', filteredRides.map((r) => ({
              from: r.startingPoint, to: r.destination, owner: formatName(r.user_id), date: r.date, time: r.time,
              slots: r.availableSlots, joined: r.joinedCount, status: r.status,
            })))}>Export CSV</button>
            <span className="ac-count">{filteredRides.length} ride(s)</span>
          </div>
          <div className="ac-table-card">
            <div className="ac-table-scroll">
              <table className="ac-table">
                <thead>
                  <tr><th>Route</th><th>Owner</th><th>Date / Time</th><th>Slots</th><th>Joined</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filteredRides.length === 0 && (
                    <tr><td colSpan="7"><div className="ac-empty">No rides found.</div></td></tr>
                  )}
                  {pageSlice(filteredRides, rPage).map((r) => (
                    <tr key={r._id}>
                      <td className="ac-strong">{r.startingPoint} &rarr; {r.destination}</td>
                      <td className="ac-muted-text">{formatName(r.user_id)}</td>
                      <td className="ac-muted-text">{r.date}<br />{r.time}</td>
                      <td>{r.availableSlots}</td>
                      <td>{r.confirmedCount}/{r.joinedCount}</td>
                      <td><span className={`ac-badge ac-badge-${r.status}`}>{r.status}</span></td>
                      <td>
                        <div className="ac-actions">
                          <button className="ac-btn" onClick={() => toggleRideStatus(r)}>
                            {r.status === 'open' ? 'Close' : 'Open'}
                          </button>
                          <button className="ac-btn ac-btn-danger" onClick={() => deleteRide(r)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={rPage} total={filteredRides.length} onPage={setRidePage} />
          </div>
        </>
      )}

      {/* RATINGS */}
      {activeTab === 'ratings' && (
        <>
          <div className="ac-toolbar">
            <input className="ac-search" placeholder="Search by user or comment" value={ratingSearch}
              onChange={(e) => { setRatingSearch(e.target.value); setRatingPage(1); }} />
            <select className="ac-select" value={ratingScoreFilter}
              onChange={(e) => { setRatingScoreFilter(e.target.value); setRatingPage(1); }}>
              <option value="all">All scores</option>
              {[5, 4, 3, 2, 1].map((s) => <option key={s} value={String(s)}>{s} star</option>)}
            </select>
            <button className="ac-btn" onClick={() => exportCSV('ratings.csv', filteredRatings.map((r) => ({
              rated: formatName(r.ratedUserId), ratedBy: formatName(r.raterUserId), score: r.rating,
              comment: r.comment || '', date: fmtDate(r.createdAt),
            })))}>Export CSV</button>
            <span className="ac-count">{filteredRatings.length} rating(s)</span>
          </div>
          <div className="ac-table-card">
            <div className="ac-table-scroll">
              <table className="ac-table">
                <thead>
                  <tr><th>User Rated</th><th>Rated By</th><th>Score</th><th>Comment</th><th>Date</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filteredRatings.length === 0 && (
                    <tr><td colSpan="6"><div className="ac-empty">No ratings found.</div></td></tr>
                  )}
                  {pageSlice(filteredRatings, rtPage).map((r) => (
                    <tr key={r._id}>
                      <td className="ac-strong">{formatName(r.ratedUserId)}</td>
                      <td className="ac-muted-text">{formatName(r.raterUserId)}</td>
                      <td className="ac-stars">{stars(r.rating)}</td>
                      <td>{r.comment || <span className="ac-muted-text">—</span>}</td>
                      <td className="ac-muted-text">{fmtDate(r.createdAt)}</td>
                      <td><button className="ac-btn ac-btn-danger" onClick={() => deleteRating(r)}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={rtPage} total={filteredRatings.length} onPage={setRatingPage} />
          </div>
        </>
      )}

      {/* AUDIT LOG */}
      {activeTab === 'audit' && (
        <>
          <div className="ac-toolbar">
            <input className="ac-search" placeholder="Search actions" value={logSearch}
              onChange={(e) => { setLogSearch(e.target.value); setLogPage(1); }} />
            <span className="ac-count">{filteredLogs.length} entr(ies)</span>
          </div>
          <div className="ac-table-card">
            <div className="ac-table-scroll">
              <table className="ac-table">
                <thead>
                  <tr><th>Action</th><th>By</th><th>Target</th><th>Details</th><th>When</th></tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 && (
                    <tr><td colSpan="5"><div className="ac-empty">No admin activity recorded yet.</div></td></tr>
                  )}
                  {pageSlice(filteredLogs, lPage).map((l) => (
                    <tr key={l._id}>
                      <td className="ac-strong">{l.action}</td>
                      <td className="ac-muted-text">{l.performedByName || '—'}</td>
                      <td><span className="ac-badge ac-badge-muted">{l.targetType}</span></td>
                      <td className="ac-muted-text">{l.details || '—'}</td>
                      <td className="ac-muted-text">{fmtDateTime(l.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={lPage} total={filteredLogs.length} onPage={setLogPage} />
          </div>
        </>
      )}

      {/* NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <>
          <div className="ac-table-card" style={{ padding: '20px', marginBottom: '16px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '14px' }}>Send a global notification</h3>
            <form onSubmit={sendNotification}>
              <input
                className="ac-search"
                style={{ marginBottom: '10px', width: '100%' }}
                placeholder="Title (optional)"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
              />
              <textarea
                className="ac-search"
                style={{ width: '100%', minHeight: '100px', marginBottom: '10px', resize: 'vertical', fontFamily: 'inherit' }}
                placeholder="Write your announcement to all users..."
                value={notifMessage}
                onChange={(e) => setNotifMessage(e.target.value)}
                required
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', fontSize: '14px', color: '#374151' }}>
                <input type="checkbox" checked={notifEmail} onChange={(e) => setNotifEmail(e.target.checked)} />
                Also send by email to all users
              </label>
              <button type="submit" className="ac-btn ac-btn-primary" disabled={sendingNotif || !notifMessage.trim()}>
                {sendingNotif ? 'Sending...' : 'Send to all users'}
              </button>
              {notifResult && <p style={{ marginTop: '12px', color: '#15803d', fontSize: '14px' }}>{notifResult}</p>}
            </form>
          </div>

          <div className="ac-table-card">
            <div className="ac-table-scroll">
              <table className="ac-table">
                <thead>
                  <tr><th>Title</th><th>Message</th><th>Sent By</th><th>When</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {notifications.length === 0 && (
                    <tr><td colSpan="5"><div className="ac-empty">No notifications sent yet.</div></td></tr>
                  )}
                  {notifications.map((n) => (
                    <tr key={n._id}>
                      <td className="ac-strong">{n.title || '—'}</td>
                      <td>{n.message}</td>
                      <td className="ac-muted-text">{n.createdByName || '—'}</td>
                      <td className="ac-muted-text">{fmtDateTime(n.createdAt)}</td>
                      <td><button className="ac-btn ac-btn-danger" onClick={() => deleteNotificationItem(n)}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* USER DETAIL MODAL */}
      {selectedUser && (
        <div className="ac-overlay" onClick={() => setSelectedUser(null)}>
          <div className="ac-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ac-modal-head">
              <h2>{formatName(selectedUser.user || selectedUser.base)}</h2>
              <button className="ac-modal-close" onClick={() => setSelectedUser(null)}>×</button>
            </div>

            {detailLoading || selectedUser.loading ? (
              <div className="ac-empty">Loading profile...</div>
            ) : (
              <>
                <p className="ac-muted-text" style={{ marginTop: 0 }}>{selectedUser.user.email}</p>
                <div className="ac-detail-stats">
                  <StatCard label="Rides Created" value={selectedUser.stats.ridesCreated} />
                  <StatCard label="Avg Rating" value={selectedUser.stats.averageRating || '—'} />
                  <StatCard label="Ratings Received" value={selectedUser.stats.ratingsReceived} />
                  <StatCard label="Ratings Given" value={selectedUser.stats.ratingsGiven} />
                </div>

                <div className="ac-detail-section">
                  <h4>Rides created ({selectedUser.rides.length})</h4>
                  {selectedUser.rides.length ? selectedUser.rides.map((r) => (
                    <div className="ac-detail-item" key={r._id}>
                      <strong>{r.startingPoint} &rarr; {r.destination}</strong>
                      <div className="ac-muted-text">{r.date} at {r.time} · {r.status}</div>
                    </div>
                  )) : <p className="ac-muted-text">None.</p>}
                </div>

                <div className="ac-detail-section">
                  <h4>Ratings received ({selectedUser.ratingsReceived.length})</h4>
                  {selectedUser.ratingsReceived.length ? selectedUser.ratingsReceived.map((r) => (
                    <div className="ac-detail-item" key={r._id}>
                      <span className="ac-stars">{stars(r.rating)}</span>
                      <div>{r.comment || <span className="ac-muted-text">No comment</span>}</div>
                      <div className="ac-muted-text">by {formatName(r.raterUserId)}</div>
                    </div>
                  )) : <p className="ac-muted-text">None.</p>}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
