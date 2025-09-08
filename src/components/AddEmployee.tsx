import React, { useState } from 'react';
import { ArrowLeft, User, Phone, Save, X, Shield } from 'lucide-react';
import apiService from '../services/apiService';

interface Role {
  id: string;
  name: string;
}

interface AddEmployeeProps {
  authToken: string;
  availableRoles: Role[];
  onBack: () => void;
  onSuccess: () => void;
}

const AddEmployee: React.FC<AddEmployeeProps> = ({ authToken, availableRoles, onBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    roleId: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const cleanDigits = digits.startsWith('0') ? digits.slice(1) : digits;
    return cleanDigits.slice(0, 10);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData(prev => ({ ...prev, phone: formatted }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) { setError('نام الزامی است'); return false; }
    if (!formData.lastName.trim()) { setError('نام خانوادگی الزامی است'); return false; }
    if (!formData.phone.trim() || formData.phone.length !== 10) { setError('شماره تلفن باید 10 رقم باشد'); return false; }
    if (!formData.roleId) { setError('انتخاب نقش الزامی است'); return false; }
    if (!formData.password || formData.password.length < 8) { setError('رمز عبور باید حداقل 8 کاراکتر باشد'); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setLoading(true);
      setError(null);

      const phoneWithCountryCode = `98${formData.phone}`;
      let userId: number;

      try {
        const registerResponse = await apiService.registerUser(phoneWithCountryCode, formData.password);
        userId = registerResponse.data.id;
      } catch (registerError: any) {
        if (registerError?.status === 409 || (typeof registerError?.message === 'string' && registerError.message.includes('409'))) {
          const checkResponse = await apiService.checkUserExists(phoneWithCountryCode);
          userId = checkResponse.data.userId;
        } else {
          throw registerError;
        }
      }

      await apiService.createManagerUser({
        roleId: formData.roleId,
        userId: userId,
        firstName: formData.firstName,
        lastName: formData.lastName,
      }, authToken);

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ایجاد کارمند');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <button onClick={onBack} className="flex items-center space-x-2 space-x-reverse text-gray-600 hover:text-gray-800 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>بازگشت</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2 space-x-reverse">
              <Shield className="w-5 h-5 text-indigo-500" />
              <span>افزودن کارمند جدید</span>
            </h1>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center space-x-2 space-x-reverse">
                <X className="w-5 h-5 text-red-500" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نام *</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="نام" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نام خانوادگی *</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="نام خانوادگی" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">شماره تلفن *</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                    <span className="text-gray-500 text-sm font-medium">+98</span>
                  </div>
                  <input type="tel" value={formData.phone} onChange={handlePhoneChange} className="w-full pl-16 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="شماره موبایل بدون صفر" maxLength={10} required />
                </div>
                <p className="text-xs text-gray-500 mt-1">مثال: 9123456789</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">انتخاب نقش *</label>
                <select name="roleId" value={formData.roleId} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                  <option value="">انتخاب کنید</option>
                  {availableRoles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">رمز عبور *</label>
                <input type="password" name="password" value={formData.password} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="حداقل ۸ کاراکتر" required />
              </div>
            </div>

            <div className="flex justify-end space-x-4 space-x-reverse">
              <button type="button" onClick={onBack} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">انصراف</button>
              <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 space-x-reverse">
                {loading ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div><span>در حال ایجاد...</span></>) : (<><Save className="w-4 h-4" /><span>ایجاد کارمند</span></>)}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEmployee;