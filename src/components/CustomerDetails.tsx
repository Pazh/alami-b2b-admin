import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Building, CreditCard, MapPin, Calendar, Phone, Mail, Edit, Save, X, Eye, FileText, TrendingUp, Receipt, Clock, DollarSign, Tag } from 'lucide-react';
import { RoleEnum } from '../types/roles';
import { formatCurrency, toPersianDigits } from '../utils/numberUtils';
import { formatUnixTimestampShort } from '../utils/dateUtils';
import apiService from '../services/apiService';
import CustomerComment from './CustomerComment';

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

interface Customer {
  personal: Personal;
  account: Account;
}

interface Tag {
  id: string;
  name: string;
}

interface CustomerDetailsProps {
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
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);

  useEffect(() => {
    fetchCustomerDebt();
    fetchCustomerTransactions();
    fetchCustomerInvoices();
  }, [customer.account.userId]);

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

  const fetchCustomerTransactions = async () => {
    try {
      setTransactionsLoading(true);
      const response = await apiService.getCustomerTransactions(customer.account.userId, authToken);
      setTransactions(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch customer transactions:', err);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const fetchCustomerInvoices = async () => {
    try {
      setInvoicesLoading(true);
      const response = await apiService.getCustomerInvoices(customer.account.userId, authToken);
      setInvoices(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch customer invoices:', err);
    } finally {
      setInvoicesLoading(false);
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
                      <p className="text-2xl font-bold text-blue-900">{toPersianDigits(customerDebt.totalTransactions)}</p>
                    </div>
                    <FileText className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-600">کل بدهی</p>
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
                   <div className="text-2xl font-bold text-blue-600">{toPersianDigits(transactions.length)}</div>
                   <div className="text-sm text-gray-600">تعداد تراکنش‌ها</div>
                 </div>
                 <div className="text-center">
                   <div className="text-2xl font-bold text-green-600">
                     {formatCurrency(transactions.reduce((total, t) => total + parseFloat(t.price), 0))} ریال
                   </div>
                   <div className="text-sm text-gray-600">مجموع مبالغ</div>
                 </div>
                 <div className="text-center">
                   <div className="text-2xl font-bold text-purple-600">
                     {formatCurrency(transactions.filter(t => t.method === 'cash').reduce((total, t) => total + parseFloat(t.price), 0))} ریال
                   </div>
                   <div className="text-sm text-gray-600">پرداخت‌های نقدی</div>
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
             </div>
           </div>
         )}
       </div>

       {/* Customer Invoices */}
       <div className="bg-white rounded-lg shadow-md p-6">
         <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
           <FileText className="w-5 h-5 text-blue-500" />
           <span>فاکتورهای مشتری</span>
         </h3>
         
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
           <div className="overflow-x-auto">
             <table className="w-full table-auto">
               <thead>
                 <tr className="bg-gray-50 border-b">
                   <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نام فاکتور</th>
                   <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">وضعیت</th>
                   <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تگ‌ها</th>
                   <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عملیات</th>
                 </tr>
               </thead>
               <tbody className="bg-white divide-y divide-gray-200">
                 {invoices.map((invoice) => (
                   <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                     <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                       <div className="flex items-center space-x-2 space-x-reverse">
                         <FileText className="w-4 h-4 text-gray-400" />
                         <span className="font-medium">{invoice.name || invoice.id}</span>
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
                     <td className="px-4 py-4">
                       <div className="flex flex-wrap gap-1">
                         {invoice.tags && invoice.tags.length > 0 ? (
                           invoice.tags.map((tag: Tag) => (
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