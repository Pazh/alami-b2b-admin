import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Building, Tag, FileText, AlertTriangle, XCircle, Trash2 as TrashIcon, CheckCircle } from 'lucide-react';
import { RoleEnum } from '../types/roles';
import { 
  FactorStatus,
  FACTOR_STATUS_DISPLAY_NAMES,
  FACTOR_STATUS_COLORS
} from '../types/invoiceTypes';
import { formatCurrency, toPersianDigits } from '../utils/numberUtils';
import apiService from '../services/apiService';
import InvoiceItems from './InvoiceItems';
import InvoiceCheques from './InvoiceCheques';
import InvoiceTransactions from './InvoiceTransactions';
import InvoiceComment from './InvoiceComment';
import InvoiceLogs from './InvoiceLogs';

interface Personal {
  userId: string;
  firstName: string;
  lastName: string;
  profile?: string;
}

interface Account {
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
}

interface CustomerData {
  personal: Personal;
  account: Account;
}

interface CreatorData {
  personal: Personal;
  account: Account;
}

interface Tag {
  id: string;
  name: string;
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

interface InvoiceDetailsProps {
  authToken: string;
  userId: number;
  userRole: RoleEnum;
  selectedFactor: Factor;
  onBack: () => void;
}

const InvoiceDetails: React.FC<InvoiceDetailsProps> = ({ 
  authToken, 
  userId, 
  userRole, 
  selectedFactor, 
  onBack 
}) => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingInvoiceDetails, setEditingInvoiceDetails] = useState<string | null>(null);
  const [editDetailsForm, setEditDetailsForm] = useState<any>({});
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingDetails, setUpdatingDetails] = useState(false);
  const [updatingFactorStatus, setUpdatingFactorStatus] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const [logsRefreshTrigger, setLogsRefreshTrigger] = useState(0);
  const [customerDebt, setCustomerDebt] = useState<{
    totalTransactions: number;
    totalDebt: number;
    finalDebt: number;
  } | null>(null);
  const [loadingDebt, setLoadingDebt] = useState(false);

  const formatDateDisplay = (dateStr: string) => {
    if (dateStr.length === 8) {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      return toPersianDigits(`${year}/${month}/${day}`);
    }
    return toPersianDigits(dateStr);
  };

  // Fetch customer debt information
  useEffect(() => {
    const fetchCustomerDebt = async () => {
      if (!selectedFactor.customerUserId) return;
      
      try {
        setLoadingDebt(true);
        const response = await apiService.getCustomerDebt(selectedFactor.customerUserId, authToken);
        setCustomerDebt(response.data);
      } catch (err) {
        console.error('Failed to fetch customer debt:', err);
        setError('خطا در دریافت اطلاعات بدهی مشتری');
      } finally {
        setLoadingDebt(false);
      }
    };

    fetchCustomerDebt();
  }, [selectedFactor.customerUserId, authToken]);

  // Status update functions
  const handleApproveByFinance = async () => {
    if (!confirm('آیا از تایید این فاکتور توسط مالی اطمینان دارید؟')) return;
    
    try {
      setUpdatingFactorStatus(true);
      await apiService.updateInvoiceStatus(selectedFactor.id, FactorStatus.APPROVED_BY_FINANCE, userId, authToken);
      setSuccess('فاکتور با موفقیت توسط مالی تایید شد');
      // Update local state
      selectedFactor.status = FactorStatus.APPROVED_BY_FINANCE;
      // Refresh logs
      setLogsRefreshTrigger(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در تایید فاکتور');
    } finally {
      setUpdatingFactorStatus(false);
    }
  };

  const handleApproveByManager = async () => {
    if (!confirm('آیا از تایید این فاکتور توسط مدیر اطمینان دارید؟')) return;
    
    try {
      setUpdatingFactorStatus(true);
      await apiService.updateInvoiceStatus(selectedFactor.id, FactorStatus.APPROVED_BY_MANAGER, userId, authToken);
      setSuccess('فاکتور با موفقیت توسط مدیر تایید شد');
      // Update local state
      selectedFactor.status = FactorStatus.APPROVED_BY_MANAGER;
      // Refresh logs
      setLogsRefreshTrigger(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در تایید فاکتور');
    } finally {
      setUpdatingFactorStatus(false);
    }
  };

  const handleRejectFactor = async () => {
    if (!confirm('آیا از رد این فاکتور اطمینان دارید؟')) return;
    
    try {
      setUpdatingFactorStatus(true);
      await apiService.updateInvoiceStatus(selectedFactor.id, FactorStatus.CANCELED, userId, authToken);
      setSuccess('فاکتور با موفقیت رد شد');
      // Update local state
      selectedFactor.status = FactorStatus.CANCELED;
      // Refresh logs
      setLogsRefreshTrigger(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در رد فاکتور');
    } finally {
      setUpdatingFactorStatus(false);
    }
  };

  const handleDeleteFactor = async () => {
    if (!confirm('آیا از حذف این فاکتور اطمینان دارید؟ این عمل قابل بازگشت نیست.')) return;
    
    try {
      setUpdatingFactorStatus(true);
      await apiService.updateInvoiceStatus(selectedFactor.id, FactorStatus.DELETED, userId, authToken);
      setSuccess('فاکتور با موفقیت حذف شد');
      // Update local state
      selectedFactor.status = FactorStatus.DELETED;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در حذف فاکتور');
    } finally {
      setUpdatingFactorStatus(false);
    }
  };

  // Check permissions for status updates
  const canApproveByFinance = () => {
    return userRole === RoleEnum.FINANCEMANAGER && 
           selectedFactor.status === FactorStatus.APPROVED_BY_MANAGER;
  };

  const canApproveByManager = () => {
    return (userRole === RoleEnum.SALEMANAGER || userRole === RoleEnum.MANAGER) && 
           selectedFactor.status === FactorStatus.CREATED;
  };

  const canRejectOrDelete = () => {
    return (userRole === RoleEnum.SALEMANAGER || 
            userRole === RoleEnum.FINANCEMANAGER || 
            userRole === RoleEnum.MANAGER) &&
           (selectedFactor.status === FactorStatus.CREATED || 
            selectedFactor.status === FactorStatus.APPROVED_BY_MANAGER);
  };



  const getFullName = (account: Account | null) => {
    if (!account) return 'نامشخص';
    return `${account.firstName} ${account.lastName || ''}`.trim();
  };

  const handleEditInvoiceDetails = (invoiceId: string) => {
    const invoice = selectedFactor;
    if (invoice) {
      setEditingInvoiceDetails(invoiceId);
      setEditDetailsForm({
        name: invoice.name,
        date: invoice.date,
        paymentMethod: invoice.paymentMethod,
        orashFactorId: invoice.orashFactorId
      });
    }
  };

  const handleSaveInvoiceDetails = async () => {
    if (!editingInvoiceDetails) return;
    
    try {
      setUpdatingDetails(true);
      await apiService.updateInvoice(editingInvoiceDetails, { ...editDetailsForm, creatorUserId: userId }, authToken);
      setSuccess('اطلاعات فاکتور با موفقیت به‌روزرسانی شد');
      setEditingInvoiceDetails(null);
      setEditDetailsForm({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update invoice details');
    } finally {
      setUpdatingDetails(false);
    }
  };

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

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 space-x-reverse text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>بازگشت</span>
          </button>
          <h1 className="text-xl font-semibold text-gray-900">
            جزئیات فاکتور: {selectedFactor.name}
          </h1>
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

      {/* Factor Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Factor Details */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
            <FileText className="w-5 h-5 text-blue-500" />
            <span>اطلاعات فاکتور</span>
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium text-gray-700">نام فاکتور: </span>
              <span className="text-gray-900">{selectedFactor.name}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">تاریخ: </span>
              <span className="text-gray-900">{formatDateDisplay(selectedFactor.date)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">شناسه اوراش: </span>
              <span className="text-gray-900">{toPersianDigits(selectedFactor.orashFactorId)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">وضعیت: </span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${FACTOR_STATUS_COLORS[selectedFactor.status as FactorStatus]}`}>
                {FACTOR_STATUS_DISPLAY_NAMES[selectedFactor.status as FactorStatus]}
              </span>
            </div>

            <div>
              <span className="font-medium text-gray-700">
                برچسب‌ها: 
                {selectedFactor.tags && selectedFactor.tags.length > 0 && (
                  <span className="text-blue-600 text-xs mr-2">
                    ({toPersianDigits(selectedFactor.tags.length)} برچسب)
                  </span>
                )}
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedFactor.tags && selectedFactor.tags.length > 0 ? (
                  <>
                    {(showAllTags ? selectedFactor.tags : selectedFactor.tags.slice(0, 3)).map((tag, index) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105 animate-in zoom-in-50 duration-300"
                        style={{ animationDelay: `${index * 100}ms` }}
                        title={tag.name}
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag.name}
                      </span>
                    ))}
                    {selectedFactor.tags.length > 3 && !showAllTags && (
                      <button
                        onClick={() => setShowAllTags(true)}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105 hover:bg-gray-200"
                        title={`نمایش ${toPersianDigits(selectedFactor.tags.length - 3)} برچسب دیگر`}
                      >
                        +{toPersianDigits(selectedFactor.tags.length - 3)}
                      </button>
                    )}
                    {showAllTags && selectedFactor.tags.length > 3 && (
                      <button
                        onClick={() => setShowAllTags(false)}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105 hover:bg-blue-200"
                        title="نمایش کمتر"
                      >
                        کمتر
                      </button>
                    )}
                  </>
                ) : (
                  <span className="text-gray-400 text-sm flex items-center">
                    <Tag className="w-3 h-3 mr-1" />
                    بدون برچسب
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
            <User className="w-5 h-5 text-green-500" />
            <span>اطلاعات مشتری</span>
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium text-gray-700">نام: </span>
              <span className="text-gray-900">{getFullName(selectedFactor.customerData?.account)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">کد ملی: </span>
              <span className="text-gray-900">{toPersianDigits(selectedFactor.customerData?.account?.nationalCode || '')}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">کد نقش: </span>
              <span className="text-gray-900">{toPersianDigits(selectedFactor.customerData?.account?.naghshCode || '')}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">حداکثر بدهی: </span>
              <span className="text-gray-900">{formatCurrency(selectedFactor.customerData?.account?.maxDebt || 0)} ریال</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">سقف حساب باز: </span>
              <span className="text-gray-900">{formatCurrency(selectedFactor.customerData?.account?.maxOpenAccount || 0)} ریال</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">گرید: </span>
              <span className="text-gray-900">{selectedFactor.customerData?.account?.grade?.name || '-'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">حداکثر اعتبار: </span>
              <span className="text-gray-900">{formatCurrency(selectedFactor.customerData?.account?.grade?.maxCredit || 0)} ریال</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">شهر: </span>
              <span className="text-gray-900">{selectedFactor.customerData?.account?.city || '-'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">استان: </span>
              <span className="text-gray-900">{selectedFactor.customerData?.account?.state || '-'}</span>
            </div>
            
            {/* Debt Information */}
            <div className="border-t border-gray-200 pt-3 mt-3">
              <h4 className="font-semibold text-gray-800 mb-2">اطلاعات بدهی</h4>
              {loadingDebt ? (
                <div className="text-gray-500 text-sm">در حال بارگذاری...</div>
              ) : customerDebt ? (
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-gray-700">مجموع تراکنش‌ها: </span>
                    <span className="text-gray-900">{formatCurrency(customerDebt.totalTransactions)} ریال</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">مجموع بدهی: </span>
                    <span className="text-gray-900">{formatCurrency(customerDebt.totalDebt)} ریال</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">بدهی نهایی: </span>
                    <span className={`font-semibold ${customerDebt.finalDebt >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(Math.abs(customerDebt.finalDebt))} ریال
                      {customerDebt.finalDebt >= 0 ? ' (بدهکار)' : ' (بستانکار)'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-sm">اطلاعات بدهی در دسترس نیست</div>
              )}
            </div>
          </div>
        </div>

        {/* Creator Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
            <User className="w-5 h-5 text-purple-500" />
            <span>اطلاعات ایجادکننده</span>
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium text-gray-700">نام: </span>
              <span className="text-gray-900">{getFullName(selectedFactor.creatorData?.account)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">کد ملی: </span>
              <span className="text-gray-900">{toPersianDigits(selectedFactor.creatorData?.account?.nationalCode || '')}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">شهر: </span>
              <span className="text-gray-900">{selectedFactor.creatorData?.account?.city || '-'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">استان: </span>
              <span className="text-gray-900">{selectedFactor.creatorData?.account?.state || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Factor Status Actions */}
      {(canApproveByFinance() || canApproveByManager() || canRejectOrDelete()) && (
        <div className="bg-white rounded-lg shadow-md p-6 sticky top-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <span>عملیات فاکتور</span>
          </h3>
          
          <div className="flex flex-wrap gap-3">
            {canApproveByFinance() && (
              <button
                onClick={handleApproveByFinance}
                disabled={updatingFactorStatus}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 space-x-reverse transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updatingFactorStatus ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span>تایید توسط مالی</span>
              </button>
            )}

            {canApproveByManager() && (
              <button
                onClick={handleApproveByManager}
                disabled={updatingFactorStatus}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 space-x-reverse transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updatingFactorStatus ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span>تایید توسط مدیر</span>
              </button>
            )}

            {canRejectOrDelete() && (
              <>
                <button
                  onClick={handleRejectFactor}
                  disabled={updatingFactorStatus}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 space-x-reverse transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingFactorStatus ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  <span>رد فاکتور</span>
                </button>

                <button
                  onClick={handleDeleteFactor}
                  disabled={updatingFactorStatus}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 space-x-reverse transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingFactorStatus ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <TrashIcon className="w-4 h-4" />
                  )}
                  <span>حذف فاکتور</span>
                </button>
              </>
            )}
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>راهنما:</strong>
              {userRole === RoleEnum.FINANCEMANAGER && ' شما به عنوان مدیر مالی می‌توانید فاکتورهای تایید شده توسط مدیر را تایید نهایی کنید.'}
              {(userRole === RoleEnum.SALEMANAGER || userRole === RoleEnum.MANAGER) && ' شما به عنوان مدیر می‌توانید فاکتورهای ایجاد شده را تایید کنید.'}
              {(selectedFactor.status !== FactorStatus.APPROVED_BY_FINANCE) && ' همچنین امکان رد یا حذف فاکتور نیز وجود دارد.'}
              {selectedFactor.status === FactorStatus.APPROVED_BY_FINANCE && ' فاکتور تایید نهایی شده و قابل تغییر نیست.'}
            </p>
          </div>
        </div>
      )}

      {/* Invoice Items Component */}
      <InvoiceItems 
        authToken={authToken}
        userId={userId}
        userRole={userRole}
        selectedFactor={selectedFactor}
        onSuccess={setSuccess}
        onError={setError}
      />

      {/* Invoice Cheques Component */}
      <InvoiceCheques 
        authToken={authToken}
        selectedFactor={selectedFactor}
        onSuccess={setSuccess}
        onError={setError}
      />

      {/* Invoice Transactions Component */}
      <InvoiceTransactions 
        authToken={authToken}
        factorId={selectedFactor.id}
        customerUserId={selectedFactor.customerUserId}
        onSuccess={setSuccess}
        onError={setError}
      />

      {/* Invoice Comments */}
      <InvoiceComment 
        authToken={authToken}
        factorId={selectedFactor.id}
        userId={userId.toString()}
        onError={setError}
        refreshTrigger={logsRefreshTrigger}
      />

      {/* Factor Logs */}
      <InvoiceLogs 
        authToken={authToken}
        factorId={selectedFactor.id}
        onError={setError}
        refreshTrigger={logsRefreshTrigger}
      />
    </div>
  );
};

export default InvoiceDetails;