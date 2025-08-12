import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  User, 
  Building, 
  Tag, 
  FileText, 
  AlertTriangle, 
  XCircle, 
  Trash2 as TrashIcon, 
  CheckCircle, 
  Edit3, 
  Plus, 
  X, 
  Save, 
  Loader2,
  Calendar,
  Hash,
  CreditCard,
  TrendingUp,
  Shield,
  Clock,
  MapPin,
  DollarSign,
  Eye,
  Settings
} from 'lucide-react';
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
import TagSelector from './TagSelector';
import { formatPersianDateForDisplay } from '../utils/dateUtils';

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
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [editingTags, setEditingTags] = useState(false);
  const [tempTags, setTempTags] = useState<Tag[]>([]);
  const [currentTags, setCurrentTags] = useState<Tag[]>([]);
  const [updatingTags, setUpdatingTags] = useState(false);

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  useEffect(() => {
    const fetchCustomerDebt = async () => {
      try {
        setLoadingDebt(true);
        const response = await apiService.getCustomerDebt(selectedFactor.customerUserId, authToken);
        setCustomerDebt(response.data);
      } catch (err) {
        console.error('Failed to fetch customer debt:', err);
      } finally {
        setLoadingDebt(false);
      }
    };

    const loadAvailableTags = async () => {
      try {
        const response = await apiService.getTags(100, 0, authToken);
        setAvailableTags(response.data.data || []);
      } catch (err) {
        console.error('Failed to load available tags:', err);
      }
    };

    fetchCustomerDebt();
    loadAvailableTags();
  }, [selectedFactor.customerUserId, authToken]);

  useEffect(() => {
    setTempTags(selectedFactor.tags || []);
    setCurrentTags(selectedFactor.tags || []);
  }, [selectedFactor.tags]);

  const handleStartEditTags = () => {
    setEditingTags(true);
    setTempTags(currentTags); // استفاده از currentTags به جای selectedFactor.tags
  };

  const handleCancelEditTags = () => {
    setEditingTags(false);
    setTempTags(currentTags); // استفاده از currentTags به جای selectedFactor.tags
  };

  const handleRemoveTag = (tagId: string) => {
    setTempTags(prev => prev.filter(tag => tag.id !== tagId));
  };

  const handleSaveTags = async () => {
    try {
      setUpdatingTags(true);
      await apiService.updateInvoice(selectedFactor.id, { 
        tags: tempTags.map(t => t.id),
        creatorUserId: userId,
        status: selectedFactor.status // ارسال status فعلی فاکتور
      }, authToken);
      
      // به‌روزرسانی UI برچسب‌ها با مقادیر جدید
      setCurrentTags(tempTags);
      
      setSuccess('برچسب‌ها با موفقیت به‌روزرسانی شدند');
      setEditingTags(false);
      setLogsRefreshTrigger(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tags');
    } finally {
      setUpdatingTags(false);
    }
  };

  const handleApproveByFinance = async () => {
    try {
      setUpdatingFactorStatus(true);
      await apiService.updateInvoiceStatus(selectedFactor.id, 'approved_by_finance', userId, authToken);
      setSuccess('فاکتور با موفقیت توسط مالی تایید شد');
      setLogsRefreshTrigger(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve by finance');
    } finally {
      setUpdatingFactorStatus(false);
    }
  };

  const handleApproveByManager = async () => {
    try {
      setUpdatingFactorStatus(true);
      await apiService.updateInvoiceStatus(selectedFactor.id, 'approved_by_manager', userId, authToken);
      setSuccess('فاکتور با موفقیت توسط مدیر تایید شد');
      setLogsRefreshTrigger(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve by manager');
    } finally {
      setUpdatingFactorStatus(false);
    }
  };

  const handleRejectFactor = async () => {
    try {
      setUpdatingFactorStatus(true);
      await apiService.updateInvoiceStatus(selectedFactor.id, 'canceled', userId, authToken);
      setSuccess('فاکتور با موفقیت رد شد');
      setLogsRefreshTrigger(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject factor');
    } finally {
      setUpdatingFactorStatus(false);
    }
  };

  const handleDeleteFactor = async () => {
    if (!window.confirm('آیا از حذف این فاکتور اطمینان دارید؟')) return;
    
    try {
      setUpdatingFactorStatus(true);
      await apiService.updateInvoiceStatus(selectedFactor.id, 'deleted', userId, authToken);
      setSuccess('فاکتور با موفقیت حذف شد');
      setLogsRefreshTrigger(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete factor');
    } finally {
      setUpdatingFactorStatus(false);
    }
  };

  const canApproveByFinance = () => {
    return userRole === RoleEnum.FINANCEMANAGER && selectedFactor.status === 'approved_by_manager';
  };

  const canApproveByManager = () => {
    return (userRole === RoleEnum.SALEMANAGER || userRole === RoleEnum.MANAGER) && selectedFactor.status === 'created';
  };

  const canRejectOrDelete = () => {
    return selectedFactor.status !== 'approved_by_finance' && selectedFactor.status !== 'deleted';
  };

  const getFullName = (account: Account | null) => {
    if (!account) return '-';
    return `${account.firstName} ${account.lastName || ''}`.trim();
  };

  const handleEditInvoiceDetails = (invoiceId: string) => {
    const invoice = selectedFactor;
    setEditingInvoiceDetails(invoiceId);
    setEditDetailsForm({
      name: invoice.name,
      date: invoice.date,
      paymentMethod: invoice.paymentMethod,
      orashFactorId: invoice.orashFactorId
    });
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'created':
        return <Clock className="w-4 h-4" />;
      case 'approved_by_manager':
        return <Shield className="w-4 h-4" />;
      case 'approved_by_finance':
        return <CheckCircle className="w-4 h-4" />;
      case 'canceled':
        return <XCircle className="w-4 h-4" />;
      case 'deleted':
        return <TrashIcon className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <DollarSign className="w-4 h-4" />;
      case 'cheque':
        return <CreditCard className="w-4 h-4" />;
      case 'transfer':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white shadow-2xl rounded-3xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 space-x-reverse text-white/90 hover:text-white transition-all duration-200 hover:scale-105 bg-white/10 hover:bg-white/20 rounded-xl px-4 py-2 backdrop-blur-sm"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">بازگشت</span>
              </button>
              <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <FileText className="w-6 h-6" />
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">جزئیات فاکتور</h1>
              <p className="text-blue-100 text-lg">{selectedFactor.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Banner */}
        <div className="mb-8">
          <div className={`inline-flex items-center space-x-3 space-x-reverse px-6 py-4 rounded-2xl shadow-lg ${FACTOR_STATUS_COLORS[selectedFactor.status as FactorStatus]} bg-opacity-10 backdrop-blur-sm`}>
            {getStatusIcon(selectedFactor.status)}
            <span className="font-semibold text-lg">
              {FACTOR_STATUS_DISPLAY_NAMES[selectedFactor.status as FactorStatus]}
            </span>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-2xl shadow-lg animate-slide-up">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <XCircle className="w-3 h-3 text-white" />
              </div>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-2xl shadow-lg animate-slide-up">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
              <p className="text-green-700 font-medium">{success}</p>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          {/* Factor Details Card */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-white/20 backdrop-blur-sm">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-3 space-x-reverse">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <span>اطلاعات فاکتور</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-sm text-gray-500">نام فاکتور</span>
                    </div>
                    <span className="font-semibold text-gray-900">{selectedFactor.name}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-sm text-gray-500">تاریخ</span>
                    </div>
                    <span className="font-semibold text-gray-900">{toPersianDigits(formatPersianDateForDisplay(selectedFactor.date))}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Hash className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="text-sm text-gray-500">شناسه اوراش</span>
                    </div>
                    <span className="font-semibold text-gray-900">{toPersianDigits(selectedFactor.orashFactorId)}</span>
                  </div>

                  {/* <div className="flex items-center space-x-3 space-x-reverse p-4 bg-gray-50 rounded-2xl">
                    <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
                      {getPaymentMethodIcon(selectedFactor.paymentMethod)}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">روش پرداخت</p>
                      <p className="font-semibold text-gray-900">
                        {selectedFactor.paymentMethod === 'cheque' ? 'چک' :
                         selectedFactor.paymentMethod === 'cash' ? 'نقدی' :
                         selectedFactor.paymentMethod === 'transfer' ? 'انتقال' :
                         selectedFactor.paymentMethod}
                      </p>
                    </div>
                  </div> */}

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
                        <User className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="text-sm text-gray-500">ایجادکننده</span>
                    </div>
                    <span className="font-semibold text-gray-900">{getFullName(selectedFactor.creatorData?.account)}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                        <User className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-sm text-gray-500">نام مشتری</span>
                    </div>
                    <span className="font-semibold text-gray-900">{getFullName(selectedFactor.customerData?.account)}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Hash className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-sm text-gray-500">کد ملی</span>
                    </div>
                    <span className="font-semibold text-gray-900">{toPersianDigits(selectedFactor.customerData?.account?.nationalCode || '')}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-orange-600" />
                      </div>
                      <span className="text-sm text-gray-500">شهر</span>
                    </div>
                    <span className="font-semibold text-gray-900">{selectedFactor.customerData?.account?.city || '-'}</span>
                  </div>
                </div>

                {/* Tags Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900 flex items-center space-x-2 space-x-reverse">
                      <Tag className="w-5 h-5 text-blue-500" />
                      <span>برچسب‌ها</span>
                      {(editingTags ? tempTags : currentTags) && (editingTags ? tempTags : currentTags).length > 0 && (
                        <span className="text-blue-600 text-sm bg-blue-100 px-2 py-1 rounded-full">
                          {toPersianDigits((editingTags ? tempTags : currentTags).length)}
                        </span>
                      )}
                    </h4>
                    {!editingTags && (
                      <button
                        onClick={handleStartEditTags}
                        className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all duration-200 flex items-center space-x-2 space-x-reverse"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>ویرایش</span>
                      </button>
                    )}
                  </div>
                  
                  {!editingTags ? (
                    <div className="min-h-[120px] p-4 bg-gray-50 rounded-2xl">
                      {(editingTags ? tempTags : currentTags) && (editingTags ? tempTags : currentTags).length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {(showAllTags ? (editingTags ? tempTags : currentTags) : (editingTags ? tempTags : currentTags).slice(0, 6)).map((tag, index) => (
                            <span
                              key={tag.id}
                              className="inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-in zoom-in-50 duration-300"
                              style={{ animationDelay: `${index * 100}ms` }}
                            >
                              <Tag className="w-3 h-3 ml-2" />
                              {tag.name}
                            </span>
                          ))}
                          {(editingTags ? tempTags : currentTags).length > 6 && !showAllTags && (
                            <button
                              onClick={() => setShowAllTags(true)}
                              className="inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-600 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 hover:bg-gray-200"
                            >
                              +{toPersianDigits((editingTags ? tempTags : currentTags).length - 6)}
                            </button>
                          )}
                          {showAllTags && (editingTags ? tempTags : currentTags).length > 6 && (
                            <button
                              onClick={() => setShowAllTags(false)}
                              className="inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium bg-blue-100 text-blue-600 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 hover:bg-blue-200"
                            >
                              کمتر
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          <Tag className="w-8 h-8 mr-2" />
                          <span>بدون برچسب</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-2xl">
                      {/* Current Tags */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">برچسب‌های فعلی:</label>
                        <div className="flex flex-wrap gap-2">
                          {tempTags.length > 0 ? (
                            tempTags.map((tag) => (
                              <span
                                key={tag.id}
                                className="inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 group"
                              >
                                <Tag className="w-4 h-4 mr-2" />
                                {tag.name}
                                <button
                                  onClick={() => handleRemoveTag(tag.id)}
                                  className="mr-2 ml-1 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors duration-200 group-hover:scale-110"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 text-sm">هیچ برچسبی انتخاب نشده</span>
                          )}
                        </div>
                      </div>

                      {/* Add New Tags */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">افزودن برچسب جدید:</label>
                        <TagSelector
                          selectedTags={tempTags.map(t => t.id)}
                          onTagsChange={(tagIds) => {
                            const newTags = tagIds
                              .filter(tagId => !tempTags.find(t => t.id === tagId))
                              .map(tagId => availableTags.find(t => t.id === tagId))
                              .filter(Boolean) as Tag[];
                            
                            if (newTags.length > 0) {
                              setTempTags([...tempTags, ...newTags]);
                            }
                          }}
                          availableTags={availableTags}
                          placeholder="جستجو و انتخاب برچسب..."
                          className="w-full"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-end space-x-3 space-x-reverse pt-4 border-t border-gray-200">
                        <button
                          onClick={handleCancelEditTags}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200"
                        >
                          انصراف
                        </button>
                        <button
                          onClick={handleSaveTags}
                          disabled={updatingTags}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 space-x-reverse"
                        >
                          {updatingTags ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>در حال ذخیره...</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              <span>ذخیره تغییرات</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Compact Cards */}
          <div className="xl:col-span-1 flex flex-col">


            {/* Debt Info - Compact */}
            <div className="bg-white rounded-2xl shadow-lg p-4 border border-white/20 backdrop-blur-sm flex-1 mt-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2 space-x-reverse text-sm">
                <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-3 h-3 text-white" />
                </div>
                <span>گزارش حساب مشتری</span>
              </h4>
              {loadingDebt ? (
                <div className="text-center py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400 mx-auto" />
                </div>
              ) : customerDebt ? (
                <div className="space-y-3">
                  <div className="flex flex-col">
                    <p className="text-xs text-gray-500">مجموع پرداختی‌ها<br/>
                    <span className="text-[10px] text-gray-500">مجموع مبلغ تمامی چک های پاس شده و تراکنش های نقدی</span>
                    </p>
                    <span className="font-semibold text-blue-600 text-base mt-3">{formatCurrency(customerDebt.totalTransactions)} ریال</span>
                    <hr className="my-3" />
                  </div>
                  
                  <div className="flex flex-col">
                    <p className="text-xs text-gray-500">مجموع خرید<br/>
                    <span className="text-[10px] text-gray-500">مجموع مبلغ تمامی فاکتور های تاییده شده توسط مدیر فروش</span>
                    </p>
                    <span className="font-semibold text-orange-600 text-base mt-3">{formatCurrency(customerDebt.totalDebt)} ریال</span>
                    <hr className="my-3" />
                  </div>
                  
                  <div className="flex flex-col">
                    <p className="text-xs text-gray-500">مانده بدهی <br/>
                    <span className="text-[10px] text-gray-500">مجموع فاکتورهای پرداخت نشده + چک های پاس نشده</span>
                    </p>
                    <span className={`font-bold text-base mt-3 ${customerDebt.finalDebt >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(Math.abs(customerDebt.finalDebt))} ریال
                    </span>
                    <hr className="my-3" />
                  </div>
                  <div className={`text-xs text-center ${customerDebt.finalDebt >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {customerDebt.finalDebt >= 0 ? 'بدهکار' : 'بستانکار'}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-400">اطلاعات در دسترس نیست</div>
              )}
            </div>

            {/* Credit & Limits Info - Compact */}
            <div className="bg-white rounded-2xl shadow-lg p-4 border border-white/20 backdrop-blur-sm flex-1 mt-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2 space-x-reverse text-sm">
                <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-3 h-3 text-white" />
                </div>
                <span>اعتبار و محدودیت‌ها</span>
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">حداکثر اعتبار</span>
                  <span className="font-semibold text-purple-600 text-base">
                    {formatCurrency(selectedFactor.customerData?.account?.grade?.maxCredit || 0)} ریال
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">حداکثر بدهی</span>
                  <span className="font-semibold text-red-600 text-base">
                    {formatCurrency(selectedFactor.customerData?.account?.maxDebt || 0)} ریال
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">سقف حساب باز</span>
                  <span className="font-semibold text-blue-600 text-base">
                    {formatCurrency(selectedFactor.customerData?.account?.maxOpenAccount || 0)} ریال
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">گرید کاربر</span>
                  <span className="font-semibold text-gray-900 text-base">
                    {selectedFactor.customerData?.account?.grade?.name || '-'}
                  </span>
                </div>
              </div>
            </div>


          </div>
        </div>

        {/* Factor Status Actions */}
        {(canApproveByFinance() || canApproveByManager() || canRejectOrDelete()) && (
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-white/20 backdrop-blur-sm mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-3 space-x-reverse">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <span>عملیات فاکتور</span>
            </h3>
            
            <div className="flex flex-wrap gap-4">
              {canApproveByFinance() && (
                <button
                  onClick={handleApproveByFinance}
                  disabled={updatingFactorStatus}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-2xl flex items-center space-x-3 space-x-reverse transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {updatingFactorStatus ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  <span className="font-medium">تایید توسط مالی</span>
                </button>
              )}

              {canApproveByManager() && (
                <button
                  onClick={handleApproveByManager}
                  disabled={updatingFactorStatus}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-2xl flex items-center space-x-3 space-x-reverse transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {updatingFactorStatus ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  <span className="font-medium">تایید توسط مدیر</span>
                </button>
              )}

              {canRejectOrDelete() && (
                <>
                  <button
                    onClick={handleRejectFactor}
                    disabled={updatingFactorStatus}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-2xl flex items-center space-x-3 space-x-reverse transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    {updatingFactorStatus ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <XCircle className="w-5 h-5" />
                    )}
                    <span className="font-medium">رد فاکتور</span>
                  </button>

                  <button
                    onClick={handleDeleteFactor}
                    disabled={updatingFactorStatus}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-2xl flex items-center space-x-3 space-x-reverse transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    {updatingFactorStatus ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <TrashIcon className="w-5 h-5" />
                    )}
                    <span className="font-medium">حذف فاکتور</span>
                  </button>
                </>
              )}
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl">
              <p className="text-blue-800 text-sm leading-relaxed">
                <strong>💡 راهنما:</strong>
                {userRole === RoleEnum.FINANCEMANAGER && ' شما به عنوان مدیر مالی می‌توانید فاکتورهای تایید شده توسط مدیر را تایید نهایی کنید.'}
                {(userRole === RoleEnum.SALEMANAGER || userRole === RoleEnum.MANAGER) && ' شما به عنوان مدیر می‌توانید فاکتورهای ایجاد شده را تایید کنید.'}
                {(selectedFactor.status !== FactorStatus.APPROVED_BY_FINANCE) && ' همچنین امکان رد یا حذف فاکتور نیز وجود دارد.'}
                {selectedFactor.status === FactorStatus.APPROVED_BY_FINANCE && ' فاکتور تایید نهایی شده و قابل تغییر نیست.'}
              </p>
            </div>
          </div>
        )}

        {/* Components */}
        <div className="space-y-8">
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
      </div>
    </div>
  );
};

export default InvoiceDetails;