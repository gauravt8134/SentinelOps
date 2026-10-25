import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Server as ServerIcon, Cpu, MemoryStick, HardDrive, Clock, Activity, Terminal, Network } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api';

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

function ServerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [server, setServer] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch the server list and this server's specific historical metrics simultaneously
        const [serverRes, metricsRes] = await Promise.all([
          api.get('/servers'),
          api.get(`/metrics/${id}`)
        ]);
        
        const foundServer = serverRes.data.find(s => s.id === parseInt(id));
        setServer(foundServer);
        
        // Format dates into HH:MM:SS strings for the X-Axis of the charts
        const formattedMetrics = metricsRes.data.map(m => ({
          ...m,
          timeLabel: new Date(m.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }));
        
        setMetrics(formattedMetrics);
      } catch (error) {
        console.error('Failed to fetch server details:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
    // Auto-refresh the charts every 10 seconds for live updates
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) return <div className="loading-text" style={{ padding: '24px' }}>Loading node telemetry...</div>;
  if (!server) return <div className="loading-text" style={{ padding: '24px' }}>Node not found.</div>;

  const latestMetric = metrics.length > 0 ? metrics[metrics.length - 1] : null;

  // Custom sleek tooltip for the Recharts graphs
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#1e222d', border: '1px solid #2d3748', padding: '12px', borderRadius: '6px', color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '0.85em', color: '#94a3b8' }}>{label}</p>
          <p style={{ margin: 0, fontWeight: 'bold', color: payload[0].color }}>
            {payload[0].name}: {payload[0].value}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      {/* 1. Top Navigation Bar */}
      <button 
        onClick={() => navigate('/servers')}
        style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.9em', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '24px', padding: 0 }}
      >
        <ArrowLeft size={16} /> Back to Fleet Management
      </button>

      {/* 2. Node Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid #232836' }}>
        <div style={{ background: '#1a1d24', padding: '12px', borderRadius: '8px', border: '1px solid #2d3748' }}>
          <ServerIcon size={32} color="#0db7ed" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8em', color: '#fff' }}>{server.name}</h1>
          <div style={{ display: 'flex', gap: '12px', marginTop: '6px', color: '#94a3b8', fontSize: '0.9em' }}>
            <span>{server.ip_address}</span>
            <span>•</span>
            <span>Node ID: {server.id}</span>
            {latestMetric && (
               <>
                 <span>•</span>
                 <span>{latestMetric.os_type}</span>
               </>
            )}
          </div>
        </div>
      </div>

      {/* 3. Dashboard Layout Grid (Charts on Left, Stats on Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* LEFT COLUMN: Large Historical Charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* CPU Area Chart */}
          <div style={{ background: '#14171f', border: '1px solid #232836', borderRadius: '8px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={18} color="#3b82f6" /> CPU Utilization History
            </h3>
            <div style={{ height: '280px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics}>
                  <defs>
                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#232836" vertical={false} />
                  <XAxis dataKey="timeLabel" stroke="#64748b" fontSize={12} tickMargin={10} minTickGap={30} />
                  <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="cpu_percent" name="CPU" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCpu)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RAM Area Chart */}
          <div style={{ background: '#14171f', border: '1px solid #232836', borderRadius: '8px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MemoryStick size={18} color="#10b981" /> Memory Utilization History
            </h3>
            <div style={{ height: '280px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics}>
                  <defs>
                    <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#232836" vertical={false} />
                  <XAxis dataKey="timeLabel" stroke="#64748b" fontSize={12} tickMargin={10} minTickGap={30} />
                  <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="memory_percent" name="RAM" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRam)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Live Panel & Heavy Process Alert */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Live Telemetry Card */}
          <div style={{ background: '#14171f', border: '1px solid #232836', borderRadius: '8px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1em', borderBottom: '1px solid #232836', paddingBottom: '12px' }}>Live Telemetry</h3>
            
            {latestMetric ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}><Cpu size={16}/> CPU</span>
                  <span style={{ fontWeight: 'bold' }}>{latestMetric.cpu_percent.toFixed(1)}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}><MemoryStick size={16}/> RAM</span>
                  <span style={{ fontWeight: 'bold' }}>{latestMetric.memory_percent.toFixed(1)}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}><HardDrive size={16}/> Disk</span>
                  <span style={{ fontWeight: 'bold' }}>{latestMetric.disk_percent.toFixed(1)}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}><Network size={16}/> Network In</span>
                  <span style={{ fontWeight: 'bold' }}>{formatBytes(latestMetric.network_in)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}><Network size={16}/> Network Out</span>
                  <span style={{ fontWeight: 'bold' }}>{formatBytes(latestMetric.network_out)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={16}/> Uptime</span>
                  <span style={{ fontWeight: 'bold' }}>{formatUptime(latestMetric.uptime_seconds)}</span>
                </div>
              </div>
            ) : (
              <p style={{ color: '#64748b' }}>No telemetry data available.</p>
            )}
          </div>

          {/* Top Process Insight Card */}
          <div style={{ background: '#14171f', border: '1px solid #232836', borderRadius: '8px', padding: '20px' }}>
             <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1em', borderBottom: '1px solid #232836', paddingBottom: '12px' }}>Resource Heavy Task</h3>
             
             {latestMetric && latestMetric.top_process ? (
                <div style={{ background: '#1e222d', padding: '16px', borderRadius: '6px', border: '1px solid #2d3748', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Terminal size={24} color="#ef4444" />
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#fff' }}>{latestMetric.top_process}</div>
                    <div style={{ fontSize: '0.85em', color: '#94a3b8', marginTop: '2px' }}>Highest consumer detected</div>
                  </div>
                </div>
             ) : (
                <p style={{ color: '#64748b' }}>No process data detected.</p>
             )}
          </div>

        </div>

      </div>
    </div>
  );
}

export default ServerDetails;