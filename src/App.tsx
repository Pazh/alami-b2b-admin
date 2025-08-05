import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LoginForm from './components/LoginForm';
import OTPVerification from './components/OTPVerification';
import PasswordReset from './components/PasswordReset';
import AdminPanel from './components/AdminPanel';
import authService from './services/authService';
import roleService from './services/roleService';
import { RoleEnum, UserInfo } from './types/roles';

type AuthStep = 'login' | 'otp' | 'password-reset';

// Auth wrapper component to handle navigation
function AuthWrapper() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPhone, setUserPhone] = useState('');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // Check if user is already authenticated
  useEffect(() => {
    const { authToken, userId } = authService.getAuthData();
    if (authToken && userId) {
      // Fetch user role first, then set userInfo
      roleService.getUserRole(userId, authToken).then(role => {
        setUserInfo({ authToken, userId, role });
        setInitialLoading(false);
      }).catch(error => {
        console.error('Error fetching user role:', error);
        // Default to customer role if fetch fails
        setUserInfo({ authToken, userId, role: RoleEnum.CUSTOMER });
        setInitialLoading(false);
      });
    } else {
      setInitialLoading(false);
    }
  }, []);

  const fetchUserRole = async (userId: number, authToken: string) => {
    try {
      const role = await roleService.getUserRole(userId, authToken);
      setUserInfo({ authToken, userId, role });
    } catch (error) {
      console.error('Error fetching user role:', error);
      // Default to customer role if fetch fails
      setUserInfo({ authToken, userId, role: RoleEnum.CUSTOMER });
    }
  };

  const handleLogin = async (phone: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.login(phone, password);
      authService.saveAuthData(response.data.authToken, response.data.userId);
      await fetchUserRole(response.data.userId, response.data.authToken);
      navigate('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (phone: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await authService.generateOTP(phone);
      setUserPhone(phone);
      navigate('/otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (otpCode: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.loginWithOTP(userPhone, otpCode);
      authService.saveAuthData(response.data.authToken, response.data.userId);
      await fetchUserRole(response.data.userId, response.data.authToken);
      navigate('/password-reset');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      await authService.generateOTP(userPhone);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP');
    }
  };

  const handleResetPassword = async (newPassword: string) => {
    if (!userInfo) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await authService.updatePassword(userInfo.userId, newPassword, userInfo.authToken);
      navigate('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.clearAuthData();
    setUserInfo(null);
    setError(null);
    navigate('/login');
  };

  // Show loading spinner while checking authentication
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route 
        path="/login" 
        element={
          userInfo ? (
            <Navigate to="/admin" replace />
          ) : (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
              <div className="w-full max-w-md">
                <LoginForm
                  onLogin={handleLogin}
                  onForgotPassword={handleForgotPassword}
                  loading={loading}
                  error={error}
                />
              </div>
            </div>
          )
        } 
      />
      
      <Route 
        path="/otp" 
        element={
          userInfo ? (
            <Navigate to="/admin" replace />
          ) : (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
              <div className="w-full max-w-md">
                <OTPVerification
                  phone={userPhone}
                  onVerifyOTP={handleVerifyOTP}
                  onResendOTP={handleResendOTP}
                  loading={loading}
                  error={error}
                />
              </div>
            </div>
          )
        } 
      />
      
      <Route 
        path="/password-reset" 
        element={
          userInfo ? (
            <Navigate to="/admin" replace />
          ) : (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
              <div className="w-full max-w-md">
                <PasswordReset
                  onResetPassword={handleResetPassword}
                  loading={loading}
                  error={error}
                />
              </div>
            </div>
          )
        } 
      />

      {/* Protected admin routes */}
      <Route 
        path="/admin/*" 
        element={
          userInfo && userInfo.role ? (
            <AdminPanel
              onLogout={handleLogout}
              userInfo={{ 
                userId: userInfo.userId, 
                role: userInfo.role,
                authToken: userInfo.authToken
              }}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />

      {/* Default redirects */}
      <Route 
        path="/" 
        element={
          userInfo && userInfo.role ? <Navigate to="/admin" replace /> : <Navigate to="/login" replace />
        } 
      />
      
      <Route 
        path="*" 
        element={
          userInfo && userInfo.role ? <Navigate to="/admin" replace /> : <Navigate to="/login" replace />
        } 
      />
    </Routes>
  );
}

// Main App component
function App() {
  return (
    <Router>
      <AuthWrapper />
    </Router>
  );
}

export default App;