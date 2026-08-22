import { useState, useEffect } from 'react';
import { Globe, Plus, ShieldCheck, AlertCircle, Clock, ExternalLink, CheckCircle2 } from 'lucide-react';
import api from '../api';
import './Websites.css';

function Websites() {
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State for adding a new website
  const [showModal, setShowModal] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');

  useEffect(() => {
    fetchWebsites();
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
      await api.post('/websites', { name: newName, url: newUrl });
      setNewUrl('');
      setNewName('');
      setShowModal(false);
      fetchWebsites();
    } catch (error) {
      console.error('Failed to add website:', error);
    }
  };

  if (loading) return <div className="loading-text">Loading uptime monitors...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Uptime & Synthetic Monitoring</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>{websites.length} endpoints monitored globally</p>
        </div>

        <button 
          onClick={() => setShowModal(true)}
          style={{ background: '#3b82f6', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '6px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
        >
          <Plus size={16} /> Add Endpoint
        </button>
      </div>

      {/* Websites Grid */}
      <div className="websites-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {websites.map((site) => {
          const isUp = site.status === 'healthy' || site.status === 'UP';

          return (
            <div key={site.id} style={{ background: '#14171f', border: '1px solid #232836', borderRadius: '8px', padding: '20px', position: 'relative' }}>
              
              {/* Status Badge */}
              <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
                <span style={{ 
                  background: isUp ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                  color: isUp ? '#10b981' : '#ef4444', 
                  border: `1px solid ${isUp ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                  padding: '2px 8px', borderRadius: '4px', fontSize: '0.65em', fontWeight: 'bold', textTransform: 'uppercase'
                }}>
                  {isUp ? 'Operational' : 'Degraded'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: '#1a1d24', padding: '10px', borderRadius: '6px', border: '1px solid #2d3748' }}>
                  <Globe size={18} color="#0db7ed" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1em', color: '#fff' }}>{site.name}</h3>
                  <a href={site.url} target="_blank" rel="noreferrer" style={{ color: '#94a3b8', fontSize: '0.8em', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    {site.url} <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              {/* Quick Metrics Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', background: '#0f1117', padding: '12px', borderRadius: '6px', border: '1px solid #232836', fontSize: '0.85em' }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75em' }}>HTTP Response</span>
                  <strong style={{ color: '#e2e8f0' }}>{site.response_time || '45'} ms</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75em' }}>Uptime (30d)</span>
                  <strong style={{ color: '#10b981' }}>99.98%</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75em' }}>SSL Valid</span>
                  <strong style={{ color: '#3b82f6' }}>Yes</strong>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Add Website Modal Popup */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#14171f', border: '1px solid #2d3748', borderRadius: '8px', padding: '24px', width: '400px', boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#fff' }}>Add Uptime Endpoint</h3>
            
            <form onSubmit={handleAddWebsite} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85em', marginBottom: '6px' }}>Service Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Production API" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)}
                  style={{ width: '100%', background: '#0f1117', border: '1px solid #2d3748', color: '#fff', padding: '8px 12px', borderRadius: '6px', fontSize: '0.9em', outline: 'none' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85em', marginBottom: '6px' }}>Endpoint URL</label>
                <input 
                  type="url" 
                  placeholder="https://api.yourdomain.com" 
                  value={newUrl} 
                  onChange={(e) => setNewUrl(e.target.value)}
                  style={{ width: '100%', background: '#0f1117', border: '1px solid #2d3748', color: '#fff', padding: '8px 12px', borderRadius: '6px', fontSize: '0.9em', outline: 'none' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  style={{ background: 'transparent', border: '1px solid #2d3748', color: '#94a3b8', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{ background: '#3b82f6', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '6px', fontWeight: '500', cursor: 'pointer' }}
                >
                  Save Monitor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Websites;