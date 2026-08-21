import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../api';
import './MetricsChart.css';

function MetricsChart({ serverId }) {
  const [metrics, setMetrics] = useState([]);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await api.get(`/metrics/${serverId}`);
        const formatted = res.data
          .slice(-20)
          .map((m) => ({
            time: new Date(m.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            cpu: m.cpu_percent,
            ram: m.memory_percent,
          }));
        setMetrics(formatted);
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      }
    }

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000);
    return () => clearInterval(interval);
  }, [serverId]);

  if (metrics.length === 0) {
    return <div className="chart-empty">No metric data yet</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={metrics}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2733" vertical={false} />
        <XAxis dataKey="time" stroke="#8b949e" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#8b949e" fontSize={12} tickLine={false} axisLine={false} unit="%" />
        <Tooltip
          contentStyle={{
            backgroundColor: '#131924',
            border: '1px solid #1f2733',
            borderRadius: '8px',
            fontSize: '13px',
          }}
          labelStyle={{ color: '#8b949e' }}
        />
        <Line type="monotone" dataKey="cpu" name="CPU %" stroke="#00e5ff" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="ram" name="RAM %" stroke="#39ff88" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default MetricsChart;