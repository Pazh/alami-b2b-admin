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
  Eye
} from 'lucide-react';
import ChequeLogs from './ChequeLogs';
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
    customerName: ''
  });
  const [showFilters, setShowFilters] = useState({
    number: false,
    startDate: false,
    endDate: false,
    price: false,
    status: false,
    bankName: false,
    customerName: false
  });
  
  // For sales roles - customer filtering
  const [allowedCustomerIds, setAllowedCustomerIds] = useState<string[]>([]);
  const [availableCustomers, setAvailableCustomers] = useState<any[]>([]);
  const [currentManagerId, setCurrentManagerId] = useState<string>('');

  // Customer search states
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');

  const [selectedChequeForLogs, setSelectedChequeForLogs] = useState<string | null>(null);

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
      if (userRole === RoleEnum.SALEMANAGER || userRole === RoleEnum.MARKETER) {
        // For sales roles, get customers through customer-relation
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
        // For high-level roles, get all customers
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
          if (filters.number.trim()) filterData.number = filters.number.trim();
          if (filters.startDate.trim()) filterData.startDate = parseDate(toEnglishDigits(filters.startDate.trim()));
          if (filters.endDate.trim()) filterData.endDate = parseDate(toEnglishDigits(filters.endDate.trim()));
          if (filters.price.trim()) filterData.price = parseInt(toEnglishDigits(filters.price.trim())) || undefined;
          if (filters.status.trim()) filterData.status = filters.status.trim();
          if (filters.bankName.trim()) filterData.bankName = filters.bankName.trim();
          
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
        if (filters.number.trim()) filterData.number = filters.number.trim();
        if (filters.startDate.trim()) filterData.startDate = parseDate(toEnglishDigits(filters.startDate.trim()));
        if (filters.endDate.trim()) filterData.endDate = parseDate(toEnglishDigits(filters.endDate.trim()));
        if (filters.price.trim()) filterData.price = parseInt(toEnglishDigits(filters.price.trim())) || undefined;
        if (filters.status.trim()) filterData.status = filters.status.trim();
        if (filters.bankName.trim()) filterData.bankName = filters.bankName.trim();

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
      const count = data.data?.details?.count || 0;
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
      customerName: ''
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
      
      if (userRole === RoleEnum.SALEMANAGER || userRole === RoleEnum.MARKETER) {
        // For sales roles, search in their customers
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
        // For high-level roles, search all customers
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
    setShowCustomerModal(true);
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomerForAdd(customer);
    setAddForm({ ...addForm, customerUserId: customer.account.id });
    setShowCustomerModal(false);
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
    if (userRole === RoleEnum.MANAGER || userRole === RoleEnum.DEVELOPER || userRole === RoleEnum.FINANCEMANAGER) {
      fetchCheques();
    } else if (userRole === RoleEnum.SALEMANAGER || userRole === RoleEnum.MARKETER) {
      // For sales roles, always call fetchCheques - it will handle empty customer list
      fetchCheques();
    }
  }, [pageIndex, pageSize, filters, allowedCustomerIds]);

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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">مدیریت چک‌ها</h2>
        <div className="flex items-center space-x-4 space-x-reverse">
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors flex items-center space-x-1 space-x-reverse"
            >
              <X className="w-4 h-4" />
              <span>پاک کردن فیلترها</span>
            </button>
          )}
          <div className="text-sm text-gray-500">
            تعداد کل: {toPersianDigits(totalCount)}
          </div>
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
            <span>افزودن چک جدید</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">افزودن چک جدید</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">شماره چک</label>
              <input
                type="text"
                value={toPersianDigits(addForm.number)}
                onChange={(e) => setAddForm({ ...addForm, number: toEnglishDigits(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="شماره چک"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ (YYYY/MM/DD)</label>
              <input
                type="text"
                value={toPersianDigits(addForm.date)}
                onChange={(e) => setAddForm({ ...addForm, date: toEnglishDigits(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1403/12/01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">مبلغ</label>
              <input
                type="text"
                value={toPersianDigits(addForm.price.toString())}
                onChange={(e) => setAddForm({ ...addForm, price: parseInt(toEnglishDigits(e.target.value)) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">مشتری</label>
              <div className="relative">
                <input
                  type="text"
                  value={selectedCustomerForAdd ? `${selectedCustomerForAdd.account.firstName} ${selectedCustomerForAdd.account.lastName || ''}` : ''}
                  onClick={handleOpenCustomerModal}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                  placeholder="انتخاب مشتری..."
                  required
                />
                <button
                  type="button"
                  onClick={handleOpenCustomerModal}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">بانک</label>
              <select
                value={addForm.bankName}
                onChange={(e) => setAddForm({ ...addForm, bankName: e.target.value })}
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
                value={addForm.status}
                onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات</label>
              <textarea
                value={addForm.description || ''}
                onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="توضیحات"
                rows={3}
              />
            </div>
          </div>
          <div className="flex space-x-2 space-x-reverse">
            <button
              onClick={handleAdd}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center space-x-2 space-x-reverse transition-colors"
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
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md flex items-center space-x-2 space-x-reverse transition-colors"
            >
              <X className="w-4 h-4" />
              <span>انصراف</span>
            </button>
          </div>
        </div>
      )}

      {/* Customer Selection Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">انتخاب مشتری</h3>
              <button
                onClick={() => setShowCustomerModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Search Input */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={customerSearchTerm}
                  onChange={(e) => handleCustomerSearch(e.target.value)}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="جستجو بر اساس نام خانوادگی..."
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
            </div>

            {/* Customer List */}
            <div className="overflow-y-auto max-h-96">
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
                      onClick={() => handleSelectCustomer(customer)}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-colors"
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

      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center justify-between">
                  <span>شماره چک</span>
                  <button
                    onClick={() => setShowFilters(prev => ({ ...prev, number: !prev.number }))}
                    className={`p-1 rounded hover:bg-gray-200 transition-colors ${filters.number ? 'text-blue-600' : 'text-gray-400'}`}
                    title="فیلتر بر اساس شماره چک"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
                {showFilters.number && (
                  <div className="mt-2 flex items-center space-x-2 space-x-reverse">
                    <input
                      type="text"
                      value={filters.number}
                      onChange={(e) => handleFilterChange('number', e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleFilterSubmit('number')}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="شماره چک..."
                      autoFocus
                    />
                    <button
                      onClick={() => handleFilterSubmit('number')}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="اعمال فیلتر"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                    {filters.number && (
                      <button
                        onClick={() => clearFilter('number')}
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
                  <span>بازه تاریخ</span>
                  <button
                    onClick={() => setShowFilters(prev => ({ ...prev, startDate: !prev.startDate }))}
                    className={`p-1 rounded hover:bg-gray-200 transition-colors ${filters.startDate || filters.endDate ? 'text-blue-600' : 'text-gray-400'}`}
                    title="فیلتر بر اساس تاریخ"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
                {showFilters.startDate && (
                  <div className="mt-2 space-y-2">
                    <input
                      type="text"
                      value={filters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="از تاریخ (1403/01/01)"
                    />
                    <input
                      type="text"
                      value={filters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="تا تاریخ (1403/12/29)"
                    />
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleFilterSubmit('startDate')}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="اعمال فیلتر"
                      >
                        <Search className="w-4 h-4" />
                      </button>
                      {(filters.startDate || filters.endDate) && (
                        <button
                          onClick={() => {
                            clearFilter('startDate');
                            clearFilter('endDate');
                          }}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="پاک کردن فیلتر"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center justify-between">
                  <span>مبلغ</span>
                  <button
                    onClick={() => setShowFilters(prev => ({ ...prev, price: !prev.price }))}
                    className={`p-1 rounded hover:bg-gray-200 transition-colors ${filters.price ? 'text-blue-600' : 'text-gray-400'}`}
                    title="فیلتر بر اساس مبلغ"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
                {showFilters.price && (
                  <div className="mt-2 flex items-center space-x-2 space-x-reverse">
                    <input
                      type="number"
                      value={filters.price}
                      onChange={(e) => handleFilterChange('price', e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleFilterSubmit('price')}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="مبلغ..."
                      autoFocus
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
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">مشتری</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">مدیر</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاریخ ایجاد</th>
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
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                <div className="flex items-center justify-between">
                  <span>بانک</span>
                  <button
                    onClick={() => setShowFilters(prev => ({ ...prev, bankName: !prev.bankName }))}
                    className={`p-1 rounded hover:bg-gray-200 transition-colors ${filters.bankName ? 'text-blue-600' : 'text-gray-400'}`}
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
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">توضیحات</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">وضعیت صیادی</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عملیات</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cheques.map((cheque) => (
              <tr key={cheque.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                        <CreditCard className="h-3 w-3 md:h-5 md:w-5 text-white" />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs md:text-sm font-medium text-gray-900">{toPersianDigits(cheque.number)}</div>
                      <div className="text-xs text-gray-500">ID: {cheque.id.slice(0, 8)}...</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-xs md:text-sm text-gray-900">
                    {toPersianDigits(formatDate(cheque.date))}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-xs md:text-sm text-gray-900">
                    {formatCurrency(cheque.price)} ریال
                  </div>
                </td>
                <td className="px-4 py-4">
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
                <td className="px-4 py-4 hidden md:table-cell">
                  <div className="text-xs md:text-sm text-gray-900">
                    {getManagerName(cheque.managerData)}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {cheque.createdDate ? toPersianDigits(formatISODateToPersian(cheque.createdDate)) : '-'}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
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
                <td className="px-4 py-4 whitespace-nowrap hidden lg:table-cell">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    <Building className="w-3 h-3 mr-1" />
                    {getBankLabel(cheque.bankName)}
                  </span>
                </td>
                <td className="px-4 py-4 hidden xl:table-cell">
                  <div className="text-xs md:text-sm text-gray-900 max-w-xs truncate">
                    {cheque.description || '-'}
                  </div>
                </td>

                <td className="px-4 py-4 whitespace-nowrap">
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

                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
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
            {(userRole === RoleEnum.SALEMANAGER || userRole === RoleEnum.MARKETER) && allowedCustomerIds.length === 0 ? (
              <p className="text-gray-400 text-sm">هیچ مشتری به شما اختصاص داده نشده است. برای مشاهده چک‌ها ابتدا باید مشتری به شما تخصیص یابد.</p>
            ) : (
              <p className="text-gray-400 text-sm">چک‌های سیستم در اینجا نمایش داده می‌شوند</p>
            )}
          </div>
        )}
      </div>



      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="text-sm text-gray-700">
            نمایش {toPersianDigits(pageIndex * pageSize + 1)} تا {toPersianDigits(Math.min((pageIndex + 1) * pageSize, totalCount))} از {toPersianDigits(totalCount)} چک
          </div>
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