import React, { useState, useEffect } from 'react';
import { Plus, CreditCard, FileText, Calendar, DollarSign, Hash, RefreshCw, AlertCircle } from 'lucide-react';
import { formatCurrency, toPersianDigits, toEnglishDigits } from '../utils/numberUtils';
import { toPersianDate } from '../utils/dateUtils';
import apiService from '../services/apiService';
import PersianDatePicker from './PersianDatePicker';

interface Transaction {
  id: string;
  customerUserId: string;
  chequeId: string | null;
  factorId: string;
  trackingCode: string | null;
  price: string;
  method: 'cash' | 'cheque';
  createdAt: string;
  cheque?: {
    id: string;
    number: string;
    date: string;
    price: number;
    bankName: string;
    status: string;
    description?: string;
  };
}

interface InvoiceTransactionsProps {
  authToken: string;
  factorId: string;
  customerUserId: string;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

const InvoiceTransactions: React.FC<InvoiceTransactionsProps> = ({
  authToken,
  factorId,
  customerUserId,
  onSuccess,
  onError
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    trackingCode: '',
    price: '',
    createdAt: ''
  });
  
  // Display price in Persian digits for user input
  const [displayPrice, setDisplayPrice] = useState('');

  // Load transactions
  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await apiService.getFactorTransactions(factorId, authToken);
      setTransactions(response.data.data || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در بارگذاری تراکنش‌ها';
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Validate and convert price input
  const validateAndConvertPrice = (priceInput: string): string | null => {
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
    
    return numPrice.toString();
  };

  // Convert Persian YYYYMMDD to Unix seconds (approximate)
  const convertPersianDateToUnixSeconds = (persianYmd: string): string => {
    if (!persianYmd || persianYmd.length !== 8) return '';
    const year = parseInt(persianYmd.substring(0, 4));
    const month = parseInt(persianYmd.substring(4, 6));
    const day = parseInt(persianYmd.substring(6, 8));

    let gregorianYear = year + 621;
    let gregorianMonth: number;
    if (month <= 9) {
      gregorianMonth = month + 3;
    } else {
      gregorianMonth = month - 9;
      gregorianYear += 1;
    }
    const gregorianDay = day;

    const unixSeconds = Math.floor(new Date(gregorianYear, gregorianMonth - 1, gregorianDay).getTime() / 1000);
    return unixSeconds.toString();
  };

  // Create new transaction
  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.trackingCode.trim() || !displayPrice.trim() || !formData.createdAt.trim()) {
      onError?.('لطفاً تمام فیلدها را پر کنید');
      return;
    }

    // Validate and convert price
    const validatedPrice = validateAndConvertPrice(displayPrice);
    if (!validatedPrice) {
      onError?.('مبلغ وارد شده نامعتبر است');
      return;
    }

