import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Server, Globe, Activity, Users, Shield, BellRing, FileText, Zap, ShieldCheck } from 'lucide-react';
import './Sidebar.css';
function Sidebar() {
 const navItems=[{to:'/overview',icon:LayoutDashboard,label:'Overview'},{to:'/servers',icon:Server,label:'Servers'},{to:'/websites',icon:Globe,label:'Websites'},{to:'/apm',icon:Activity,label:'APM'},{to:'/rum',icon:Users,label:'Real Users'},{to:'/alerts',icon:BellRing,label:'Alerts'},{to:'/logs',icon:FileText,label:'Logs'},{to:'/auto-healing',icon:Zap,label:'Auto-Healing'},{to:'/security',icon:ShieldCheck,label:'Security'}];
 return <aside className="sidebar"><div className="sidebar-logo"><Shield size={24} className="logo-icon"/><span className="logo-text">SentinelOps</span></div><nav className="sidebar-nav">{navItems.map(item=><NavLink key={item.to} to={item.to} end={item.to==='/overview'} className={({isActive})=>`nav-item ${isActive?'active':''}`}><item.icon size={18}/><span>{item.label}</span></NavLink>)}</nav><div className="sidebar-footer"><div className="status-dot"/><span>System Online</span></div></aside>;
}
export default Sidebar;