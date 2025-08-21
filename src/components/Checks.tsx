import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Edit, 
  Plus, 
  Save, 
  X, 
  CreditCard, 
  User, 
  Building, 
  Calendar,
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Filter,
  DollarSign,
  Eye,
  Users
} from 'lucide-react';
import ChequeLogs from './ChequeLogs';
import PersianDatePicker from './PersianDatePicker';
import { RoleEnum } from '../types/roles';
import { formatCurrency, formatNumber, toPersianDigits, toEnglishDigits } from '../utils/numberUtils';
import { formatISODateToPersian } from '../utils/dateUtils';

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
  sayyadi:boolean;
  bankName: string;
  description: string | null;
  customerData: CustomerData;
  managerData: ManagerData;
  createdDate?: string;
}

interface CustomerRelation {
  id: string;
  customer: {
    personal: Personal;
    account: Account;
  };
}

interface Customer {
  personal: Personal;
  account: Account;
}

interface ChecksProps {
  authToken: string;
  userId: number;
  userRole: RoleEnum;
}

const Checks: React.FC<ChecksProps> = ({ authToken, userId, userRole }) => {
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [updatingSayyadiId, setUpdatingSayyadiId] = useState<string | null>(null);
  const [addForm, setAddForm] = useState<Omit<Cheque, 'id' | 'customerData' | 'managerData'>>({
    number: '',
    date: '',
    price: 0,
    customerUserId: '',
    managerUserId: '',
    status: 'created',
    bankName: '',
    description: '',
    sayyadi: false
  });
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState<Customer[]>([]);
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  const [selectedCustomerForAdd, setSelectedCustomerForAdd] = useState<Customer | null>(null);
  
  // Pagination
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filters
  const [filters, setFilters] = useState({
    number: '',
    startDate: '',
    endDate: '',
    price: '',
    status: '',
    bankName: '',
    customerId: ''
  });
  const [showFilters, setShowFilters] = useState({
    number: false,
    startDate: false,
    endDate: false,
    price: false,
    status: false,
    bankName: false,
    customer: false
  });
  
  // For sales roles - customer filtering
  const [allowedCustomerIds, setAllowedCustomerIds] = useState<string[]>([]);
  const [availableCustomers, setAvailableCustomers] = useState<any[]>([]);
  const [currentManagerId, setCurrentManagerId] = useState<string>('');

  // Customer search states
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');

  // Filter-specific customer search
  const [filterCustomerSearch, setFilterCustomerSearch] = useState('');
  const [filterCustomerResults, setFilterCustomerResults] = useState<any[]>([]);
  const [filterCustomerLoading, setFilterCustomerLoading] = useState(false);
  const [selectedFilterCustomer, setSelectedFilterCustomer] = useState<any>(null);
  const [filterCustomerTimeout, setFilterCustomerTimeout] = useState<number | null>(null);

  const [selectedChequeForLogs, setSelectedChequeForLogs] = useState<string | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://alami-b2b-api.liara.run/api';

  const statusOptions = [
    { value: 'created', label: 'ایجاد شده' },
    { value: 'passed', label: 'پاس شده' },
    { value: 'rejected', label: 'برگشت خورده' },
    { value: 'canceled', label: 'لغو شده' }
  ];

  const bankOptions = [
    { value: 'melli', label: 'بانک ملی ایران' },
    { value: 'tejarat', label: 'بانک تجارت' },
    { value: 'saderat', label: 'بانک صادرات ایران' },
    { value: 'mellat', label: 'بانک ملت' },
    { value: 'parsian', label: 'بانک پارسیان' },
    { value: 'pasargad', label: 'بانک پاسارگاد' },
    { value: 'sepah', label: 'بانک سپه' },
    { value: 'keshavarzi', label: 'بانک کشاورزی' },
    { value: 'maskan', label: 'بانک مسکن' },
    { value: 'refah', label: 'بانک رفاه کارگران' },
    { value: 'postbank', label: 'پست بانک ایران' },
    { value: 'eghtesadnovin', label: 'بانک اقتصاد نوین' },
    { value: 'saman', label: 'بانک سامان' },
    { value: 'sina', label: 'بانک سینا' },
    { value: 'karafarin', label: 'بانک کارآفرین' },
    { value: 'dey', label: 'بانک دی' },
    { value: 'shahr', label: 'بانک شهر' },
    { value: 'ayandeh', label: 'بانک آینده' },
    { value: 'ansar', label: 'بانک انصار' },
    { value: 'mehr', label: 'بانک مهر ایران' },
    { value: 'iranzamin', label: 'بانک ایران زمین' },
    { value: 'gardeshgari', label: 'بانک گردشگری' },
    { value: 'hekmat', label: 'بانک حکمت ایرانیان' },
    { value: 'middleeast', label: 'بانک خاورمیانه' },
    { value: 'noor', label: 'بانک نور' },
    { value: 'mehr_eghtesad', label: 'بانک مهر اقتصاد' },
    { value: 'resalat', label: 'بانک رسالت' }
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
    if (!dateStr || dateStr.length !== 8) return dateStr;
    return `${dateStr.slice(0, 4)}/${dateStr.slice(4, 6)}/${dateStr.slice(6, 8)}`;
  };

  const parseDate = (dateStr: string) => {
    return dateStr.replace(/\//g, '');
  };

  // Fetch allowed customers for sales roles
  const fetchAllowedCustomers = async () => {
    try {
      if (userRole === RoleEnum.MARKETER) {
        // For sales representative, get customers through customer-relation
        const response = await fetch(`${baseUrl}/customer-relation/filter`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            managerUserId: userId
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch allowed customers');
        }

        const data = await response.json();
        const relations: CustomerRelation[] = data.data.data || [];
        
        const customerIds = relations.map(rel => rel.customer.account.id);
        const customers = relations.map(rel => ({
          personal: rel.customer.personal,
          account: rel.customer.account
        }));
        
        setAllowedCustomerIds(customerIds);
        setAvailableCustomers(customers);
      } else {
        // For high-level roles and sales managers, get all customers
        const response = await fetch(`${baseUrl}/customer-user`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch customers');
        }

        const data = await response.json();
        const customers = data.data.data || [];
        
        setAvailableCustomers(customers);
      }
    } catch (err) {
      console.error('Error fetching allowed customers:', err);
    }
  };

  const fetchCheques = async () => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams({
        pageSize: pageSize.toString(),
        pageIndex: pageIndex.toString()
      });

      let response;
      
      // Check user role and determine API endpoint
      if (userRole === RoleEnum.MANAGER || userRole === RoleEnum.DEVELOPER || userRole === RoleEnum.FINANCEMANAGER|| userRole === RoleEnum.SALEMANAGER) {
        // For high-level roles, show all cheques
        const hasFilters = Object.values(filters).some(filter => filter.trim() !== '');
        
        if (hasFilters) {
          // Prepare filter data
          const filterData: any = {};
          if (filters.number.trim()) filterData.number = toEnglishDigits(filters.number.trim());
          if (filters.startDate.trim()) filterData.startDate = parseDate(toEnglishDigits(filters.startDate.trim()));
          if (filters.endDate.trim()) filterData.endDate = parseDate(toEnglishDigits(filters.endDate.trim()));
          if (filters.price.trim()) filterData.price = parseInt(toEnglishDigits(filters.price.trim())) || undefined;
          if (filters.status.trim()) filterData.status = filters.status.trim();
          if (filters.bankName.trim()) filterData.bankName = filters.bankName.trim();
          if (filters.customerId.trim()) filterData.customerUserId = filters.customerId.trim();
          
          response = await fetch(`${baseUrl}/cheque/filter?${queryParams}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify(filterData),
          });
        } else {
          response = await fetch(`${baseUrl}/cheque?${queryParams}`, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
            },
          });
        }
      } else {
        // For sales roles, filter by allowed customers
        if (allowedCustomerIds.length === 0) {
          setCheques([]);
          setTotalCount(0);
          setTotalPages(0);
          setLoading(false);
          return;
        }

        const filterData: any = {
          customerUserId: allowedCustomerIds
        };

        // Add other filters
        if (filters.number.trim()) filterData.number = toEnglishDigits(filters.number.trim());
        if (filters.startDate.trim()) filterData.startDate = parseDate(toEnglishDigits(filters.startDate.trim()));
        if (filters.endDate.trim()) filterData.endDate = parseDate(toEnglishDigits(filters.endDate.trim()));
        if (filters.price.trim()) filterData.price = parseInt(toEnglishDigits(filters.price.trim())) || undefined;
        if (filters.status.trim()) filterData.status = filters.status.trim();
        if (filters.bankName.trim()) filterData.bankName = filters.bankName.trim();
        if (filters.customerId.trim()) filterData.customerUserId = filters.customerId.trim();

        response = await fetch(`${baseUrl}/cheque/filter?${queryParams}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify(filterData),
        });
      }

      if (!response.ok) {
        throw new Error('Failed to fetch cheques');
      }

      const data = await response.json();
      
      // Set total count and calculate total pages
      const count = data.data?.details?.count || data.data?.total || 0;
      setTotalCount(count);
      setTotalPages(Math.ceil(count / pageSize));
      
      setCheques(data.data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cheques');
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate();

  const handleEdit = (chequeId: string) => {
    navigate(`/admin/checks/${chequeId}/edit`);
  };

  const handleToggleSayyadi = async (checkId: string, currentStatus: boolean) => {
    setUpdatingSayyadiId(checkId);
    try {
      const response = await fetch(`${baseUrl}/cheque/${checkId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          sayyadi: currentStatus,
          creatorUserId:userId
        }),
      });

      if (response.ok) {
        await fetchCheques();
      } else {
        console.error('Failed to update sayyadi status');
      }
    } catch (error) {
      console.error('Error updating sayyadi status:', error);
    } finally {
      setUpdatingSayyadiId(null);
    }
  };

  const handleAdd = async () => {
    if (!addForm.number || !addForm.date || !addForm.customerUserId) return;

    try {
      const createData = {
        ...addForm,
        creatorUserId:userId,
        date: parseDate(addForm.date),
        description: addForm.description || null
      };

      const response = await fetch(`${baseUrl}/cheque`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(createData),
      });

      if (!response.ok) {
        throw new Error('Failed to create cheque');
      }

      await fetchCheques();
      setShowAddForm(false);
      setAddForm({
        number: '',
        date: '',
        price: 0,
        customerUserId: '',
        managerUserId: userId.toString(),
        status: 'created',
        bankName: '',
        description: '',
        sayyadi: false
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create cheque');
    }
  };

  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFilterSubmit = (field: keyof typeof filters) => {
    setPageIndex(0);
    fetchCheques();
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
    fetchCheques();
  };

  const clearAllFilters = () => {
    setFilters({
      number: '',
      startDate: '',
      endDate: '',
      price: '',
      status: '',
      bankName: '',
      customerId: ''
    });
    setPageIndex(0);
  };

  const hasActiveFilters = Object.values(filters).some(filter => filter.trim() !== '');

  const handlePageChange = (newPageIndex: number) => {
    if (newPageIndex >= 0 && newPageIndex < totalPages) {
      setPageIndex(newPageIndex);
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPageIndex(0);
  };

  const getCustomerName = (customerData: CustomerData) => {
    return `${customerData.account.firstName}${customerData.account.lastName ? ` ${customerData.account.lastName}` : ''}`;
  };

  const getCustomerNameFromCustomer = (customer: Customer) => {
    return `${customer.account.firstName}${customer.account.lastName ? ` ${customer.account.lastName}` : ''}`;
  };

  const getManagerName = (managerData: ManagerData) => {
    return `${managerData.firstName}${managerData.lastName ? ` ${managerData.lastName}` : ''}`;
  };

  const searchCustomers = async (query: string) => {
    if (!query.trim()) {
      setCustomerSearchResults([]);
      return;
    }

    try {
      setCustomerSearchLoading(true);
      
      let response;
      
      if (userRole === RoleEnum.MARKETER) {
        // For sales representative, search in their assigned customers
        const filterData = {
          managerUserId: userId,
          lastName: query.trim()
        };
        
        response = await fetch(`${baseUrl}/customer-relation/filter?pageSize=20&pageIndex=0`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify(filterData),
        });
        
        if (response.ok) {
          const data = await response.json();
          const customers = (data.data.data || []).map((rel: any) => rel.customer);
          setCustomerSearchResults(customers);
        }
      } else {
        // For high-level roles and sales managers, search all customers
        const filterData = {
          lastName: query.trim()
        };
        
        response = await fetch(`${baseUrl}/customer-user/filter?pageSize=20&pageIndex=0`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify(filterData),
        });
        
        if (response.ok) {
          const data = await response.json();
          setCustomerSearchResults(data.data.data || []);
        }
      }
    } catch (err) {
      console.error('Error searching customers:', err);
    } finally {
      setCustomerSearchLoading(false);
    }
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

      if (userRole === RoleEnum.MANAGER || userRole === RoleEnum.DEVELOPER || userRole === RoleEnum.FINANCEMANAGER || userRole === RoleEnum.SALEMANAGER) {
        // Search all customers
        const filterData = {
          lastName: query.trim()
        };
        
        const response = await fetch(`${baseUrl}/customer-user/filter?pageSize=10&pageIndex=0`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify(filterData),
        });
        
        if (response.ok) {
          const data = await response.json();
          customers = data.data.data || [];
        }
      } else if (userRole === RoleEnum.MARKETER) {
        // Search only assigned customers
        const filterData = {
          managerUserId: userId,
          lastName: query.trim()
        };
        
        const response = await fetch(`${baseUrl}/customer-relation/filter?pageSize=10&pageIndex=0`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify(filterData),
        });
        
        if (response.ok) {
          const data = await response.json();
          customers = (data.data.data || []).map((rel: any) => rel.customer);
        }
      }

      setFilterCustomerResults(customers);
    } catch (err) {
      console.error('Error searching filter customers:', err);
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

  const selectCustomer = (customer: any, isEdit = false) => {
    const customerName = `${customer.account.firstName}${customer.account.lastName ? ` ${customer.account.lastName}` : ''}`;
    
    if (!isEdit) {
      setAddForm({ ...addForm, customerUserId: customer.account.id });
      setCustomerSearchQuery(customerName);
      setShowCustomerSearch(false);
      setCustomerSearchResults([]);
    }
  };

  const fetchCurrentManagerId = async () => {
    try {
      const response = await fetch(`${baseUrl}/manager-user/filter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const data = await response.json();
        const managerData = data.data.data?.[0];
        if (managerData) {
          setCurrentManagerId(managerData.id);
          setAddForm(prev => ({ ...prev, managerUserId: managerData.id }));
        }
      }
    } catch (err) {
      console.error('Error fetching manager ID:', err);
    }
  };

  const handleOpenCustomerModal = () => {
    setScrollPosition(window.pageYOffset || document.documentElement.scrollTop);
    setShowCustomerModal(true);
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomerForAdd(customer);
    setAddForm({ ...addForm, customerUserId: customer.account.id });
    setShowCustomerModal(false);
    // Restore scroll position after customer selection
    setTimeout(() => {
      window.scrollTo({ top: scrollPosition, behavior: 'smooth' });
    }, 100);
  };

  const handleCustomerSearch = (query: string) => {
    setCustomerSearchTerm(query);
    searchCustomers(query);
  };



  useEffect(() => {
    const initializeData = async () => {
      await fetchAllowedCustomers();
      await fetchCurrentManagerId();
    };
    
    initializeData();
  }, [userRole, userId]);

  useEffect(() => {
    if (userRole === RoleEnum.MANAGER || userRole === RoleEnum.DEVELOPER || userRole === RoleEnum.FINANCEMANAGER || userRole === RoleEnum.SALEMANAGER) {
      fetchCheques();
    } else if (userRole === RoleEnum.MARKETER) {
      // For sales representative, always call fetchCheques - it will handle empty customer list
      fetchCheques();
    }
  }, [pageIndex, pageSize, filters, allowedCustomerIds]);

  // Clear filter customer timeout on unmount
  useEffect(() => {
    return () => {
      if (filterCustomerTimeout) {
        clearTimeout(filterCustomerTimeout);
      }
    };
  }, [filterCustomerTimeout]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.relative')) {
        setShowCustomerSearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    <div className="glass-effect rounded-2xl shadow-modern-lg p-4 lg:p-8 border border-white/20 animate-fade-in h-full">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 space-y-4 lg:space-y-0">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl lg:text-2xl font-bold gradient-text">مدیریت چک‌ها</h2>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 space-x-reverse">
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="px-3 py-2 text-sm bg-gradient-to-r from-red-500/10 to-red-600/10 text-red-700 rounded-xl hover:from-red-500/20 hover:to-red-600/20 transition-all duration-200 flex items-center space-x-1 space-x-reverse border border-red-200 shadow-md hover:shadow-lg w-full sm:w-auto justify-center"
            >
              <X className="w-4 h-4" />
              <span>پاک کردن فیلترها</span>
            </button>
          )}
          <div className="mobile-text text-gray-500 bg-white/80 px-3 py-2 rounded-xl backdrop-blur-sm">
            تعداد کل: {toPersianDigits(totalCount)}
          </div>
          <div className="flex items-center space-x-2 space-x-reverse w-full sm:w-auto justify-center sm:justify-start">
            <label className="mobile-text text-gray-700 hidden sm:inline">تعداد در صفحه:</label>
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
            className="btn-primary flex items-center space-x-2 space-x-reverse w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن چک جدید</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-200 rounded-xl shadow-lg animate-slide-up">
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
              <X className="w-3 h-3 text-white" />
            </div>
            <p className="text-red-700 font-medium text-sm lg:text-base">{error}</p>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="mb-8 p-4 lg:p-6 glass-effect rounded-2xl border border-white/20 shadow-modern animate-slide-up">
          <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2 space-x-reverse">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <span>افزودن چک جدید</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">شماره چک</label>
              <input
                type="text"
                value={toPersianDigits(addForm.number)}
                onChange={(e) => setAddForm({ ...addForm, number: toEnglishDigits(e.target.value) })}
                className="input-modern"
                placeholder="شماره چک"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">تاریخ</label>
              <PersianDatePicker
                value={addForm.date}
                onChange={(value) => setAddForm({ ...addForm, date: value })}
                placeholder="انتخاب تاریخ چک"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm shadow-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">مبلغ</label>
              <input
                type="text"
                value={toPersianDigits(addForm.price.toString())}
                onChange={(e) => setAddForm({ ...addForm, price: parseInt(toEnglishDigits(e.target.value)) || 0 })}
                className="input-modern"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">مشتری</label>
              <div className="relative">
                <input
                  type="text"
                  value={selectedCustomerForAdd ? `${selectedCustomerForAdd.account.firstName} ${selectedCustomerForAdd.account.lastName || ''}` : ''}
                  onClick={handleOpenCustomerModal}
                  readOnly
                  className="input-modern pr-12 cursor-pointer"
                  placeholder="انتخاب مشتری..."
                  required
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Search className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">بانک</label>
              <select
                value={addForm.bankName}
                onChange={(e) => setAddForm({ ...addForm, bankName: e.target.value })}
                className="input-modern"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">وضعیت</label>
              <select
                value={addForm.status}
                onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
                className="input-modern"
              >
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">توضیحات</label>
              <textarea
                value={addForm.description || ''}
                onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                className="input-modern"
                placeholder="توضیحات"
                rows={3}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 space-x-0 sm:space-x-2 space-x-reverse">
            <button
              onClick={handleAdd}
              className="btn-success flex items-center space-x-2 space-x-reverse justify-center"
            >
              <Save className="w-4 h-4" />
              <span>ذخیره</span>
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setAddForm({
                  number: '',
                  date: '',
                  price: 0,
                  customerUserId: '',
                  managerUserId: currentManagerId,
                  status: 'created',
                  bankName: '',
                  description: '',
                  sayyadi: false
                });
                setCustomerSearchQuery('');
                setCustomerSearchResults([]);
                setShowCustomerSearch(false);
              }}
              className="btn-secondary flex items-center space-x-2 space-x-reverse justify-center"
            >
              <X className="w-4 h-4" />
              <span>انصراف</span>
            </button>
          </div>
        </div>
      )}

      {/* Customer Selection Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] animate-fade-in">
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 glass-effect rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden border border-white/20 animate-scale-in">
            <div className="p-4 lg:p-6 border-b border-white/20">
              <div className="flex items-center justify-between">
                <h3 className="text-lg lg:text-xl font-bold gradient-text flex items-center space-x-2 space-x-reverse">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <span>انتخاب مشتری</span>
                </h3>
                <button
                  onClick={() => setShowCustomerModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Search Input */}
              <div className="mt-4">
                <div className="relative">
                  <input
                    type="text"
                    value={customerSearchTerm}
                    onChange={(e) => handleCustomerSearch(e.target.value)}
                    className="input-modern pr-12"
                    placeholder="جستجو بر اساس نام خانوادگی..."
                    autoFocus
                  />
                  <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Customer List */}
            <div className="p-4 lg:p-6 overflow-y-auto max-h-96">
              {customerSearchLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-gray-500 mt-2">در حال جستجو...</p>
                </div>
              ) : customerSearchResults.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">هیچ مشتری یافت نشد</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {customerSearchResults.map((customer) => (
                    <div
                      key={customer.account.id}
                      onClick={() => {
                        handleSelectCustomer(customer);
                        // Scroll to top of page after customer selection
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="p-4 bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl hover:bg-white/80 cursor-pointer transition-all duration-200 hover:shadow-lg transform hover:scale-[1.02]"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">
                            {customer.account.firstName} {customer.account.lastName || ''}
                          </div>
                          <div className="text-sm text-gray-500">
                            کد ملی: {toPersianDigits(customer.account.nationalCode)} | 
                            شهر: {customer.account.city || 'نامشخص'}
                          </div>
                        </div>
                        <div className="text-blue-600">
                          <ChevronLeft className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto hidden lg:block">
        <table className="table-modern">
          <thead>
            <tr className="table-header">
              <th className="px-4 lg:px-6 py-3 lg:py-4 text-right text-xs lg:text-sm font-bold text-gray-700">
                <div className="flex items-center justify-between">
                  <span>شماره چک</span>
                  <button
                    onClick={() => setShowFilters(prev => ({ ...prev, number: !prev.number }))}
                    className={`p-2 rounded-xl hover:bg-white/20 transition-all duration-200 ${filters.number ? 'text-blue-600 bg-blue-100' : 'text-gray-400'}`}
                    title="فیلتر بر اساس شماره چک"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
                {showFilters.number && (
                  <div className="mt-2 flex items-center space-x-2 space-x-reverse">
                    <input
                      type="text"
                      value={toPersianDigits(filters.number)}
                      onChange={(e) => {
                        const persianValue = e.target.value;
                        const englishValue = toEnglishDigits(persianValue);
                        handleFilterChange('number', englishValue);
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && handleFilterSubmit('number')}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                      placeholder="شماره چک..."
                      autoFocus
                      dir="ltr"
                    />
                    <button
                      onClick={() => handleFilterSubmit('number')}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-xl transition-all duration-200"
                      title="اعمال فیلتر"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                    {filters.number && (
                      <button
                        onClick={() => clearFilter('number')}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-xl transition-all duration-200"
                        title="پاک کردن فیلتر"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </th>
              <th className="px-4 lg:px-6 py-3 lg:py-4 text-right text-xs lg:text-sm font-bold text-gray-700">
                <div className="flex items-center justify-between">
                  <span>تاریخ سررسید چک</span>
                  <button
                    onClick={() => setShowFilters(prev => ({ ...prev, startDate: !prev.startDate }))}
                    className={`p-2 rounded-xl hover:bg-white/20 transition-all duration-200 ${filters.startDate || filters.endDate ? 'text-blue-600 bg-blue-100' : 'text-gray-400'}`}
                    title="فیلتر بر اساس بازه تاریخ"
                  >
                    <Calendar className="w-4 h-4" />
                  </button>
                </div>
                {showFilters.startDate && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">از تاریخ:</label>
                        <PersianDatePicker
                          value={filters.startDate}
                          onChange={(value) => handleFilterChange('startDate', value)}
                          placeholder="انتخاب تاریخ شروع"
                          className="w-full text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">تا تاریخ:</label>
                        <PersianDatePicker
                          value={filters.endDate}
                          onChange={(value) => handleFilterChange('endDate', value)}
                          placeholder="انتخاب تاریخ پایان"
                          className="w-full text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <button
                            onClick={() => handleFilterSubmit('startDate')}
                            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1 space-x-reverse"
                            title="اعمال فیلتر"
                          >
                            <Search className="w-3 h-3" />
                            <span>اعمال</span>
                          </button>
                          {(filters.startDate || filters.endDate) && (
                            <button
                              onClick={() => {
                                clearFilter('startDate');
                                clearFilter('endDate');
                              }}
                              className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-1 space-x-reverse"
                              title="پاک کردن فیلتر"
                            >
                              <X className="w-3 h-3" />
                              <span>پاک کردن</span>
                            </button>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {filters.startDate && filters.endDate ? 'فیلتر فعال' : 'انتخاب بازه تاریخ'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </th>
              <th className="px-4 lg:px-6 py-3 lg:py-4 text-right text-xs lg:text-sm font-bold text-gray-700">
                <div className="flex items-center justify-between">
                  <span>مبلغ</span>
                  <button
                    onClick={() => setShowFilters(prev => ({ ...prev, price: !prev.price }))}
                    className={`p-2 rounded-xl hover:bg-white/20 transition-all duration-200 ${filters.price ? 'text-blue-600 bg-blue-100' : 'text-gray-400'}`}
                    title="فیلتر بر اساس مبلغ"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
                {showFilters.price && (
                  <div className="mt-2 flex items-center space-x-2 space-x-reverse">
                    <input
                      type="text"
                      value={toPersianDigits(filters.price)}
                      onChange={(e) => {
                        const persianValue = e.target.value;
                        const englishValue = toEnglishDigits(persianValue);
                        handleFilterChange('price', englishValue);
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && handleFilterSubmit('price')}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="مبلغ..."
                      autoFocus
                      dir="ltr"
                    />
                    <button
                      onClick={() => handleFilterSubmit('price')}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="اعمال فیلتر"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                    {filters.price && (
                      <button
                        onClick={() => clearFilter('price')}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="پاک کردن فیلتر"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </th>
              <th className="px-4 lg:px-6 py-3 lg:py-4 text-right text-xs lg:text-sm font-bold text-gray-700">
                <div className="flex items-center justify-between">
                  <span>مشتری</span>
                  <button
                    onClick={() => setShowFilters(prev => ({ ...prev, customer: !prev.customer }))}
                    className={`p-2 rounded-xl hover:bg-white/20 transition-all duration-200 ${filters.customerId ? 'text-blue-600 bg-blue-100' : 'text-gray-400'}`}
                    title="فیلتر بر اساس مشتری"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
                {showFilters.customer && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">مشتری</label>
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
                              onClick={() => clearFilter('customerId')}
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
                                    setFilters(prev => ({ ...prev, customerId: customer.account.id }));
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
                      
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <button
                            onClick={() => handleFilterSubmit('customerId')}
                            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1 space-x-reverse"
                            title="اعمال فیلتر"
                          >
                            <Search className="w-3 h-3" />
                            <span>اعمال</span>
                          </button>
                          {filters.customerId && (
                            <button
                              onClick={() => {
                                clearFilter('customerId');
                                setSelectedFilterCustomer(null);
                                setFilterCustomerSearch('');
                              }}
                              className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-1 space-x-reverse"
                              title="پاک کردن فیلتر"
                            >
                              <X className="w-3 h-3" />
                              <span>پاک کردن</span>
                            </button>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {filters.customerId ? 'فیلتر فعال' : 'انتخاب مشتری'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </th>
              <th className="px-4 lg:px-6 py-3 lg:py-4 text-right text-xs lg:text-sm font-bold text-gray-700 hidden">مدیر</th>
              <th className="px-4 lg:px-6 py-3 lg:py-4 text-right text-xs lg:text-sm font-bold text-gray-700 hidden">تاریخ ایجاد</th>
              <th className="px-4 lg:px-6 py-3 lg:py-4 text-right text-xs lg:text-sm font-bold text-gray-700">
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
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">همه وضعیت‌ها</option>
                      {statusOptions.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
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
              <th className="px-4 lg:px-6 py-3 lg:py-4 text-right text-xs lg:text-sm font-bold text-gray-700 hidden lg:table-cell">
                <div className="flex items-center justify-between">
                  <span>بانک</span>
                  <button
                    onClick={() => setShowFilters(prev => ({ ...prev, bankName: !prev.bankName }))}
                    className={`p-2 rounded-xl hover:bg-white/20 transition-all duration-200 ${filters.bankName ? 'text-blue-600 bg-blue-100' : 'text-gray-400'}`}
                    title="فیلتر بر اساس بانک"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
                {showFilters.bankName && (
                  <div className="mt-2 flex items-center space-x-2 space-x-reverse">
                    <select
                      value={filters.bankName}
                      onChange={(e) => handleFilterChange('bankName', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">همه بانک‌ها</option>
                      {bankOptions.map((bank) => (
                        <option key={bank.value} value={bank.value}>
                          {bank.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleFilterSubmit('bankName')}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="اعمال فیلتر"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                    {filters.bankName && (
                      <button
                        onClick={() => clearFilter('bankName')}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="پاک کردن فیلتر"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </th>
              <th className="px-4 lg:px-6 py-3 lg:py-4 text-right text-xs lg:text-sm font-bold text-gray-700 hidden">توضیحات</th>
              <th className="px-4 lg:px-6 py-3 lg:py-4 text-right text-xs lg:text-sm font-bold text-gray-700">وضعیت صیادی</th>
              <th className="px-4 lg:px-6 py-3 lg:py-4 text-right text-xs lg:text-sm font-bold text-gray-700">عملیات</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cheques.map((cheque) => (
              <tr key={cheque.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 lg:px-6 py-4">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                        <CreditCard className="h-3 w-3 md:h-5 md:w-5 text-white" />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs md:text-sm font-medium text-gray-900">{toPersianDigits(cheque.number)}</div>
                      {/* <div className="text-xs text-gray-500">ID: {cheque.id.slice(0, 8)}...</div> */}
                    </div>
                  </div>
                </td>
                <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                  <div className="text-xs md:text-sm text-gray-900">
                    {toPersianDigits(formatDate(cheque.date))}
                  </div>
                </td>
                <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                  <div className="text-xs md:text-sm text-gray-900">
                    {formatCurrency(cheque.price)} ریال
                  </div>
                </td>
                <td className="px-4 lg:px-6 py-4">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <div className="flex-shrink-0">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <User className="h-3 w-3 text-white" />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs md:text-sm font-medium text-gray-900">
                        {getCustomerName(cheque.customerData)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {cheque.customerData.account.city}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 lg:px-6 py-4 hidden">
                  <div className="text-xs md:text-sm text-gray-900">
                    {getManagerName(cheque.managerData)}
                  </div>
                </td>
                <td className="px-4 lg:px-6 py-4 whitespace-nowrap hidden">
                  <div className="text-sm text-gray-900">
                    {cheque.createdDate ? toPersianDigits(formatISODateToPersian(cheque.createdDate)) : '-'}
                  </div>
                </td>
                <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    cheque.status === 'created' ? 'bg-gray-100 text-gray-800' :
                    cheque.status === 'passed' ? 'bg-green-100 text-green-800' :
                    cheque.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    cheque.status === 'canceled' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {getStatusLabel(cheque.status)}
                  </span>
                </td>
                <td className="px-4 lg:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    <Building className="w-3 h-3 mr-1" />
                    {getBankLabel(cheque.bankName)}
                  </span>
                </td>
                <td className="px-4 lg:px-6 py-4 hidden">
                  <div className="text-xs md:text-sm text-gray-900 max-w-xs truncate">
                    {cheque.description || '-'}
                  </div>
                </td>

                <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cheque.sayyadi || false}
                        onChange={() => handleToggleSayyadi(cheque.id, !(cheque.sayyadi || false))}
                        disabled={updatingSayyadiId === cheque.id}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
                      {updatingSayyadiId === cheque.id && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                    </label>
                  </div>
                </td>

                <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2 space-x-reverse">
                    <button
                      onClick={() => setSelectedChequeForLogs(cheque.id)}
                      className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                      title="مشاهده تاریخچه"
                    >
                      <Eye className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(cheque.id)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                      title="ویرایش"
                    >
                      <Edit className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {cheques.length === 0 && !loading && (
          <div className="text-center py-8">
            <div className="text-gray-500 text-lg mb-2">هیچ چکی یافت نشد</div>
            {userRole === RoleEnum.MARKETER && allowedCustomerIds.length === 0 ? (
              <p className="text-gray-400 text-sm">هیچ مشتری به شما اختصاص داده نشده است. برای مشاهده چک‌ها ابتدا باید مشتری به شما تخصیص یابد.</p>
            ) : (
              <p className="text-gray-400 text-sm">چک‌های سیستم در اینجا نمایش داده می‌شوند</p>
            )}
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-4 mt-6">
        {cheques.map((cheque) => (
          <div key={cheque.id} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-gray-100">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm leading-tight">
                    چک شماره {toPersianDigits(cheque.number)}
                  </h3>
                  <p className="text-gray-500 text-xs mt-1">
                    {getCustomerName(cheque.customerData)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <button
                  onClick={() => setSelectedChequeForLogs(cheque.id)}
                  className="text-purple-600 hover:text-purple-900 p-2 rounded-lg hover:bg-purple-50 transition-colors"
                  title="مشاهده لاگ‌ها"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEdit(cheque.id)}
                  className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                  title="ویرایش"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500 text-xs mb-1">مبلغ</div>
                <div className="font-bold text-gray-900">{formatCurrency(cheque.price)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500 text-xs mb-1">تاریخ</div>
                <div className="font-bold text-gray-900">{formatDate(cheque.date)}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500 text-xs mb-1">بانک</div>
                <div className="font-bold text-gray-900">{getBankLabel(cheque.bankName)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500 text-xs mb-1">وضعیت</div>
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    cheque.status === 'created' ? 'bg-blue-100 text-blue-800' :
                    cheque.status === 'paid' ? 'bg-green-100 text-green-800' :
                    cheque.status === 'returned' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {getStatusLabel(cheque.status)}
                  </span>
                  {cheque.sayyadi && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      صیادی
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <span className="text-gray-500 text-xs hidden">
                مدیر: {getManagerName(cheque.managerData)}
              </span>
              {cheque.description && (
                <span className="text-gray-400 text-xs max-w-[150px] truncate hidden" title={cheque.description}>
                  {cheque.description}
                </span>
              )}
            </div>
          </div>
        ))}
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
              className="px-2 md:px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 space-x-reverse"
            >
              <span className="hidden md:inline">بعدی</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Cheque Logs Modal */}
      {selectedChequeForLogs && (
        <ChequeLogs
          authToken={authToken}
          chequeId={selectedChequeForLogs}
          onClose={() => setSelectedChequeForLogs(null)}
          onError={setError}
        />
      )}
    </div>
  );
};

export default Checks;