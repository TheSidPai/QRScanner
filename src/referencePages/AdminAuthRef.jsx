import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiLockLine, RiEyeLine, RiEyeOffLine } from '@remixicon/react';
import { API_ENDPOINTS, buildApiUrl } from '../config/api';
import './AdminAuth.css';

function AdminAuth() {
  const navigate = useNavigate();
  const [adminKey, setAdminKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!adminKey.trim()) {
      setError('Please enter admin key');
      return;
    }

    setIsAuthenticating(true);
    setError('');

    try {
      console.log('🔐 Attempting admin login with key:', adminKey);
      console.log('📍 API URL:', buildApiUrl(API_ENDPOINTS.ADMIN_LOGIN));
      
      // Admin login using correct endpoint from readme.txt
      const response = await fetch(buildApiUrl(API_ENDPOINTS.ADMIN_LOGIN), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminKey: adminKey }),
      });

      console.log('📥 Response status:', response.status);
      
      const data = await response.json();
      console.log('📦 Response data:', data);

      // Check if login was successful
      // Backend returns: { status: "success", message: "...", data: { token: "..." } }
      if (response.ok && data.status === 'success' && data.data?.token) {
        console.log('✅ Login successful! Token:', data.data.token?.substring(0, 20) + '...');
        
        // Store the JWT token returned by backend
        sessionStorage.setItem('admin_token', data.data.token);
        console.log('💾 Token stored in sessionStorage');
        
        console.log('🚀 Navigating to /admin/dashboard...');
        // Redirect to admin dashboard
        navigate('/admin/dashboard');
      } else {
        console.log('❌ Login failed:', data.message);
        // Handle failed authentication
        setError(data.message || 'Invalid admin key');
        setAdminKey('');
      }
    } catch (error) {
      console.error('❌ Admin authentication error:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError('❌ Cannot connect to server. Make sure the backend is running at ' + buildApiUrl(''));
      } else if (error.message) {
        setError('Network error: Unable to connect to server. Please check your connection and try again.');
      } else {
        setError('An error occurred during authentication. Please try again.');
      }
      
      setAdminKey('');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="admin-auth-container">
      <div className="admin-auth-card">
        <div className="admin-auth-header">
          <div className="admin-auth-icon">
            <RiLockLine size={36} className="text-black" />
          </div>
          <h1 className="admin-auth-title">Admin Access</h1>
          <p className="admin-auth-subtitle">Enter your admin key to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-auth-form">
          <div className="admin-input-group">
            <label className="admin-input-label">
              Admin Key
            </label>
            <div className="admin-input-wrapper">
              <input
                type={showKey ? 'text' : 'password'}
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className="admin-input"
                placeholder="Enter admin key"
                required
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="admin-toggle-password"
              >
                {showKey ? <RiEyeOffLine size={20} /> : <RiEyeLine size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="admin-error">
              <p className="admin-error-text">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isAuthenticating}
            className="admin-submit-btn"
          >
            {isAuthenticating ? 'Authenticating...' : 'Access Dashboard'}
          </button>
        </form>

        <div className="admin-auth-footer">
          <p className="admin-warning-text">
            Unauthorized access is prohibited and monitored
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminAuth;