    try {
      setCreating(true);
      const createdAtUnix = convertPersianDateToUnixSeconds(formData.createdAt);
      if (!createdAtUnix) {
        onError?.('تاریخ واریز نامعتبر است');
        setCreating(false);
        return;
      }
      const transactionData = {
        customerUserId,
        chequeId: null,
        factorId,
        trackingCode: formData.trackingCode.trim(),
        price: validatedPrice,
        method: 'cash' as const,
        createdAt: createdAtUnix
      };

      await apiService.createTransaction(transactionData, authToken);
      
      onSuccess?.('تراکنش با موفقیت ایجاد شد');
      setShowCreateForm(false);
      setFormData({ trackingCode: '', price: '', createdAt: '' });
      setDisplayPrice('');
      loadTransactions(); // Refresh the list
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در ایجاد تراکنش';
      onError?.(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [factorId]);

  const formatTransactionDate = (timestamp: string) => {
    try {
      const date = new Date(parseInt(timestamp) * 1000);
      return toPersianDate(date);
    } catch {
      return 'نامشخص';
    }
  };

  const getMethodDisplayName = (method: string) => {
    return method === 'cash' ? 'نقدی' : 'چک';
  };

  const getMethodColor = (method: string) => {
    return method === 'cash' 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-blue-100 text-blue-800 border-blue-200';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2 space-x-reverse">
          <CreditCard className="w-5 h-5 text-purple-500" />
          <span>تراکنش‌های فاکتور</span>
        </h3>
        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            onClick={loadTransactions}
            disabled={loading}
            className="p-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
            title="بارگذاری مجدد"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 space-x-reverse transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن تراکنش نقدی</span>
          </button>
        </div>
      </div>

      {/* Create Transaction Form */}
      {showCreateForm && (
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h4 className="text-md font-medium text-purple-900 mb-4">افزودن تراکنش نقدی جدید</h4>
          <form onSubmit={handleCreateTransaction} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  کد پیگیری
                </label>
                <input
                  type="text"
                  value={formData.trackingCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, trackingCode: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="کد پیگیری"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  مبلغ (ریال)
                </label>
                <input
                  type="text"
                  value={displayPrice}
                  onChange={(e) => setDisplayPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-right"
                  placeholder="مبلغ تراکنش (مثال: ۱۰۰۰۰۰۰)"
                  required
                />
                <div className="text-xs text-gray-500 mt-1 text-right">
                  می‌توانید اعداد فارسی یا انگلیسی وارد کنید
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  تاریخ واریز
                </label>
                <PersianDatePicker
                  value={formData.createdAt}
                  onChange={(val) => setFormData(prev => ({ ...prev, createdAt: val }))}
                  placeholder="انتخاب تاریخ واریز"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                type="submit"
                disabled={creating}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 space-x-reverse transition-colors disabled:opacity-50"
              >
                {creating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>{creating ? 'در حال ایجاد...' : 'ایجاد تراکنش'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({ trackingCode: '', price: '', createdAt: '' });
                  setDisplayPrice('');
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                انصراف
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transactions List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            <span className="mr-3 text-gray-600">در حال بارگذاری...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>هیچ تراکنشی برای این فاکتور یافت نشد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    نوع تراکنش
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    مبلغ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    کد پیگیری
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    تاریخ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    جزئیات چک
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getMethodColor(transaction.method)}`}>
                        {transaction.method === 'cash' ? (
                          <CreditCard className="w-3 h-3 ml-1" />
                        ) : (
                          <FileText className="w-3 h-3 ml-1" />
                        )}
                        {getMethodDisplayName(transaction.method)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 text-green-500 ml-1" />
                        {formatCurrency(parseInt(transaction.price))} ریال
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.trackingCode ? (
                        <div className="flex items-center">
                          <Hash className="w-4 h-4 text-blue-500 ml-1" />
                          {toPersianDigits(transaction.trackingCode)}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-orange-500 ml-1" />
                        {formatTransactionDate(transaction.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.cheque && transaction.method === 'cheque' ? (
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <span className="font-medium">شماره چک:</span>
                            <span className="mr-2">{toPersianDigits(transaction.cheque.number)}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium">بانک:</span>
                            <span className="mr-2">{transaction.cheque.bankName}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium">تاریخ چک:</span>
                            <span className="mr-2">{toPersianDigits(transaction.cheque.date)}</span>
                          </div>
                          {transaction.cheque.description && (
                            <div className="flex items-center">
                              <span className="font-medium">توضیحات:</span>
                              <span className="mr-2 text-gray-600">{transaction.cheque.description}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      {transactions.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="flex items-center space-x-2 space-x-reverse">
                <AlertCircle className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600">مجموع تراکنش‌ها:</span>
                <span className="font-medium">{toPersianDigits(transactions.length)}</span>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <DollarSign className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">مجموع مبالغ:</span>
                <span className="font-medium">
                  {formatCurrency(
                    transactions.reduce((sum, t) => sum + parseInt(t.price), 0)
                  )} ریال
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {toPersianDigits(transactions.filter(t => t.method === 'cash').length)} تراکنش نقدی | 
              {toPersianDigits(transactions.filter(t => t.method === 'cheque').length)} تراکنش چک
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceTransactions; 