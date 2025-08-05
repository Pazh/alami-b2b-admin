import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  User, 
  Building, 
  CreditCard, 
  Tag, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Filter,
  Plus,
  X,
  UserPlus,
  Check,
  Trash2
} from 'lucide-react';
import { formatCurrency, formatNumber, toPersianDigits, toEnglishDigits } from '../utils/numberUtils';

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

interface CustomerWithRelation {
  personal: Personal;
  account: Account;
}

interface CustomerRelation {
  id: string;
  customer: CustomerWithRelation;
}

interface Customer {
  personal: Personal;
  account: Account;
}

interface Employee {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
}

interface EmployeeCustomersProps {
  authToken: string;
  employee: Employee;
  onBack: () => void;
}

const EmployeeCustomers: React.FC<EmployeeCustomersProps> = ({ authToken, employee, onBack }) => {
  const [customers, setCustomers] = useState<CustomerRelation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Add customer section states
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [searchCustomers, setSearchCustomers] = useState<Customer[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchPageIndex, setSearchPageIndex] = useState(0);
  const [searchPageSize] = useState(10);
  const [searchTotalCount, setSearchTotalCount] = useState(0);
  const [searchTotalPages, setSearchTotalPages] = useState(0);
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [addingCustomers, setAddingCustomers] = useState(false);
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);
  
  // Pagination for employee customers
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  const [searchFilters, setSearchFilters] = useState({
    firstName: '',
    lastName: '',
    nationalCode: '',
    naghshCode: '',
    city: '',
    state: ''
  });

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://alami-b2b-api.liara.run/api';

  const fetchEmployeeCustomers = async () => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams({
        pageSize: pageSize.toString(),
        pageIndex: pageIndex.toString()
      });
      
      const response = await fetch(`${baseUrl}/customer-relation/filter?${queryParams}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          managerUserId: parseInt(employee.userId)
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch employee customers');
      }

      const data = await response.json();
      
      // Set total count and calculate total pages
      const count = data.data?.details?.count || 0;
      setTotalCount(count);
      setTotalPages(Math.ceil(count / pageSize));
      
      setCustomers(data.data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch employee customers');
    } finally {
      setLoading(false);
    }
  };

  const searchAvailableCustomers = async () => {
    try {
      setSearchLoading(true);
      
      const queryParams = new URLSearchParams({
        pageSize: searchPageSize.toString(),
        pageIndex: searchPageIndex.toString()
      });

      // Prepare filter data - only include non-empty filters and convert Persian digits to English
      const filterData: any = {};
      if (searchFilters.firstName.trim()) filterData.firstName = searchFilters.firstName.trim();
      if (searchFilters.lastName.trim()) filterData.lastName = searchFilters.lastName.trim();
      if (searchFilters.nationalCode.trim()) filterData.nationalCode = toEnglishDigits(searchFilters.nationalCode.trim());
      if (searchFilters.naghshCode.trim()) filterData.naghshCode = toEnglishDigits(searchFilters.naghshCode.trim());
      if (searchFilters.city.trim()) filterData.city = searchFilters.city.trim();
      if (searchFilters.state.trim()) filterData.state = searchFilters.state.trim();

      const response = await fetch(`${baseUrl}/customer-user/filter?${queryParams}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(filterData),
      });

      if (!response.ok) {
        throw new Error('Failed to search customers');
      }

      const data = await response.json();
      
      // Set total count and calculate total pages
      const count = data.data?.details?.count || 0;
      setSearchTotalCount(count);
      setSearchTotalPages(Math.ceil(count / searchPageSize));
      
      setSearchCustomers(data.data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search customers');
    } finally {
      setSearchLoading(false);
    }
  };

  const addCustomersToEmployee = async () => {
    if (selectedCustomers.size === 0) return;

    try {
      setAddingCustomers(true);
      const promises = Array.from(selectedCustomers).map(async (customerUserId) => {
        const response = await fetch(`${baseUrl}/customer-relation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            customerUserId: parseInt(customerUserId),
            managerUserId: parseInt(employee.userId)
          }),
        });

        if (!response.ok && response.status !== 409) {
          throw new Error(`Failed to add customer ${customerUserId}`);
        }

        return { customerUserId, success: response.ok, status: response.status };
      });

      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.success).length;
      const duplicateCount = results.filter(r => r.status === 409).length;

      if (successCount > 0) {
        setSuccess(`${toPersianDigits(successCount)} مشتری با موفقیت اضافه شد${duplicateCount > 0 ? ` (${toPersianDigits(duplicateCount)} مشتری قبلاً موجود بود)` : ''}`);
        await fetchEmployeeCustomers();
        setSelectedCustomers(new Set());
        setShowAddCustomer(false);
      } else if (duplicateCount > 0) {
        setError('تمام مشتریان انتخاب شده قبلاً به این کارمند اختصاص داده شده‌اند');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add customers');
    } finally {
      setAddingCustomers(false);
    }
  };

  const handleDeleteCustomer = async (customerUserId: string) => {
    if (!confirm('آیا از حذف این مشتری از لیست کارمند اطمینان دارید؟')) return;

    try {
      setDeletingCustomerId(customerUserId);
      
      const response = await fetch(`${baseUrl}/customer-relation`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          customerUserId: parseInt(customerUserId),
          managerUserId: parseInt(employee.userId)
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove customer from employee');
      }

      setSuccess('مشتری با موفقیت از لیست کارمند حذف شد');
      await fetchEmployeeCustomers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove customer');
    } finally {
      setDeletingCustomerId(null);
    }
  };

  const handleCustomerSelect = (customerUserId: string) => {
    const newSelected = new Set(selectedCustomers);
    if (newSelected.has(customerUserId)) {
      newSelected.delete(customerUserId);
    } else {
      newSelected.add(customerUserId);
    }
    setSelectedCustomers(newSelected);
  };

  const isCustomerAlreadyAssigned = (customerUserId: string) => {
    return customers.some(c => c.customer.personal.userId === customerUserId);
  };

  const handleSearchFilterChange = (field: keyof typeof searchFilters, value: string) => {
    setSearchFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearchPageChange = (newPageIndex: number) => {
    if (newPageIndex >= 0 && newPageIndex < searchTotalPages) {
      setSearchPageIndex(newPageIndex);
    }
  };

  const handlePageChange = (newPageIndex: number) => {
    if (newPageIndex >= 0 && newPageIndex < totalPages) {
      setPageIndex(newPageIndex);
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPageIndex(0); // Reset to first page when changing page size
  };

  const getFullName = (personal: Personal) => {
    return `${personal.firstName}${personal.lastName ? ` ${personal.lastName}` : ''}`;
  };

  useEffect(() => {
    fetchEmployeeCustomers();
  }, [pageIndex, pageSize]);

  useEffect(() => {
    if (showAddCustomer) {
      searchAvailableCustomers();
    }
  }, [showAddCustomer, searchPageIndex, searchFilters]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 space-x-reverse">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 space-x-reverse text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>بازگشت</span>
            </button>
            
            <div className="flex items-center space-x-1 space-x-reverse">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i;
                } else if (pageIndex < 3) {
                  pageNum = i;
                } else if (pageIndex >= totalPages - 3) {
                  pageNum = totalPages - 5 + i;
                } else {
                  pageNum = pageIndex - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      pageIndex === pageNum
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {toPersianDigits(pageNum + 1)}
                  </button>
                );
              })}
            </div>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-xl font-semibold text-gray-900">
              مشتریان {getFullName({ firstName: employee.firstName, lastName: employee.lastName } as Personal)}
            </h1>
          </div>
          <button
            onClick={() => setShowAddCustomer(!showAddCustomer)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 space-x-reverse transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>اضافه کردن مشتری</span>
          </button>
        </div>

        <div className="text-sm text-gray-600">
          <div className="flex items-center space-x-4 space-x-reverse">
            <span>تعداد کل: {toPersianDigits(totalCount)}</span>
            <div className="flex items-center space-x-2 space-x-reverse">
              <label className="text-sm text-gray-700">تعداد در صفحه:</label>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={5}>{toPersianDigits('5')}</option>
                <option value={10}>{toPersianDigits('10')}</option>
                <option value={20}>{toPersianDigits('20')}</option>
                <option value={50}>{toPersianDigits('50')}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-600 text-sm">{success}</p>
        </div>
      )}

      {/* Add Customer Section */}
      {showAddCustomer && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">جستجو و اضافه کردن مشتری</h3>
          
          {/* Search Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نام</label>
              <input
                type="text"
                value={searchFilters.firstName}
                onChange={(e) => handleSearchFilterChange('firstName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="جستجو در نام..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نام خانوادگی</label>
              <input
                type="text"
                value={searchFilters.lastName}
                onChange={(e) => handleSearchFilterChange('lastName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="جستجو در نام خانوادگی..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">کد ملی</label>
              <input
                type="text"
                value={searchFilters.nationalCode}
                onChange={(e) => handleSearchFilterChange('nationalCode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="جستجو در کد ملی..."
              />
            </div>
          </div>

          {/* Search Results */}
          <div className="border rounded-lg">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">انتخاب</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نام</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نام خانوادگی</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">کد ملی</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">شهر</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">وضعیت</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {searchLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center">
                        <div className="animate-pulse">در حال جستجو...</div>
                      </td>
                    </tr>
                  ) : searchCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        هیچ مشتری یافت نشد
                      </td>
                    </tr>
                  ) : (
                    searchCustomers.map((customer) => {
                      const isAssigned = isCustomerAlreadyAssigned(customer.personal.userId);
                      const isSelected = selectedCustomers.has(customer.personal.userId);
                      
                      return (
                        <tr key={customer.account.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            {isAssigned ? (
                              <div className="flex items-center space-x-2 space-x-reverse text-green-600">
                                <Check className="w-4 h-4" />
                                <span className="text-xs">اختصاص داده شده</span>
                              </div>
                            ) : (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleCustomerSelect(customer.personal.userId)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {customer.account.firstName}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {customer.account.lastName || '-'}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            {toPersianDigits(customer.account.nationalCode)}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            {customer.account.city || '-'}
                          </td>
                          <td className="px-4 py-4">
                            {isAssigned ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                اختصاص داده شده
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                آماده اختصاص
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Search Pagination */}
            {searchTotalPages > 1 && (
              <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  نمایش {toPersianDigits(searchPageIndex * searchPageSize + 1)} تا {toPersianDigits(Math.min((searchPageIndex + 1) * searchPageSize, searchTotalCount))} از {toPersianDigits(searchTotalCount)} مشتری
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <button
                    onClick={() => handleSearchPageChange(searchPageIndex - 1)}
                    disabled={searchPageIndex === 0}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <span className="text-sm">
                    {toPersianDigits(searchPageIndex + 1)} از {toPersianDigits(searchTotalPages)}
                  </span>
                  <button
                    onClick={() => handleSearchPageChange(searchPageIndex + 1)}
                    disabled={searchPageIndex >= searchTotalPages - 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              {selectedCustomers.size > 0 && (
                <span>{toPersianDigits(selectedCustomers.size)} مشتری انتخاب شده</span>
              )}
            </div>
            <div className="flex space-x-2 space-x-reverse">
              <button
                onClick={() => setShowAddCustomer(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={addCustomersToEmployee}
                disabled={selectedCustomers.size === 0 || addingCustomers}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 space-x-reverse"
              >
                {addingCustomers ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>در حال اضافه کردن...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>اضافه کردن ({toPersianDigits(selectedCustomers.size)})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Customers List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">لیست مشتریان</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نام</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نام خانوادگی</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">کد ملی</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">کد نقش</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">حداکثر بدهی</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">شهر</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">استان</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">برندها</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">گرید</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عملیات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customerRelation) => (
                <tr key={customerRelation.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">
                    {customerRelation.customer.account.firstName}
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">
                    {customerRelation.customer.account.lastName || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {toPersianDigits(customerRelation.customer.account.nationalCode)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {toPersianDigits(customerRelation.customer.account.naghshCode)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(customerRelation.customer.account.maxDebt)} ریال
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customerRelation.customer.account.city || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customerRelation.customer.account.state || '-'}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {customerRelation.customer.account.brand.map((brand) => (
                        <span
                          key={brand.id}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          {brand.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {customerRelation.customer.account.grade.name}
                      </div>
                      <div className="text-gray-500 text-xs">
                        حداکثر اعتبار: {formatCurrency(customerRelation.customer.account.grade.maxCredit)} ریال
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleDeleteCustomer(customerRelation.customer.personal.userId)}
                      disabled={deletingCustomerId === customerRelation.customer.personal.userId}
                      className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="حذف مشتری از لیست کارمند"
                    >
                      {deletingCustomerId === customerRelation.customer.personal.userId ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {customers.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500 text-lg mb-2">هیچ مشتری یافت نشد</div>
              <p className="text-gray-400 text-sm">مشتریان این کارمند در اینجا نمایش داده می‌شوند</p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              نمایش {toPersianDigits(pageIndex * pageSize + 1)} تا {toPersianDigits(Math.min((pageIndex + 1) * pageSize, totalCount))} از {toPersianDigits(totalCount)} مشتری
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                onClick={() => handlePageChange(pageIndex - 1)}
                disabled={pageIndex === 0}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 space-x-reverse"
              >
                <ChevronRight className="w-4 h-4" />
                <span>قبلی</span>
              </button>
              
              <div className="flex items-center space-x-1 space-x-reverse">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i;
                  } else if (pageIndex < 3) {
                    pageNum = i;
                  } else if (pageIndex >= totalPages - 3) {
                    pageNum = totalPages - 5 + i;
                  } else {
                    pageNum = pageIndex - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        pageIndex === pageNum
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {toPersianDigits(pageNum + 1)}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(pageIndex + 1)}
                disabled={pageIndex >= totalPages - 1}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 space-x-reverse"
              >
                <span>بعدی</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeCustomers;