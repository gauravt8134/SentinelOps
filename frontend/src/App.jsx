import { BrowserRouter, Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AlertTriangle, Bell, CheckCircle2, ChevronDown, Clock3, FileText, Filter, LockKeyhole, Play, RefreshCw, Search, ShieldAlert, Terminal, Zap } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Servers from './pages/Servers';
import ServerDetails from './pages/ServerDetails';
import Websites from './pages/Websites';
import APM from './pages/APM'; 
import RealUsers from './pages/RealUsers';
import Settings from './pages/Settings';
import { Landing, AuthPage } from './pages/Landing';
import api from './api'; // Make sure to import your api instance!
import './App.css';

// --- NEW: The invisible tracker that watches your clicks ---
function RUMTracker() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Measure how fast the page loaded
    const [navEntry] = performance.getEntriesByType('navigation');
    const loadTimeMs = navEntry ? Math.round(navEntry.loadEventEnd - navEntry.startTime) : 850;

    // 2. Silently send this data to your FastAPI backend
    api.post('/rum/log', {
      page_url: location.pathname,
      load_time_ms: Math.max(loadTimeMs, 100),
      error_message: null,
      user_agent: navigator.userAgent
    }).catch(err => console.error("RUM tracking failed:", err));
    
  }, [location.pathname]); // This triggers every time the URL changes

  return null; // It renders nothing on the screen!
}

function CommandBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  const [openMenu, setOpenMenu] = useState(null);
  const [environment, setEnvironment] = useState('Production');
  const [query, setQuery] = useState('');
  const [loggedIn, setLoggedIn] = useState(() => localStorage.getItem('sentinelops-session') === 'active');
  const pageNames = { '/': 'Overview', '/servers': 'Fleet Management', '/websites': 'Synthetic Monitoring', '/apm': 'Application Monitoring', '/rum': 'Real User Monitoring' };
  const searchItems = ['Overview', 'Servers', 'Websites', 'APM', 'Real Users', 'Node telemetry', 'API errors', 'Auto-healing events'];

  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(timer); }, []);

  const toggleMenu = (menu) => setOpenMenu((current) => current === menu ? null : menu);
  const handleLogin = () => { navigate('/login'); setOpenMenu(null); };
  const handleLogout = () => { localStorage.removeItem('sentinelops-session'); setLoggedIn(false); setOpenMenu(null); navigate('/'); };

  return (
    <header className="command-bar">
      <div className="command-context"><span className="breadcrumb-root">SentinelOps</span><span className="breadcrumb-separator">/</span><span>{pageNames[location.pathname] || 'Node Details'}</span></div>
      <div className="command-actions">
        <div className="live-state"><span className="live-pulse" /> Live telemetry</div>
        <div className="command-time"><Clock3 size={14} /> {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        <div className="command-popover-wrap">
          <button className="command-select" onClick={() => toggleMenu('environment')}><span>{environment}</span><ChevronDown size={14} /></button>
          {openMenu === 'environment' && <div className="command-popover environment-menu">{['Production', 'Development', 'Local'].map((item) => <button key={item} className={environment === item ? 'selected' : ''} onClick={() => { setEnvironment(item); setOpenMenu(null); }}>{item}<span>{environment === item ? '✓' : ''}</span></button>)}</div>}
        </div>
        <div className="command-popover-wrap">
          <button className="icon-button" title="Search" onClick={() => toggleMenu('search')}><Search size={17} /></button>
          {openMenu === 'search' && <div className="command-popover search-menu"><div className="search-input-wrap"><Search size={15} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search SentinelOps..." /></div><div className="search-results">{searchItems.filter((item) => item.toLowerCase().includes(query.toLowerCase())).map((item) => <button key={item} onClick={() => { setQuery(item); setOpenMenu(null); }}>{item}<span>↵</span></button>)}{searchItems.filter((item) => item.toLowerCase().includes(query.toLowerCase())).length === 0 && <small>No matching results</small>}</div></div>}
        </div>
        <div className="command-popover-wrap">
          <button className="icon-button notification-button" title="Notifications" onClick={() => toggleMenu('notifications')}><Bell size={17} /><span className="notification-dot" /></button>
          {openMenu === 'notifications' && <div className="command-popover notification-menu"><div className="popover-heading"><strong>Notifications</strong><span>3 new</span></div><div className="notification-item critical"><span className="notification-icon">!</span><div><strong>High memory usage</strong><small>Peter Parker · 2 minutes ago</small></div></div><div className="notification-item warning"><span className="notification-icon">↻</span><div><strong>Agent restart completed</strong><small>SAHIL-Node · 18 minutes ago</small></div></div><div className="notification-item success"><span className="notification-icon">✓</span><div><strong>All synthetic checks passing</strong><small>System · 1 hour ago</small></div></div></div>}
        </div>
        <div className="command-popover-wrap">
          <button className="avatar-button" onClick={() => toggleMenu('profile')} title="Account menu">GT</button>
          {openMenu === 'profile' && <div className="command-popover profile-menu"><div className="profile-summary"><div className="profile-avatar">GT</div><div><strong>Gaurav Thakare</strong><small>{loggedIn ? 'Administrator' : 'Signed out'}</small></div></div>{loggedIn ? <button onClick={handleLogout}>↪ <span>Logout</span></button> : <button onClick={handleLogin}>↪ <span>Login</span></button>}<button onClick={() => { setOpenMenu(null); navigate('/settings'); }}>⚙ <span>Account settings</span></button></div>}
        </div>
      </div>
    </header>
  );
}

const opsData = { alerts: [['critical','Memory usage above threshold','Peter Parker','RAM sustained above 85% for 10 minutes'],['warning','Agent heartbeat delayed','SAHIL-Node','Last heartbeat received 74 seconds ago'],['healthy','Synthetic checks recovered','Google API','HTTP 200 after auto-heal']], logs: [['ERROR','Database connection retry succeeded','api-gateway','Peter Parker'],['WARN','Heartbeat response exceeded 60 seconds','telemetry-agent','SAHIL-Node'],['INFO','Synthetic uptime check completed','scheduler','localhost']], healing: [['success','Restart telemetry agent','Peter Parker','4.2s'],['success','Restart API service','SAHIL-Node','7.8s'],['failed','Recover synthetic endpoint','Wikipedia API','12.4s']], security: [['high','Repeated failed login attempts','26.57.229.125','12 attempts detected'],['medium','Agent running with elevated privileges','LAPTOP-PMUOK9LU','Review agent permissions'],['low','New node registered','26.234.167.253','Registration approved']] };
const opsInfo = { alerts: ['Alerts & Incidents','Detect, triage, and resolve reliability issues.','Operations center', AlertTriangle], logs: ['Log Explorer','Search backend, agent, and scheduler events.','Unified telemetry', FileText], healing: ['Auto-Healing','Track automated recovery and resilience actions.','Resilience automation', Zap], security: ['Security Signals','Investigate suspicious activity across your environment.','Security operations', ShieldAlert] };
function OperationsPage({ type }) { const [query,setQuery]=useState(''); const [filter,setFilter]=useState('all'); const [running,setRunning]=useState(false); const [title,subtitle,eyebrow,Icon]=opsInfo[type]; const rows=opsData[type].filter(r=>JSON.stringify(r).toLowerCase().includes(query.toLowerCase())&&(filter==='all'||r[0].toLowerCase()===filter)); const run=()=>{setRunning(true);setTimeout(()=>setRunning(false),1800)}; return <div className="operations-page"><div className="ops-header"><div><span className="ops-eyebrow">{eyebrow}</span><h1 className="page-title">{title}</h1><p className="page-subtitle">{subtitle}</p></div>{type==='healing'&&<button className="ops-primary" onClick={run}><Play size={15}/>{running?'Running recovery…':'Run heal action'}</button>}</div><div className="ops-kpis"><div><span>OPEN ITEMS</span><strong>{type==='logs'?'1,248':type==='security'?'03':type==='healing'?'01':'02'}</strong><small>Live signal</small></div><div><span>HEALTH SCORE</span><strong>{type==='security'?'96%':'98.4%'}</strong><small className="kpi-good">↑ 4.2% this week</small></div><div><span>LAST UPDATED</span><strong>Just now</strong><small>Auto-refresh enabled</small></div><div><span>ENVIRONMENT</span><strong>Production</strong><small>5 nodes connected</small></div></div><div className="ops-toolbar"><div className="ops-search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search signals, services, or hosts…"/></div><div className="ops-filters"><Filter size={15}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All statuses</option>{type==='alerts'&&<><option value="critical">Critical</option><option value="warning">Warning</option><option value="healthy">Resolved</option></>}{type==='security'&&<><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></>}{type==='healing'&&<><option value="success">Successful</option><option value="failed">Failed</option></>}</select><button className="ops-icon-btn"><RefreshCw size={15}/></button></div></div>{type==='alerts'&&<div className="incident-banner"><AlertTriangle size={18}/><div><strong>One incident needs attention</strong><span>High memory usage on Peter Parker is still open.</span></div><button>Investigate</button></div>}<div className="ops-list">{rows.map((r,i)=>type==='logs'?<div className="ops-row" key={i}><div className={'log-level '+r[0].toLowerCase()}>{r[0]}</div><div className="ops-row-main"><strong>{r[1]}</strong><span><Terminal size={12}/> {r[2]} · {r[3]}</span></div><time>09:42:18 PM</time></div>:<div className="ops-row" key={i}><div className={'ops-status '+r[0]}>{type==='healing'?(r[0]==='success'?<CheckCircle2 size={18}/>:<AlertTriangle size={18}/>):type==='security'?<LockKeyhole size={18}/>:r[0]==='healthy'?<CheckCircle2 size={18}/>:<AlertTriangle size={18}/>}</div><div className="ops-row-main"><strong>{r[1]}</strong><span>{r[3]}</span></div><div className="ops-row-meta"><b>{r[0]}</b><time>{r[2]}</time></div><button className="row-action">Investigate</button></div>)}</div><div className="ops-footer">Showing {rows.length} events <span><span className="live-dot"/> Live updates every 10 seconds</span></div></div> }
function Alerts(){return <OperationsPage type="alerts"/>} function Logs(){return <OperationsPage type="logs"/>} function Healing(){return <OperationsPage type="healing"/>} function Security(){return <OperationsPage type="security"/>}
function AppRouter() {
  const location = useLocation();
  const navigate = useNavigate();
  const isPublic = ['/', '/login', '/trial'].includes(location.pathname);
  const loggedIn = localStorage.getItem('sentinelops-session') === 'active';
  if (isPublic) return <Routes><Route path="/" element={<Landing />} /><Route path="/login" element={<AuthPage />} /><Route path="/trial" element={<AuthPage mode="trial" />} /></Routes>;
  if (!loggedIn) return <Navigate to="/login" replace />
  return <div className="app-layout"><Sidebar /><main className="main-content"><CommandBar /><div className="page-surface"><Routes><Route path="/overview" element={<Dashboard />} /><Route path="/servers" element={<Servers />} /><Route path="/servers/:id" element={<ServerDetails />} /><Route path="/websites" element={<Websites />} /><Route path="/apm" element={<APM />} /><Route path="/rum" element={<RealUsers />} /><Route path="/settings" element={<Settings />} /><Route path="/alerts" element={<Alerts />} /><Route path="/logs" element={<Logs />} /><Route path="/auto-healing" element={<Healing />} /><Route path="/security" element={<Security />} /><Route path="*" element={<Navigate to="/overview" replace />} /></Routes></div></main></div>;
}

function App() { return <BrowserRouter><RUMTracker /><AppRouter /></BrowserRouter>; }
export default App;