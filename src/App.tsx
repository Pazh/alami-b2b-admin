import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import AdminPanel from './components/AdminPanel';
import LoginForm from './components/LoginForm';
import OTPVerification from './components/OTPVerification';
import PasswordReset from './components/PasswordReset';
import authService from './services/authService';
import roleService from './services/roleService';
import apiService from './services/apiService';
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
  const [isMobile, setIsMobile] = useState(false);

  // Check if user is already authenticated
  useEffect(() => {
    const { authToken, userId, userName, fullName } = authService.getAuthData();
    if (authToken && userId) {
      // Fetch user role and details first, then set userInfo
      fetchUserRole(userId, authToken).then(() => {
        setInitialLoading(false);
      }).catch(error => {
        console.error('Error fetching user role:', error);
        // Default to customer role if fetch fails
        setUserInfo({ authToken, userId, role: RoleEnum.CUSTOMER, userName: userName || undefined, fullName: fullName || undefined });
        setInitialLoading(false);
      });
    } else {
      setInitialLoading(false);
    }
  }, []);

  // Check mobile responsiveness
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchUserRole = async (userId: number, authToken: string) => {
    try {
      const role = await roleService.getUserRole(userId, authToken);
      const { userName } = authService.getAuthData();
      
      // Try to get user details from manager-user API
      let fullName = undefined;
      try {
        console.log('Fetching user details for userId:', userId);
        const userDetailsResponse = await apiService.getCurrentUserDetails(userId.toString(), authToken);
        console.log('User details response:', userDetailsResponse);
        if (userDetailsResponse.data.data && userDetailsResponse.data.data.length > 0) {
          const userData = userDetailsResponse.data.data[0];
          fullName = `${userData.firstName} ${userData.lastName}`;
          console.log('Full name set to:', fullName);
          // Save full name to localStorage
          authService.saveAuthData(authToken, userId, userName || undefined, fullName || undefined);
        }
      } catch (userDetailsError) {
        console.log('Could not fetch user details, using phone as display name');
        console.error('User details error:', userDetailsError);
      }
      
      setUserInfo({ authToken, userId, role, userName: userName || undefined, fullName: fullName || undefined });
    } catch (error) {
      console.error('Error fetching user role:', error);
      // Default to customer role if fetch fails
      const { userName } = authService.getAuthData();
      setUserInfo({ authToken, userId, role: RoleEnum.CUSTOMER, userName: userName || undefined });
    }
  };

  const handleLogin = async (phone: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.login(phone, password);
      // Try to get user details if available, otherwise use phone as display name
      const displayName = phone; // For now, use phone as display name
      authService.saveAuthData(response.data.authToken, response.data.userId, displayName);
      await fetchUserRole(response.data.userId, response.data.authToken);
      navigate('/admin');
    } catch (err) {
      setError('شماره تلفن یا پسورد اشتباه است');
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
      // Use phone as display name for OTP login as well
      const displayName = userPhone;
      authService.saveAuthData(response.data.authToken, response.data.userId, displayName);
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
      // Fetch user details again after password reset
      await fetchUserRole(userInfo.userId, userInfo.authToken);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">در حال بارگذاری...</p>
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
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
              <div className="w-full max-w-md">
                {error && (
                  <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    <strong>خطا:</strong> {error}
                  </div>
                )}
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
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
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
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
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
                authToken: userInfo.authToken,
                userName: userInfo.userName,
                fullName: userInfo.fullName
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