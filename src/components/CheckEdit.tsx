import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Save, 
  X, 
  User, 
  Calendar,
  DollarSign,
  Building,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { RoleEnum } from '../types/roles';
import { formatCurrency, toPersianDigits, toEnglishDigits } from '../utils/numberUtils';

interface Personal {
  id: number;
  firstName: string;
  lastName: string | null;
  profile: string | null;
  birthdate: string | null;
  birthPlace: string | null;
  gender: string | null;
  nationalCode: string | null;
  fatherName: string | null;
  motherName: string | null;
  married: string | null;
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
  maxCredit: string;
}

interface Account {
  id: string;
  userId: string;
  roleId: string;
  firstName: string;
  lastName: string | null;
  maxDebt: string;
  nationalCode: string;
  naghshCode: string;
  city: string | null;
  state: string | null;
  maxOpenAccount: string;
  brand: Brand[];
  grade: Grade;
}

interface CustomerData {
  personal: Personal;
  account: Account;
}

interface Role {
  id: string;
  name: string;
}

interface ManagerData {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  role: Role;
}

interface Cheque {
  id: string;
  number: string;
  date: string;
  price: number;
  customerUserId: string;
  managerUserId: string;
  status: string;
  sayyadi: boolean;
  bankName: string;
  description: string | null;
  customerData: CustomerData;
  managerData: ManagerData;
  createdDate?: string;
}

interface Customer {
  personal: Personal;
  account: Account;
}

interface CheckEditProps {
  authToken: string;
  userId: number;
  userRole: RoleEnum;
}

