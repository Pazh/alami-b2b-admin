import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Save, X, FileText, User, ChevronLeft, ChevronRight, Search, Filter, Plus, Eye, Tag } from 'lucide-react';
import { 
  Calendar, 
  CheckCircle, 
  Clock
} from 'lucide-react';
import { RoleEnum } from '../types/roles';
import { 
  FactorStatus,
  PaymentMethod,
  FACTOR_STATUS_DISPLAY_NAMES,
  FACTOR_STATUS_COLORS,
  PAYMENT_METHOD_DISPLAY_NAMES,
  PAYMENT_METHOD_COLORS
} from '../types/invoiceTypes';
import { formatCurrency, toPersianDigits, toEnglishDigits } from '../utils/numberUtils';
import { formatPersianDateForDisplay, getTodayPersianDate } from '../utils/dateUtils';
import apiService from '../services/apiService';
import InvoiceDetails from './InvoiceDetails';
import PersianDatePicker from './PersianDatePicker';
import TagSelector from './TagSelector';

interface Brand {
  id: string;
  name: string;
}

interface Grade {
  id: string;
  name: string;
}

interface Personal {
  userId: string;
  firstName: string;
  lastName: string;
  profile?: string;
}

interface Tag {
  id: string;
  name: string;
}

interface Account {
  firstName: string;
  lastName: string;
  nationalCode: string;
  naghshCode: string;
  maxDebt: number;
  maxOpenAccount: number;
  grade: {
    id: string;
    name: string;
    maxCredit: number;
  };
  city: string | null;
  state: string | null;
  brand: Brand[];
}

interface CustomerData {
  personal: Personal;
  account: Account;
}

interface CreatorData {
  personal: Personal;
  account: Account;
}

interface Factor {
  id: string;
  name: string;
  date: string;
  customerUserId: string;
  creatorUserId: string;
  status: string;
  orashFactorId: string;
  paymentMethod: string;
  tags: Tag[];
  customerData: CustomerData;
  creatorData: CreatorData;
}

interface InvoicesProps {
  authToken: string;
  userId: number;
  userRole: RoleEnum;
}

const Invoices: React.FC<InvoicesProps> = ({ authToken, userId, userRole }) => {
  const navigate = useNavigate();
  const [factors, setFactors] = useState<Factor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<Omit<Factor, 'id' | 'customerData' | 'creatorData' | 'tags'> & { tags: string[] }>({
    name: '',
    date: getTodayPersianDate(),
    customerUserId: '',
    creatorUserId: userId.toString(),
    status: 'created',
    orashFactorId: '',
    paymentMethod: 'cheque',
    tags: []
  });
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Pagination
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const fetchTags = async () => {
    try {
      const data = await apiService.getTags(100, 0, authToken);
      setAvailableTags(data.data.data || []);
    } catch (err) {
      console.error('Failed to fetch tags:', err);
    }
  };

  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Customer search for add form
  const [showCustomerPopup, setShowCustomerPopup] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState<any[]>([]);
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [generatedInvoiceName, setGeneratedInvoiceName] = useState<string>('');

  // Filters
  const [filters, setFilters] = useState({
    name: '',
    status: '',
    paymentMethod: '',
    orashFactorId: ''
  });
  const [showFilters, setShowFilters] = useState({
    name: false,
    status: false,
    paymentMethod: false,
    orashFactorId: false
  });
  const statusOptions = [
    { value: 'created', label: 'ایجاد شده' },
    { value: 'approved_by_manager', label: 'تایید شده توسط مدیر' },
    { value: 'approved_by_finance', label: 'تایید شده توسط مالی' },
    { value: 'canceled', label: 'رد شده' },
    { value: 'deleted', label: 'حذف شده' }
  ];

  const paymentMethodOptions = [
    { value: 'cash', label: 'نقدی' },
    { value: 'cheque', label: 'چک' }
  ];

  const fetchFactors = async () => {
    try {
      setLoading(true);
      
      let factorsData: Factor[] = [];
      let total: number = 0;
      if (userRole === RoleEnum.MANAGER || userRole === RoleEnum.DEVELOPER || userRole === RoleEnum.FINANCEMANAGER|| userRole === RoleEnum.SALEMANAGER) {
        // Get all factors
        const queryParams = new URLSearchParams({
          pageSize: pageSize.toString(),
          pageIndex: pageIndex.toString()
        });
        const hasFilters = Object.values(filters).some(filter => filter.trim() !== '');
        
        let data;
        if (hasFilters) {
          const filterData: any = {};
          if (filters.name.trim()) filterData.name = filters.name.trim();
          if (filters.status.trim()) filterData.status = filters.status.trim();
          if (filters.paymentMethod.trim()) filterData.paymentMethod = filters.paymentMethod.trim();
          if (filters.orashFactorId.trim()) filterData.orashFactorId = toEnglishDigits(filters.orashFactorId.trim());
          
          data = await apiService.filterInvoices(pageSize, pageIndex, filterData, authToken);
        } else {
          data = await apiService.getInvoices(pageSize, pageIndex, authToken);
        }

        factorsData = data.data.data || [];
        total = data.data?.details?.count;
        setTotalCount(total);
        
      } else if (userRole === RoleEnum.MARKETER) {
        // Get customer relations first
        const customerRelationsData = await apiService.getCustomerRelations(100, 0, {userId}, authToken);
        const customerUserIds = customerRelationsData.data.data.map((relation: any) => 
          parseInt(relation.customer.personal.userId)
        );

        if (customerUserIds.length > 0) {
          // Get factors for these customers
          const filterData: any = {
            customerUserIds: customerUserIds
          };

          // Add other filters if they exist
          if (filters.name.trim()) filterData.name = filters.name.trim();
          if (filters.status.trim()) filterData.status = filters.status.trim();
          if (filters.paymentMethod.trim()) filterData.paymentMethod = filters.paymentMethod.trim();
          if (filters.orashFactorId.trim()) filterData.orashFactorId = toEnglishDigits(filters.orashFactorId.trim());

          const factorsResponse = await apiService.filterInvoices(pageSize, pageIndex, filterData, authToken);
          factorsData = factorsResponse.data.data || [];
          setTotalCount(factorsResponse.data?.details?.count || 0);
        }
      }

      setFactors(factorsData);
      setTotalPages(Math.ceil(total / pageSize));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch factors');
    } finally {
      setLoading(false);
    }
  };

  const searchCustomers = async (query: string) => {
    if (!query.trim()) {
      setCustomerSearchResults([]);
      return;
    }

    try {
      setCustomerSearchLoading(true);

      let customers: any[] = [];

      if (userRole === RoleEnum.MANAGER || userRole === RoleEnum.DEVELOPER || userRole === RoleEnum.FINANCEMANAGER) {
        // Search all customers
        const data = await apiService.filterCustomers(10, 0,{lastName: query.trim()}, authToken);
        customers = data.data.data || [];
      } else if (userRole === RoleEnum.SALEMANAGER || userRole === RoleEnum.MARKETER) {
        // Search only assigned customers
        const customerRelationsData = await apiService.getCustomerRelations(100, 0, {userId,lastName: query.trim()}, authToken);
        customers = customerRelationsData.data.data
          .map((relation: any) => relation.customer)
          .filter((customer: any) => 
            customer.account.lastName && 
            customer.account.lastName.toLowerCase().includes(query.toLowerCase())
          );
      }

      setCustomerSearchResults(customers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search customers');
    } finally {
      setCustomerSearchLoading(false);
    }
  };

  const generateInvoiceName = (customer: any, date: string, tags: string[]) => {
    // نام مشتری
    const customerName = `${customer.account.firstName} ${customer.account.lastName || ''}`.trim();
    
    // تاریخ
    const formattedDate = formatDateDisplay(date);
    
    // نام تگ‌ها
    const tagNames = tags
      .map(tagId => availableTags.find(tag => tag.id === tagId)?.name)
      .filter(Boolean)
      .join('-');
    
    // ترکیب همه بخش‌ها
    const parts = [customerName, formattedDate];
    if (tagNames) {
      parts.push(tagNames);
    }
    
    return parts.join('  ');
  };

  const handleAdd = async () => {
    if (!selectedCustomer) return;

    try {
      // تولید نام فاکتور به صورت خودکار
      const generatedName = generateInvoiceName(selectedCustomer, addForm.date, addForm.tags || []);
      
      // نمایش پیام تأیید با نام تولید شده
      if (!confirm(`آیا از ایجاد فاکتور با نام زیر اطمینان دارید؟\n\n"${generatedName}"`)) {
        return;
      }
      
      const response = await apiService.createInvoice({
        ...addForm,
        name: generatedName,
        customerUserId: selectedCustomer.personal.userId,
        paymentMethod: addForm.paymentMethod,
        tags: addForm.tags
      }, authToken);
      setSuccess(`فاکتور "${generatedName}" با موفقیت ایجاد شد`);
      await fetchFactors();
      
      // Get the newly created invoice and redirect to details
      // Get the created invoice from API response and navigate to details
      if (response.data) {
        // Fetch complete invoice details including customer and creator data
        const invoiceDetails = await apiService.getInvoiceById(response.data.data.id, authToken);
        handleViewInvoiceDetails(invoiceDetails.data);
      }
      
      setShowAddForm(false);
      setAddForm({
        name: '',
        date: '',
        customerUserId: '',
        creatorUserId: userId.toString(),
        status: 'created',
        orashFactorId: '',
        paymentMethod: 'cash',
        tags: []
      });
      setSelectedCustomer(null);
      setGeneratedInvoiceName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create factor');
    }
  };



  const formatDate = (dateStr: string) => {
    if (dateStr.length === 8) {
      return `${dateStr.slice(0, 4)}/${dateStr.slice(4, 6)}/${dateStr.slice(6, 8)}`;
    }
    return dateStr;
  };

  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFilterSubmit = (field: keyof typeof filters) => {
    setPageIndex(0);
    fetchFactors();
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
    fetchFactors();
  };

  const clearAllFilters = () => {
    setFilters({
      name: '',
      status: '',
      paymentMethod: '',
      orashFactorId: ''
    });
    setPageIndex(0);
  };

  const handleViewInvoiceDetails = (factor: Factor) => {
    navigate(`/admin/invoices/${factor.id}`);
  };

  const getFullName = (account: Account | null) => {
    if (!account) return 'نامشخص';
    return `${account.firstName} ${account.lastName || ''}`.trim();
  };

  const hasActiveFilters = Object.values(filters).some(filter => filter.trim() !== '');

  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);
  const [selectedFactor, setSelectedFactor] = useState<Factor | null>(null);

  const handleBackFromDetails = () => {
    setShowInvoiceDetails(false);
    setSelectedFactor(null);
  };

  const handlePageChange = (newPageIndex: number) => {
    if (newPageIndex >= 0 && newPageIndex < totalPages) {
      setPageIndex(newPageIndex);
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPageIndex(0);
  };

  const formatDateDisplay = (dateStr: string) => {
    if (dateStr.length === 8) {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      return toPersianDigits(`${year}/${month}/${day}`);
    }
    return toPersianDigits(dateStr);
  };

  const canChangeStatus = (role: RoleEnum) => {
    return [RoleEnum.MANAGER, RoleEnum.FINANCEMANAGER, RoleEnum.SALEMANAGER].includes(role);
  };

  const getAvailableStatuses = (role: RoleEnum, currentStatus: FactorStatus): FactorStatus[] => {
    const statuses: FactorStatus[] = [];
    
    // مدیر مالی می‌تواند وضعیت ایجاد شده را به تایید شده توسط مالی تغییر دهد
    if (role === RoleEnum.FINANCEMANAGER && currentStatus === FactorStatus.CREATED) {
      statuses.push(FactorStatus.APPROVED_BY_FINANCE);
    }
    
    // مدیر کل می‌تواند وضعیت را به تایید شده توسط مدیر تغییر دهد
    if (role === RoleEnum.MANAGER) {
      statuses.push(FactorStatus.APPROVED_BY_MANAGER);
    }
    
    // مدیر فروش، مدیر مالی و مدیر کل می‌توانند وضعیت را به لغو شده یا حذف شده تغییر دهند
    if ([RoleEnum.SALEMANAGER, RoleEnum.FINANCEMANAGER, RoleEnum.MANAGER].includes(role)) {
      if (currentStatus !== FactorStatus.CANCELED) {
        statuses.push(FactorStatus.CANCELED);
      }
      if (currentStatus !== FactorStatus.DELETED) {
        statuses.push(FactorStatus.DELETED);
      }
    }
    
    return statuses;
  };

  useEffect(() => {
    fetchFactors();
    fetchTags();
  }, [pageIndex, pageSize, filters]);

  // Update generated invoice name when customer, date, or tags change
  useEffect(() => {
    if (selectedCustomer && addForm.date) {
      const generatedName = generateInvoiceName(selectedCustomer, addForm.date, addForm.tags || []);
      setGeneratedInvoiceName(generatedName);
    } else {
      setGeneratedInvoiceName('');
    }
  }, [selectedCustomer, addForm.date, addForm.tags, availableTags]);

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

  // Render invoice details page
  if (showInvoiceDetails && selectedFactor) {
    return (
      <InvoiceDetails
        authToken={authToken}
        userId={userId}
        userRole={userRole}
        selectedFactor={selectedFactor}
        onBack={handleBackFromDetails}
      />
    );
  }

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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">فاکتورها</h2>
        <div className="flex items-center space-x-4 space-x-reverse">
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-red-600 hover:text-red-800 text-sm flex items-center space-x-1 space-x-reverse"
            >
              <X className="w-4 h-4" />
              <span>پاک کردن همه فیلترها</span>
            </button>
          )}
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
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 space-x-reverse transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن فاکتور</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-600 text-sm">{success}</p>
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="mb-6 p-6 bg-gray-50 rounded-lg border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">افزودن فاکتور جدید</h3>
          
          {/* Generated Invoice Name Preview */}
          {generatedInvoiceName && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 space-x-reverse mb-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-700">نام تولید شده فاکتور:</span>
              </div>
              <div className="text-sm text-blue-900 font-mono bg-white px-3 py-2 rounded border">
                {generatedInvoiceName}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ</label>
              <PersianDatePicker
                value={addForm.date}
                onChange={(date) => setAddForm({ ...addForm, date })}
                placeholder="انتخاب تاریخ فاکتور"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">مشتری</label>
              <div className="relative">
                <input
                  type="text"
                  value={selectedCustomer ? `${selectedCustomer.account.firstName} ${selectedCustomer.account.lastName || ''}` : ''}
                  onClick={() => setShowCustomerPopup(true)}
                  readOnly
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                  placeholder="انتخاب مشتری"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">برچسب‌ها</label>
              <TagSelector
                availableTags={availableTags}
                selectedTags={addForm.tags || []}
                onTagsChange={(tags) => setAddForm({ ...addForm, tags })}
                placeholder="جستجو و انتخاب برچسب‌ها..."
              />
            </div>
            
          </div>
          <div className="flex space-x-2 space-x-reverse">
            <button
              onClick={handleAdd}
              disabled={!selectedCustomer}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center space-x-2 space-x-reverse transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>ذخیره</span>
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setAddForm({
                  name: '',
                  date: getTodayPersianDate(),
                  customerUserId: '',
                  creatorUserId: userId.toString(),
                  status: 'created',
                  orashFactorId: '',
                  paymentMethod: 'cheque',
                  tags: []
                });
                setSelectedCustomer(null);
                setGeneratedInvoiceName('');
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md flex items-center space-x-2 space-x-reverse transition-colors"
            >
              <X className="w-4 h-4" />
              <span>انصراف</span>
            </button>
          </div>
        </div>
      )}

      {/* Customer Search Popup for Add */}
      {showCustomerPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">انتخاب مشتری</h3>
                <button
                  onClick={() => setShowCustomerPopup(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="mt-4">
                <input
                  type="text"
                  value={customerSearchQuery}
                  onChange={(e) => {
                    setCustomerSearchQuery(e.target.value);
                    searchCustomers(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="جستجو بر اساس نام خانوادگی..."
                  autoFocus
                />
              </div>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              {customerSearchLoading ? (
                <div className="text-center py-4">در حال جستجو...</div>
              ) : customerSearchResults.length > 0 ? (
                <div className="space-y-2">
                  {customerSearchResults.map((customer) => (
                    <div
                      key={customer.personal.userId}
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setShowCustomerPopup(false);
                        setCustomerSearchQuery('');
                        setCustomerSearchResults([]);
                      }}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {customer.account.firstName} {customer.account.lastName || ''}
                          </div>
                          <div className="text-sm text-gray-500">
                            کد ملی: {toPersianDigits(customer.account.nationalCode)} | 
                            شهر: {customer.account.city || 'نامشخص'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : customerSearchQuery ? (
                <div className="text-center py-4 text-gray-500">هیچ مشتری یافت نشد</div>
              ) : (
                <div className="text-center py-4 text-gray-500">نام خانوادگی مشتری را جستجو کنید</div>
              )}
            </div>
          </div>
        </div>
      )}



      {/* Factors Table */}
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاریخ</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">مشتری</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ایجادکننده</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center justify-between">
                  <span>وضعیت</span>
                  <button
                    onClick={() => setShowFilters(prev => ({ ...prev, status: !prev.status }))}
                    className={`p-1 rounded hover:bg-gray-200 transition-colors ${filters.status ? 'text-blue-600' : 'text-gray-400'}`}
                    title="فیلتر بر اساس وضعیت"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
                {showFilters.status && (
                  <div className="mt-2 flex items-center space-x-2 space-x-reverse">
                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">همه وضعیت‌ها</option>
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleFilterSubmit('status')}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="اعمال فیلتر"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                    {filters.status && (
                      <button
                        onClick={() => clearFilter('status')}
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
                  <span>روش پرداخت</span>
                  <button
                    onClick={() => setShowFilters(prev => ({ ...prev, paymentMethod: !prev.paymentMethod }))}
                    className={`p-1 rounded hover:bg-gray-200 transition-colors ${filters.paymentMethod ? 'text-blue-600' : 'text-gray-400'}`}
                    title="فیلتر بر اساس روش پرداخت"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
                {showFilters.paymentMethod && (
                  <div className="mt-2 flex items-center space-x-2 space-x-reverse">
                    <select
                      value={filters.paymentMethod}
                      onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">همه روش‌ها</option>
                      {paymentMethodOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleFilterSubmit('paymentMethod')}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="اعمال فیلتر"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                    {filters.paymentMethod && (
                      <button
                        onClick={() => clearFilter('paymentMethod')}
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
                  <span>شناسه اوراش</span>
                  <button
                    onClick={() => setShowFilters(prev => ({ ...prev, orashFactorId: !prev.orashFactorId }))}
                    className={`p-1 rounded hover:bg-gray-200 transition-colors ${filters.orashFactorId ? 'text-blue-600' : 'text-gray-400'}`}
                    title="فیلتر بر اساس شناسه اوراش"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
                {showFilters.orashFactorId && (
                  <div className="mt-2 flex items-center space-x-2 space-x-reverse">
                    <input
                      type="text"
                      value={filters.orashFactorId}
                      onChange={(e) => handleFilterChange('orashFactorId', e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleFilterSubmit('orashFactorId')}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="جستجو در شناسه..."
                      autoFocus
                    />
                    <button
                      onClick={() => handleFilterSubmit('orashFactorId')}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="اعمال فیلتر"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                    {filters.orashFactorId && (
                      <button
                        onClick={() => clearFilter('orashFactorId')}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="پاک کردن فیلتر"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">برچسب‌ها</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عملیات</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {factors.map((factor) => (
              <tr key={factor.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-900">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{formatDateDisplay(factor.date)}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="flex-shrink-0">
                      {factor.customerData.personal.profile ? (
                        <img
                          className="h-8 w-8 rounded-full object-cover"
                          src={factor.customerData.personal.profile}
                          alt={factor.customerData.personal.firstName}
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {getFullName(factor.customerData.account)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {factor.customerData.account.city || 'نامشخص'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="flex-shrink-0">
                      {factor.creatorData.personal.profile ? (
                        <img
                          className="h-8 w-8 rounded-full object-cover"
                          src={factor.creatorData.personal.profile}
                          alt={factor.creatorData.personal.firstName}
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {getFullName(factor.creatorData.account)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${FACTOR_STATUS_COLORS[factor.status as FactorStatus]}`}>
                    {FACTOR_STATUS_DISPLAY_NAMES[factor.status as FactorStatus]}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${PAYMENT_METHOD_COLORS[factor.paymentMethod as PaymentMethod]}`}>
                    {PAYMENT_METHOD_DISPLAY_NAMES[factor.paymentMethod as PaymentMethod]}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {toPersianDigits(factor.orashFactorId)}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-1">
                    {factor.tags && factor.tags.length > 0 ? (
                      factor.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm"
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          {tag.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 text-sm flex items-center">
                        <Tag className="w-3 h-3 mr-1" />
                        بدون برچسب
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleViewInvoiceDetails(factor)}
                    className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors ml-2"
                    title="مشاهده جزئیات فاکتور"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {factors.length === 0 && !loading && (
          <div className="text-center py-8">
            <div className="text-gray-500 text-lg mb-2">هیچ فاکتوری یافت نشد</div>
            <p className="text-gray-400 text-sm">فاکتورهای سیستم در اینجا نمایش داده می‌شوند</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            نمایش {toPersianDigits(pageIndex * pageSize + 1)} تا {toPersianDigits(Math.min((pageIndex + 1) * pageSize, totalCount))} از {toPersianDigits(totalCount)} فاکتور
          </div>
          {totalPages > 1 && (
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
          )}
        </div>
      )}
    </div>
  );
};

export default Invoices;