import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Building, CreditCard, MapPin, Calendar, Edit, Save, X, Eye, FileText, TrendingUp, Receipt, Clock, DollarSign, Tag } from 'lucide-react';
import { RoleEnum } from '../types/roles';
import { formatCurrency, toPersianDigits } from '../utils/numberUtils';
import { formatUnixTimestampShort } from '../utils/dateUtils';
import apiService from '../services/apiService';
import CustomerComment from './CustomerComment';
import PersianDatePicker from './PersianDatePicker';

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

export interface Customer {
  personal: Personal;
  account: Account;
}

export interface Tag {
  id: string;
  name: string;
}

export interface CustomerDetailsProps {
  authToken: string;
  userId: number;
  userRole: RoleEnum;
  selectedCustomer: Customer;
  onBack: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onNavigate?: (path: string) => void;
}

const CustomerDetails: React.FC<CustomerDetailsProps> = ({
  authToken,
  userId,
  userRole,
  selectedCustomer,
  onBack,
  onSuccess,
  onError,
  onNavigate
}) => {
  const [customer, setCustomer] = useState<Customer>(selectedCustomer);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Account>>({});
  const [loading, setLoading] = useState(false);
  const [customerDebt, setCustomerDebt] = useState<{
    totalTransactions: number;
    totalDebt: number;
    finalDebt: number;
    totalReturnedCheques?: number;
    totalPassedCheques?: number;
    totalOverdueCheques?: number;
    accountBalance?: number;
  } | null>(null);
  const [debtLoading, setDebtLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionPageIndex, setTransactionPageIndex] = useState(1);
  const [transactionPageSize, setTransactionPageSize] = useState(10);
  const [transactionTotalCount, setTransactionTotalCount] = useState(0);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoicePageIndex, setInvoicePageIndex] = useState(1);
  const [invoicePageSize, setInvoicePageSize] = useState(10);
  const [invoiceTotalCount, setInvoiceTotalCount] = useState(0);
  const [customerCheques, setCustomerCheques] = useState<any[]>([]);
  const [chequesLoading, setChequesLoading] = useState(false);
  const [filteredCheques, setFilteredCheques] = useState<any[]>([]);
  const [chequeFilters, setChequeFilters] = useState({
    number: '',
    bankName: '',
    status: '',
    startDate: '',
    endDate: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [chequesPerPage, setChequesPerPage] = useState(10);
  const [totalChequesCount, setTotalChequesCount] = useState(0);

  useEffect(() => {
    fetchCustomerDebt();
    fetchCustomerTransactions(1, transactionPageSize);
    fetchCustomerInvoices();
    fetchCustomerCheques();
  }, [customer.account.userId]);

  // Reset filters when customer changes
  useEffect(() => {
    setChequeFilters({
      number: '',
      bankName: '',
      status: '',
      startDate: '',
      endDate: ''
    });
    setCurrentPage(1);
    setTotalChequesCount(0);
    // Reset invoice pagination on customer change
    setInvoicePageIndex(1);
    setInvoiceTotalCount(0);
    // Reset transaction pagination on customer change
    setTransactionPageIndex(1);
    setTransactionTotalCount(0);
  }, [customer.account.userId]);

  // Refetch data when page size changes
  useEffect(() => {
    if (totalChequesCount > 0) { // Only refetch if we already have data
      const apiFilters: any = {};
      
      if (chequeFilters.number) {
        apiFilters.number = chequeFilters.number;
      }
      
      if (chequeFilters.bankName) {
        apiFilters.bankName = chequeFilters.bankName;
      }
      
      if (chequeFilters.status) {
        apiFilters.status = chequeFilters.status;
      }
      
      if (chequeFilters.startDate) {
        apiFilters.startDate = chequeFilters.startDate;
      }
      
      if (chequeFilters.endDate) {
        apiFilters.endDate = chequeFilters.endDate;
      }
      
      fetchCustomerCheques(apiFilters, 1);
    }
  }, [chequesPerPage]);

  // Refetch transactions when page size changes
  useEffect(() => {
    if (transactionTotalCount > 0) { // Only refetch if we already have data
      fetchCustomerTransactions(1, transactionPageSize);
    }
  }, [transactionPageSize]);

  const fetchCustomerDebt = async () => {
    try {
      setDebtLoading(true);
      const debtData = await apiService.getCustomerDebt(customer.account.userId, authToken);
      setCustomerDebt(debtData.data);
    } catch (err) {
      console.error('Failed to fetch customer debt:', err);
    } finally {
      setDebtLoading(false);
    }
  };

  const fetchCustomerTransactions = async (pageIndex = 1, pageSize = transactionPageSize) => {
    try {
      setTransactionsLoading(true);
      const queryParams = new URLSearchParams({
        pageIndex: (pageIndex - 1).toString(),
        pageSize: pageSize.toString(),
      });
      const response = await apiService.getCustomerTransactions(customer.account.userId, authToken, queryParams);
      setTransactions(response.data.data || []);
      setTransactionTotalCount(response.data.details?.count || 0);
      setTransactionPageIndex(pageIndex);
    } catch (err) {
      console.error('Failed to fetch customer transactions:', err);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const fetchCustomerInvoices = async (pageIndex = 1, pageSize = invoicePageSize) => {
    try {
      setInvoicesLoading(true);
      const queryParams = new URLSearchParams({
        pageIndex: (pageIndex - 1).toString(),
        pageSize: pageSize.toString(),
      });
      // By default fetch without extra filters
      const response = await apiService.getCustomerInvoices(customer.account.userId, authToken, queryParams);
      setInvoices(response.data.data || []);
      setInvoiceTotalCount(response.data.details?.count || 0);
      setInvoicePageIndex(pageIndex);
    } catch (err) {
      console.error('Failed to fetch customer invoices:', err);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const fetchCustomerCheques = async (filters = {}, pageIndex = 1) => {
    try {
      setChequesLoading(true);
      
      // Prepare filter data (without pagination)
      const filterData = {
        customerUserId: customer.account.id,
        ...filters
      };
      
      // Prepare query parameters for pagination
      const queryParams = new URLSearchParams({
        pageIndex: (pageIndex - 1).toString(), // API uses 0-based indexing
        pageSize: chequesPerPage.toString()
      });
      
      const response = await apiService.getCustomerCheques(filterData, authToken, queryParams);
      const cheques = response.data.data || [];
      const totalCount = response.data.details?.count || 0;
      
      setCustomerCheques(cheques);
      setFilteredCheques(cheques);
      setTotalChequesCount(totalCount);
      setCurrentPage(pageIndex);
    } catch (err) {
      console.error('Failed to fetch customer cheques:', err);
    } finally {
      setChequesLoading(false);
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setChequesPerPage(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
    
    // Re-fetch data with new page size
    const apiFilters: any = {};
    
    if (chequeFilters.number) {
      apiFilters.number = chequeFilters.number;
    }
    
    if (chequeFilters.bankName) {
      apiFilters.bankName = chequeFilters.bankName;
    }
    
    if (chequeFilters.status) {
      apiFilters.status = chequeFilters.status;
    }
    
    if (chequeFilters.startDate) {
      apiFilters.startDate = chequeFilters.startDate;
    }
    
    if (chequeFilters.endDate) {
      apiFilters.endDate = chequeFilters.endDate;
    }
    
    fetchCustomerCheques(apiFilters, 1);
  };

  const applyFilters = () => {
    // Prepare filters for API
    const apiFilters: any = {};
    
    if (chequeFilters.number) {
      apiFilters.number = chequeFilters.number;
    }
    
    if (chequeFilters.bankName) {
      apiFilters.bankName = chequeFilters.bankName;
    }
    
    if (chequeFilters.status) {
      apiFilters.status = chequeFilters.status;
    }
    
    if (chequeFilters.startDate) {
      apiFilters.startDate = chequeFilters.startDate;
    }
    
    if (chequeFilters.endDate) {
      apiFilters.endDate = chequeFilters.endDate;
    }
    
    // Fetch filtered data from API
    fetchCustomerCheques(apiFilters, 1);
  };

  const clearFilters = () => {
    setChequeFilters({
      number: '',
      bankName: '',
      status: '',
      startDate: '',
      endDate: ''
    });
    // Fetch original data without filters
    fetchCustomerCheques({}, 1);
  };

  const handleFilterChange = (field: string, value: string) => {
    setChequeFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Pagination
  const totalPages = Math.ceil(totalChequesCount / chequesPerPage);
  const currentCheques = filteredCheques; // API returns the current page data

  const goToPage = (page: number) => {
    // Prepare current filters for API
    const apiFilters: any = {};
    
    if (chequeFilters.number) {
      apiFilters.number = chequeFilters.number;
    }
    
    if (chequeFilters.bankName) {
      apiFilters.bankName = chequeFilters.bankName;
    }
    
    if (chequeFilters.status) {
      apiFilters.status = chequeFilters.status;
    }
    
    if (chequeFilters.startDate) {
      apiFilters.startDate = chequeFilters.startDate;
    }
    
    if (chequeFilters.endDate) {
      apiFilters.endDate = chequeFilters.endDate;
    }
    
    // Fetch data for the selected page
    fetchCustomerCheques(apiFilters, page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const handleEdit = () => {
    setEditForm({
      firstName: customer.account.firstName,
      lastName: customer.account.lastName,
      maxDebt: customer.account.maxDebt,
      nationalCode: customer.account.nationalCode,
      naghshCode: customer.account.naghshCode,
      city: customer.account.city,
      state: customer.account.state,
      maxOpenAccount: customer.account.maxOpenAccount
    });
    setEditing(true);
  };

  const handleSave = async () => {
    if (!editForm) return;

    try {
      setLoading(true);
      
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
        brandIds: customer.account.brand.map(b => b.id),
        gradeId: customer.account.grade.id
      };

      await apiService.updateCustomer(customer.account.id, updateData, authToken);
      
      // Refresh customer data
      const updatedCustomer = {
        ...customer,
        account: {
          ...customer.account,
          ...editForm
        }
      };
      setCustomer(updatedCustomer);
      setEditing(false);
      setEditForm({});
      onSuccess('اطلاعات مشتری با موفقیت بروزرسانی شد');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'خطا در بروزرسانی اطلاعات مشتری');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setEditForm({});
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

  const handleViewInvoice = async (invoiceId: string) => {
    try {
      if (onNavigate) {
        onNavigate(`/admin/invoices/${invoiceId}`);
      } else {
        // Fallback: try to use window.location if navigation function is not provided
        window.location.href = `/admin/invoices/${invoiceId}`;
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'خطا در باز کردن فاکتور');
    }
  };

  const getChequeStatusText = (status: string) => {
    switch (status) {
      case 'created':
        return 'ایجاد شده';
      case 'passed':
        return 'پاس شده';
      case 'rejected':
        return 'برگشت خورده';
      case 'canceled':
        return 'لغو شده';
      default:
        return status;
    }
  };

  const getChequeStatusColor = (status: string) => {
    switch (status) {
      case 'created':
        return 'bg-blue-100 text-blue-800';
      case 'passed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'canceled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getBankDisplayName = (bankName: string): string => {
    const bankNames: Record<string, string> = {
      'tejarat': 'تجارت',
      'melli': 'ملی',
      'mellat': 'ملت',
      'saderat': 'صادرات',
      'parsian': 'پارسیان',
      'pasargad': 'پاسارگاد',
      'saman': 'سامان',
      'shahr': 'شهر',
      'day': 'دی',
      'sina': 'سینا',
      'karafarin': 'کارآفرین',
      'tose': 'توسعه',
      'ansar': 'انصار',
      'hekmat': 'حکمت',
      'gardeshgari': 'گردشگری',
      'iranzamin': 'ایران زمین',
      'kosar': 'کوثر',
      'middleeast': 'خاورمیانه',
      'refah': 'رفاه',
      'sepah': 'سپه',
      'keshavarzi': 'کشاورزی',
      'maskan': 'مسکن',
      'postbank': 'پست بانک',
      'ghavamin': 'قوامین',
      'resalat': 'رسالت',
      'tourism': 'گردشگری',
      'iranvenezuela': 'ایران ونزوئلا',
      'novin': 'نوین',
      'ayandeh': 'آینده',
      'sarmayeh': 'سرمایه',
      'tat': 'تات',
      'shaparak': 'شاپرک',
      'central': 'مرکزی',
      'gharzolhasaneh': 'قرض الحسنه مهر ایران',
      'gharzolhasanehmehr': 'قرض الحسنه مهر',
      'gharzolhasanehresalat': 'قرض الحسنه رسالت',
      'gharzolhasanehkarafarin': 'قرض الحسنه کارآفرین',
      'gharzolhasanehkosar': 'قرض الحسنه کوثر',
      'gharzolhasanehansar': 'قرض الحسنه انصار',
      'gharzolhasanehhekmat': 'قرض الحسنه حکمت',
      'gharzolhasanehgardeshgari': 'قرض الحسنه گردشگری',
      'gharzolhasanehiranzamin': 'قرض الحسنه ایران زمین',
      'gharzolhasanehmiddleeast': 'قرض الحسنه خاورمیانه',
      'gharzolhasanehrefah': 'قرض الحسنه رفاه',
      'gharzolhasanehsepah': 'قرض الحسنه سپه',
      'gharzolhasanehkeshavarzi': 'قرض الحسنه کشاورزی',
      'gharzolhasanehmaskan': 'قرض الحسنه مسکن',
      'gharzolhasanehpostbank': 'قرض الحسنه پست بانک',
      'gharzolhasanehghavamin': 'قرض الحسنه قوامین',
      'gharzolhasanehtourism': 'قرض الحسنه گردشگری',
      'gharzolhasanehiranvenezuela': 'قرض الحسنه ایران ونزوئلا',
      'gharzolhasanehnovin': 'قرض الحسنه نوین',
      'gharzolhasanehayandeh': 'قرض الحسنه آینده',
      'gharzolhasanehsarmayeh': 'قرض الحسنه سرمایه',
      'gharzolhasanehtat': 'قرض الحسنه تات',
      'gharzolhasanehshaparak': 'قرض الحسنه شاپرک',
      'gharzolhasanehcentral': 'قرض الحسنه مرکزی'
    };
    return bankNames[bankName] || bankName;
  };

  const formatChequeDate = (dateString: string) => {
    if (!dateString) return '-';
    
    // Check if it's a Persian date format (8 digits like 14021201)
    if (dateString.length === 8 && /^\d{8}$/.test(dateString)) {
      const year = dateString.substring(0, 4);
      const month = dateString.substring(4, 6);
      const day = dateString.substring(6, 8);
      return `${year}/${month}/${day}`;
    }
    
    // If it's a regular date string, format it normally
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('fa-IR');
    } catch (error) {
      return dateString;
    }
  };

  const bankOptions = [
    { value: 'tejarat', label: 'تجارت' },
    { value: 'melli', label: 'ملی' },
    { value: 'saderat', label: 'صادرات' },
    { value: 'mellat', label: 'ملت' },
    { value: 'parsian', label: 'پارسیان' },
    { value: 'pasargad', label: 'پاسارگاد' },
    { value: 'eghtesad_novin', label: 'اقتصاد نوین' },
    { value: 'saman', label: 'سامان' },
    { value: 'sina', label: 'سینا' },
    { value: 'dey', label: 'دی' },
    { value: 'keshavarzi', label: 'کشاورزی' },
    { value: 'maskan', label: 'مسکن' },
    { value: 'refah', label: 'رفاه' },
    { value: 'post_bank', label: 'پست بانک' },
    { value: 'tourism', label: 'گردشگری' },
    { value: 'karafarin', label: 'کارآفرین' },
    { value: 'middle_east', label: 'خاورمیانه' },
    { value: 'ghavamin', label: 'قوامین' },
    { value: 'mehr_iran', label: 'مهر ایران' },
    { value: 'mehr_eghtesad', label: 'مهر اقتصاد' },
    { value: 'shahr', label: 'شهر' },
    { value: 'ayandeh', label: 'آینده' },
    { value: 'hekmat_iranian', label: 'حکمت ایرانیان' },
    { value: 'iran_zamin', label: 'ایران زمین' },
    { value: 'resalat', label: 'رسالت' },
    { value: 'ansar', label: 'انصار' }
  ];

  const statusOptions = [
    { value: 'created', label: 'ایجاد شده' },
    { value: 'passed', label: 'پاس شده' },
    { value: 'rejected', label: 'برگشت خورده' },
    { value: 'canceled', label: 'لغو شده' }
  ];

  // Invoice statuses (different from cheque statuses)
  const invoiceStatusOptions = [
    { value: 'created', label: 'ایجاد شده' },
    { value: 'approved_by_manager', label: 'تایید شده توسط مدیر' },
    { value: 'approved_by_finance', label: 'تایید شده توسط مالی' },
    { value: 'canceled', label: 'رد شده' },
    { value: 'deleted', label: 'حذف شده' }
  ];

  // Convert 8-digit picker date (YYYYMMDD) to API display format YYYY/MM/DD
  const toApiDisplayDate = (pickerDate: string): string => {
    if (!pickerDate) return '';
    if (pickerDate.length === 8) {
      return `${pickerDate.substring(0,4)}/${pickerDate.substring(4,6)}/${pickerDate.substring(6,8)}`;
    }
    return pickerDate;
  };

  const buildInvoiceApiFilters = () => {
    const f: any = { customerUserId: customer.account.userId };
    if (chequeFilters.status) f.status = chequeFilters.status;
    if (chequeFilters.startDate) f.startDate = toApiDisplayDate(chequeFilters.startDate);
    if (chequeFilters.endDate) f.endDate = toApiDisplayDate(chequeFilters.endDate);
    return f;
  };

  const applyInvoiceFilters = async () => {
    try {
      setInvoicesLoading(true);
      const filters = buildInvoiceApiFilters();
      // Use factor/filter with query params
      const response = await apiService.filterInvoices(
        invoicePageSize,
        0,
        filters,
        authToken
      );
      setInvoices(response.data.data || []);
      setInvoiceTotalCount(response.data.details?.count || 0);
      setInvoicePageIndex(1);
    } catch (err) {
      console.error('Failed to filter invoices:', err);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const clearInvoiceFilters = async () => {
    setChequeFilters(prev => ({ ...prev, status: '', startDate: '', endDate: '' }));
    await fetchCustomerInvoices(1, invoicePageSize);
  };

  const handleInvoicePageSizeChange = (newSize: number) => {
    setInvoicePageSize(newSize);
    // Respect current filters if any
    const filters = buildInvoiceApiFilters();
    (async () => {
      try {
        setInvoicesLoading(true);
        const response = await apiService.filterInvoices(
          newSize,
          0,
          filters,
          authToken
        );
        setInvoices(response.data.data || []);
        setInvoiceTotalCount(response.data.details?.count || 0);
        setInvoicePageIndex(1);
      } finally {
        setInvoicesLoading(false);
      }
    })();
  };

  const goToInvoicePage = (page: number) => {
    const totalPages = Math.ceil(invoiceTotalCount / invoicePageSize);
    const safePage = Math.min(Math.max(page, 1), Math.max(totalPages, 1));
    const filters = buildInvoiceApiFilters();
    (async () => {
      try {
        setInvoicesLoading(true);
        const response = await apiService.filterInvoices(
          invoicePageSize,
          safePage - 1,
          filters,
          authToken
        );
        setInvoices(response.data.data || []);
        setInvoiceTotalCount(response.data.details?.count || 0);
        setInvoicePageIndex(safePage);
      } finally {
        setInvoicesLoading(false);
      }
    })();
  };

  const goToPrevInvoicePage = () => goToInvoicePage(invoicePageIndex - 1);
  const goToNextInvoicePage = () => goToInvoicePage(invoicePageIndex + 1);

  // Transaction pagination functions
  const goToTransactionPage = (page: number) => {
    const totalPages = Math.ceil(transactionTotalCount / transactionPageSize);
    const safePage = Math.min(Math.max(page, 1), Math.max(totalPages, 1));
    fetchCustomerTransactions(safePage, transactionPageSize);
  };

  const goToPrevTransactionPage = () => goToTransactionPage(transactionPageIndex - 1);
  const goToNextTransactionPage = () => goToTransactionPage(transactionPageIndex + 1);

  const handleTransactionPageSizeChange = (newSize: number) => {
    setTransactionPageSize(newSize);
    fetchCustomerTransactions(1, newSize);
  };

  // Format invoice date like main invoices page (YYYYMMDD -> YYYY/MM/DD with Persian digits)
  const formatInvoiceDateDisplay = (dateStr: string) => {
    if (!dateStr) return '-';
    if (dateStr.length === 8) {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      return toPersianDigits(`${year}/${month}/${day}`);
    }
    return toPersianDigits(dateStr);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <button
              onClick={onBack}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="بازگشت"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">جزئیات مشتری</h1>
          </div>
          {!editing && (
            <button
              onClick={handleEdit}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 space-x-reverse transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>ویرایش</span>
            </button>
          )}
        </div>

        {/* Customer Profile */}
        <div className="flex items-start space-x-6 space-x-reverse">
          <div className="flex-shrink-0">
            {customer.personal.profile ? (
              <img
                className="h-24 w-24 rounded-full object-cover border-4 border-gray-200"
                src={customer.personal.profile}
                alt={customer.personal.firstName}
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-4 border-gray-200">
                <User className="h-12 w-12 text-white" />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
                  <User className="w-5 h-5 text-blue-500" />
                  <span>اطلاعات شخصی</span>
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">نام و نام خانوادگی:</span>
                    <span className="font-medium">
                      {editing ? (
                        <input
                          type="text"
                          value={editForm.firstName || customer.account.firstName}
                          onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        `${customer.account.firstName}${customer.account.lastName ? ` ${customer.account.lastName}` : ''}`
                      )}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">کد ملی:</span>
                    <span className="font-medium">
                      {editing ? (
                        <input
                          type="text"
                          value={editForm.nationalCode || customer.account.nationalCode}
                          onChange={(e) => setEditForm({ ...editForm, nationalCode: e.target.value })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        toPersianDigits(customer.account.nationalCode)
                      )}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">کد نقش:</span>
                    <span className="font-medium">
                      {editing ? (
                        <input
                          type="text"
                          value={editForm.naghshCode || customer.account.naghshCode}
                          onChange={(e) => setEditForm({ ...editForm, naghshCode: e.target.value })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        toPersianDigits(customer.account.naghshCode)
                      )}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">جنسیت:</span>
                    <span className="font-medium">{getGenderText(customer.personal.gender)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">وضعیت تاهل:</span>
                    <span className="font-medium">{getMaritalStatusText(customer.personal.married)}</span>
                  </div>
                  
                                     <div className="flex justify-between">
                     <span className="text-gray-600">تاریخ تولد:</span>
                     <span className="font-medium">{formatDate(customer.personal.birthdate)}</span>
                   </div>
                </div>
              </div>

              {/* Account Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
                  <CreditCard className="w-5 h-5 text-green-500" />
                  <span>اطلاعات حساب</span>
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">حداکثر بدهی:</span>
                    <span className="font-medium">
                      {editing ? (
                        <input
                          type="number"
                          value={editForm.maxDebt || customer.account.maxDebt}
                          onChange={(e) => setEditForm({ ...editForm, maxDebt: parseInt(e.target.value) || 0 })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        formatCurrency(customer.account.maxDebt) + ' ریال'
                      )}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">سقف حساب باز:</span>
                    <span className="font-medium">
                      {editing ? (
                        <input
                          type="number"
                          value={editForm.maxOpenAccount || customer.account.maxOpenAccount}
                          onChange={(e) => setEditForm({ ...editForm, maxOpenAccount: parseInt(e.target.value) || 0 })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        formatCurrency(customer.account.maxOpenAccount) + ' ریال'
                      )}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">گرید:</span>
                    <span className="font-medium">{customer.account.grade.name}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">حداکثر اعتبار:</span>
                    <span className="font-medium">{formatCurrency(customer.account.grade.maxCredit)} ریال</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
                <MapPin className="w-5 h-5 text-purple-500" />
                <span>اطلاعات مکانی</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">شهر:</span>
                  <span className="font-medium">
                    {editing ? (
                      <input
                        type="text"
                        value={editForm.city || customer.account.city || ''}
                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="شهر"
                      />
                    ) : (
                      customer.account.city || '-'
                    )}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">استان:</span>
                  <span className="font-medium">
                    {editing ? (
                      <input
                        type="text"
                        value={editForm.state || customer.account.state || ''}
                        onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="استان"
                      />
                    ) : (
                      customer.account.state || '-'
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Brands */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
                <Building className="w-5 h-5 text-orange-500" />
                <span>برندهای مجاز</span>
              </h3>
              
              <div className="flex flex-wrap gap-2">
                {customer.account.brand.map((brand) => (
                  <span
                    key={brand.id}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm"
                  >
                    <Building className="w-4 h-4 mr-1" />
                    {brand.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            {editing && (
              <div className="mt-6 flex space-x-3 space-x-reverse">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 space-x-reverse transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
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
                <button
                  onClick={handleCancel}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 space-x-reverse transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>انصراف</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      {customerDebt && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span>خلاصه مالی</span>
          </h3>
          
          {debtLoading ? (
            <div className="animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600">کل تراکنش‌ها</p>
                      <p className="text-2xl font-bold text-blue-900">{formatCurrency(customerDebt.totalTransactions)}</p>
                    </div>
                    <FileText className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-600">کل بدهی(مجموع کل فاکتورهای تایید شده)</p>
                      <p className="text-2xl font-bold text-orange-900">{formatCurrency(customerDebt.totalDebt)} ریال</p>
                    </div>
                    <CreditCard className="w-8 h-8 text-orange-500" />
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600">بدهی نهایی</p>
                      <p className="text-2xl font-bold text-green-900">{formatCurrency(customerDebt.finalDebt)} ریال</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                </div>
              </div>

              {/* Additional Cheque Information */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-600">مجموع چک‌های برگشتی</p>
                      <p className="text-xl font-bold text-red-900">{formatCurrency(customerDebt.totalReturnedCheques || 0)} ریال</p>
                    </div>
                    <FileText className="w-6 h-6 text-red-500" />
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600">مجموع چک‌های پاس شده</p>
                      <p className="text-xl font-bold text-green-900">{formatCurrency(customerDebt.totalPassedCheques || 0)} ریال</p>
                    </div>
                    <FileText className="w-6 h-6 text-green-500" />
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-yellow-600">مجموع چک‌های سررسید نشده</p>
                      <p className="text-xl font-bold text-yellow-900">{formatCurrency(customerDebt.totalOverdueCheques || 0)} ریال</p>
                    </div>
                    <FileText className="w-6 h-6 text-yellow-500" />
                  </div>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600">مانده حساب</p>
                      <p className="text-xl font-bold text-purple-900">{formatCurrency(customerDebt.accountBalance || 0)} ریال</p>
                    </div>
                    <CreditCard className="w-6 h-6 text-purple-500" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

       {/* Customer Transactions */}
       <div className="bg-white rounded-lg shadow-md p-6">
         <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
           <Receipt className="w-5 h-5 text-purple-500" />
           <span>تراکنش‌های مشتری</span>
         </h3>
         
         {transactionsLoading ? (
           <div className="animate-pulse">
             <div className="space-y-3">
               {[...Array(3)].map((_, i) => (
                 <div key={i} className="h-16 bg-gray-200 rounded"></div>
               ))}
             </div>
           </div>
         ) : transactions.length === 0 ? (
           <div className="text-center py-8">
             <div className="text-gray-500 text-lg mb-2">هیچ تراکنشی یافت نشد</div>
             <p className="text-gray-400 text-sm">تراکنش‌های این مشتری در اینجا نمایش داده می‌شوند</p>
           </div>
         ) : (
           <div>
             {/* Transactions Summary */}
             <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="text-center">
                   <div className="text-2xl font-bold text-blue-600">{toPersianDigits(transactionTotalCount)}</div>
                   <div className="text-sm text-gray-600">تعداد کل تراکنش‌ها</div>
                 </div>
                 <div className="text-center">
                   <div className="text-2xl font-bold text-green-600">
                     {formatCurrency(transactions.reduce((total, t) => total + parseFloat(t.price), 0))} ریال
                   </div>
                   <div className="text-sm text-gray-600">مجموع مبالغ (صفحه فعلی)</div>
                 </div>
                 <div className="text-center">
                   <div className="text-2xl font-bold text-purple-600">
                     {formatCurrency(transactions.filter(t => t.method === 'cash').reduce((total, t) => total + parseFloat(t.price), 0))} ریال
                   </div>
                   <div className="text-sm text-gray-600">پرداخت‌های نقدی (صفحه فعلی)</div>
                 </div>
               </div>
             </div>

             {/* Page Size Selector */}
             <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
               <div className="flex items-center justify-between mb-4">
                 <h4 className="text-md font-medium text-gray-900">تنظیمات صفحه</h4>
                 
                 {/* Page Size Selector */}
                 <div className="flex items-center space-x-2 space-x-reverse">
                   <label className="text-sm font-medium text-gray-700">تعداد در هر صفحه:</label>
                   <select
                     value={transactionPageSize}
                     onChange={(e) => handleTransactionPageSizeChange(parseInt(e.target.value))}
                     className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                   >
                     <option value={5}>۵</option>
                     <option value={10}>۱۰</option>
                     <option value={20}>۲۰</option>
                     <option value={50}>۵۰</option>
                     <option value={100}>۱۰۰</option>
                   </select>
                 </div>
               </div>
             </div>
             
             <div className="overflow-x-auto">
               <table className="w-full table-auto">
               <thead>
                 <tr className="bg-gray-50 border-b">
                   <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">کد پیگیری</th>
                   <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">مبلغ</th>
                   <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">روش پرداخت</th>
                   <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاریخ</th>
                   <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">وضعیت</th>
                 </tr>
               </thead>
               <tbody className="bg-white divide-y divide-gray-200">
                 {transactions.map((transaction) => (
                   <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                     <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                       <div className="flex items-center space-x-2 space-x-reverse">
                         <Receipt className="w-4 h-4 text-gray-400" />
                         <span>{transaction.trackingCode}</span>
                       </div>
                     </td>
                     <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                       <div className="flex items-center space-x-2 space-x-reverse">
                         <DollarSign className="w-4 h-4 text-green-500" />
                         <span className="font-medium">{formatCurrency(transaction.price)} ریال</span>
                       </div>
                     </td>
                     <td className="px-4 py-4 whitespace-nowrap">
                       <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                         transaction.method === 'cash' 
                           ? 'bg-green-100 text-green-800' 
                           : 'bg-blue-100 text-blue-800'
                       }`}>
                         {transaction.method === 'cash' ? 'نقدی' : 'چک'}
                       </span>
                     </td>
                     <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                       <div className="flex items-center space-x-2 space-x-reverse">
                         <Clock className="w-4 h-4 text-gray-400" />
                         <span>{formatUnixTimestampShort(transaction.createdAt)}</span>
                       </div>
                     </td>
                     <td className="px-4 py-4 whitespace-nowrap">
                       <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                         موفق
                       </span>
                     </td>
                   </tr>
                 ))}
                                </tbody>
               </table>

               {/* Transactions Pagination */}
               {Math.ceil(transactionTotalCount / transactionPageSize) > 1 && (
                 <div className="mt-6 flex items-center justify-between">
                   <div className="text-sm text-gray-700">
                     نمایش {toPersianDigits((transactionPageIndex - 1) * transactionPageSize + 1)} تا {toPersianDigits(Math.min(transactionPageIndex * transactionPageSize, transactionTotalCount))} از {toPersianDigits(transactionTotalCount)} تراکنش
                   </div>
                   
                   <div className="flex items-center space-x-2 space-x-reverse">
                     <button
                       onClick={goToPrevTransactionPage}
                       disabled={transactionPageIndex === 1}
                       className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                     >
                       قبلی
                     </button>
                     
                     {Array.from({ length: Math.min(5, Math.ceil(transactionTotalCount / transactionPageSize)) }, (_, i) => {
                       let pageNum;
                       if (Math.ceil(transactionTotalCount / transactionPageSize) <= 5) {
                         pageNum = i + 1;
                       } else if (transactionPageIndex <= 3) {
                         pageNum = i + 1;
                       } else if (transactionPageIndex >= Math.ceil(transactionTotalCount / transactionPageSize) - 2) {
                         pageNum = Math.ceil(transactionTotalCount / transactionPageSize) - 4 + i;
                       } else {
                         pageNum = transactionPageIndex - 2 + i;
                       }
                       
                       return (
                         <button
                           key={pageNum}
                           onClick={() => goToTransactionPage(pageNum)}
                           className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                             transactionPageIndex === pageNum
                               ? 'bg-blue-500 text-white'
                               : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                           }`}
                         >
                           {toPersianDigits(pageNum)}
                         </button>
                       );
                     })}
                     
                     <button
                       onClick={goToNextTransactionPage}
                       disabled={transactionPageIndex >= Math.ceil(transactionTotalCount / transactionPageSize)}
                       className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                     >
                       بعدی
                     </button>
                   </div>
                 </div>
               )}
             </div>
           </div>
         )}
       </div>

       {/* Customer Invoices */}
       <div className="bg-white rounded-lg shadow-md p-6">
         <div className="flex items-center justify-between mb-4">
           <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2 space-x-reverse">
             <FileText className="w-5 h-5 text-blue-500" />
             <span>فاکتورهای مشتری</span>
           </h3>
           {/* <div className="flex items-center space-x-2 space-x-reverse">
             <label className="text-sm font-medium text-gray-700">تعداد در هر صفحه:</label>
             <select
               value={invoicePageSize}
               onChange={(e) => handleInvoicePageSizeChange(parseInt(e.target.value))}
               className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
             >
               <option value={5}>۵</option>
               <option value={10}>۱۰</option>
               <option value={20}>۲۰</option>
               <option value={50}>۵۰</option>
               <option value={100}>۱۰۰</option>
             </select>
           </div> */}
         </div>
         
         {invoicesLoading ? (
           <div className="animate-pulse">
             <div className="space-y-3">
               {[...Array(3)].map((_, i) => (
                 <div key={i} className="h-16 bg-gray-200 rounded"></div>
               ))}
             </div>
           </div>
         ) : invoices.length === 0 ? (
           <div className="text-center py-8">
             <div className="text-gray-500 text-lg mb-2">هیچ فاکتوری یافت نشد</div>
             <p className="text-gray-400 text-sm">فاکتورهای این مشتری در اینجا نمایش داده می‌شوند</p>
           </div>
         ) : (
           <div>
             {/* Invoices Summary */}
             {/* <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="text-center">
                   <div className="text-2xl font-bold text-blue-600">{toPersianDigits(invoiceTotalCount)}</div>
                   <div className="text-sm text-gray-600">تعداد کل فاکتورها</div>
                 </div>
                 <div className="text-center">
                   <div className="text-2xl font-bold text-green-600">
                     {formatCurrency(invoices.reduce((total, i) => total + parseFloat(i.totalPrice), 0))} ریال
                   </div>
                   <div className="text-sm text-gray-600">مجموع مبالغ (صفحه فعلی)</div>
                 </div>
                 <div className="text-center">
                   <div className="text-2xl font-bold text-green-600">
                     {formatCurrency(invoices.filter(i => i.status === 'approved_by_manager').reduce((total, i) => total + parseFloat(i.totalPrice), 0))} ریال
                   </div>
                   <div className="text-sm text-gray-600">فاکتورهای تایید شده (صفحه فعلی)</div>
                 </div>
               </div>
             </div> */}

             {/* Filters and Page Size */}
             <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
               <div className="flex items-center justify-between mb-4">
                 <h4 className="text-md font-medium text-gray-900">فیلترها</h4>
                 
                 {/* Page Size Selector */}
                 <div className="flex items-center space-x-2 space-x-reverse">
                   <label className="text-sm font-medium text-gray-700">تعداد در هر صفحه:</label>
                   <select
                     value={invoicePageSize}
                     onChange={(e) => handleInvoicePageSizeChange(parseInt(e.target.value))}
                     className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                   >
                     <option value={5}>۵</option>
                     <option value={10}>۱۰</option>
                     <option value={20}>۲۰</option>
                     <option value={50}>۵۰</option>
                     <option value={100}>۱۰۰</option>
                   </select>
                 </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                 {/* Invoice Status Filter */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">وضعیت فاکتور</label>
                   <select
                     value={chequeFilters.status} // Reusing chequeFilters for invoice status filter
                     onChange={(e) => handleFilterChange('status', e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                   >
                     <option value="">همه وضعیت‌ها</option>
                     {invoiceStatusOptions.map((status) => (
                       <option key={status.value} value={status.value}>
                         {status.label}
                       </option>
                     ))}
                   </select>
                 </div>

                 {/* From Date Filter */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">از تاریخ</label>
                   <PersianDatePicker
                     value={chequeFilters.startDate} // Reusing chequeFilters for invoice date filter
                     onChange={(value) => handleFilterChange('startDate', value)}
                     placeholder="انتخاب تاریخ شروع"
                     className="text-sm"
                   />
                 </div>

                 {/* To Date Filter */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">تا تاریخ</label>
                   <PersianDatePicker
                     value={chequeFilters.endDate} // Reusing chequeFilters for invoice date filter
                     onChange={(value) => handleFilterChange('endDate', value)}
                     placeholder="انتخاب تاریخ پایان"
                     className="text-sm"
                   />
                 </div>

                 {/* Filter Actions */}
                 <div className="flex items-end space-x-2 space-x-reverse">
                   <button
                     onClick={applyInvoiceFilters}
                     className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm transition-colors"
                   >
                     اعمال فیلتر
                   </button>
                   <button
                     onClick={clearInvoiceFilters}
                     className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm transition-colors"
                   >
                     پاک کردن
                   </button>
                 </div>
               </div>
             </div>

             <div className="overflow-x-auto">
               <table className="w-full table-auto">
                 <thead>
                   <tr className="bg-gray-50 border-b">
                     <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نام فاکتور</th>
                     <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">وضعیت</th>
                     <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاریخ</th>
                     <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عملیات</th>
                   </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-gray-200">
                   {invoices.map((invoice) => (
                     <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                       <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                         <div className="flex items-center space-x-2 space-x-reverse">
                           <FileText className="w-4 h-4 text-gray-400" />
                           <span className="font-medium">{invoice.name}</span>
                         </div>
                       </td>
                       <td className="px-4 py-4 whitespace-nowrap">
                         <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                           invoice.status === 'created' ? 'bg-blue-100 text-blue-800' :
                           invoice.status === 'approved_by_manager' ? 'bg-green-100 text-green-800' :
                           invoice.status === 'approved_by_finance' ? 'bg-purple-100 text-purple-800' :
                           invoice.status === 'canceled' ? 'bg-red-100 text-red-800' :
                           invoice.status === 'deleted' ? 'bg-gray-100 text-gray-800' :
                           'bg-gray-100 text-gray-800'
                         }`}>
                           {invoice.status === 'created' ? 'ایجاد شده' :
                            invoice.status === 'approved_by_manager' ? 'تایید شده توسط مدیر' :
                            invoice.status === 'approved_by_finance' ? 'تایید شده توسط مالی' :
                            invoice.status === 'canceled' ? 'رد شده' :
                            invoice.status === 'deleted' ? 'حذف شده' :
                            invoice.status}
                         </span>
                       </td>
                       <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                         <div className="flex items-center space-x-2 space-x-reverse">
                           <Calendar className="w-4 h-4 text-gray-400" />
                           <span>{formatInvoiceDateDisplay(invoice.date)}</span>
                         </div>
                       </td>
                       <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                         <button
                           onClick={() => handleViewInvoice(invoice.id)}
                           className="text-blue-600 hover:text-blue-900 flex items-center space-x-2 space-x-reverse"
                         >
                           <Eye className="w-4 h-4" />
                           <span>مشاهده</span>
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>

               {/* Invoices Pagination */}
               {Math.ceil(invoiceTotalCount / invoicePageSize) > 1 && (
                 <div className="mt-6 flex items-center justify-between">
                   <div className="text-sm text-gray-700">
                     نمایش {toPersianDigits((invoicePageIndex - 1) * invoicePageSize + 1)} تا {toPersianDigits(Math.min(invoicePageIndex * invoicePageSize, invoiceTotalCount))} از {toPersianDigits(invoiceTotalCount)} فاکتور
                   </div>
                   
                   <div className="flex items-center space-x-2 space-x-reverse">
                     <button
                       onClick={goToPrevInvoicePage}
                       disabled={invoicePageIndex === 1}
                       className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                     >
                       قبلی
                     </button>
                     
                     {Array.from({ length: Math.min(5, Math.ceil(invoiceTotalCount / invoicePageSize)) }, (_, i) => {
                       let pageNum;
                       if (Math.ceil(invoiceTotalCount / invoicePageSize) <= 5) {
                         pageNum = i + 1;
                       } else if (invoicePageIndex <= 3) {
                         pageNum = i + 1;
                       } else if (invoicePageIndex >= Math.ceil(invoiceTotalCount / invoicePageSize) - 2) {
                         pageNum = Math.ceil(invoiceTotalCount / invoicePageSize) - 4 + i;
                       } else {
                         pageNum = invoicePageIndex - 2 + i;
                       }
                       
                       return (
                         <button
                           key={pageNum}
                           onClick={() => goToInvoicePage(pageNum)}
                           className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                             invoicePageIndex === pageNum
                               ? 'bg-blue-500 text-white'
                               : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                           }`}
                         >
                           {toPersianDigits(pageNum)}
                         </button>
                       );
                     })}
                     
                     <button
                       onClick={goToNextInvoicePage}
                       disabled={invoicePageIndex === Math.ceil(invoiceTotalCount / invoicePageSize) || Math.ceil(invoiceTotalCount / invoicePageSize) === 0}
                       className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                     >
                       بعدی
                     </button>
                   </div>
                 </div>
               )}
             </div>
           </div>
         )}
       </div>

       {/* Customer Cheques */}
       <div className="bg-white rounded-lg shadow-md p-6">
         <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
           <CreditCard className="w-5 h-5 text-purple-500" />
           <span>چک‌های مشتری</span>
         </h3>
         
         {chequesLoading ? (
           <div className="animate-pulse">
             <div className="space-y-3">
               {[...Array(3)].map((_, i) => (
                 <div key={i} className="h-16 bg-gray-200 rounded"></div>
               ))}
             </div>
           </div>
         ) : customerCheques.length === 0 ? (
           <div className="text-center py-8">
             <div className="text-gray-500 text-lg mb-2">هیچ چکی یافت نشد</div>
             <p className="text-gray-400 text-sm">چک‌های این مشتری در اینجا نمایش داده می‌شوند</p>
           </div>
         ) : (
           <div>
             {/* Cheques Summary */}
             <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
               <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                 <div className="text-center">
                   <div className="text-2xl font-bold text-blue-600">{toPersianDigits(totalChequesCount)}</div>
                   <div className="text-sm text-gray-600">تعداد کل چک‌ها</div>
                 </div>
                 <div className="text-center">
                   <div className="text-2xl font-bold text-green-600">
                     {formatCurrency(filteredCheques.reduce((total, c) => total + c.price, 0))} ریال
                   </div>
                   <div className="text-sm text-gray-600">مجموع مبالغ (صفحه فعلی)</div>
                 </div>
                 <div className="text-center">
                   <div className="text-2xl font-bold text-green-600">
                     {formatCurrency(filteredCheques.filter(c => c.status === 'passed').reduce((total, c) => total + c.price, 0))} ریال
                   </div>
                   <div className="text-sm text-gray-600">چک‌های پاس شده (صفحه فعلی)</div>
                 </div>
                 <div className="text-center">
                   <div className="text-2xl font-bold text-red-600">
                     {formatCurrency(filteredCheques.filter(c => c.status === 'rejected').reduce((total, c) => total + c.price, 0))} ریال
                   </div>
                   <div className="text-sm text-gray-600">چک‌های برگشتی (صفحه فعلی)</div>
                 </div>
                 <div className="text-center">
                   <div className="text-2xl font-bold text-yellow-600">
                     {formatCurrency(filteredCheques.filter(c => c.status === 'created').reduce((total, c) => total + c.price, 0))} ریال
                   </div>
                   <div className="text-sm text-gray-600">چک‌های سررسید نشده (صفحه فعلی)</div>
                 </div>
               </div>
             </div>

             {/* Filters and Page Size */}
             <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
               <div className="flex items-center justify-between mb-4">
                 <h4 className="text-md font-medium text-gray-900">فیلترها</h4>
                 
                 {/* Page Size Selector */}
                 <div className="flex items-center space-x-2 space-x-reverse">
                   <label className="text-sm font-medium text-gray-700">تعداد در هر صفحه:</label>
                   <select
                     value={chequesPerPage}
                     onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                     className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                   >
                     <option value={5}>۵</option>
                     <option value={10}>۱۰</option>
                     <option value={20}>۲۰</option>
                     <option value={50}>۵۰</option>
                     <option value={100}>۱۰۰</option>
                   </select>
                 </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                 {/* Cheque Number Filter */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">شماره چک</label>
                   <input
                     type="text"
                     value={chequeFilters.number}
                     onChange={(e) => handleFilterChange('number', e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                     placeholder="شماره چک"
                   />
                 </div>

                 {/* Bank Filter */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">بانک</label>
                   <select
                     value={chequeFilters.bankName}
                     onChange={(e) => handleFilterChange('bankName', e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                   >
                     <option value="">همه بانک‌ها</option>
                     {bankOptions.map((bank) => (
                       <option key={bank.value} value={bank.value}>
                         {bank.label}
                       </option>
                     ))}
                   </select>
                 </div>

                 {/* Status Filter */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">وضعیت</label>
                   <select
                     value={chequeFilters.status}
                     onChange={(e) => handleFilterChange('status', e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                   >
                     <option value="">همه وضعیت‌ها</option>
                     {statusOptions.map((status) => (
                       <option key={status.value} value={status.value}>
                         {status.label}
                       </option>
                     ))}
                   </select>
                 </div>

                 {/* From Date Filter */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">از تاریخ</label>
                   <PersianDatePicker
                     value={chequeFilters.startDate}
                     onChange={(value) => handleFilterChange('startDate', value)}
                     placeholder="انتخاب تاریخ شروع"
                     className="text-sm"
                   />
                 </div>

                 {/* To Date Filter */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">تا تاریخ</label>
                   <PersianDatePicker
                     value={chequeFilters.endDate}
                     onChange={(value) => handleFilterChange('endDate', value)}
                     placeholder="انتخاب تاریخ پایان"
                     className="text-sm"
                   />
                 </div>

                 {/* Filter Actions */}
                 <div className="flex items-end space-x-2 space-x-reverse">
                   <button
                     onClick={applyFilters}
                     className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm transition-colors"
                   >
                     اعمال فیلتر
                   </button>
                   <button
                     onClick={clearFilters}
                     className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm transition-colors"
                   >
                     پاک کردن
                   </button>
                 </div>
               </div>
             </div>
             
             <div className="overflow-x-auto">
               <table className="w-full table-auto">
                 <thead>
                   <tr className="bg-gray-50 border-b">
                     <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">شماره چک</th>
                     <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">مبلغ</th>
                     <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاریخ سررسید</th>
                     <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">بانک</th>
                     <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">وضعیت</th>
                     <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">توضیحات</th>
                   </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-gray-200">
                   {currentCheques.map((cheque) => (
                     <tr key={cheque.id} className="hover:bg-gray-50 transition-colors">
                       <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                         <div className="flex items-center space-x-2 space-x-reverse">
                           <CreditCard className="w-4 h-4 text-gray-400" />
                           <span className="font-medium">{cheque.number}</span>
                         </div>
                       </td>
                       <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                         <div className="flex items-center space-x-2 space-x-reverse">
                           <DollarSign className="w-4 h-4 text-green-500" />
                           <span className="font-medium">{formatCurrency(cheque.price)} ریال</span>
                         </div>
                       </td>
                       <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                         <div className="flex items-center space-x-2 space-x-reverse">
                           <Calendar className="w-4 h-4 text-gray-400" />
                           <span>{formatChequeDate(cheque.date)}</span>
                         </div>
                       </td>
                       <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                         <span className="font-medium">{cheque.bankName ? getBankDisplayName(cheque.bankName) : '-'}</span>
                       </td>
                       <td className="px-4 py-4 whitespace-nowrap">
                         <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getChequeStatusColor(cheque.status)}`}>
                           {getChequeStatusText(cheque.status)}
                         </span>
                       </td>
                       <td className="px-4 py-4 text-sm text-gray-900">
                         <span className="text-gray-500">{cheque.description || '-'}</span>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>

               {/* Pagination */}
               {totalPages > 1 && (
                 <div className="mt-6 flex items-center justify-between">
                   <div className="text-sm text-gray-700">
                     نمایش {toPersianDigits((currentPage - 1) * chequesPerPage + 1)} تا {toPersianDigits(Math.min(currentPage * chequesPerPage, totalChequesCount))} از {toPersianDigits(totalChequesCount)} چک
                   </div>
                   
                   <div className="flex items-center space-x-2 space-x-reverse">
                     <button
                       onClick={goToPreviousPage}
                       disabled={currentPage === 1}
                       className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                     >
                       قبلی
                     </button>
                     
                     {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                       let pageNum;
                       if (totalPages <= 5) {
                         pageNum = i + 1;
                       } else if (currentPage <= 3) {
                         pageNum = i + 1;
                       } else if (currentPage >= totalPages - 2) {
                         pageNum = totalPages - 4 + i;
                       } else {
                         pageNum = currentPage - 2 + i;
                       }
                       
                       return (
                         <button
                           key={pageNum}
                           onClick={() => goToPage(pageNum)}
                           className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                             currentPage === pageNum
                               ? 'bg-blue-500 text-white'
                               : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                           }`}
                         >
                           {toPersianDigits(pageNum)}
                         </button>
                       );
                     })}
                     
                     <button
                       onClick={goToNextPage}
                       disabled={currentPage === totalPages}
                       className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                     >
                       بعدی
                     </button>
                   </div>
                 </div>
               )}
             </div>
           </div>
         )}
       </div>

       {/* Customer Comments */}
       <CustomerComment
         authToken={authToken}
         customerUserId={customer.account.userId}
         userId={userId.toString()}
         onError={onError}
       />
     </div>
   );
 };

export default CustomerDetails; 