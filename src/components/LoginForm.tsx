import React, { useState } from 'react';
import { Eye, EyeOff, Phone, Lock, ArrowRight, RefreshCw } from 'lucide-react';

interface LoginFormProps {
  onLogin: (phone: string, password: string) => Promise<void>;
  onForgotPassword: (phone: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onForgotPassword, loading, error }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) return;
    await onLogin(phone, password);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    await onForgotPassword(phone);
  };

  return (
    <div className="w-full max-w-md animate-scale-in">
      <div className="glass-effect rounded-3xl shadow-2xl p-6 lg:p-10 border border-white/20">
        <div className="text-center mb-8 lg:mb-10">
          <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 lg:mb-6 shadow-lg floating">
            <Lock className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold gradient-text mb-2 lg:mb-3">خوش آمدید</h1>
          <p className="text-gray-600 text-base lg:text-lg">وارد پنل مدیریت خود شوید</p>
        </div>

        {error && (
          <div className="mb-6 p-3 lg:p-4 bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-200 rounded-xl shadow-lg animate-slide-up">
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="w-4 h-4 lg:w-5 lg:h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                <X className="w-2 h-2 lg:w-3 lg:h-3 text-white" />
              </div>
              <p className="text-red-700 font-medium text-sm lg:text-base">{error}</p>
            </div>
          </div>
        )}

        {!showForgotPassword ? (
          <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-bold text-gray-700 mb-2 lg:mb-3">
                شماره تلفن
              </label>
              <div className="relative">
                <div className="absolute left-3 lg:left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 lg:w-6 lg:h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Phone className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
                </div>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 lg:pl-12 pr-3 lg:pr-4 py-3 lg:py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-md focus:shadow-lg text-sm lg:text-base"
                  placeholder="شماره تلفن خود را وارد کنید"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2 lg:mb-3">
                رمز عبور
              </label>
              <div className="relative">
                <div className="absolute left-3 lg:left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 lg:w-6 lg:h-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Lock className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 lg:pl-12 pr-12 lg:pr-14 py-3 lg:py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-md focus:shadow-lg text-sm lg:text-base"
                  placeholder="رمز عبور خود را وارد کنید"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 lg:right-4 top-1/2 transform -translate-y-1/2 p-1.5 lg:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 lg:w-5 lg:h-5" /> : <Eye className="w-4 h-4 lg:w-5 lg:h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 lg:py-4 px-6 lg:px-8 rounded-xl font-bold text-base lg:text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2 space-x-reverse">
                  <RefreshCw className="w-4 h-4 lg:w-5 lg:h-5 animate-spin" />
                  <span>در حال ورود...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2 space-x-reverse">
                  <span>ورود</span>
                  <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5" />
                </div>
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-blue-600 hover:text-blue-700 text-sm lg:text-base font-medium hover:underline transition-colors"
              >
                فراموشی رمز عبور؟
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-4 lg:space-y-6">
            <div>
              <label htmlFor="forgot-phone" className="block text-sm font-bold text-gray-700 mb-2 lg:mb-3">
                شماره تلفن
              </label>
              <div className="relative">
                <div className="absolute left-3 lg:left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 lg:w-6 lg:h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Phone className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
                </div>
                <input
                  id="forgot-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 lg:pl-12 pr-3 lg:pr-4 py-3 lg:py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-md focus:shadow-lg text-sm lg:text-base"
                  placeholder="شماره تلفن خود را وارد کنید"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 lg:py-4 px-6 lg:px-8 rounded-xl font-bold text-base lg:text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2 space-x-reverse">
                  <RefreshCw className="w-4 h-4 lg:w-5 lg:h-5 animate-spin" />
                  <span>در حال ارسال...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2 space-x-reverse">
                  <span>ارسال کد تایید</span>
                  <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5" />
                </div>
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="text-gray-600 hover:text-gray-700 text-sm lg:text-base font-medium hover:underline transition-colors"
              >
                بازگشت به ورود
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginForm;