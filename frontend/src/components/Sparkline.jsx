import { LineChart, Line, ResponsiveContainer } from 'recharts';

function Sparkline({ data, color = '#00e5ff' }) {
  if (!data || data.length === 0) return null;

  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <ResponsiveContainer width="100%" height={32}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default Sparkline;