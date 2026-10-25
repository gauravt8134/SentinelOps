import { useState, useEffect } from 'react';
import { Search, Filter, Plus, Trash2, CheckCircle2, AlertCircle, X, Clock, Activity, ShieldCheck, Lock } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import api from '../api';
import './Websites.css';

function Websites() {
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');
  const [newExpectedText, setNewExpectedText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedSite, setSelectedSite] = useState(null);

  useEffect(() => {
    // 1. Fetch immediately on page load
    fetchWebsites();

    // 2. Set up a silent background timer to fetch every 60 seconds
    const intervalId = setInterval(() => {
      fetchWebsites();
    }, 60000);

    // 3. Clean up the timer if the user navigates to a different page
    return () => clearInterval(intervalId);
  }, []);

  async function fetchWebsites() {
    try {
      const res = await api.get('/websites');
      setWebsites(res.data);
    } catch (error) {
      console.error('Failed to fetch websites:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleAddWebsite = async (e) => {
    e.preventDefault();
    if (!newUrl || !newName) return;
    try {
      await api.post('/websites', { 
        name: newName, 
        url: newUrl,
        expected_text: newExpectedText || null 
      });
      setNewUrl(''); 
      setNewName(''); 
      setNewExpectedText('');
      setShowModal(false);
      fetchWebsites();
    } catch (error) {
      console.error('Failed to add website:', error);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this endpoint?")) {
      try {
        await api.delete(`/websites/${id}`);
        if (selectedSite && selectedSite.id === id) setSelectedSite(null);
        fetchWebsites();
      } catch (error) {
        console.error('Failed to delete website:', error);
      }
    }
  };

  // --- Dynamic Stats Banner Calculations ---
  const totalMonitors = websites.length;
  const activeAlerts = websites.filter(site => site.status !== 'up' && site.status !== 'UP').length;
  const avgResponseTime = totalMonitors > 0 
    ? Math.round(websites.reduce((acc, site) => acc + (site.response_time_ms || 0), 0) / totalMonitors)
    : 0;
  const globalUptime = totalMonitors > 0 
    ? (((totalMonitors - activeAlerts) / totalMonitors) * 100).toFixed(2)
    : 100.00;

  return (
    <div className="websites-container">
      <div className="header-flex">
        <div>
          <h1 className="page-title">Synthetic Monitoring</h1>
          <p className="page-subtitle">Proactively monitor API endpoints and web services.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Monitor
        </button>
      </div>

      <div className="stats-banner">
        <div className="stat-box"><span className="stat-label">Total Monitors</span><span className="stat-value">{totalMonitors}</span></div>
        <div className="stat-box"><span className="stat-label">Global Uptime</span><span className={`stat-value ${globalUptime >= 99 ? 'text-success' : 'text-danger'}`}>{globalUptime}%</span></div>
        <div className="stat-box"><span className="stat-label">Avg Response Time</span><span className="stat-value">{avgResponseTime} ms</span></div>
        <div className="stat-box"><span className="stat-label">Active Alerts</span><span className={`stat-value ${activeAlerts > 0 ? 'text-danger' : 'text-success'}`}>{activeAlerts}</span></div>
      </div>

      <div className="table-controls">
        <div className="search-bar">
          <Search size={16} color="#64748b" />
          <input type="text" placeholder="Search by name or URL..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <button className="btn-secondary"><Filter size={14} /> Filter</button>
      </div>

      <div className="table-container">
        <table className="enterprise-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Endpoint Definition</th>
              <th>Environment</th>
              <th>Response Time</th>
              <th>Details</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {websites.map((site, index) => {
              const isUp = site.status === 'up' || site.status === 'UP';
              const isAssertionFail = site.status === 'Assertion Failed';
              const responseTime = site.response_time_ms ? Math.round(site.response_time_ms) : 0;
              
              // Get the most recent check for the waterfall metrics
              const latestCheck = site.checks && site.checks.length > 0 
                ? site.checks[site.checks.length - 1] 
                : null;

              return (
                <tr key={site.id || index} onClick={() => setSelectedSite({ ...site, isUp, isAssertionFail, responseTime, latestCheck })} className="clickable-row">
                  <td>
                    <div className={`status-pill ${isUp ? 'status-up' : (isAssertionFail ? 'status-warn' : 'status-down')}`}>
                      {isUp ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                      {isUp ? 'OK' : (isAssertionFail ? 'MISMATCH' : 'FAIL')}
                    </div>
                  </td>
                  <td>
                    <div className="site-info">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="http-badge get">GET</span>
                        <span className="site-name">{site.name || 'API Endpoint'}</span>
                      </div>
                      <a href={site.url} target="_blank" rel="noreferrer" className="site-url" onClick={(e) => e.stopPropagation()}>{site.url}</a>
                    </div>
                  </td>
                  <td><span className="env-tag prod">Production</span></td>
                  <td>
                    <div className="response-time-col">
                      <span className="resp-text">{responseTime} ms</span>
                      <div style={{ width: '80px', height: '24px' }}>
                        {site.checks && site.checks.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={site.checks.slice(-20)}>
                              <YAxis domain={['dataMin', 'dataMax']} hide />
                              <Tooltip contentStyle={{ display: 'none' }} cursor={false} />
                              <Line 
                                type="monotone" 
                                dataKey="response_time_ms" 
                                stroke={isUp ? "#10b981" : "#ef4444"} 
                                strokeWidth={2} 
                                dot={false} 
                                isAnimationActive={false} 
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <span style={{ fontSize: '10px', color: '#64748b' }}>No data</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
                      {site.expected_text && (
                        <span style={{ color: '#94a3b8' }}><ShieldCheck size={12} color={isAssertionFail ? "#ef4444" : "#10b981"}/> Contains: "{site.expected_text}"</span>
                      )}
                      {site.ssl_expiry_days !== null && (
                        <span style={{ color: '#94a3b8' }}><Lock size={12} color={site.ssl_expiry_days > 14 ? "#10b981" : "#ef4444"}/> SSL: {site.ssl_expiry_days} days</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <button className="action-btn" onClick={(e) => handleDelete(e, site.id)}>
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Slide-Out Details Panel */}
      <div className={`slide-panel-overlay ${selectedSite ? 'open' : ''}`} onClick={() => setSelectedSite(null)}></div>
      <div className={`slide-panel ${selectedSite ? 'open' : ''}`}>
        {selectedSite && (
          <div className="panel-content">
            <div className="panel-header">
              <div>
                <h2>{selectedSite.name || 'API Endpoint'}</h2>
                <p>{selectedSite.url}</p>
              </div>
              <button className="close-btn" onClick={() => setSelectedSite(null)}><X size={20} /></button>
            </div>
            
            <div className="panel-section">
              <h3><Activity size={16} /> Latest Test Result</h3>
              <div className="result-card">
                <div className={`status-pill ${selectedSite.isUp ? 'status-up' : 'status-down'}`}>
                  {selectedSite.isUp ? 'PASSED' : 'FAILED'} 
                  {selectedSite.latestCheck?.status_code ? ` (HTTP ${selectedSite.latestCheck.status_code})` : ''}
                </div>
                <h2>{selectedSite.responseTime} ms</h2>
                <p>Checked from Local SentinelOps Agent</p>
              </div>
            </div>

            <div className="panel-section">
              <h3><Clock size={16} /> Network Timing Waterfall</h3>
              {selectedSite.latestCheck ? (
                <div className="waterfall-container">
                  <div className="waterfall-row">
                    <span className="wf-label">DNS Lookup</span>
                    <div className="wf-bar dns" style={{width: '15%'}}></div>
                    <span className="wf-time">{selectedSite.latestCheck.dns_time_ms !== null ? `${selectedSite.latestCheck.dns_time_ms} ms` : '--'}</span>
                  </div>
                  <div className="waterfall-row">
                    <span className="wf-label">TCP Connection</span>
                    <div className="wf-bar tcp" style={{width: '25%', marginLeft: '15%'}}></div>
                    <span className="wf-time">{selectedSite.latestCheck.tcp_time_ms !== null ? `${selectedSite.latestCheck.tcp_time_ms} ms` : '--'}</span>
                  </div>
                  {selectedSite.latestCheck.tls_time_ms !== null && (
                    <div className="waterfall-row">
                      <span className="wf-label">TLS Handshake</span>
                      <div className="wf-bar tls" style={{width: '40%', marginLeft: '40%'}}></div>
                      <span className="wf-time">{selectedSite.latestCheck.tls_time_ms} ms</span>
                    </div>
                  )}
                  <div className="waterfall-row">
                    <span className="wf-label">TTFB</span>
                    <div className="wf-bar ttfb" style={{width: '10%', marginLeft: '80%'}}></div>
                    <span className="wf-time">{selectedSite.latestCheck.ttfb_ms !== null ? `${selectedSite.latestCheck.ttfb_ms} ms` : '--'}</span>
                  </div>
                </div>
              ) : (
                <p style={{ color: '#64748b', fontSize: '13px' }}>Awaiting first ping data...</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Website Modal Popup */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ margin: '0 0 16px 0', color: '#fff' }}>Add Uptime Endpoint</h3>
            
            <form onSubmit={handleAddWebsite} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Service Name</label>
                <input type="text" placeholder="e.g. Production API" value={newName} onChange={(e) => setNewName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Endpoint URL</label>
                <input type="url" placeholder="https://api.yourdomain.com" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Expected Text (Optional)</label>
                <input type="text" placeholder="e.g. 'status: healthy'" value={newExpectedText} onChange={(e) => setNewExpectedText(e.target.value)} />
                <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Fails the monitor if this exact text is not in the response payload.</span>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Monitor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Websites;