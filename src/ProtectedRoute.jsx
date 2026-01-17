import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute Component
 * 
 * Wraps protected routes and checks for authentication token.
 * If no token is found in sessionStorage, redirects to login page.
 * 
 * Usage:
 * <ProtectedRoute>
 *   <YourProtectedComponent />
 * </ProtectedRoute>
 */
function ProtectedRoute({ children }) {
  const token = sessionStorage.getItem('admin_token');
  
  // If no token, redirect to login page
  if (!token) {
    return <Navigate to="/" replace />;
  }
  
  // If token exists, render the protected component
  return children;
}

export default ProtectedRoute;
