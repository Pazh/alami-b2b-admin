import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Save, X, User, Building, CreditCard, Tag, ChevronLeft, ChevronRight, Search, Filter, Eye } from 'lucide-react';
import { RoleEnum } from '../types/roles';
import { formatCurrency, formatNumber, toPersianDigits, toEnglishDigits } from '../utils/numberUtils';
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

interface CustomerWithRelation {
  personal: Personal;
  account: Account;
}

interface Customer {
  personal: Personal;
  account: Account;
}

interface CustomerRelation {
  id: string;
  customer: CustomerWithRelation;
  managerUser: Personal;
}

interface CustomersProps {
  authToken: string;
  userId: number;
  userRole: RoleEnum;
}

const Customers: React.FC<CustomersProps> = ({ authToken, userId, userRole }) => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerRelation[] | Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableBrands, setAvailableBrands] = useState<Brand[]>([]);
  const [availableGrades, setAvailableGrades] = useState<Grade[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState({
    firstName: '',
    lastName: '',
    nationalCode: '',
    naghshCode: '',
    city: '',
    state: ''
  });
  const [showFilters, setShowFilters] = useState({
    firstName: false,
    lastName: false,
    nationalCode: false,
    naghshCode: false,
    city: false,
    state: false
  });
  const [editingBrands, setEditingBrands] = useState<string | null>(null);
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
  const [savingBrands, setSavingBrands] = useState(false);

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://alami-b2b-api.liara.run/api';

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      
      let response;
      const queryParams = new URLSearchParams({
        pageSize: pageSize.toString(),
        pageIndex: pageIndex.toString()
      });
      
      // Prepare filter data - only include non-empty filters and convert Persian digits to English
      const filterData: any = {};
      if (filters.firstName.trim()) filterData.firstName = filters.firstName.trim();
      if (filters.lastName.trim()) filterData.lastName = filters.lastName.trim();
      if (filters.nationalCode.trim()) filterData.nationalCode = toEnglishDigits(filters.nationalCode.trim());
      if (filters.naghshCode.trim()) filterData.naghshCode = toEnglishDigits(filters.naghshCode.trim());
      if (filters.city.trim()) filterData.city = filters.city.trim();
      if (filters.state.trim()) filterData.state = filters.state.trim();
      
      // If user is marketer, use filtered API to show only their customers
      if (userRole === RoleEnum.MARKETER) {
        const requestBody = {
          managerUserId: userId,
          ...filterData
        };
        
        response = await fetch(`${baseUrl}/customer-relation/filter?${queryParams}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify(requestBody),
        });
      } else {
        // For sale managers, managers, developers, and finance managers, show all customers
        if (Object.keys(filterData).length > 0) {
          // Use filter API if there are filters
          response = await fetch(`${baseUrl}/customer-user/filter?${queryParams}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify(filterData),
          });
        } else {
          // Use regular API if no filters
          response = await fetch(`${baseUrl}/customer-user?${queryParams}`, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
            },
          });
        }
      }

      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }

      const data = await response.json();
      
      // Set total count and calculate total pages
      const count = data.data?.details?.count || 0;
      setTotalCount(count);
      setTotalPages(Math.ceil(count / pageSize));
      
      if (userRole === RoleEnum.MARKETER) {
        setCustomers(data.data.data || []);
      } else {
        // Transform the data to match CustomerRelation structure for consistency
        const transformedData = (data.data.data || []).map((customer: Customer) => ({
          id: customer.account.id, // Use account ID as relation ID
          customer: customer,
          managerUser: null // No manager info in this API
        }));
        setCustomers(transformedData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch customers');
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

      if (response.ok) {
        const data = await response.json();
        setAvailableBrands(data.data.data || []);
      }
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

      if (response.ok) {
        const data = await response.json();
        setAvailableGrades(data.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch grades:', err);
    }
  };

  const handleEdit = (customerData: CustomerRelation | Customer) => {
    const isRelation = 'id' in customerData && 'customer' in customerData;
    const customer = isRelation ? (customerData as CustomerRelation).customer : (customerData as Customer);
    const id = isRelation ? (customerData as CustomerRelation).id : customer.account.id;
    
    navigate(`/admin/customers/${id}/edit`);
  };

  const handleEditBrands = (customerData: CustomerRelation | Customer) => {
    const isRelation = 'id' in customerData && 'customer' in customerData;
    const customer = isRelation ? (customerData as CustomerRelation).customer : (customerData as Customer);
    const id = isRelation ? (customerData as CustomerRelation).id : customer.account.id;
    
    setEditingBrands(id);
    setSelectedBrandIds(customer.account.brand.map(b => b.id));
  };

  const handleSaveBrands = async () => {
    if (!editingBrands) return;

    try {
      setSavingBrands(true);
      setError(null);

      // Find the customer data
      const customerData = customers.find(c => {
        const isRelation = 'id' in c && 'customer' in c;
        const id = isRelation ? (c as CustomerRelation).id : (c as Customer).account.id;
        return id === editingBrands;
      });

      if (!customerData) {
        throw new Error('Customer not found');
      }

      const isRelation = 'id' in customerData && 'customer' in customerData;
      const customer = isRelation ? (customerData as CustomerRelation).customer : (customerData as Customer);

      const updateData = {
        userId: customer.account.userId,
        roleId: customer.account.roleId,
        firstName: customer.account.firstName,
        lastName: customer.account.lastName,
        maxDebt: customer.account.maxDebt,
        nationalCode: customer.account.nationalCode,
        naghshCode: customer.account.naghshCode,
        city: customer.account.city,
        state: customer.account.state,
        maxOpenAccount: customer.account.maxOpenAccount,
        brandIds: selectedBrandIds,
        gradeId: customer.account.grade.id
      };

      const response = await fetch(`${baseUrl}/customer-user/${editingBrands}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update customer brands');
      }

      // Update the local state
      setCustomers(prevCustomers => 
        prevCustomers.map(c => {
          const isRelation = 'id' in c && 'customer' in c;
          const id = isRelation ? (c as CustomerRelation).id : (c as Customer).account.id;
          
          if (id === editingBrands) {
            if (isRelation) {
              const relation = c as CustomerRelation;
              return {
                ...relation,
                customer: {
                  ...relation.customer,
                  account: {
                    ...relation.customer.account,
                    brand: availableBrands.filter(b => selectedBrandIds.includes(b.id))
                  }
                }
              };
            } else {
              const customer = c as Customer;
              return {
                ...customer,
                account: {
                  ...customer.account,
                  brand: availableBrands.filter(b => selectedBrandIds.includes(b.id))
                }
              };
            }
          }
          return c;
        }) as CustomerRelation[] | Customer[]
      );

      setEditingBrands(null);
      setSelectedBrandIds([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update customer brands');
    } finally {
      setSavingBrands(false);
    }
  };

  const handleCancelBrands = () => {
    setEditingBrands(null);
    setSelectedBrandIds([]);
  };

  const handleBrandsChange = (brandIds: string[]) => {
    setSelectedBrandIds(brandIds);
  };


  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFilterSubmit = (field: keyof typeof filters) => {
    setPageIndex(0); // Reset to first page when filtering
    fetchCustomers();
    setShowFilters(prev => ({
      ...prev,
      [field]: false
    }));
  };

  const clearFilter = (field: keyof typeof filters) => {
    setFilters(prev => ({
      ...prev,
      [field]: ''
    }));
    setPageIndex(0);
    fetchCustomers();
  };

  const clearAllFilters = () => {
    setFilters({
      firstName: '',
      lastName: '',
      nationalCode: '',
      naghshCode: '',
      city: '',
      state: ''
    });
    setPageIndex(0);
    // Don't call fetchCustomers here, let useEffect handle it
  };

  const hasActiveFilters = Object.values(filters).some(filter => filter.trim() !== '');

  const getFullName = (personal: Personal | null) => {
    if (!personal) return 'نامشخص';
    return `${personal.firstName}${personal.lastName ? ` ${personal.lastName}` : ''}`;
  };

  const getCustomerFromData = (item: CustomerRelation | Customer) => {
    const isRelation = 'id' in item && 'customer' in item;
    return isRelation ? (item as CustomerRelation).customer : (item as Customer);
  };

  const getItemId = (item: CustomerRelation | Customer) => {
    const isRelation = 'id' in item && 'customer' in item;
    return isRelation ? (item as CustomerRelation).id : (item as Customer).account.id;
  };

  useEffect(() => {
    fetchCustomers();
    fetchBrands();
    fetchGrades();
  }, [pageIndex, pageSize, userRole, filters]);

  const handlePageChange = (newPageIndex: number) => {
    if (newPageIndex >= 0 && newPageIndex < totalPages) {
      setPageIndex(newPageIndex);
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPageIndex(0); // Reset to first page when changing page size
  };

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
    <div className="glass-effect rounded-2xl shadow-modern mobile-card border border-white/20">
      {/* Header Section - Responsive */}
      <div className="mobile-flex mobile-space mb-6">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <User className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl lg:text-2xl font-bold gradient-text">مشتریان</h2>
        </div>
        <div className="mobile-flex mobile-space items-start sm:items-center">
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="btn-mobile bg-red-100 text-red-700 hover:bg-red-200 transition-all duration-200 active:scale-95 touch-manipulation flex items-center space-x-1 space-x-reverse justify-center"
            >
              <X className="icon-mobile-sm" />
              <span>پاک کردن فیلترها</span>
            </button>
          )}
          <div className="mobile-text text-gray-500 bg-white/80 px-3 py-2 rounded-xl backdrop-blur-sm">
            تعداد کل: {toPersianDigits(totalCount)}
          </div>
          <div className="flex items-center space-x-2 space-x-reverse justify-center">
            <label className="mobile-text text-gray-700 hidden sm:inline">تعداد در صفحه:</label>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-xl mobile-text focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/90 backdrop-blur-sm shadow-sm"
            >
              <option value={5}>{toPersianDigits('5')}</option>
              <option value={10}>{toPersianDigits('10')}</option>
              <option value={20}>{toPersianDigits('20')}</option>
              <option value={50}>{toPersianDigits('50')}</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-4">
        {customers.map((customerData) => {
          const customer = getCustomerFromData(customerData);
          const itemId = getItemId(customerData);
          
          return (
            <div key={itemId} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-3 space-x-reverse mb-3">
                <div className="flex-shrink-0">
                  {customer.personal.profile ? (
                    <img
                      className="h-12 w-12 rounded-full object-cover"
                      src={customer.personal.profile}
                      alt={customer.personal.firstName}
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <User className="icon-mobile" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-base font-medium text-gray-900">
                    {customer.account.firstName} {customer.account.lastName || ''}
                  </div>
                  <div className="text-sm text-gray-500">
                    کد ملی: {toPersianDigits(customer.account.nationalCode)}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                <div>
                  <span className="text-gray-500">کد نقش:</span>
                  <div className="font-medium">{toPersianDigits(customer.account.naghshCode)}</div>
                </div>
                <div>
                  <span className="text-gray-500">شهر:</span>
                  <div className="font-medium">{customer.account.city || '-'}</div>
                </div>
                <div>
                  <span className="text-gray-500">حداکثر بدهی:</span>
                  <div className="font-medium">{formatCurrency(customer.account.maxDebt)} ریال</div>
                </div>
                <div>
                  <span className="text-gray-500">سقف حساب باز:</span>
                  <div className="font-medium">{formatCurrency(customer.account.maxOpenAccount)} ریال</div>
                </div>
              </div>
              
              <div className="mb-3">
                <span className="text-gray-500 text-sm">برندها:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {customer.account.brand.map((brand) => (
                    <span
                      key={brand.id}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm"
                    >
                      <Building className="icon-mobile-sm mr-1" />
                      {brand.name}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="mb-3">
                <span className="text-gray-500 text-sm">گرید:</span>
                <div className="mt-1">
                  <div className="font-medium text-gray-900">
                    {customer.account.grade.name}
                  </div>
                  <div className="text-gray-500 text-xs">
                    حداکثر اعتبار: {formatCurrency(customer.account.grade.maxCredit)} ریال
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2 space-x-reverse justify-center">
                <button
                  onClick={() => handleEdit(customerData)}
                  className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50 transition-colors"
                  title="ویرایش اطلاعات حساب"
                >
                  <Edit className="icon-mobile-sm" />
                </button>
                <button
                  onClick={() => {
                    const customer = getCustomerFromData(customerData);
                    window.location.href = `/admin/customers/${customer.account.id}`;
                  }}
                  className="text-green-600 hover:text-green-900 p-2 rounded hover:bg-green-50 transition-colors"
                  title="مشاهده جزئیات"
                >
                  <Eye className="icon-mobile-sm" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center justify-between">
                  <span>نام</span>
                  <button
                    onClick={() => setShowFilters(prev => ({ ...prev, firstName: !prev.firstName }))}
                    className={`p-1 rounded hover:bg-gray-200 transition-colors ${filters.firstName ? 'text-blue-600' : 'text-gray-400'}`}
                    title="فیلتر بر اساس نام"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
                {showFilters.firstName && (
                  <div className="mt-2 flex items-center space-x-2 space-x-reverse">
                    <input
                      type="text"
                      value={filters.firstName}
                      onChange={(e) => handleFilterChange('firstName', e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleFilterSubmit('firstName')}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="جستجو در نام..."
                      autoFocus
                    />
                    <button
                      onClick={() => handleFilterSubmit('firstName')}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="اعمال فیلتر"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                    {filters.firstName && (
                      <button
                        onClick={() => clearFilter('firstName')}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="پاک کردن فیلتر"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center justify-between">
                  <span>نام خانوادگی</span>
                  <button
                    onClick={() => setShowFilters(prev => ({ ...prev, lastName: !prev.lastName }))}
                    className={`p-1 rounded hover:bg-gray-200 transition-colors ${filters.lastName ? 'text-blue-600' : 'text-gray-400'}`}
                    title="فیلتر بر اساس نام خانوادگی"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
                {showFilters.lastName && (
                  <div className="mt-2 flex items-center space-x-2 space-x-reverse">
                    <input
                      type="text"
                      value={filters.lastName}
                      onChange={(e) => handleFilterChange('lastName', e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleFilterSubmit('lastName')}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="جستجو در نام خانوادگی..."
                      autoFocus
                    />
                    <button
                      onClick={() => handleFilterSubmit('lastName')}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="اعمال فیلتر"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                    {filters.lastName && (
                      <button
                        onClick={() => clearFilter('lastName')}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="پاک کردن فیلتر"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center justify-between">
                  <span>کد ملی</span>
                  <button
                    onClick={() => setShowFilters(prev => ({ ...prev, nationalCode: !prev.nationalCode }))}
                    className={`p-1 rounded hover:bg-gray-200 transition-colors ${filters.nationalCode ? 'text-blue-600' : 'text-gray-400'}`}
                    title="فیلتر بر اساس کد ملی"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
                {showFilters.nationalCode && (
                  <div className="mt-2 flex items-center space-x-2 space-x-reverse">
                    <input
                      type="text"
                      value={filters.nationalCode}
                      onChange={(e) => handleFilterChange('nationalCode', e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleFilterSubmit('nationalCode')}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="جستجو در کد ملی..."
                      autoFocus
                    />
                    <button
                      onClick={() => handleFilterSubmit('nationalCode')}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="اعمال فیلتر"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                    {filters.nationalCode && (
                      <button
                        onClick={() => clearFilter('nationalCode')}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="پاک کردن فیلتر"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center justify-between">
                  <span>کد نقش</span>
                  <button
                    onClick={() => setShowFilters(prev => ({ ...prev, naghshCode: !prev.naghshCode }))}
                    className={`p-1 rounded hover:bg-gray-200 transition-colors ${filters.naghshCode ? 'text-blue-600' : 'text-gray-400'}`}
                    title="فیلتر بر اساس کد نقش"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
                {showFilters.naghshCode && (
                  <div className="mt-2 flex items-center space-x-2 space-x-reverse">
                    <input
                      type="text"
                      value={filters.naghshCode}
                      onChange={(e) => handleFilterChange('naghshCode', e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleFilterSubmit('naghshCode')}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="جستجو در کد نقش..."
                      autoFocus
                    />
                    <button
                      onClick={() => handleFilterSubmit('naghshCode')}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="اعمال فیلتر"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                    {filters.naghshCode && (
                      <button
                        onClick={() => clearFilter('naghshCode')}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="پاک کردن فیلتر"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">حداکثر بدهی</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center justify-between">
                  <span>شهر</span>
                  <button
                    onClick={() => setShowFilters(prev => ({ ...prev, city: !prev.city }))}
                    className={`p-1 rounded hover:bg-gray-200 transition-colors ${filters.city ? 'text-blue-600' : 'text-gray-400'}`}
                    title="فیلتر بر اساس شهر"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
                {showFilters.city && (
                  <div className="mt-2 flex items-center space-x-2 space-x-reverse">
                    <input
                      type="text"
                      value={filters.city}
                      onChange={(e) => handleFilterChange('city', e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleFilterSubmit('city')}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="جستجو در شهر..."
                      autoFocus
                    />
                    <button
                      onClick={() => handleFilterSubmit('city')}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="اعمال فیلتر"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                    {filters.city && (
                      <button
                        onClick={() => clearFilter('city')}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="پاک کردن فیلتر"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center justify-between">
                  <span>استان</span>
                  <button
                    onClick={() => setShowFilters(prev => ({ ...prev, state: !prev.state }))}
                    className={`p-1 rounded hover:bg-gray-200 transition-colors ${filters.state ? 'text-blue-600' : 'text-gray-400'}`}
                    title="فیلتر بر اساس استان"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
                {showFilters.state && (
                  <div className="mt-2 flex items-center space-x-2 space-x-reverse">
                    <input
                      type="text"
                      value={filters.state}
                      onChange={(e) => handleFilterChange('state', e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleFilterSubmit('state')}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="جستجو در استان..."
                      autoFocus
                    />
                    <button
                      onClick={() => handleFilterSubmit('state')}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="اعمال فیلتر"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                    {filters.state && (
                      <button
                        onClick={() => clearFilter('state')}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="پاک کردن فیلتر"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">سقف حساب باز</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">برندها</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">گرید</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عملیات</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {customers.map((customerData) => {
              const customer = getCustomerFromData(customerData);
              const itemId = getItemId(customerData);
              
              return (
              <tr key={itemId} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="flex-shrink-0">
                      {customer.personal.profile ? (
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={customer.personal.profile}
                          alt={customer.personal.firstName}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <User className="h-5 w-5 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {customer.account.firstName}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {toPersianDigits(customer.personal.userId)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {customer.account.lastName || '-'}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {toPersianDigits(customer.account.nationalCode)}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {toPersianDigits(customer.account.naghshCode)}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatCurrency(customer.account.maxDebt)} ریال
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {customer.account.city || '-'}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {customer.account.state || '-'}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatCurrency(customer.account.maxOpenAccount)} ریال
                  </div>
                </td>
                <td className="px-4 py-4">
                  {editingBrands === itemId ? (
                    <div className="space-y-2">
                      <BrandSelector
                        availableBrands={availableBrands}
                        selectedBrands={selectedBrandIds}
                        onBrandsChange={handleBrandsChange}
                        placeholder="انتخاب برندها..."
                        className="w-full"
                      />
                      <div className="flex space-x-2 space-x-reverse">
                        <button
                          onClick={handleSaveBrands}
                          disabled={savingBrands}
                          className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center space-x-1 space-x-reverse"
                        >
                          {savingBrands ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                              <span>ذخیره...</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-3 h-3" />
                              <span>ذخیره</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleCancelBrands}
                          className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors flex items-center space-x-1 space-x-reverse"
                        >
                          <X className="w-3 h-3" />
                          <span>انصراف</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {customer.account.brand.map((brand) => (
                        <span
                          key={brand.id}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm"
                        >
                          <Building className="w-3 h-3 mr-1" />
                          {brand.name}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">
                      {customer.account.grade.name}
                    </div>
                    <div className="text-gray-500 text-xs">
                      حداکثر اعتبار: {formatCurrency(customer.account.grade.maxCredit)} ریال
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2 space-x-reverse">
                    <button
                      onClick={() => handleEdit(customerData)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                      title="ویرایش اطلاعات حساب"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        const customer = getCustomerFromData(customerData);
                        window.location.href = `/admin/customers/${customer.account.id}`;
                      }}
                      className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                      title="مشاهده جزئیات"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>

        {customers.length === 0 && !loading && (
          <div className="text-center py-8">
            <div className="text-gray-500 text-lg mb-2">هیچ مشتری یافت نشد</div>
            <p className="text-gray-400 text-sm">مشتریان تحت مدیریت شما در اینجا نمایش داده می‌شوند</p>
          </div>
        )}
      </div>

      {/* Pagination - Responsive */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              onClick={() => handlePageChange(pageIndex - 1)}
              disabled={pageIndex === 0}
              className="px-2 md:px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 space-x-reverse"
            >
              <ChevronRight className="w-4 h-4" />
              <span className="hidden md:inline">قبلی</span>
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
                    className={`px-2 md:px-3 py-2 text-sm font-medium rounded-md ${
                      pageIndex === pageNum
                        ? 'bg-purple-500 text-white'
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
              className="px-2 md:px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 space-x-reverse"
            >
              <span className="hidden md:inline">بعدی</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;