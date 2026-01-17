import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminAuth from './pages/AdminAuth';
import QRScannerMain from './pages/QRScannerMain';
import ProtectedRoute from './ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AdminAuth />} />
        <Route 
          path="/admin/qr" 
          element={
            <ProtectedRoute>
              <QRScannerMain />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;