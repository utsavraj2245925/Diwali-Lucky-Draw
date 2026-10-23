import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { App as AntdApp, ConfigProvider } from 'antd';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import EventConfig from './pages/EventConfig';
import PrizeManagement from './pages/PrizeManagement';
import EmployeeImport from './pages/EmployeeImport';
import CardManagement from './pages/CardManagement';
import LiveDraw from './pages/LiveDraw';
import Login from './pages/Login';
import { Toaster } from 'react-hot-toast';

const App = () => {
  return (
    <ConfigProvider theme={{ token: { primaryColor: '#d4af37' } }}>
      <Router>
        <AntdApp>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/live-draw" element={<LiveDraw />} />
            
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="events" element={<EventConfig />} />
              <Route path="prizes" element={<PrizeManagement />} />
              <Route path="import" element={<EmployeeImport />} />
              <Route path="cards" element={<CardManagement />} />
            </Route>

            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="*" element={<div style={{ padding: 20, textAlign: 'center' }}>404 Page Not Found</div>} />
          </Routes>
        </AntdApp>
      </Router>
    </ConfigProvider>
  );
};

export default App;
