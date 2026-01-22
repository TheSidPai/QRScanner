import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiLockLine, RiEyeLine, RiEyeOffLine } from '@remixicon/react';
import { API_ENDPOINTS, buildApiUrl } from '../config/api';
import './AdminAuth.css';
import logger from "../utils/logger";

function AdminAuth() {
  const navigate = useNavigate();
  const [adminKey, setAdminKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!adminKey.trim()) {
      setError('Please enter admin key');
      return;
    }

    setIsAuthenticating(true);
    setError('');

    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.ADMIN_LOGIN), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ adminKey }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success' && data.data?.token) {
        // Store token and admin data in sessionStorage
        sessionStorage.setItem('admin_token', data.data.token);
        sessionStorage.setItem('admin_name', data.data.name || 'Admin');
        
        // Navigate to QR scanner page
        navigate('/admin/qr');
      } else {
        // Handle error
        setError(data.message || 'Invalid admin key');
        setAdminKey('');
      }
    } catch (error) {
      logger.error('Authentication error:', error);
      setError('Network error: Unable to connect to server. Please try again.');
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
            <RiLockLine size={36} color="#000" />
          </div>
          <h1 className="admin-auth-title">Admin Access</h1>
          <p className="admin-auth-subtitle">Enter your admin key to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-auth-form">
          <div className="admin-input-group">
            <label className="admin-input-label">Admin Key</label>
            <div className="admin-input-wrapper">
              <input
                type={showKey ? 'text' : 'password'}
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className="admin-input"
                placeholder="Enter admin key"
                required
                disabled={isAuthenticating}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="admin-toggle-password"
                tabIndex={-1}
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
