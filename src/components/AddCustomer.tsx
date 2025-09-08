import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Phone, MapPin, CreditCard, Save, X } from 'lucide-react';
import { toPersianDigits, toEnglishDigits } from '../utils/numberUtils';
import apiService from '../services/apiService';

interface AddCustomerProps {
  authToken: string;
  onBack: () => void;
  onSuccess: () => void;
}

interface Brand {
  id: string;
  name: string;
}

interface Grade {
  id: string;
  name: string;
  description: string;
  maxCredit: number;
}

const AddCustomer: React.FC<AddCustomerProps> = ({ authToken, onBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    orashId: '',
    firstName: '',
    lastName: '',
    phone: '',
    province: '',
    city: '',
    nationalCode: '',
    naghshCode: ''
  });

  const [availableBrands, setAvailableBrands] = useState<Brand[]>([]);
  const [availableGrades, setAvailableGrades] = useState<Grade[]>([]);
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://alami-b2b-api.liara.run/api';

  useEffect(() => {
    fetchBrands();
    fetchGrades();
  }, []);

  const fetchBrands = async () => {
    try {
      const response = await fetch(`${baseUrl}/brand?pageSize=200`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch brands');
      }

      const data = await response.json();
      setAvailableBrands(data.data.data || []);
    } catch (err) {
      console.error('Error fetching brands:', err);
    }
  };

  const fetchGrades = async () => {
    try {
      const response = await fetch(`${baseUrl}/grade`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch grades');
      }

      const data = await response.json();
      setAvailableGrades(data.data.data || []);
    } catch (err) {
      console.error('Error fetching grades:', err);
    }
  };

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const cleanDigits = digits.startsWith('0') ? digits.slice(1) : digits;
    return cleanDigits.slice(0, 10);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData(prev => ({ ...prev, phone: formatted }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBrandToggle = (brandId: string) => {
    setSelectedBrandIds(prev => 
      prev.includes(brandId) 
        ? prev.filter(id => id !== brandId)
        : [...prev, brandId]
    );
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setError('نام الزامی است');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('نام خانوادگی الزامی است');
      return false;
    }
    if (!formData.phone.trim() || formData.phone.length !== 10) {
      setError('شماره تلفن باید 10 رقم باشد');
      return false;
    }
    if (!formData.nationalCode.trim()) {
      setError('کد ملی الزامی است');
      return false;
    }
    if (!formData.province.trim()) {
      setError('استان الزامی است');
      return false;
    }
    if (!formData.city.trim()) {
      setError('شهر الزامی است');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      // Step 1: Register user or get existing user ID
      const phoneWithCountryCode = `98${formData.phone}`;
      let userId: number;

      try {
        // Try to register new user
        const registerResponse = await apiService.registerUser(phoneWithCountryCode);
        userId = registerResponse.data.id;
      } catch (registerError: any) {
        if (registerError?.status === 409 || (typeof registerError?.message === 'string' && registerError.message.includes('409'))) {
          // User already exists, get user ID
          const checkResponse = await apiService.checkUserExists(phoneWithCountryCode);
          userId = checkResponse.data.userId;
        } else {
          throw registerError;
        }
      }

      // Step 2: Create personal info (only if user was newly registered)
      try {
        await apiService.createPersonalInfo(
          userId,
          formData.firstName,
          formData.lastName,
          toEnglishDigits(formData.nationalCode),
          authToken
        );
      } catch (personalError: any) {
        // If personal info already exists, continue
        if (!personalError.message.includes('already exists')) {
          throw personalError;
        }
      }

      // Step 3: Create customer
      const customerData = {
        userId: userId.toString(),
        roleId: 'b99d0abf-391b-4da3-869f-21d96c61e5f9', // Customer role ID
        gradeId: '20d3dbf8-182c-44a1-b6b8-c63f2da3aeeb', // Default grade ID
        maxDebt: 0,
        nationalCode: toEnglishDigits(formData.nationalCode),
        brandIds: selectedBrandIds,
        naghshCode: formData.naghshCode,
        firstName: formData.firstName,
        lastName: formData.lastName,
      };

      await apiService.createCustomer(customerData, authToken);

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ایجاد مشتری');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 space-x-reverse text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>بازگشت</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">افزودن مشتری جدید</h1>
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
            {/* Personal Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2 space-x-reverse">
                <User className="w-5 h-5 text-blue-500" />
                <span>اطلاعات شخصی</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نام *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="نام"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نام خانوادگی *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="نام خانوادگی"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    کد ملی *
                  </label>
                  <input
                    type="text"
                    name="nationalCode"
                    value={formData.nationalCode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="کد ملی"
                    maxLength={10}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    کد نقش *
                  </label>
                  <input
                    type="text"
                    name="naghshCode"
                    value={formData.naghshCode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="کد نقش"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2 space-x-reverse">
                <Phone className="w-5 h-5 text-green-500" />
                <span>اطلاعات تماس</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    شماره تلفن *
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                      <span className="text-gray-500 text-sm font-medium">+98</span>
                    </div>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      className="w-full pl-16 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="شماره موبایل بدون صفر"
                      maxLength={10}
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">مثال: 9123456789</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اوراش آیدی
                  </label>
                  <input
                    type="text"
                    name="orashId"
                    value={formData.orashId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="اوراش آیدی"
                  />
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2 space-x-reverse">
                <MapPin className="w-5 h-5 text-purple-500" />
                <span>اطلاعات مکانی</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    استان *
                  </label>
                  <input
                    type="text"
                    name="province"
                    value={formData.province}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="استان"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    شهر *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="شهر"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Brand Selection */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2 space-x-reverse">
                <CreditCard className="w-5 h-5 text-orange-500" />
                <span>انتخاب برندها</span>
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableBrands.map((brand) => (
                  <label key={brand.id} className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedBrandIds.includes(brand.id)}
                      onChange={() => handleBrandToggle(brand.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{brand.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 space-x-reverse">
              <button
                type="button"
                onClick={onBack}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 space-x-reverse"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>در حال ایجاد...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>ایجاد مشتری</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddCustomer;