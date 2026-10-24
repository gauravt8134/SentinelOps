import Sparkline from './Sparkline';
import './StatCard.css';

function StatCard({ label, value, icon: Icon, accentColor = 'cyan', suffix = '', trend = null }) {
  const colorMap = {
    cyan: '#00e5ff',
    green: '#39ff88',
    red: '#ff4757',
    amber: '#ffb020',
  };

  return (
    <div className="stat-card">
      <div className={`stat-icon icon-${accentColor}`}>
        <Icon size={20} />
      </div>
      <div className="stat-info">
        <span className="stat-label">{label}</span>
        <span className="stat-value">
          {value}
          {suffix && <span className="stat-suffix">{suffix}</span>}
        </span>
      </div>
      {trend && (
        <div className="stat-sparkline">
          <Sparkline data={trend} color={colorMap[accentColor]} />
        </div>
      )}
    </div>
  );
}

export default StatCard;