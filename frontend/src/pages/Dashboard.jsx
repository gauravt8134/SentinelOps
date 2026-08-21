import { useState, useEffect } from 'react';
import { Server, Globe, Activity, AlertTriangle, Clock, Terminal } from 'lucide-react';
import StatCard from '../components/StatCard';
import MetricsChart from '../components/MetricsChart';
import api from '../api';
import './Dashboard.css';

// Helper to make large numbers look professional (e.g., 7125 -> 7.1K)
const formatCompactNumber = (number) => {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(number);
};

function Dashboard() {
  const [servers, setServers] = useState([]);
  const [websites, setWebsites] = useState([]);
  const [apmStats, setApmStats] = useState([]);
  const [latestMetrics, setLatestMetrics] = useState({});
  const [selectedServerId, setSelectedServerId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [serversRes, websitesRes, apmRes] = await Promise.all([
          api.get('/servers'),
          api.get('/websites'),
          api.get('/apm/stats'),
        ]);
        setServers(serversRes.data);
        setWebsites(websitesRes.data);
        setApmStats(apmRes.data);

        // Default to the first server if none selected
        if (serversRes.data.length > 0 && !selectedServerId) {
          setSelectedServerId(serversRes.data[0].id);
        }

        // Fetch latest metrics for all servers to display runtime info in the metadata bar
        const metricsPromises = serversRes.data.map((server) =>
          api.get(`/metrics/${server.id}`).then((r) => ({ id: server.id, data: r.data }))
        );
        const metricsResults = await Promise.all(metricsPromises);
        const latestMap = {};
        metricsResults.forEach(({ id, data }) => {
          if (data.length > 0) {
            latestMap[id] = data[data.length - 1];
          }
        });
        setLatestMetrics(latestMap);

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [selectedServerId]);

  const websitesUp = websites.filter((w) => w.status === 'up').length;
  const totalRequests = apmStats.reduce((sum, stat) => sum + stat.total_requests, 0);
  const avgErrorRate =
    apmStats.length > 0
      ? (apmStats.reduce((sum, stat) => sum + stat.error_rate_percent, 0) / apmStats.length).toFixed(1)
      : 0;

  const activeServer = servers.find((s) => s.id === selectedServerId) || servers[0];
  const activeMetric = selectedServerId ? latestMetrics[selectedServerId] : null;

  if (loading) {
    return <div className="loading-text">Loading dashboard...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Overview</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>Real-time system health at a glance</p>
        </div>

        {/* Scalable Server Selector Dropdown */}
        {servers.length > 0 && (
          <div style={{ position: 'relative', minWidth: '220px' }}>
            <select
              value={selectedServerId || ''}
              onChange={(e) => setSelectedServerId(Number(e.target.value))}
              style={{
                appearance: 'none',
                width: '100%',
                backgroundColor: '#14171f',
                color: '#fff',
                border: '1px solid #232836',
                padding: '10px 40px 10px 16px',
                borderRadius: '8px',
                fontSize: '0.9em',
                fontWeight: '500',
                cursor: 'pointer',
                outline: 'none',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              {servers.map((server) => (
                <option key={server.id} value={server.id} style={{ background: '#1a1d24', color: '#fff' }}>
                  {server.name} ({server.ip_address})
                </option>
              ))}
            </select>
            {/* Custom dropdown arrow for a clean look */}
            <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8', fontSize: '0.8em' }}>
              ▼
            </div>
          </div>
        )}
      </div>

      {/* STAT CARDS GRID */}
      <div className="stats-grid">
        <StatCard label="Total Servers" value={servers.length} icon={Server} accentColor="cyan" />
        <StatCard label="Websites Up" value={`${websitesUp}/${websites.length}`} icon={Globe} accentColor="green" />
        {/* API Requests now uses the compact formatter */}
        <StatCard label="API Requests" value={formatCompactNumber(totalRequests)} icon={Activity} accentColor="cyan" />
        <StatCard
          label="Avg Error Rate"
          value={avgErrorRate}
          suffix="%"
          icon={AlertTriangle}
          accentColor={avgErrorRate > 5 ? 'red' : 'amber'}
        />
      </div>

      {/* SYS PULSE STYLE TELEMETRY METADATA BAR */}
      {activeMetric && activeServer && (
        <div style={{
          background: '#14171f',
          border: '1px solid #232836',
          borderRadius: '10px',
          padding: '12px 20px',
          marginTop: '24px', // <-- Added space above the bar
          marginBottom: '24px', // <-- Added space below the bar
          display: 'flex',
          flexWrap: 'wrap',
          gap: '24px',
          alignItems: 'center',
          fontSize: '0.85em',
          color: '#cbd5e1'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Server size={14} color="#3b82f6" />
            <span style={{ color: '#94a3b8' }}>Host:</span>
            <strong style={{ color: '#fff' }}>{activeServer.name}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Terminal size={14} color="#10b981" />
            <span style={{ color: '#94a3b8' }}>OS:</span>
            <span style={{ color: '#fff' }}>{activeMetric.os_type || 'Unknown'} ({activeMetric.arch || 'x86_64'})</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>🐍</span>
            <span style={{ color: '#94a3b8' }}>Python:</span>
            <span style={{ color: '#fff' }}>{activeMetric.python_version || '3.11.0'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} color="#f59e0b" />
            <span style={{ color: '#94a3b8' }}>Uptime:</span>
            <span style={{ color: '#fff' }}>{Math.floor((activeMetric.uptime_seconds || 0) / 3600)}h {Math.floor(((activeMetric.uptime_seconds || 0) % 3600) / 60)}m</span>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ height: '7px', width: '7px', backgroundColor: '#10b981', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 6px #10b981' }}></span>
            <span style={{ color: '#10b981', fontWeight: '600', fontSize: '0.8em' }}>LIVE</span>
          </div>
        </div>
      )}

      {/* LIVE SERVER METRICS CHART */}
      {activeServer && (
        <div className="chart-card">
          <div className="chart-card-header">
            <h2 className="chart-title">Live Server Metrics</h2>
            <span className="chart-subtitle">{activeServer.name}</span>
          </div>
          <MetricsChart serverId={activeServer.id} />
        </div>
      )}
    </div>
  );
}

export default Dashboard;