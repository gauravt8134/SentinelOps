import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Servers from './pages/Servers';
import ServerDetails from './pages/ServerDetails'; // 1. Import the new page
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/servers" element={<Servers />} />
            {/* 2. Add the dynamic route for the drill-down page */}
            <Route path="/servers/:id" element={<ServerDetails />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;