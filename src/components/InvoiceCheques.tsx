import React, { useState, useEffect } from 'react';
import { Plus, CreditCard, AlertCircle, CheckCircle, Trash2, Eye } from 'lucide-react';
import ChequeDetails from './ChequeDetails';
import { FactorStatus, PaymentMethod } from '../types/invoiceTypes';
import { formatCurrency, toPersianDigits, toEnglishDigits } from '../utils/numberUtils';
import PersianDatePicker from './PersianDatePicker';
import apiService from '../services/apiService';

export enum ChequeStatus {
  CREATED = 'created',
  PASSED = 'passed',
  REJECTED = 'rejected',
  CANCELED = 'canceled',
}

interface CustomerData {
  personal: {
    userId: string;
    firstName: string;
    lastName: string;
    profile?: string;
  };
  account: {
    firstName: string;
    lastName: string;
    nationalCode: string;
    maxDebt: number;
    grade: {
      id: string;
      name: string;
      maxCredit: number;
    };
    naghshCode: string;
    city: string | null;
    state: string | null;
    maxOpenAccount: number;
    brand: any[];
  };
}

interface FactorCheque {
  id: string;
  factorId: string;
  chequeId: string;
  factorData: any;
  chequeData: {
    id: string;
    number: string;
    date: string;
    price: number;
    customerUserId: string;
    managerUserId: string;
    status: string;
    bankName: string;
    description: string | null;
    customerData: CustomerData;
    managerData: {
      role: {
        id: string;
        name: string;
      };
      id: string;
      userId: string;
      firstName: string;
      lastName: string;
    };
  };
}

interface CustomerCheque {
  id: string;
  number: string;
  date: string;
  price: number;
  customerUserId: string;
  managerUserId: string;
  status: string;
  bankName: string;
  description: string | null;
}

