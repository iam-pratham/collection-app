import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import DoctorList from './pages/DoctorList';
import DoctorDetail from './pages/DoctorDetail';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <header className="navbar">
          <div className="container nav-content">
            <Link to="/" className="logo">
              SHMB Collection Reports
            </Link>
            <nav className="nav-links">
              <Link to="/" className="nav-link">Directory</Link>
              <a href="#" className="nav-link">Reports</a>
            </nav>
          </div>
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<DoctorList />} />
            <Route path="/doctor/:doctorId" element={<DoctorDetail />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
