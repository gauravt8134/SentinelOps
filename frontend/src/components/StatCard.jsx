import './StatCard.css';

function StatCard({ label, value, icon: Icon, accentColor = 'cyan', suffix = '' }) {
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
    </div>
  );
}

export default StatCard;