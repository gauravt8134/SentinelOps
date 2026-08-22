import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Server as ServerIcon, Cpu, HardDrive, MemoryStick, 
  Clock, Activity, ArrowDown, ArrowUp, AlertTriangle, AlertCircle,
  Search, Filter, MoreVertical, TrendingUp, TrendingDown, Tag, ChevronRight,
  Terminal, BellOff, RefreshCw
} from 'lucide-react';
import api from '../api';
import './Servers.css';

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
};

const formatUptime = (totalSeconds) => {
  if (!totalSeconds || totalSeconds === 0) return '0h 0m';
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h ${minutes}m`;
};

const checkIfOffline = (recordedAt) => {
  if (!recordedAt) return true;
  const lastPing = new Date(recordedAt).getTime();
  const now = new Date().getTime();
  const diffSeconds = (now - lastPing) / 1000;
  return diffSeconds > 90; 
};

const getTimeAgo = (dateString) => {
  if (!dateString) return 'Awaiting first connection...';
  const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

const getHealthStatus = (value) => {
  if (value >= 90) return 'critical'; 
  if (value >= 80) return 'warning';  
  return 'healthy';                  
};

const MetricTrend = ({ current, previous }) => {
  if (!current || !previous) return null;
  const diff = current - previous;
  if (Math.abs(diff) < 2) return null; 
  return diff > 0 
    ? <TrendingUp size={14} color="#ef4444" style={{ marginLeft: '6px' }} />  
    : <TrendingDown size={14} color="#10b981" style={{ marginLeft: '6px' }} />; 
};

function Servers() {
  const [servers, setServers] = useState([]);
  const [latestMetrics, setLatestMetrics] = useState({});
  const [previousMetrics, setPreviousMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  
  // NEW: State for the 3-dot dropdown menu
  const [activeDropdown, setActiveDropdown] = useState(null);
  
  // NEW: Router navigation
  const navigate = useNavigate();

  // Control Bar State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    async function fetchServers() {
      try {
        const res = await api.get('/servers');
        setServers(res.data);
        const metricsPromises = res.data.map((server) =>
          api.get(`/metrics/${server.id}`).then((r) => ({ id: server.id, data: r.data }))
        );
        const metricsResults = await Promise.all(metricsPromises);
        
        const latestMap = {};
        const previousMap = {};

        metricsResults.forEach(({ id, data }) => {
          if (data.length > 0) latestMap[id] = data[data.length - 1];
          if (data.length > 1) previousMap[id] = data[data.length - 2]; 
        });

        setLatestMetrics(latestMap);
        setPreviousMetrics(previousMap);
      } catch (error) {
        console.error('Failed to fetch servers:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchServers();
    const interval = setInterval(fetchServers, 10000);
    return () => clearInterval(interval);
  }, []);

  const processedServers = servers
    .filter(server => {
      const metric = latestMetrics[server.id];
      const isOffline = checkIfOffline(metric?.recorded_at);
      const isAlerting = getHealthStatus(metric?.cpu_percent || 0) === 'critical' || getHealthStatus(metric?.memory_percent || 0) === 'critical';
      
      const matchesSearch = server.name.toLowerCase().includes(searchQuery.toLowerCase()) || server.ip_address.includes(searchQuery);
      
      let matchesFilter = true;
      if (filterStatus === 'online') matchesFilter = !isOffline;
      if (filterStatus === 'offline') matchesFilter = isOffline;
      if (filterStatus === 'alerting') matchesFilter = isAlerting;

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      const metricA = latestMetrics[a.id];
      const metricB = latestMetrics[b.id];
      if (sortBy === 'cpu') return (metricB?.cpu_percent || 0) - (metricA?.cpu_percent || 0);
      if (sortBy === 'ram') return (metricB?.memory_percent || 0) - (metricA?.memory_percent || 0);
      if (sortBy === 'uptime') return (metricB?.uptime_seconds || 0) - (metricA?.uptime_seconds || 0);
      return a.name.localeCompare(b.name);
    });

  if (loading) return <div className="loading-text">Loading servers...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Fleet Management</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>{processedServers.length} servers matching criteria</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', background: '#14171f', padding: '8px', borderRadius: '8px', border: '1px solid #232836' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px' }} />
            <input 
              type="text" 
              placeholder="Search hostname or IP..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: '#0f1117', border: '1px solid #2d3748', color: '#fff', padding: '6px 10px 6px 32px', borderRadius: '6px', fontSize: '0.85em', outline: 'none' }}
            />
          </div>
          
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ background: '#0f1117', border: '1px solid #2d3748', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85em', outline: 'none', cursor: 'pointer' }}>
            <option value="all">All Status</option>
            <option value="online">Online Only</option>
            <option value="offline">Offline Only</option>
            <option value="alerting">Alerting Only</option>
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ background: '#0f1117', border: '1px solid #2d3748', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85em', outline: 'none', cursor: 'pointer' }}>
            <option value="name">Sort: Name (A-Z)</option>
            <option value="cpu">Sort: Highest CPU</option>
            <option value="ram">Sort: Highest RAM</option>
            <option value="uptime">Sort: Highest Uptime</option>
          </select>
        </div>
      </div>

      <div className="servers-grid">
        {processedServers.map((server) => {
          const metric = latestMetrics[server.id];
          const prevMetric = previousMetrics[server.id];
          const isOffline = checkIfOffline(metric?.recorded_at);
          
          let displayStatus = isOffline ? 'OFFLINE' : 'ONLINE';
          let statusClass = isOffline ? 'status-offline' : 'status-online';

          const cpuHealth = getHealthStatus(metric?.cpu_percent || 0);
          const ramHealth = getHealthStatus(metric?.memory_percent || 0);
          const diskHealth = getHealthStatus(metric?.disk_percent || 0);

          const isCritical = cpuHealth === 'critical' || ramHealth === 'critical' || diskHealth === 'critical';

          const envTag = server.name.toLowerCase().includes('laptop') || server.name.toLowerCase().includes('pc') ? 'env: local' : 'env: prod';

          return (
            <div className={`server-card ${isOffline ? 'card-offline' : ''}`} key={server.id} style={{ position: 'relative' }}>
              
              {/* TOP RIGHT: STATUS BADGE & QUICK ACTION MENU */}
              <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 10 }}>
                <div 
                  className={`server-status ${statusClass}`} 
                  style={{ position: 'static', margin: 0, padding: '2px 6px', fontSize: '0.65em' }}
                >
                  {displayStatus}
                </div>
                
                {/* 3-Dot Container */}
                <div style={{ position: 'relative' }}>
                  <div 
                    style={{ cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}
                    onClick={() => setActiveDropdown(activeDropdown === server.id ? null : server.id)}
                  >
                    <MoreVertical size={16} />
                  </div>
                  
                  {/* The Dropdown Menu Box */}
                  {activeDropdown === server.id && (
                    <div className="action-dropdown">
                      <button onClick={() => setActiveDropdown(null)}>
                        <Terminal size={14} /> View Logs
                      </button>
                      <button onClick={() => setActiveDropdown(null)}>
                        <BellOff size={14} /> Mute Alerts
                      </button>
                      <button className="danger-btn" onClick={() => setActiveDropdown(null)}>
                        <RefreshCw size={14} /> Restart Agent
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="server-card-header" style={{ alignItems: 'flex-start', display: 'flex', gap: '12px', width: '100%' }}>
                
                <div className="server-icon" style={{ marginTop: '2px' }}>
                  <ServerIcon size={18} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <h3 className="server-name" style={{ margin: 0, paddingRight: '70px' }}>
                    {server.name}
                  </h3>
                  
                  <span className="server-ip" style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {server.ip_address} 
                    <span style={{ color: '#8c8c8c', fontSize: '0.9em' }}>
                      • {metric?.os_type || 'Unknown OS'}
                    </span>
                  </span>
                  
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#1a1d24', border: '1px solid #2d3748', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7em', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      <Tag size={10} /> {envTag}
                    </span>
                    {metric?.docker_containers > 0 && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(13, 183, 237, 0.1)', border: '1px solid rgba(13, 183, 237, 0.2)', padding: '2px 6px', borderRadius: '4px', color: '#0db7ed', fontSize: '0.7em', whiteSpace: 'nowrap' }}>
                        🐳 {metric.docker_containers} Container{metric.docker_containers > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

              </div>

              {metric && !isOffline ? (
                <div className="server-metrics" style={{ marginTop: '20px' }}>
                  
                  {isCritical && (
                    <div className="alert-box critical-alert">
                      <AlertTriangle size={16} />
                      <span>
                        <strong>Critical:</strong> System overloaded. 
                        <strong> {metric?.top_process || 'A background task'} </strong> 
                        is consuming massive resources.
                      </span>
                    </div>
                  )}

                  <div className="metric-group mt-3">
                    <div className={`metric-item health-${cpuHealth}`}>
                      <div className="metric-label-wrapper">
                        <Cpu size={14} />
                        <span className="metric-label">CPU</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span className="metric-value">{metric.cpu_percent?.toFixed(1) || 0}%</span>
                        <MetricTrend current={metric.cpu_percent} previous={prevMetric?.cpu_percent} />
                      </div>
                    </div>
                    <div className="progress-bar-bg" style={{ marginBottom: '12px' }}>
                      <div className={`progress-bar-fill bg-${cpuHealth}`} style={{ width: `${metric.cpu_percent || 0}%` }}></div>
                    </div>
                  </div>

                  <div className="metric-group">
                    <div className={`metric-item health-${ramHealth}`}>
                      <div className="metric-label-wrapper">
                        <MemoryStick size={14} />
                        <span className="metric-label">RAM</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span className="metric-value">{metric.memory_percent?.toFixed(1) || 0}%</span>
                        <MetricTrend current={metric.memory_percent} previous={prevMetric?.memory_percent} />
                      </div>
                    </div>
                    <div className="progress-bar-bg" style={{ marginBottom: '12px' }}>
                      <div className={`progress-bar-fill bg-${ramHealth}`} style={{ width: `${metric.memory_percent || 0}%` }}></div>
                    </div>
                  </div>

                  <div className="metric-group">
                    <div className={`metric-item health-${diskHealth}`}>
                      <div className="metric-label-wrapper">
                        <HardDrive size={14} />
                        <span className="metric-label">Disk</span>
                      </div>
                      <span className="metric-value">{metric.disk_percent?.toFixed(1) || 0}%</span>
                    </div>
                    <div className="progress-bar-bg" style={{ marginBottom: '16px' }}>
                      <div className={`progress-bar-fill bg-${diskHealth}`} style={{ width: `${metric.disk_percent || 0}%` }}></div>
                    </div>
                  </div>
                  
                  <div className="metric-item mt-3">
                    <div className="metric-label-wrapper"><ArrowDown size={14} /><span className="metric-label">Net In</span></div>
                    <span className="metric-value">{formatBytes(metric.network_in)}</span>
                  </div>
                  <div className="metric-item">
                    <div className="metric-label-wrapper"><ArrowUp size={14} /><span className="metric-label">Net Out</span></div>
                    <span className="metric-value">{formatBytes(metric.network_out)}</span>
                  </div>
                  <div className="metric-item">
                    <div className="metric-label-wrapper"><Clock size={14} /><span className="metric-label">Uptime</span></div>
                    <span className="metric-value">{formatUptime(metric.uptime_seconds)}</span>
                  </div>
                  
                  <div style={{ marginTop: '20px', paddingTop: '12px', borderTop: '1px solid #232836', textAlign: 'center' }}>
                    {/* BUTTON NOW NAVIGATES TO THE SERVER ID ROUTE */}
                    <button 
                      onClick={() => navigate(`/servers/${server.id}`)}
                      style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: '0.85em', fontWeight: '500', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                    >
                      View Node Details <ChevronRight size={14} />
                    </button>
                  </div>

                </div>
              ) : (
                <div className="no-metrics">
                  <div className="offline-message">Connection lost</div>
                  <div className="last-seen">Last seen: {getTimeAgo(metric?.recorded_at)}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Servers;