interface InvoiceChequesProps {
  authToken: string;
  selectedFactor: any;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const InvoiceCheques: React.FC<InvoiceChequesProps> = ({ 
  authToken, 
  selectedFactor, 
  onSuccess, 
  onError 
}) => {
  const [factorCheques, setFactorCheques] = useState<FactorCheque[]>([]);
  const [factorChequesLoading, setFactorChequesLoading] = useState(false);
  const [showAddCheque, setShowAddCheque] = useState(false);
  const [customerCheques, setCustomerCheques] = useState<CustomerCheque[]>([]);
  const [customerChequesLoading, setCustomerChequesLoading] = useState(false);
  const [chequeSearchNumber, setChequeSearchNumber] = useState('');
  const [deletingChequeId, setDeletingChequeId] = useState<string | null>(null);
  const [chequeNumberFilter, setChequeNumberFilter] = useState('');
  const [selectedCheque, setSelectedCheque] = useState('');
  const [assigningCheque, setAssigningCheque] = useState(false);
  const [chequeError, setChequeError] = useState<string | null>(null);
  const [showCreateChequeForm, setShowCreateChequeForm] = useState(false);
  const [creatingCheque, setCreatingCheque] = useState(false);
  const [newChequeForm, setNewChequeForm] = useState({
    number: '',
    date: '',
    price: 0,
    bankName: '',
    description: '',
    sayyadi: false
  });
  
  // Display price in Persian digits for user input
  const [displayChequePrice, setDisplayChequePrice] = useState('');
  const [selectedChequeForDetails, setSelectedChequeForDetails] = useState<string | null>(null);

  // Validate and convert cheque price input
  const validateAndConvertChequePrice = (priceInput: string): number | null => {
    if (!priceInput.trim()) return null;
    
    // Convert Persian/Arabic digits to English
    const englishPrice = toEnglishDigits(priceInput.trim());
    
    // Remove any non-digit characters except decimal point
    const cleanPrice = englishPrice.replace(/[^\d.]/g, '');
    
    // Check if it's a valid number
    const numPrice = parseFloat(cleanPrice);
    if (isNaN(numPrice) || numPrice <= 0) {
      return null;
    }
    
    return numPrice;
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
  
  const fetchFactorCheques = async () => {
    try {
      setFactorChequesLoading(true);
      const data = await apiService.getFactorCheques(selectedFactor.id, authToken);
      setFactorCheques(data.data?.data || []);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to fetch factor cheques');
    } finally {
      setFactorChequesLoading(false);
    }
  };

  const fetchCustomerCheques = async () => {
    try {
      setCustomerChequesLoading(true);
      
      // Prepare filter data
      const filterData: any = {
        customerUserId: selectedFactor.customerData.account.id
      };
      
      // Add number filter if search input is not empty
      if (chequeSearchNumber.trim()) {
        filterData.number = chequeSearchNumber.trim();
      }
      
      // Add number filter if provided
      if (chequeNumberFilter.trim()) {
        filterData.number = chequeNumberFilter.trim();
      }
      
      const data = await apiService.getCustomerCheques(filterData, authToken);
      
      const assignedChequeIds = factorCheques.map(fc => fc.chequeId);
      const availableCheques = (data.data?.data || []).filter(
        (cheque: CustomerCheque) => !assignedChequeIds.includes(cheque.id)
      );
      setCustomerCheques(availableCheques);
    } catch (err) {
      setChequeError(err instanceof Error ? err.message : 'Failed to fetch customer cheques');
    } finally {
      setCustomerChequesLoading(false);
    }
  };

  const handleAssignCheque = async () => {
    if (!selectedCheque) return;

    try {
      setAssigningCheque(true);
      setChequeError(null);

      await apiService.assignChequeToFactor(selectedFactor.id, selectedCheque, authToken);
      
      onSuccess('چک با موفقیت به فاکتور تخصیص داده شد');
      await fetchFactorCheques();
      setShowAddCheque(false);
      setSelectedCheque('');
    } catch (err) {
      setChequeError(err instanceof Error ? err.message : 'خطا در تخصیص چک');
    } finally {
      setAssigningCheque(false);
    }
  };

  const handleDeleteFactorCheque = async (factorChequeId: string) => {
    if (!confirm('آیا از حذف این چک از فاکتور اطمینان دارید؟')) return;

    try {
      setDeletingChequeId(factorChequeId);
      
      await apiService.deleteFactorCheque(factorChequeId, authToken);
      
      onSuccess('چک با موفقیت از فاکتور حذف شد');
      await fetchFactorCheques();
    } catch (err) {
      setChequeError(err instanceof Error ? err.message : 'خطا در حذف چک از فاکتور');
    } finally {
      setDeletingChequeId(null);
    }
  };

  const handleCreateAndAssignCheque = async () => {
    try {
      setCreatingCheque(true);
      
      // Validate and convert price
      const validatedPrice = validateAndConvertChequePrice(displayChequePrice);
      if (!validatedPrice) {
        onError('مبلغ وارد شده نامعتبر است');
        setCreatingCheque(false);
        return;
      }
      
      // First, create the cheque
      const createData = await apiService.createCheque({
        number: newChequeForm.number,
        date: newChequeForm.date,
        price: validatedPrice,
        customerUserId: selectedFactor.customerData.account.id,
        managerUserId: selectedFactor.creatorData.account.id,
        creatorUserId: selectedFactor.creatorData.personal.userId,
        status: 'created',
        bankName: newChequeForm.bankName,
        description: newChequeForm.description,
        sayyadi: newChequeForm.sayyadi
      }, authToken);

      const newChequeId = createData.data.data.id;

      // Then, assign the cheque to the factor
      await apiService.assignChequeToFactor(selectedFactor.id, newChequeId, authToken);

      onSuccess('چک جدید ایجاد و با موفقیت به فاکتور تخصیص داده شد');
      
      // Reset form and close
      setNewChequeForm({
        number: '',
        date: '',
        price: 0,
        bankName: '',
        description: '',
        sayyadi: false
      });
      setDisplayChequePrice('');
      setShowCreateChequeForm(false);
      setShowAddCheque(false);
      
      // Refresh the lists
      await fetchFactorCheques();
      await fetchCustomerCheques();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to create and assign cheque');
    } finally {
      setCreatingCheque(false);
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

  const getBankDisplayName = (bankName: string): string => {
    const bankNames: Record<string, string> = {
      'tejarat': 'تجارت',
      'melli': 'ملی',
      'saderat': 'صادرات',
      'mellat': 'ملت',
      'parsian': 'پارسیان',
      'pasargad': 'پاسارگاد',
      'eghtesad_novin': 'اقتصاد نوین',
      'saman': 'سامان',
      'sina': 'سینا',
      'dey': 'دی',
      'keshavarzi': 'کشاورزی',
      'maskan': 'مسکن',
      'refah': 'رفاه',
      'post_bank': 'پست بانک',
      'tourism': 'گردشگری',
      'karafarin': 'کارآفرین',
      'middle_east': 'خاورمیانه',
      'ghavamin': 'قوامین',
      'mehr_iran': 'مهر ایران',
      'mehr_eghtesad': 'مهر اقتصاد',
      'shahr': 'شهر',
      'ayandeh': 'آینده',
      'hekmat_iranian': 'حکمت ایرانیان',
      'iran_zamin': 'ایران زمین',
      'resalat': 'رسالت',
      'ansar': 'انصار'
    };
    return bankNames[bankName] || bankName;
  };

  useEffect(() => {
    // Only fetch cheques if payment method is cheque
    if (selectedFactor.paymentMethod === PaymentMethod.CHEQUE) {
      fetchFactorCheques();
    }
  }, [selectedFactor.id]);

  useEffect(() => {
    if (showAddCheque) {
      fetchCustomerCheques();
    }
  }, [showAddCheque, selectedFactor, chequeSearchNumber]);

  // Don't render if payment method is not cheque
  if (selectedFactor.paymentMethod !== PaymentMethod.CHEQUE) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2 space-x-reverse">
          <CreditCard className="w-5 h-5 text-purple-500" />
          <span>چک‌های تخصیص داده شده</span>
        </h3>
        <button
          onClick={() => setShowAddCheque(true)}
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 space-x-reverse transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>افزودن چک</span>
        </button>
      </div>



      {chequeError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            {chequeError}
          </p>
        </div>
      )}

      {/* Add Cheque Form */}
      {showAddCheque && (
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h4 className="text-md font-medium text-gray-900 mb-3">تخصیص چک به فاکتور</h4>
          
          <div className="space-y-4">
            {/* Customer Cheques Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                انتخاب چک از لیست چک‌های مشتری
              </label>
               <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                جستجو بر اساس شماره چک
              </label>
              <input
                type="text"
                value={chequeSearchNumber}
                onChange={(e) => setChequeSearchNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="شماره چک را وارد کنید..."
              />
            </div>
              {customerChequesLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-2">در حال بارگذاری چک‌ها...</p>
                </div>
              ) : customerCheques.length === 0 ? (
                <div className="p-4 text-center text-gray-500 border border-gray-300 rounded-md">
                  هیچ چک قابل تخصیصی برای این مشتری یافت نشد
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md">
                  {customerCheques.map((cheque) => (
                    <div
                      key={cheque.id}
                      className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                        selectedCheque === cheque.id ? 'bg-purple-50 border-purple-200' : ''
                      }`}
                      onClick={() => setSelectedCheque(cheque.id)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-gray-900">
                            شماره چک: {toPersianDigits(cheque.number)}
                          </div>
                          <div className="text-sm text-gray-600">
                            تاریخ: {toPersianDigits(cheque.date)} | 
                            مبلغ: {formatCurrency(cheque.price)} ریال | 
                            بانک: {getBankDisplayName(cheque.bankName)}
                          </div>
                          {cheque.description && (
                            <div className="text-sm text-gray-500 mt-1">
                              توضیحات: {cheque.description}
                            </div>
                          )}
                        </div>
                        <input
                          type="radio"
                          name="selectedCheque"
                          checked={selectedCheque === cheque.id}
                          onChange={() => setSelectedCheque(cheque.id)}
                          className="text-purple-600"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Create New Cheque Section */}
            <div className="border-t border-purple-200 pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-medium text-gray-900">یا</h5>
                <button
                  onClick={() => setShowCreateChequeForm(!showCreateChequeForm)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1 space-x-reverse"
                >
                  <Plus className="w-3 h-3" />
                  <span>ایجاد چک جدید</span>
                </button>
              </div>
              
              {showCreateChequeForm && (
                <div className="bg-white border border-gray-300 rounded-lg p-4 space-y-4">
                  <h6 className="text-sm font-medium text-gray-900 mb-3">اطلاعات چک جدید</h6>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">شماره چک</label>
                      <input
                        type="text"
                        value={newChequeForm.number}
                        onChange={(e) => setNewChequeForm({ ...newChequeForm, number: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="شماره چک"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ چک</label>
                      <PersianDatePicker
                        value={newChequeForm.date}
                        onChange={(val) => setNewChequeForm({ ...newChequeForm, date: val })}
                        placeholder="انتخاب تاریخ چک"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">مبلغ (ریال)</label>
                      <input
                        type="text"
                        value={displayChequePrice}
                        onChange={(e) => setDisplayChequePrice(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                        placeholder="مبلغ چک (مثال: ۱۰۰۰۰۰۰)"
                        required
                      />
                      <div className="text-xs text-gray-500 mt-1 text-right">
                        می‌توانید اعداد فارسی یا انگلیسی وارد کنید
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">بانک</label>
                      <select
                        value={newChequeForm.bankName}
                        onChange={(e) => setNewChequeForm({ ...newChequeForm, bankName: e.target.value })}
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
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات</label>
                    <textarea
                      value={newChequeForm.description}
                      onChange={(e) => setNewChequeForm({ ...newChequeForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="توضیحات (اختیاری)"
                      rows={2}
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="sayyadi"
                      checked={newChequeForm.sayyadi}
                      onChange={(e) => setNewChequeForm({ ...newChequeForm, sayyadi: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="sayyadi" className="mr-2 text-sm text-gray-700">
                      صیادی
                    </label>
                  </div>
                  
                  <div className="flex space-x-2 space-x-reverse">
                    <button
                      onClick={handleCreateAndAssignCheque}
                      disabled={!newChequeForm.number || !newChequeForm.date || !displayChequePrice.trim() || !newChequeForm.bankName || creatingCheque}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 space-x-reverse"
                    >
                      {creatingCheque ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>در حال ایجاد...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>ایجاد و تخصیص چک</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowCreateChequeForm(false)}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
                    >
                      انصراف
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 space-x-reverse">
              <button
                onClick={handleAssignCheque}
                disabled={!selectedCheque || assigningCheque}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 space-x-reverse"
              >
                {assigningCheque ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>در حال تخصیص...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>تخصیص چک</span>
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowAddCheque(false);
                  setChequeSearchNumber('');
                  setSelectedCheque('');
                  setChequeError(null);
                  setShowCreateChequeForm(false);
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                انصراف
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Factor Cheques Table */}
      {factorChequesLoading ? (
        <div className="animate-pulse">
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">شماره چک</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاریخ</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">مبلغ</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">بانک</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">وضعیت</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">توضیحات</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عملیات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {factorCheques.map((factorCheque) => (
                <tr key={factorCheque.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {toPersianDigits(factorCheque.chequeData.number)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDateDisplay(factorCheque.chequeData.date)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(factorCheque.chequeData.price)} ریال
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getBankDisplayName(factorCheque.chequeData.bankName)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      factorCheque.chequeData.status === ChequeStatus.CREATED ? 'bg-blue-100 text-blue-800' :
                      factorCheque.chequeData.status === ChequeStatus.PASSED ? 'bg-green-100 text-green-800' :
                      factorCheque.chequeData.status === ChequeStatus.REJECTED ? 'bg-red-100 text-red-800' :
                      factorCheque.chequeData.status === ChequeStatus.CANCELED ? 'bg-gray-100 text-gray-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {factorCheque.chequeData.status === ChequeStatus.CREATED ? 'ایجاد شده' :
                       factorCheque.chequeData.status === ChequeStatus.PASSED ? 'پاس شده' :
                       factorCheque.chequeData.status === ChequeStatus.REJECTED ? 'رد شده' :
                       factorCheque.chequeData.status === ChequeStatus.CANCELED ? 'لغو شده' :
                       factorCheque.chequeData.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {factorCheque.chequeData.description || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <button
                        onClick={() => setSelectedChequeForDetails(factorCheque.chequeData.id)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                        title="مشاهده جزئیات چک"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {selectedFactor.status !== FactorStatus.APPROVED_BY_FINANCE && (
                        <button
                          onClick={() => handleDeleteFactorCheque(factorCheque.id)}
                          disabled={deletingChequeId === factorCheque.id}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="حذف چک از فاکتور"
                        >
                          {deletingChequeId === factorCheque.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {factorCheques.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500 text-lg mb-2">هیچ چکی تخصیص داده نشده</div>
              <p className="text-gray-400 text-sm">چک‌های تخصیص داده شده به این فاکتور در اینجا نمایش داده می‌شوند</p>
            </div>
          )}
        </div>
      )}



      {/* Total Checks Amount - Similar to Invoice Total */}
      {factorCheques.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2 space-x-reverse">
              <CreditCard className="w-5 h-5 text-purple-500" />
              <span>مجموع مبالغ چک‌های تخصیص داده شده</span>
            </h3>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(factorCheques.reduce((total, factorCheque) => total + factorCheque.chequeData.price, 0))} ریال
            </div>
          </div>
          
          {/* Additional info below the total */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>تعداد چک‌های تخصیص داده شده:</span>
              <span className="font-medium">{toPersianDigits(factorCheques.length)} چک</span>
            </div>
            
            {/* Passed checks information */}
            {(() => {
              const passedCheques = factorCheques.filter(cheque => cheque.chequeData.status === ChequeStatus.PASSED);
              const passedAmount = passedCheques.reduce((total, cheque) => total + cheque.chequeData.price, 0);
              return passedCheques.length > 0 && (
                <>
                  <div className="flex justify-between items-center text-sm text-gray-600 mt-2">
                    <span>تعداد چک‌های پاس شده:</span>
                    <span className="font-medium text-green-600">{toPersianDigits(passedCheques.length)} چک</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-600 mt-2">
                    <span>مجموع مبالغ چک‌های پاس شده:</span>
                    <span className="font-medium text-green-600">{formatCurrency(passedAmount)} ریال</span>
                  </div>
                </>
              );
            })()}
            
            {selectedFactor.totalAmount && (
              <>
                <div className="flex justify-between items-center text-sm text-gray-600 mt-2">
                  <span>درصد پوشش چک‌ها:</span>
                  <span className="font-medium">
                    {toPersianDigits(Math.round((factorCheques.reduce((total, factorCheque) => total + factorCheque.chequeData.price, 0) / selectedFactor.totalAmount) * 100))}%
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600 mt-2">
                  <span>مبلغ باقی‌مانده:</span>
                  <span className="font-medium text-orange-600">
                    {formatCurrency(Math.max(0, selectedFactor.totalAmount - factorCheques.reduce((total, factorCheque) => total + factorCheque.chequeData.price, 0)))} ریال
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Cheque Details Modal */}
      {selectedChequeForDetails && (
        <ChequeDetails
          authToken={authToken}
          chequeId={selectedChequeForDetails}
          onClose={() => setSelectedChequeForDetails(null)}
          onError={onError}
        />
      )}
    </div>
  );
};

export default InvoiceCheques; 