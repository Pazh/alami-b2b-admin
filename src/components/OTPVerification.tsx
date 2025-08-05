import React, { useState } from 'react';
import { Shield, ArrowRight, RefreshCw } from 'lucide-react';

interface OTPVerificationProps {
  phone: string;
  onVerifyOTP: (otpCode: string) => Promise<void>;
  onResendOTP: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const OTPVerification: React.FC<OTPVerificationProps> = ({ 
  phone, 
  onVerifyOTP, 
  onResendOTP, 
  loading, 
  error 
}) => {
  const [otpCode, setOtpCode] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) return;
    await onVerifyOTP(otpCode);
  };

  const handleResend = async () => {
    setResendLoading(true);
    await onResendOTP();
    setResendLoading(false);
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify OTP</h1>
          <p className="text-gray-600">We sent a verification code to</p>
          <p className="text-gray-900 font-medium">{phone}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
              OTP Code
            </label>
            <input
              id="otp"
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-center text-lg font-medium tracking-widest"
              placeholder="Enter OTP code"
              maxLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !otpCode}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Verify OTP</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={handleResend}
            disabled={resendLoading}
            className="text-blue-600 hover:text-blue-700 font-medium transition-colors disabled:opacity-50"
          >
            {resendLoading ? 'Sending...' : 'Resend OTP'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;