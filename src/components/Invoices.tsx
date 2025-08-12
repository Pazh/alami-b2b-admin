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
  const [scrollPosition, setScrollPosition] = useState(0);

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
        total = data.data?.details?.count || 0;
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

  // Save scroll position before opening customer popup
  const saveScrollPosition = () => {
    setScrollPosition(window.pageYOffset || document.documentElement.scrollTop);
  };

  // Restore scroll position after customer selection
  const restoreScrollPosition = () => {
    window.scrollTo({ top: scrollPosition, behavior: 'smooth' });
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

  const handleStatusChange = async (factorId: string, currentStatus: string) => {
    try {
      const availableStatuses = getAvailableStatuses(userRole, currentStatus as FactorStatus);
      
      if (availableStatuses.length === 0) {
        setError('شما نمی‌توانید وضعیت این فاکتور را تغییر دهید');
        return;
      }

      const newStatus = prompt(
        `وضعیت فعلی: ${FACTOR_STATUS_DISPLAY_NAMES[currentStatus as FactorStatus]}\n\nوضعیت‌های قابل انتخاب:\n${availableStatuses.map(status => FACTOR_STATUS_DISPLAY_NAMES[status]).join('\n')}\n\nلطفاً یکی از وضعیت‌های بالا را وارد کنید:`
      );

      if (!newStatus) return;

      const selectedStatus = availableStatuses.find(status => 
        FACTOR_STATUS_DISPLAY_NAMES[status] === newStatus
      );

      if (!selectedStatus) {
        setError('وضعیت انتخاب شده معتبر نیست');
        return;
      }

      // Here you would call the API to update the status
      // await apiService.updateInvoiceStatus(factorId, selectedStatus, authToken);
      
      setSuccess(`وضعیت فاکتور با موفقیت به ${FACTOR_STATUS_DISPLAY_NAMES[selectedStatus]} تغییر یافت`);
      await fetchFactors();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در تغییر وضعیت فاکتور');
    }
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
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
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
    <div className="glass-effect rounded-2xl shadow-modern mobile-card border border-white/20 animate-fade-in p-4 sm:p-6">
      {/* Header Section - Responsive */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 mb-6">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl lg:text-2xl font-bold gradient-text">فاکتورها</h2>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 sm:space-x-reverse">
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="btn-mobile bg-red-100 text-red-700 hover:bg-red-200 transition-all duration-200 active:scale-95 touch-manipulation flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 rounded-xl text-sm font-medium"
            >
              <X className="w-4 h-4" />
              <span>پاک کردن فیلترها</span>
            </button>
          )}
          
          <div className="mobile-text text-gray-500 bg-white/80 px-3 py-2 rounded-xl backdrop-blur-sm text-center sm:text-right">
            تعداد کل: {toPersianDigits(totalCount)}
          </div>
          
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 sm:space-x-reverse">
            <label className="mobile-text text-gray-700 text-sm">تعداد در صفحه:</label>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-xl mobile-text focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/90 backdrop-blur-sm shadow-sm text-sm"
            >
              <option value={5}>{toPersianDigits('5')}</option>
              <option value={10}>{toPersianDigits('10')}</option>
              <option value={20}>{toPersianDigits('20')}</option>
              <option value={50}>{toPersianDigits('50')}</option>
            </select>
          </div>
          
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary flex items-center justify-center space-x-2 space-x-reverse w-full sm:w-auto px-4 py-2 rounded-xl text-sm font-medium"
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
            <p className="text-red-700 font-medium text-sm sm:text-base">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-200 rounded-xl shadow-lg animate-slide-up">
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-3 h-3 text-white" />
            </div>
            <p className="text-green-700 font-medium text-sm sm:text-base">{success}</p>
          </div>
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="mb-8 p-4 sm:p-6 glass-effect rounded-2xl border border-white/20 shadow-modern animate-slide-up relative z-40">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2 space-x-reverse">
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
              <div className="text-sm text-blue-900 bg-white/80 backdrop-blur-sm px-4 py-3 rounded-xl border border-blue-200 shadow-sm break-words">
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
                  onClick={() => {
                    saveScrollPosition();
                    setShowCustomerPopup(true);
                  }}
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
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 sm:space-x-reverse">
            <button
              onClick={handleAdd}
              disabled={!selectedCustomer}
              className="btn-success flex items-center justify-center space-x-2 space-x-reverse disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none px-4 py-2 rounded-xl text-sm font-medium"
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
              className="btn-secondary flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 rounded-xl text-sm font-medium"
            >
              <X className="w-4 h-4" />
              <span>انصراف</span>
            </button>
          </div>
        </div>
      )}

      {/* Customer Search Popup for Add */}
      {showCustomerPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] animate-fade-in">
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 glass-effect rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden border border-white/20 animate-scale-in">
            <div className="p-4 sm:p-6 border-b border-white/20">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-bold gradient-text flex items-center space-x-2 space-x-reverse">
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
            <div className="p-4 sm:p-6 max-h-96 overflow-y-auto">
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
                        // Restore scroll position after customer selection
                        setTimeout(() => restoreScrollPosition(), 100);
                      }}
                      className="p-4 bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl hover:bg-white/80 cursor-pointer transition-all duration-200 hover:shadow-lg transform hover:scale-[1.02]"
                    >
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                            <User className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {customer.account.firstName} {customer.account.lastName || ''}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
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

      {/* Mobile Filters */}
      <div className="block lg:hidden mb-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/40 p-4 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
            <Filter className="w-5 h-5 text-blue-600" />
            <span>فیلترها</span>
          </h3>
          
          <div className="space-y-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">وضعیت</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm text-sm"
              >
                <option value="">همه وضعیت‌ها</option>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Customer Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">مشتری</label>
              <div className="relative">
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
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
                    title="پاک کردن فیلتر"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {/* Customer Search Results */}
              {filterCustomerSearch && (
                <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto w-full">
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

            {/* Date Filters */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">از تاریخ</label>
                <PersianDatePicker
                  value={convertDateForPicker(filters.startDate)}
                  onChange={(value) => {
                    const displayDate = convertDateFromPicker(value);
                    handleFilterChange('startDate', displayDate);
                  }}
                  placeholder="از تاریخ"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تا تاریخ</label>
                <PersianDatePicker
                  value={convertDateForPicker(filters.endDate)}
                  onChange={(value) => {
                    const displayDate = convertDateFromPicker(value);
                    handleFilterChange('endDate', displayDate);
                  }}
                  placeholder="تا تاریخ"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                />
              </div>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="w-full bg-red-100 text-red-700 hover:bg-red-200 transition-all duration-200 active:scale-95 touch-manipulation flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 rounded-xl text-sm font-medium"
              >
                <X className="w-4 h-4" />
                <span>پاک کردن همه فیلترها</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-4">
        {factors.map((factor) => (
          <div key={factor.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center space-x-3 space-x-reverse mb-3">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-medium text-gray-900 truncate">
                  {factor.name}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {getFullName(factor.customerData.account)} | {formatDateDisplay(factor.date)}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 text-sm">
              <div>
                <span className="text-gray-500">وضعیت:</span>
                <div className="font-medium mt-1">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    factor.status === 'created' ? 'bg-blue-100 text-blue-800' :
                    factor.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    factor.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {factor.status === 'created' ? 'ایجاد شده' :
                     factor.status === 'confirmed' ? 'تایید شده' :
                     factor.status === 'cancelled' ? 'لغو شده' :
                     factor.status}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-gray-500">روش پرداخت:</span>
                <div className="font-medium mt-1">
                  {factor.paymentMethod === 'cheque' ? 'چک' :
                   factor.paymentMethod === 'cash' ? 'نقدی' :
                   factor.paymentMethod === 'transfer' ? 'انتقال' :
                   factor.paymentMethod}
                </div>
              </div>
              <div>
                <span className="text-gray-500">ایجاد کننده:</span>
                <div className="font-medium mt-1 truncate">
                  {getFullName(factor.creatorData.account)}
                </div>
              </div>
              <div>
                <span className="text-gray-500">شناسه اوراش:</span>
                <div className="font-medium mt-1">
                  {factor.orashFactorId || '-'}
                </div>
              </div>
            </div>
            
            {factor.tags && factor.tags.length > 0 && (
              <div className="mb-3">
                <span className="text-gray-500 text-sm">برچسب‌ها:</span>
                <div className="flex flex-wrap gap-1 mt-1 ">
                  {factor.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="flex flex-row items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-sm"
                    >
                      <Tag className="w-3 h-3 mr-2" />
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex space-x-2 space-x-reverse justify-center">
              <button
                onClick={() => handleViewInvoiceDetails(factor)}
                className="text-green-600 hover:text-green-900 p-2 rounded hover:bg-green-50 transition-colors"
                title="مشاهده جزئیات"
              >
                <Eye className="w-4 h-4" />
              </button>
              {canChangeStatus(userRole) && (
                <button
                  onClick={() => handleStatusChange(factor.id, factor.status)}
                  className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50 transition-colors"
                  title="تغییر وضعیت"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        {/* Mobile Filter Summary */}
        <div className="lg:hidden mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-800 font-medium mb-2">فیلترهای فعال:</div>
          <div className="flex flex-wrap gap-2">
            {filters.name && (
              <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                نام: {filters.name}
                <button onClick={() => clearFilter('name')} className="mr-1 text-blue-600 hover:text-blue-800">×</button>
              </span>
            )}
            {filters.status && (
              <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                وضعیت: {statusOptions.find(opt => opt.value === filters.status)?.label}
                <button onClick={() => clearFilter('status')} className="mr-1 text-blue-600 hover:text-blue-800">×</button>
              </span>
            )}
            {filters.customerId && (
              <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                مشتری: {selectedFilterCustomer ? `${selectedFilterCustomer.account.firstName} ${selectedFilterCustomer.account.lastName}` : 'انتخاب شده'}
                <button onClick={() => clearFilter('customer')} className="mr-1 text-blue-600 hover:text-blue-800">×</button>
              </span>
            )}
            {(filters.startDate || filters.endDate) && (
              <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                تاریخ: {filters.startDate || ''} تا {filters.endDate || ''}
                <button onClick={() => clearFilter('date')} className="mr-1 text-blue-600 hover:text-blue-800">×</button>
              </span>
            )}
          </div>
        </div>
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
                  <div className="mt-2 space-y-2 relative z-50">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <PersianDatePicker
                        value={convertDateForPicker(filters.startDate)}
                        onChange={(value) => {
                          const displayDate = convertDateFromPicker(value);
                          handleFilterChange('startDate', displayDate);
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
                  <div className="mt-2 relative z-50">
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
                      <div className="absolute top-full left-0 right-0 z-[60] mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
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
                  <div className="mt-2 flex items-center space-x-2 space-x-reverse relative z-50">
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
                  <div className="mt-2 flex items-center space-x-2 space-x-reverse relative z-50">
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
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {getFullName(factor.customerData.account)}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
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
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
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
                  <div className="text-sm font-medium text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">
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
                          <Tag className="w-3 h-3 ml-2" />
                          {tag.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 text-sm flex items-center">
                        <Tag className="w-3 h-3 ml-2  " />
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
      {totalCount > 0 && totalPages > 1 && (
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

export default Invoices;