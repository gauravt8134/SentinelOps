import { useState, useEffect } from 'react';
import { 
  Server, Globe, Activity, AlertTriangle, Terminal, 
  Cpu, Zap, ShieldCheck, HardDrive
} from 'lucide-react';
import StatCard from '../components/StatCard';
import MetricsChart from '../components/MetricsChart';
import api from '../api';
import './Dashboard.css';

const formatCompactNumber = (number) => {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(number);
};

const getStatusColor = (percent) => {
  if (percent > 85) return 'fill-critical';
  if (percent > 70) return 'fill-warn';
  return 'fill-safe';
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

        if (serversRes.data.length > 0 && !selectedServerId) {
          setSelectedServerId(serversRes.data[0].id);
        }

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

  const websitesUp = websites.filter((w) => w.status === 'up' || w.status === 'healthy').length;
  const totalRequests = apmStats.reduce((sum, stat) => sum + (stat.total_requests || 0), 0);
  const avgErrorRate = apmStats.length > 0
    ? (apmStats.reduce((sum, stat) => sum + (stat.error_rate_percent || 0), 0) / apmStats.length).toFixed(1)
    : 0;

  const activeServer = servers.find((s) => s.id === selectedServerId) || servers[0];
  const activeMetric = selectedServerId ? latestMetrics[selectedServerId] : null;

  if (loading) return <div className="loading-text">Initializing Command Center...</div>;

  return (
    <div>
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75em', fontWeight: 'bold', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
              ENVIRONMENT: PRODUCTION
            </span>
          </div>
          <h1 className="page-title" style={{ margin: 0 }}>Global Overview</h1>
        </div>

        {servers.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.85em' }}>Telemetry Focus:</span>
            <select
              value={selectedServerId || ''}
              onChange={(e) => setSelectedServerId(Number(e.target.value))}
              style={{
                appearance: 'none', backgroundColor: '#12151e', color: '#fff', border: '1px solid #232836',
                padding: '8px 36px 8px 12px', borderRadius: '6px', fontSize: '0.9em', cursor: 'pointer', outline: 'none'
              }}
            >
              {servers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="dashboard-grid">
        {/* ROW 1: CORE KPIs */}
        <div className="span-3"><StatCard label="Active Nodes" value={servers.length} icon={Server} accentColor="cyan" /></div>
        <div className="span-3"><StatCard label="Uptime Status" value={`${websitesUp}/${websites.length}`} icon={Globe} accentColor="green" /></div>
        <div className="span-3"><StatCard label="Total Throughput" value={formatCompactNumber(totalRequests)} icon={Activity} accentColor="cyan" /></div>
        <div className="span-3"><StatCard label="System Error Rate" value={avgErrorRate} suffix="%" icon={AlertTriangle} accentColor={avgErrorRate > 5 ? 'red' : 'amber'} /></div>

        {/* ROW 2: SPLIT VIEW */}
        
        {/* Left Column: Focused Node Utilization */}
        <div className="widget-panel span-6">
          <div className="widget-header">
            <h3 className="widget-title"><Cpu size={16} color="#38bdf8" /> Node Utilization</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flexGrow: 1, justifyContent: 'center' }}>
            {activeServer ? (() => {
              const cpu = activeMetric?.cpu_percent || 0;
              const ram = activeMetric?.memory_percent || 0;
              const disk = activeMetric?.disk_percent || 0;
              
              return (
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #1f2430' }}>
                    <strong style={{ color: '#e2e8f0', fontSize: '1.1em' }}>{activeServer.name}</strong>
                    <span style={{ fontSize: '0.9em', color: '#94a3b8', fontFamily: 'monospace' }}>{activeServer.ip_address}</span>
                  </div>
                  
                  {/* CPU Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '0.85em', color: '#94a3b8', marginBottom: '16px' }}>
                    <span style={{ width: '40px', fontWeight: 'bold' }}>CPU</span>
                    <div className="progress-track" style={{ height: '8px' }}><div className={`progress-fill ${getStatusColor(cpu)}`} style={{ width: `${cpu}%` }}></div></div>
                    <span style={{ width: '45px', textAlign: 'right' }}>{cpu.toFixed(0)}%</span>
                  </div>

                  {/* RAM Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '0.85em', color: '#94a3b8', marginBottom: '16px' }}>
                    <span style={{ width: '40px', fontWeight: 'bold' }}>RAM</span>
                    <div className="progress-track" style={{ height: '8px' }}><div className={`progress-fill ${getStatusColor(ram)}`} style={{ width: `${ram}%` }}></div></div>
                    <span style={{ width: '45px', textAlign: 'right' }}>{ram.toFixed(0)}%</span>
                  </div>

                  {/* DISK Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '0.85em', color: '#94a3b8' }}>
                    <span style={{ width: '40px', fontWeight: 'bold' }}>DISK</span>
                    <div className="progress-track" style={{ height: '8px' }}><div className={`progress-fill ${getStatusColor(disk)}`} style={{ width: `${disk}%` }}></div></div>
                    <span style={{ width: '45px', textAlign: 'right' }}>{disk.toFixed(0)}%</span>
                  </div>
                </div>
              );
            })() : (
              <div style={{ color: '#64748b', textAlign: 'center' }}>No active node selected.</div>
            )}
          </div>
        </div>

        {/* Right Column: Application Layer Health */}
        <div className="widget-panel span-6">
          <div className="widget-header">
            <h3 className="widget-title"><Zap size={16} color="#8b5cf6" /> Service Topology & Routing</h3>
          </div>
          <div>
            <h4 style={{ color: '#94a3b8', fontSize: '0.75em', textTransform: 'uppercase', marginBottom: '8px', marginTop: 0 }}>API Endpoints</h4>
            {apmStats.slice(0, 3).map((stat, idx) => (
              <div key={idx} className="mini-stat-row">
                <span style={{ fontFamily: 'monospace', fontSize: '0.85em', color: '#e2e8f0' }}>{stat.endpoint}</span>
                <span style={{ background: stat.error_rate_percent > 5 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: stat.error_rate_percent > 5 ? '#ef4444' : '#10b981', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75em' }}>
                  {stat.error_rate_percent}% Err
                </span>
              </div>
            ))}
            
            <h4 style={{ color: '#94a3b8', fontSize: '0.75em', textTransform: 'uppercase', marginBottom: '8px', marginTop: '20px' }}>Synthetic Uptime Checks</h4>
            {websites.slice(0, 3).map((site, idx) => (
              <div key={idx} className="mini-stat-row">
                <span style={{ fontSize: '0.85em', color: '#e2e8f0' }}>{site.name}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: site.status === 'up' ? '#10b981' : '#ef4444', fontSize: '0.8em' }}>
                  {site.status === 'up' ? <ShieldCheck size={14} /> : <AlertTriangle size={14} />} {site.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ROW 3: THE MAIN TELEMETRY CHART */}
        {activeServer && (
          <div className="widget-panel span-12">
             <div className="widget-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <h3 className="widget-title"><Activity size={16} color="#10b981" /> Node Telemetry Stream</h3>
                  <span style={{ background: '#1a1d24', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75em', color: '#94a3b8', border: '1px solid #232836' }}>
                    Target: {activeServer.name} ({activeServer.ip_address})
                  </span>
                </div>
                {activeMetric && (
                  <div style={{ display: 'flex', gap: '12px', fontSize: '0.8em', color: '#94a3b8' }}>
                    <span>OS: <strong style={{color:'#fff'}}>{activeMetric.os_type}</strong></span>
                    <span>Uptime: <strong style={{color:'#fff'}}>{Math.floor(activeMetric.uptime_seconds / 3600)}h</strong></span>
                  </div>
                )}
             </div>
             <MetricsChart serverId={activeServer.id} />
          </div>
        )}

      </div>
    </div>
  );
}

export default Dashboard;