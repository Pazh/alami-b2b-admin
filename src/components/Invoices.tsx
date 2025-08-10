import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Save, X, FileText, User, Users, ChevronLeft, ChevronRight, Search, Filter, Plus, Eye, Tag } from 'lucide-react';
import { 
  Calendar, 
  CheckCircle, 
  Clock
} from 'lucide-react';
import { RoleEnum } from '../types/roles';
import { 
  FactorStatus,
  FACTOR_STATUS_DISPLAY_NAMES,
  FACTOR_STATUS_COLORS
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

  // Filter-specific customer search
  const [filterCustomerSearch, setFilterCustomerSearch] = useState('');
  const [filterCustomerResults, setFilterCustomerResults] = useState<any[]>([]);
  const [filterCustomerLoading, setFilterCustomerLoading] = useState(false);
  const [selectedFilterCustomer, setSelectedFilterCustomer] = useState<any>(null);
  const [customerSearchTimeout, setCustomerSearchTimeout] = useState<number | null>(null);
  const [filterCustomerTimeout, setFilterCustomerTimeout] = useState<number | null>(null);

  // Filters
  const [filters, setFilters] = useState({
    name: '',
    status: '',
    paymentMethod: '',
    orashFactorId: '',
    startDate: '',
    endDate: '',
    customerId: ''
  });
  const [showFilters, setShowFilters] = useState({
    name: false,
    status: false,
    paymentMethod: false,
    orashFactorId: false,
    date: false,
    customer: false
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

  // Parse Persian date to API format (YYYY-MM-DD)
  const parseDate = (persianDate: string): string => {
    if (!persianDate || persianDate.length !== 10) return '';
    // Persian date format: YYYY/MM/DD -> YYYY-MM-DD
    return persianDate.replace(/\//g, '-');
  };

  // Convert between date formats for date picker
  const convertDateForPicker = (filterDate: string): string => {
    if (!filterDate) return '';
    // Convert YYYY/MM/DD to YYYYMMDD
    return filterDate.replace(/\//g, '');
  };

  const convertDateFromPicker = (pickerDate: string): string => {
    if (!pickerDate || pickerDate.length !== 8) return '';
    // Convert YYYYMMDD to YYYY/MM/DD
    return `${pickerDate.substring(0, 4)}/${pickerDate.substring(4, 6)}/${pickerDate.substring(6, 8)}`;
  };

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
          if (filters.startDate.trim()) filterData.startDate = parseDate(toEnglishDigits(filters.startDate.trim()));
          if (filters.endDate.trim()) filterData.endDate = parseDate(toEnglishDigits(filters.endDate.trim()));
          if (filters.customerId.trim()) filterData.customerUserId = filters.customerId.trim();
          
          data = await apiService.filterInvoices(pageSize, pageIndex, filterData, authToken);
        } else {
          data = await apiService.getInvoices(pageSize, pageIndex, authToken);
        }

        factorsData = data.data.data || [];
        total = data.data?.details?.count;
        setTotalCount(total);
        
      } else if (userRole === RoleEnum.MARKETER) {
        // Get customer relations first
        const customerRelationsData = await apiService.getCustomerRelations(100, 0, {managerUserId: userId}, authToken);
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
          if (filters.startDate.trim()) filterData.startDate = parseDate(toEnglishDigits(filters.startDate.trim()));
          if (filters.endDate.trim()) filterData.endDate = parseDate(toEnglishDigits(filters.endDate.trim()));
          if (filters.customerId.trim()) filterData.customerUserId = filters.customerId.trim();

          const factorsResponse = await apiService.filterInvoices(pageSize, pageIndex, filterData, authToken);
          factorsData = factorsResponse.data.data || [];
          total = factorsResponse.data?.details?.count || 0;
          setTotalCount(total);
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
        const data = await apiService.filterCustomers(10, 0, {lastName: query.trim()}, authToken);
        customers = data.data.data || [];
      } else if (userRole === RoleEnum.SALEMANAGER || userRole === RoleEnum.MARKETER) {
        // Search only assigned customers
        const customerRelationsData = await apiService.getCustomerRelations(100, 0, {managerUserId: userId, lastName: query.trim()}, authToken);
        customers = customerRelationsData.data.data
          .map((relation: any) => relation.customer)
          .filter((customer: any) => customer && customer.account && customer.account.lastName);
      }

      setCustomerSearchResults(customers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search customers');
    } finally {
      setCustomerSearchLoading(false);
    }
  };

  // Debounced customer search for add form
  const debouncedSearchCustomers = (query: string) => {
    if (customerSearchTimeout) {
      clearTimeout(customerSearchTimeout);
    }
    
    const timeout = window.setTimeout(() => {
      searchCustomers(query);
    }, 500);
    
    setCustomerSearchTimeout(timeout);
  };

  // Search customers for filter
  const searchFilterCustomers = async (query: string) => {
    if (!query.trim()) {
      setFilterCustomerResults([]);
      return;
    }

    try {
      setFilterCustomerLoading(true);

      let customers: any[] = [];

      if (userRole === RoleEnum.MANAGER || userRole === RoleEnum.DEVELOPER || userRole === RoleEnum.FINANCEMANAGER) {
        // Search all customers
        const data = await apiService.filterCustomers(10, 0, {lastName: query.trim()}, authToken);
        customers = data.data.data || [];
      } else if (userRole === RoleEnum.SALEMANAGER || userRole === RoleEnum.MARKETER) {
        // Search only assigned customers
        const customerRelationsData = await apiService.getCustomerRelations(100, 0, {managerUserId: userId, lastName: query.trim()}, authToken);
        customers = customerRelationsData.data.data
          .map((relation: any) => relation.customer)
          .filter((customer: any) => customer && customer.account && customer.account.lastName);
      }

      setFilterCustomerResults(customers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search customers');
    } finally {
      setFilterCustomerLoading(false);
    }
  };

  // Debounced filter customer search
  const debouncedSearchFilterCustomers = (query: string) => {
    if (filterCustomerTimeout) {
      clearTimeout(filterCustomerTimeout);
    }
    
    const timeout = window.setTimeout(() => {
      searchFilterCustomers(query);
    }, 500);
    
    setFilterCustomerTimeout(timeout);
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
    setShowFilters(prev => ({
      ...prev,
      [field]: false
    }));
    // fetchFactors will be called by useEffect when pageIndex changes
  };

  const clearFilter = (field: keyof typeof filters | 'date' | 'customer') => {
    if (field === 'date') {
      setFilters(prev => ({
        ...prev,
        startDate: '',
        endDate: ''
      }));
    } else if (field === 'customer') {
      setFilters(prev => ({
        ...prev,
        customerId: ''
      }));
      setSelectedFilterCustomer(null);
      setFilterCustomerSearch('');
      setFilterCustomerResults([]);
    } else {
      setFilters(prev => ({
        ...prev,
        [field]: ''
      }));
    }
    setPageIndex(0);
    // Don't call fetchFactors here, let useEffect handle it
  };

  const clearAllFilters = () => {
    setFilters({
      name: '',
      status: '',
      paymentMethod: '',
      orashFactorId: '',
      startDate: '',
      endDate: '',
      customerId: ''
    });
    setSelectedFilterCustomer(null);
    setFilterCustomerSearch('');
    setFilterCustomerResults([]);
    setPageIndex(0);
    // Don't call fetchFactors here, let useEffect handle it
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

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (customerSearchTimeout) {
        clearTimeout(customerSearchTimeout);
      }
      if (filterCustomerTimeout) {
        clearTimeout(filterCustomerTimeout);
      }
    };
  }, [customerSearchTimeout, filterCustomerTimeout]);

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
    <div className="glass-effect rounded-2xl shadow-modern-lg p-8 border border-white/20 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold gradient-text">فاکتورها</h2>
        </div>
        <div className="flex items-center space-x-4 space-x-reverse">
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 text-sm bg-gradient-to-r from-red-500/10 to-red-600/10 text-red-700 rounded-xl hover:from-red-500/20 hover:to-red-600/20 transition-all duration-200 flex items-center space-x-1 space-x-reverse border border-red-200 shadow-md hover:shadow-lg"
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
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm shadow-md"
            >
              <option value={5}>{toPersianDigits('5')}</option>
              <option value={10}>{toPersianDigits('10')}</option>
              <option value={20}>{toPersianDigits('20')}</option>
              <option value={50}>{toPersianDigits('50')}</option>
            </select>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary flex items-center space-x-2 space-x-reverse"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن فاکتور</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-200 rounded-xl shadow-lg animate-slide-up">
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
              <X className="w-3 h-3 text-white" />
            </div>
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-200 rounded-xl shadow-lg animate-slide-up">
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-3 h-3 text-white" />
            </div>
            <p className="text-green-700 font-medium">{success}</p>
          </div>
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="mb-8 p-6 glass-effect rounded-2xl border border-white/20 shadow-modern animate-slide-up">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2 space-x-reverse">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <span>افزودن فاکتور جدید</span>
          </h3>
          
          {/* Generated Invoice Name Preview */}
          {generatedInvoiceName && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-200 rounded-xl shadow-md">
              <div className="flex items-center space-x-2 space-x-reverse mb-2">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-bold text-blue-700">نام تولید شده فاکتور:</span>
              </div>
              <div className="text-sm text-blue-900 font-mono bg-white/80 backdrop-blur-sm px-4 py-3 rounded-xl border border-blue-200 shadow-sm">
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
                  className="input-modern pr-12 cursor-pointer"
                  placeholder="انتخاب مشتری"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Search className="w-4 h-4 text-white" />
                </div>
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
              className="btn-success flex items-center space-x-2 space-x-reverse disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
              className="btn-secondary flex items-center space-x-2 space-x-reverse"
            >
              <X className="w-4 h-4" />
              <span>انصراف</span>
            </button>
          </div>
        </div>
      )}

      {/* Customer Search Popup for Add */}
      {showCustomerPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass-effect rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden border border-white/20 animate-scale-in">
            <div className="p-6 border-b border-white/20">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold gradient-text flex items-center space-x-2 space-x-reverse">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <span>انتخاب مشتری</span>
                </h3>
                <button
                  onClick={() => setShowCustomerPopup(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
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
                    debouncedSearchCustomers(e.target.value);
                  }}
                  className="input-modern"
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
                      className="p-4 bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl hover:bg-white/80 cursor-pointer transition-all duration-200 hover:shadow-lg transform hover:scale-[1.02]"
                    >
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
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
        <table className="table-modern">
          <thead>
            <tr className="table-header">
              <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">
                <div className="flex items-center justify-between">
                  <span>تاریخ</span>
                  <button
                    onClick={() => setShowFilters(prev => ({ ...prev, date: !prev.date }))}
                    className={`p-2 rounded-xl hover:bg-white/20 transition-all duration-200 ${showFilters.date ? 'text-blue-600 bg-blue-100' : 'text-gray-400'}`}
                    title="فیلتر بر اساس تاریخ"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
                {showFilters.date && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <PersianDatePicker
                        value={convertDateForPicker(filters.startDate)}
                        onChange={(value) => {
                          const displayDate = convertDateFromPicker(value);
                          handleFilterChange('startDate', displayDate);
                          // Don't call handleFilterSubmit, useEffect will handle fetchFactors
                        }}
                        placeholder="از تاریخ"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                      />
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <PersianDatePicker
                        value={convertDateForPicker(filters.endDate)}
                        onChange={(value) => {
                          const displayDate = convertDateFromPicker(value);
                          handleFilterChange('endDate', displayDate);
                          // Don't call handleFilterSubmit, useEffect will handle fetchFactors
                        }}
                        placeholder="تا تاریخ"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                      />
                    </div>
                    {(filters.startDate || filters.endDate) && (
                      <button
                        onClick={() => clearFilter('date')}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-xl transition-all duration-200"
                        title="پاک کردن فیلتر"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </th>
              <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">
                <div className="flex items-center justify-between">
                  <span>مشتری</span>
                  <button
                    onClick={() => setShowFilters(prev => ({ ...prev, customer: !prev.customer }))}
                    className={`p-2 rounded-xl hover:bg-white/20 transition-all duration-200 ${showFilters.customer ? 'text-blue-600 bg-blue-100' : 'text-gray-400'}`}
                    title="فیلتر بر اساس مشتری"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
                {showFilters.customer && (
                  <div className="mt-2 relative">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <input
                        type="text"
                        placeholder="جستجو نام خانوادگی مشتری..."
                        value={filterCustomerSearch}
                        onChange={(e) => {
                          setFilterCustomerSearch(e.target.value);
                          debouncedSearchFilterCustomers(e.target.value);
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                      />
                      {selectedFilterCustomer && (
                        <button
                          onClick={() => clearFilter('customer')}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-xl transition-all duration-200"
                          title="پاک کردن فیلتر"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    {/* Customer Search Results */}
                    {filterCustomerSearch && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {filterCustomerLoading ? (
                          <div className="p-3 text-center text-gray-500">در حال جستجو...</div>
                        ) : filterCustomerResults.length > 0 ? (
                          filterCustomerResults.map((customer) => (
                            <div
                              key={customer.personal.userId}
                              onClick={() => {
                                setSelectedFilterCustomer(customer);
                                setFilters(prev => ({ ...prev, customerId: customer.personal.userId }));
                                setFilterCustomerSearch(`${customer.account.firstName} ${customer.account.lastName}`);
                                setFilterCustomerResults([]);
                                // Don't call fetchFactors here, let useEffect handle it
                              }}
                              className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">
                                {customer.account.firstName} {customer.account.lastName || ''}
                              </div>
                              <div className="text-sm text-gray-500">
                                کد ملی: {toPersianDigits(customer.account.nationalCode)}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-center text-gray-500">مشتری یافت نشد</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </th>
              <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">ایجادکننده</th>
              <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">
                <div className="flex items-center justify-between">
                  <span>وضعیت</span>
                  <button
                    onClick={() => setShowFilters(prev => ({ ...prev, status: !prev.status }))}
                    className={`p-2 rounded-xl hover:bg-white/20 transition-all duration-200 ${filters.status ? 'text-blue-600 bg-blue-100' : 'text-gray-400'}`}
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
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
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
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-xl transition-all duration-200"
                      title="اعمال فیلتر"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                    {filters.status && (
                      <button
                        onClick={() => clearFilter('status')}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-xl transition-all duration-200"
                        title="پاک کردن فیلتر"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </th>

              <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">
                <div className="flex items-center justify-between">
                  <span>شناسه اوراش</span>
                  <button
                    onClick={() => setShowFilters(prev => ({ ...prev, orashFactorId: !prev.orashFactorId }))}
                    className={`p-2 rounded-xl hover:bg-white/20 transition-all duration-200 ${filters.orashFactorId ? 'text-blue-600 bg-blue-100' : 'text-gray-400'}`}
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
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                      placeholder="جستجو در شناسه..."
                      autoFocus
                    />
                    <button
                      onClick={() => handleFilterSubmit('orashFactorId')}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-xl transition-all duration-200"
                      title="اعمال فیلتر"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                    {filters.orashFactorId && (
                      <button
                        onClick={() => clearFilter('orashFactorId')}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-xl transition-all duration-200"
                        title="پاک کردن فیلتر"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </th>
              <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">برچسب‌ها</th>
              <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {factors.map((factor) => (
              <tr key={factor.id} className="table-row">
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{formatDateDisplay(factor.date)}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="flex-shrink-0">
                      {factor.customerData.personal.profile ? (
                        <img
                          className="h-10 w-10 rounded-xl object-cover border-2 border-white shadow-md"
                          src={factor.customerData.personal.profile}
                          alt={factor.customerData.personal.firstName}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md">
                          <User className="h-5 w-5 text-white" />
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
                <td className="px-6 py-5">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="flex-shrink-0">
                      {factor.creatorData.personal.profile ? (
                        <img
                          className="h-10 w-10 rounded-xl object-cover border-2 border-white shadow-md"
                          src={factor.creatorData.personal.profile}
                          alt={factor.creatorData.personal.firstName}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md">
                          <User className="h-5 w-5 text-white" />
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
                <td className="px-6 py-5 whitespace-nowrap">
                  <span className={`status-badge ${FACTOR_STATUS_COLORS[factor.status as FactorStatus]}`}>
                    {FACTOR_STATUS_DISPLAY_NAMES[factor.status as FactorStatus]}
                  </span>
                </td>

                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 font-mono bg-gray-100 px-3 py-1 rounded-lg">
                    {toPersianDigits(factor.orashFactorId)}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-wrap gap-1">
                    {factor.tags && factor.tags.length > 0 ? (
                      factor.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="tag-badge from-blue-500 to-blue-600 text-white"
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
                <td className="px-6 py-5 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleViewInvoiceDetails(factor)}
                    className="p-3 text-green-600 hover:text-white hover:bg-gradient-to-r hover:from-green-500 hover:to-green-600 rounded-xl transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                    title="مشاهده جزئیات فاکتور"
                  >
                    <Eye className="w-5 h-5" />
                  </button>

                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {factors.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center shadow-lg">
              <FileText className="w-10 h-10 text-white" />
            </div>
            <div className="text-gray-600 text-xl font-medium mb-2">هیچ فاکتوری یافت نشد</div>
            <p className="text-gray-500">فاکتورهای سیستم در اینجا نمایش داده می‌شوند</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-md">
          <div className="text-sm font-medium text-gray-700">
            نمایش {toPersianDigits(pageIndex * pageSize + 1)} تا {toPersianDigits(Math.min((pageIndex + 1) * pageSize, totalCount))} از {toPersianDigits(totalCount)} فاکتور
          </div>
          {totalPages > 1 && (
            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                onClick={() => handlePageChange(pageIndex - 1)}
                disabled={pageIndex === 0}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white/80 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 space-x-reverse transition-all duration-200 shadow-md hover:shadow-lg"
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
                      className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg ${
                        pageIndex === pageNum
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                          : 'bg-white/80 text-gray-700 border border-gray-200 hover:bg-white'
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
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white/80 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 space-x-reverse transition-all duration-200 shadow-md hover:shadow-lg"
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