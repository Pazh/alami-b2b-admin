import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Save, 
  X, 
  User, 
  Building,
  ArrowRight,
  AlertCircle,
  DollarSign,
  MapPin,
  CreditCard
} from 'lucide-react';
import { RoleEnum } from '../types/roles';
import { formatCurrency, toPersianDigits, toEnglishDigits, parsePersianNumber, formatPersianNumber } from '../utils/numberUtils';
import BrandSelector from './BrandSelector';

interface Personal {
  id: number;
  firstName: string;
  lastName: string | null;
  profile: string | null;
  birthdate: string;
  birthPlace: string | null;
  gender: string;
  nationalCode: string;
  fatherName: string | null;
  motherName: string | null;
  married: string;
  marriageDate: string | null;
  divorceDate: string | null;
  userId: string;
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

interface Account {
  id: string;
  userId: string;
  roleId: string;
  firstName: string;
  lastName: string | null;
  maxDebt: number;
  nationalCode: string;
  naghshCode: string;
  city: string | null;
  state: string | null;
  maxOpenAccount: number;
  brand: Brand[];
  grade: Grade;
}

interface Customer {
  personal: Personal;
  account: Account;
}

interface CustomerEditProps {
  authToken: string;
  userId: number;
  userRole: RoleEnum;
}

const CustomerEdit: React.FC<CustomerEditProps> = ({ authToken, userId, userRole }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Account>>({});
  const [availableBrands, setAvailableBrands] = useState<Brand[]>([]);
  const [availableGrades, setAvailableGrades] = useState<Grade[]>([]);
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://alami-b2b-api.liara.run/api';

  const fetchCustomer = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/customer-user/${id}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch customer');
      }

      const data = await response.json();
      setCustomer(data.data);
      setEditForm({
        firstName: data.data.account.firstName,
        lastName: data.data.account.lastName,
        maxDebt: data.data.account.maxDebt,
        nationalCode: data.data.account.nationalCode,
        naghshCode: data.data.account.naghshCode,
        city: data.data.account.city,
        state: data.data.account.state,
        maxOpenAccount: data.data.account.maxOpenAccount
      });
      // Set selected brand IDs
      setSelectedBrandIds(data.data.account.brand.map((b: Brand) => b.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch customer');
    } finally {
      setLoading(false);
    }
  };

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
      console.error('Failed to fetch brands:', err);
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
      console.error('Failed to fetch grades:', err);
    }
  };

  const handleSaveEdit = async () => {
    if (!id || !customer || !editForm) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const updateData = {
        userId: customer.account.userId,
        roleId: customer.account.roleId,
        firstName: editForm.firstName || customer.account.firstName,
        lastName: editForm.lastName || customer.account.lastName,
        maxDebt: editForm.maxDebt || customer.account.maxDebt,
        nationalCode: editForm.nationalCode || customer.account.nationalCode,
        naghshCode: editForm.naghshCode || customer.account.naghshCode,
        city: editForm.city || customer.account.city,
        state: editForm.state || customer.account.state,
        maxOpenAccount: editForm.maxOpenAccount || customer.account.maxOpenAccount,
        brandIds: selectedBrandIds,
        gradeId: customer.account.grade.id
      };

      const response = await fetch(`${baseUrl}/customer-user/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update customer');
      }

      setSuccess('مشتری با موفقیت بروزرسانی شد');
      await fetchCustomer(); // Refresh the data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update customer');
    } finally {
      setSaving(false);
    }
  };

  const handleBrandsChange = (brandIds: string[]) => {
    setSelectedBrandIds(brandIds);
  };

  const getGenderText = (gender: string) => {
    return gender === 'male' ? 'مرد' : gender === 'female' ? 'زن' : 'نامشخص';
  };

  const getMaritalStatusText = (married: string) => {
    return married === 'married' ? 'متاهل' : married === 'single' ? 'مجرد' : 'نامشخص';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  useEffect(() => {
    fetchCustomer();
    fetchBrands();
    fetchGrades();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <div className="text-red-600 text-lg mb-2">مشتری یافت نشد</div>
          <p className="text-gray-400 text-sm">مشتری مورد نظر وجود ندارد یا دسترسی به آن ندارید</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4 space-x-reverse">
          <button
            onClick={() => navigate('/admin/customers')}
            className="flex items-center space-x-2 space-x-reverse text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            <span>بازگشت به لیست مشتریان</span>
          </button>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">ویرایش مشتری</h1>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 space-x-reverse">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <span className="text-green-700">{success}</span>
          </div>
        </div>
      )}

      {/* Customer Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
            <User className="w-5 h-5 text-blue-500" />
            <span>اطلاعات شخصی</span>
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نام</label>
              <input
                type="text"
                value={editForm.firstName || ''}
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="نام"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نام خانوادگی</label>
              <input
                type="text"
                value={editForm.lastName || ''}
                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="نام خانوادگی"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">کد ملی</label>
              <input
                type="text"
                value={editForm.nationalCode ? toPersianDigits(editForm.nationalCode) : ''}
                onChange={(e) => {
                  const persianValue = e.target.value;
                  const englishValue = toEnglishDigits(persianValue);
                  setEditForm({ ...editForm, nationalCode: englishValue });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="کد ملی"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">کد نقش</label>
              <input
                type="text"
                value={editForm.naghshCode ? toPersianDigits(editForm.naghshCode) : ''}
                onChange={(e) => {
                  const persianValue = e.target.value;
                  const englishValue = toEnglishDigits(persianValue);
                  setEditForm({ ...editForm, naghshCode: englishValue });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="کد نقش"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
            <DollarSign className="w-5 h-5 text-green-500" />
            <span>اطلاعات مالی</span>
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">حداکثر بدهی (ریال)</label>
              <input
                type="text"
                value={editForm.maxDebt ? formatPersianNumber(editForm.maxDebt) : ''}
                onChange={(e) => {
                  const persianValue = e.target.value;
                  const englishValue = parsePersianNumber(persianValue);
                  setEditForm({ ...editForm, maxDebt: englishValue });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="حداکثر بدهی"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">حداکثر حساب باز (ریال)</label>
              <input
                type="text"
                value={editForm.maxOpenAccount ? formatPersianNumber(editForm.maxOpenAccount) : ''}
                onChange={(e) => {
                  const persianValue = e.target.value;
                  const englishValue = parsePersianNumber(persianValue);
                  setEditForm({ ...editForm, maxOpenAccount: englishValue });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="حداکثر حساب باز"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        {/* Location Information */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
            <MapPin className="w-5 h-5 text-purple-500" />
            <span>اطلاعات مکانی</span>
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">شهر</label>
              <input
                type="text"
                value={editForm.city || ''}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="شهر"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">استان</label>
              <input
                type="text"
                value={editForm.state || ''}
                onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="استان"
              />
            </div>
          </div>
        </div>

        {/* Brand Selection */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
            <Building className="w-5 h-5 text-orange-500" />
            <span>برندهای مجاز</span>
          </h2>
          <div className="space-y-4">
            <BrandSelector
              availableBrands={availableBrands}
              selectedBrands={selectedBrandIds}
              onBrandsChange={handleBrandsChange}
              placeholder="جستجو و انتخاب برندها..."
              className="w-full"
            />
          </div>
        </div>

        {/* Current Information Display */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
            <CreditCard className="w-5 h-5 text-orange-500" />
            <span>اطلاعات فعلی</span>
          </h2>
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium text-gray-700">جنسیت: </span>
              <span className="text-gray-900">{getGenderText(customer.personal.gender)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">وضعیت تاهل: </span>
              <span className="text-gray-900">{getMaritalStatusText(customer.personal.married)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">تاریخ تولد: </span>
              <span className="text-gray-900">{formatDate(customer.personal.birthdate)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">محل تولد: </span>
              <span className="text-gray-900">{customer.personal.birthPlace || '-'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">نام پدر: </span>
              <span className="text-gray-900">{customer.personal.fatherName || '-'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">نام مادر: </span>
              <span className="text-gray-900">{customer.personal.motherName || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 space-x-reverse mt-8">
        <button
          onClick={() => navigate('/admin/customers')}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          انصراف
        </button>
        <button
          onClick={handleSaveEdit}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 space-x-reverse"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>در حال ذخیره...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>ذخیره تغییرات</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CustomerEdit; 