const CheckEdit: React.FC<CheckEditProps> = ({ authToken, userId, userRole }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cheque, setCheque] = useState<Cheque | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [editForm, setEditForm] = useState<Partial<Cheque>>({});
  const [showEditCustomerPopup, setShowEditCustomerPopup] = useState(false);
  const [editCustomerSearchQuery, setEditCustomerSearchQuery] = useState('');
  const [editCustomerSearchResults, setEditCustomerSearchResults] = useState<any[]>([]);
  const [editCustomerSearchLoading, setEditCustomerSearchLoading] = useState(false);

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://alami-b2b-api.liara.run/api';

  const statusOptions = [
    { value: 'created', label: 'ایجاد شده' },
    { value: 'passed', label: 'پاس شده' },
    { value: 'rejected', label: 'برگشت خورده' },
    { value: 'canceled', label: 'لغو شده' }
  ];

  const bankOptions = [
    { value: 'melli', label: 'بانک ملی ایران' },
    { value: 'mellat', label: 'بانک ملت' },
    { value: 'parsian', label: 'بانک پارسیان' },
    { value: 'pasargad', label: 'بانک پاسارگاد' },
    { value: 'saderat', label: 'بانک صادرات ایران' },
    { value: 'tejarat', label: 'بانک تجارت' },
    { value: 'refah', label: 'بانک رفاه کارگران' },
    { value: 'keshavarzi', label: 'بانک کشاورزی' },
    { value: 'sanat', label: 'بانک صنعت و معدن' },
    { value: 'other', label: 'سایر' }
  ];

  const getStatusLabel = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.label : status;
  };

  const getBankLabel = (bankName: string) => {
    const option = bankOptions.find(opt => opt.value === bankName);
    return option ? option.label : bankName;
  };

  const formatDate = (dateStr: string) => {
    if (dateStr.length === 8) {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      return `${year}/${month}/${day}`;
    }
    return dateStr;
  };

  const parseDate = (dateStr: string) => {
    return dateStr.replace(/\//g, '');
  };

  const fetchCheque = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/cheque/${id}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch cheque');
      }

      const data = await response.json();
      const chequeData = data.data;
      setCheque(chequeData);
      setEditForm({
        ...chequeData,
        date: formatDate(chequeData.date)
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cheque');
    } finally {
      setLoading(false);
    }
  };

  const searchCustomers = async (query: string) => {
    if (!query.trim()) {
      setEditCustomerSearchResults([]);
      return;
    }

    try {
      setEditCustomerSearchLoading(true);
      const response = await fetch(`${baseUrl}/customer/search?query=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to search customers');
      }

      const data = await response.json();
      setEditCustomerSearchResults(data.data || []);
    } catch (err) {
      console.error('Error searching customers:', err);
      setEditCustomerSearchResults([]);
    } finally {
      setEditCustomerSearchLoading(false);
    }
  };

  const handleSelectEditCustomer = (customer: any) => {
    const isRelation = 'customer' in customer;
    const customerData = isRelation ? customer.customer : customer;
    
    setEditForm(prev => ({
      ...prev,
      customerUserId: customerData.account.userId
    }));
    
    setShowEditCustomerPopup(false);
    setEditCustomerSearchQuery('');
    setEditCustomerSearchResults([]);
  };

  const handleSaveEdit = async () => {
    if (!id || !editForm) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const updateData = {
        number: editForm.number,
        date: parseDate(editForm.date || ''),
        price: editForm.price,
        customerUserId: editForm.customerUserId,
        managerUserId: editForm.managerUserId,
        creatorUserId: userId,
        status: editForm.status,
        bankName: editForm.bankName,
        description: editForm.description || null
      };

      const response = await fetch(`${baseUrl}/cheque/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update cheque');
      }

      setSuccess('چک با موفقیت بروزرسانی شد');
      await fetchCheque(); // Refresh the data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update cheque');
    } finally {
      setSaving(false);
    }
  };

  const getCustomerName = (customerData: CustomerData) => {
    return `${customerData.account.firstName}${customerData.account.lastName ? ` ${customerData.account.lastName}` : ''}`;
  };

  const getManagerName = (managerData: ManagerData) => {
    return `${managerData.firstName}${managerData.lastName ? ` ${managerData.lastName}` : ''}`;
  };

  useEffect(() => {
    fetchCheque();
  }, [id]);

  useEffect(() => {
    if (editCustomerSearchQuery) {
      const timeoutId = setTimeout(() => {
        searchCustomers(editCustomerSearchQuery);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [editCustomerSearchQuery]);

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

  if (!cheque) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <div className="text-red-600 text-lg mb-2">چک یافت نشد</div>
          <p className="text-gray-400 text-sm">چک مورد نظر وجود ندارد یا دسترسی به آن ندارید</p>
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
            onClick={() => navigate('/admin/checks')}
            className="flex items-center space-x-2 space-x-reverse text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            <span>بازگشت به لیست چک‌ها</span>
          </button>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">ویرایش چک</h2>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-600 text-sm">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Cheque Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">اطلاعات چک</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">شماره چک</label>
              <input
                type="text"
                value={editForm.number || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, number: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ چک</label>
              <input
                type="text"
                value={editForm.date || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                placeholder="YYYY/MM/DD"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">مبلغ (ریال)</label>
              <input
                type="text"
                value={toPersianDigits(editForm.price?.toString() || '')}
                onChange={(e) => setEditForm(prev => ({ ...prev, price: parseInt(toEnglishDigits(e.target.value)) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">بانک</label>
              <select
                value={editForm.bankName || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, bankName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">انتخاب بانک</option>
                {bankOptions.map((bank) => (
                  <option key={bank.value} value={bank.value}>
                    {bank.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">وضعیت</label>
              <select
                value={editForm.status || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات</label>
              <textarea
                value={editForm.description || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">اطلاعات مشتری و مدیر</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">مشتری</label>
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="flex-1 p-3 bg-white border border-gray-300 rounded-md">
                  <div className="font-medium text-gray-900">
                    {cheque.customerData ? getCustomerName(cheque.customerData) : 'نامشخص'}
                  </div>
                  <div className="text-sm text-gray-500">
                    کد ملی: {toPersianDigits(cheque.customerData?.account.nationalCode || '')}
                  </div>
                </div>
                <button
                  onClick={() => setShowEditCustomerPopup(true)}
                  className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  تغییر
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">مدیر</label>
              <div className="p-3 bg-white border border-gray-300 rounded-md">
                <div className="font-medium text-gray-900">
                  {cheque.managerData ? getManagerName(cheque.managerData) : 'نامشخص'}
                </div>
                <div className="text-sm text-gray-500">
                  نقش: {cheque.managerData?.role.name || ''}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ ایجاد</label>
              <div className="p-3 bg-white border border-gray-300 rounded-md">
                <div className="text-gray-900">
                  {cheque.createdDate ? formatDate(cheque.createdDate) : 'نامشخص'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 space-x-reverse">
        <button
          onClick={() => navigate('/admin/checks')}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          انصراف
        </button>
        <button
          onClick={handleSaveEdit}
          disabled={saving}
          className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 space-x-reverse"
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

      {/* Edit Customer Selection Popup */}
      {showEditCustomerPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">انتخاب مشتری</h3>
              <button
                onClick={() => {
                  setShowEditCustomerPopup(false);
                  setEditCustomerSearchQuery('');
                  setEditCustomerSearchResults([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <input
                  type="text"
                  value={editCustomerSearchQuery}
                  onChange={(e) => setEditCustomerSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="جستجو بر اساس نام خانوادگی..."
                  autoFocus
                />
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {editCustomerSearchLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-gray-500 mt-2">در حال جستجو...</p>
                  </div>
                ) : editCustomerSearchResults.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      {editCustomerSearchQuery ? 'هیچ مشتری یافت نشد' : 'برای جستجو نام خانوادگی را وارد کنید'}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {editCustomerSearchResults.map((customer) => {
                      const isRelation = 'customer' in customer;
                      const customerData = isRelation ? customer.customer : customer;
                      
                      return (
                        <div
                          key={customerData.account.id}
                          onClick={() => handleSelectEditCustomer(customer)}
                          className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">
                                {`${customerData.account.firstName} ${customerData.account.lastName || ''}`}
                              </div>
                              <div className="text-sm text-gray-500">
                                کد ملی: {toPersianDigits(customerData.account.nationalCode)}
                              </div>
                              {customerData.account.city && (
                                <div className="text-sm text-gray-500">
                                  شهر: {customerData.account.city}
                                </div>
                              )}
                            </div>
                            <User className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckEdit; 