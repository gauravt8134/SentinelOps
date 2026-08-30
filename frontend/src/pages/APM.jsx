import { useState, useEffect } from 'react';
import { Activity, Clock, AlertTriangle, Zap, Server, ShieldAlert, CheckCircle } from 'lucide-react';
import { 
  AreaChart, Area, ComposedChart, Line, Bar, XAxis, YAxis, 
  Tooltip, ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';
import api from '../api';
import './Websites.css';

function APM() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAPMStats();
    const interval = setInterval(fetchAPMStats, 10000); 
    return () => clearInterval(interval);
  }, []);

  async function fetchAPMStats() {
    try {
      const res = await api.get('/apm/stats'); 
      if (Array.isArray(res.data)) {
        setStats(res.data);
      } else {
        setStats([]); 
      }
    } catch (error) {
      console.error('Failed to fetch APM stats:', error);
      setStats([]); 
    } finally {
      setLoading(false);
    }
  }

  // --- Global Calculations ---
  const totalRequests = stats.reduce((acc, curr) => acc + (curr.total_requests || 0), 0);
  const avgLatency = stats.length > 0 
    ? Math.round(stats.reduce((acc, curr) => acc + (curr.avg_response_time_ms || 0), 0) / stats.length)
    : 0;
  const avgErrorRate = stats.length > 0
    ? (stats.reduce((acc, curr) => acc + (curr.error_rate_percent || 0), 0) / stats.length).toFixed(2)
    : 0;

  // --- Chart Data Preparation ---
  // 1. Traffic vs Errors (Top 10 most heavily used endpoints)
  const trafficData = [...stats]
    .sort((a, b) => b.total_requests - a.total_requests)
    .slice(0, 10)
    .map(stat => ({
      endpoint: stat.endpoint,
      requests: stat.total_requests,
      errorRate: stat.error_rate_percent ? Number(stat.error_rate_percent.toFixed(2)) : 0,
    }));

  // 2. Bottlenecks (Top 10 slowest endpoints)
  const bottleneckData = [...stats]
    .sort((a, b) => b.avg_response_time_ms - a.avg_response_time_ms)
    .slice(0, 10)
    .map(stat => ({
      endpoint: stat.endpoint,
      latency: Math.round(stat.avg_response_time_ms || 0),
    }));

  // Custom Tooltip for dark mode
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: '#0f172a', padding: '12px', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)' }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '13px', borderBottom: '1px solid #334155', paddingBottom: '4px' }}>{label}</p>
          {payload.map((entry, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', marginTop: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.color }}></div>
              <span style={{ color: '#94a3b8' }}>{entry.name}:</span>
              <span style={{ fontWeight: '600' }}>{entry.value} {entry.name.includes('Rate') ? '%' : entry.name.includes('Latency') ? 'ms' : ''}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="websites-container">
      <div className="header-flex">
        <div>
          <h1 className="page-title">Application Monitoring</h1>
          <p className="page-subtitle">Datadog-style endpoint telemetry, traffic correlation, and bottleneck analysis.</p>
        </div>
      </div>

      {/* APM Stats Banner */}
      <div className="stats-banner" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-box">
          <span className="stat-label"><Activity size={14} style={{display:'inline', marginRight:'5px'}}/>Total Volume</span>
          <span className="stat-value">{totalRequests.toLocaleString()}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label"><AlertTriangle size={14} style={{display:'inline', marginRight:'5px'}}/>Global Error Rate</span>
          <span className={`stat-value ${avgErrorRate > 5 ? 'text-danger' : 'text-success'}`}>{avgErrorRate}%</span>
        </div>
        <div className="stat-box">
          <span className="stat-label"><Clock size={14} style={{display:'inline', marginRight:'5px'}}/>P50 Latency (Avg)</span>
          <span className={`stat-value ${avgLatency > 500 ? 'text-danger' : 'text-success'}`}>{avgLatency} ms</span>
        </div>
        <div className="stat-box">
          <span className="stat-label"><Zap size={14} style={{display:'inline', marginRight:'5px'}}/>Tracked Services</span>
          <span className="stat-value">{stats.length}</span>
        </div>
      </div>

      {/* Datadog-style Grid Layout for Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px', marginTop: '20px' }}>
        
        {/* Chart 1: Traffic vs Errors (Dual Axis) */}
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '20px', height: '320px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={16} color="#38bdf8"/> Volume & Error Correlation (Top 10)
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="endpoint" stroke="#64748b" fontSize={10} tick={{fill: '#64748b'}} tickLine={false} axisLine={false} />
              
              {/* Left Y-Axis for Requests */}
              <YAxis yAxisId="left" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val} />
              {/* Right Y-Axis for Errors */}
              <YAxis yAxisId="right" orientation="right" stroke="#ef4444" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
              
              <Tooltip content={<CustomTooltip />} />
              
              {/* PERFECTED LEGEND POSITIONING */}
              <Legend 
                verticalAlign="top" 
                align="right" 
                iconType="circle" 
                wrapperStyle={{ fontSize: '12px', paddingBottom: '10px', color: '#cbd5e1' }} 
              />
              
              <Bar yAxisId="left" dataKey="requests" name="Total Requests" fill="#38bdf8" radius={[2, 2, 0, 0]} maxBarSize={40} />
              <Line yAxisId="right" type="monotone" dataKey="errorRate" name="Error Rate" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 2: Bottleneck Analysis (Latency) */}
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '20px', height: '320px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={16} color="#8b5cf6"/> Latency Bottlenecks (Slowest 10)
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={bottleneckData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="endpoint" stroke="#64748b" fontSize={10} tick={{fill: '#64748b'}} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}ms`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="latency" name="Avg Latency" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorLatency)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Advanced APM Trace Table */}
      <div className="table-container" style={{ marginTop: '20px' }}>
        <table className="enterprise-table">
          <thead>
            <tr>
              <th>Health</th>
              <th>Endpoint Definition</th>
              <th>Traffic Volume</th>
              <th>Error Rate</th>
              <th>Avg Latency</th>
            </tr>
          </thead>
          <tbody>
            {stats.sort((a, b) => b.total_requests - a.total_requests).map((stat, index) => {
              const isFailing = stat.error_rate_percent >= 5;
              const isWarning = stat.error_rate_percent > 0 && stat.error_rate_percent < 5;
              const maxRequests = Math.max(...stats.map(s => s.total_requests));
              const requestWidth = `${(stat.total_requests / maxRequests) * 100}%`;

              return (
                <tr key={index}>
                  <td>
                    {isFailing ? <ShieldAlert size={18} color="#ef4444" /> : 
                     isWarning ? <AlertTriangle size={18} color="#f59e0b" /> : 
                     <CheckCircle size={18} color="#10b981" />}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className={`http-badge ${stat.method ? stat.method.toLowerCase() : 'get'}`}>
                        {stat.method || 'GET'}
                      </span>
                      <span style={{ fontFamily: 'monospace', color: '#e2e8f0', fontSize: '13px' }}>{stat.endpoint || '/'}</span>
                    </div>
                  </td>
                  <td style={{ width: '25%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 'bold', color: '#e2e8f0', width: '40px' }}>{stat.total_requests}</span>
                      <div style={{ flex: 1, backgroundColor: '#334155', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: requestWidth, backgroundColor: '#38bdf8', height: '100%' }}></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={`status-pill ${isFailing ? 'status-down' : isWarning ? 'status-warn' : 'status-up'}`}>
                      {stat.error_rate_percent !== undefined ? stat.error_rate_percent.toFixed(2) : '0.00'}%
                    </div>
                  </td>
                  <td>
                    <span className={stat.avg_response_time_ms > 500 ? 'text-danger' : 'text-success'} style={{ fontWeight: '500' }}>
                      {stat.avg_response_time_ms ? Math.round(stat.avg_response_time_ms) : 0} ms
                    </span>
                  </td>
                </tr>
              );
            })}
            {stats.length === 0 && !loading && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No API traffic recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default APM;