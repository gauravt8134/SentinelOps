import { useState, useEffect } from 'react';
import { 
  Server as ServerIcon, Cpu, HardDrive, MemoryStick, 
  Clock, Activity, ArrowDown, ArrowUp, AlertTriangle, AlertCircle 
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

function Servers() {
  const [servers, setServers] = useState([]);
  const [latestMetrics, setLatestMetrics] = useState({});
  const [loading, setLoading] = useState(true);

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

        metricsResults.forEach(({ id, data }) => {
          if (data.length > 0) {
            latestMap[id] = data[data.length - 1];
          }
        });

        setLatestMetrics(latestMap);
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

  if (loading) return <div className="loading-text">Loading servers...</div>;

  return (
    <div>
      <h1 className="page-title">Servers</h1>
      <p className="page-subtitle">{servers.length} servers being monitored</p>

      <div className="servers-grid">
        {servers.map((server) => {
          const metric = latestMetrics[server.id];
          const isOffline = checkIfOffline(metric?.recorded_at);
          
          let displayStatus = isOffline ? 'OFFLINE' : 'ONLINE';
          let statusClass = isOffline ? 'status-offline' : 'status-online';

          const cpuHealth = getHealthStatus(metric?.cpu_percent || 0);
          const ramHealth = getHealthStatus(metric?.memory_percent || 0);
          const diskHealth = getHealthStatus(metric?.disk_percent || 0);

          const isCritical = cpuHealth === 'critical' || ramHealth === 'critical' || diskHealth === 'critical';
          const isWarning = cpuHealth === 'warning' || ramHealth === 'warning' || diskHealth === 'warning';

          return (
            <div className={`server-card ${isOffline ? 'card-offline' : ''}`} key={server.id}>
              <div className="server-card-header">
                <div className="server-icon">
                  <ServerIcon size={18} />
                </div>
                <div>
                  <h3 className="server-name">{server.name}</h3>
                  
                  {/* CLEAN HEADER: IP, OS, and Docker badge */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                    <span className="server-ip">
                      {server.ip_address} 
                      <span style={{ color: '#8c8c8c', marginLeft: '6px', fontSize: '0.9em' }}>
                        • {metric?.os_type || 'Unknown OS'}
                      </span>
                    </span>
                    
                    {metric?.docker_containers > 0 && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#0db7ed', fontSize: '0.75em', fontWeight: '500', whiteSpace: 'nowrap', width: 'fit-content' }}>
                        🐳 {metric.docker_containers} Container{metric.docker_containers > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
                <div className={`server-status ${statusClass}`}>
                  {displayStatus}
                </div>
              </div>

              {metric && !isOffline ? (
                <div className="server-metrics">
                  
                  {isCritical && (
                    <div className="alert-box critical-alert">
                      <AlertTriangle size={16} />
                      <span>
                        <strong>Critical Alert:</strong> System overloaded. 
                        <strong> {metric?.top_process || 'A background task'} </strong> 
                        is consuming massive resources. Terminate it immediately!
                      </span>
                    </div>
                  )}

                  {isWarning && !isCritical && (
                    <div className="alert-box warning-alert">
                      <AlertCircle size={16} />
                      <span>
                        <strong>Warning Notice:</strong> High usage detected. Keep an eye on 
                        <strong> {metric?.top_process || 'background tasks'} </strong> 
                        to prevent a crash.
                      </span>
                    </div>
                  )}

                  {/* CPU METRIC */}
                  <div className="metric-group mt-3">
                    <div className={`metric-item health-${cpuHealth}`}>
                      <div className="metric-label-wrapper">
                        <Cpu size={14} />
                        <span className="metric-label">CPU</span>
                      </div>
                      <span className="metric-value">{metric.cpu_percent?.toFixed(1) || 0}%</span>
                    </div>
                    <div className="progress-bar-bg" style={{ marginBottom: '12px' }}>
                      <div className={`progress-bar-fill bg-${cpuHealth}`} style={{ width: `${metric.cpu_percent || 0}%` }}></div>
                    </div>
                  </div>

                  {/* RAM METRIC */}
                  <div className="metric-group">
                    <div className={`metric-item health-${ramHealth}`}>
                      <div className="metric-label-wrapper">
                        <MemoryStick size={14} />
                        <span className="metric-label">RAM</span>
                      </div>
                      <span className="metric-value">{metric.memory_percent?.toFixed(1) || 0}%</span>
                    </div>
                    <div className="progress-bar-bg" style={{ marginBottom: '12px' }}>
                      <div className={`progress-bar-fill bg-${ramHealth}`} style={{ width: `${metric.memory_percent || 0}%` }}></div>
                    </div>
                  </div>

                  {/* DISK METRIC */}
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
                  <div className="metric-item">
                    <div className="metric-label-wrapper"><Activity size={14} /><span className="metric-label">Procs</span></div>
                    <span className="metric-value">{metric.processes || 0}</span>
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