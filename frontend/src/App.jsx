import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Servers from './pages/Servers';
import ServerDetails from './pages/ServerDetails';
import Websites from './pages/Websites';
import APM from './pages/APM'; 
import RealUsers from './pages/RealUsers';
import api from './api'; // Make sure to import your api instance!
import './App.css';

// --- NEW: The invisible tracker that watches your clicks ---
function RUMTracker() {
  const location = useLocation();

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

function App() {
  return (
    <BrowserRouter>
      {/* --- NEW: Place the tracker right here inside the router --- */}
      <RUMTracker />
      
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/servers" element={<Servers />} />
            <Route path="/servers/:id" element={<ServerDetails />} />
            <Route path="/websites" element={<Websites />} />
            <Route path="/apm" element={<APM />} /> 
            <Route path="/rum" element={<RealUsers />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;