import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Servers from './pages/Servers';
import ServerDetails from './pages/ServerDetails';
import Websites from './pages/Websites'; // 1. Import the Websites page
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
            <Route path="/servers/:id" element={<ServerDetails />} />
            <Route path="/websites" element={<Websites />} /> {/* 2. Add the Websites route */}
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;