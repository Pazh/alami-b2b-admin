import React, { useState, useEffect } from 'react';
import { X, CreditCard, User, Building, Calendar, DollarSign, FileText } from 'lucide-react';
import { toPersianDigits } from '../utils/numberUtils';
import { formatCurrency } from '../utils/numberUtils';
import { formatPersianDateForDisplay } from '../utils/dateUtils';

interface ChequeDetailsData {
  id: string;
  number: string;
  creatorUserId: string;
  createdDate: string;
  date: string;
  price: number;
  customerUserId: string;
  managerUserId: string;
  status: string;
  bankName: string;
  description: string | null;
  sayyadi: boolean;
  customerData: {
    personal: {
      id: number;
      firstName: string;
      lastName: string;
      profile: string | null;
      birthdate: string | null;
      birthPlace: string | null;
      gender: string;
      nationalCode: string;
      fatherName: string | null;
      motherName: string | null;
      married: string;
      marriageDate: string | null;
      divorceDate: string | null;
      userId: string;
    };
    account: {
      id: string;
      firstName: string;
      lastName: string;
      userId: string;
      roleId: string;
      maxDebt: string;
      maxOpenAccount: string;
      nationalCode: string;
      naghshCode: string;
      state: string;
      city: string;
      brand: Array<{
        id: string;
        name: string;
      }>;
      grade: {
        id: string;
        name: string;
        description: string;
        maxCredit: string;
      };
    };
  };
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
}

interface ChequeDetailsProps {
  authToken: string;
  chequeId: string;
  onClose: () => void;
  onError: (error: string) => void;
}

const ChequeDetails: React.FC<ChequeDetailsProps> = ({ 
  authToken, 
  chequeId, 
  onClose, 
  onError 
}) => {
  const [chequeData, setChequeData] = useState<ChequeDetailsData | null>(null);
  const [loading, setLoading] = useState(true);

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

  const getStatusDisplayName = (status: string): string => {
    const statusNames: Record<string, string> = {
      'created': 'ایجاد شده',
      'approved': 'تایید شده',
      'rejected': 'رد شده',
      'pending': 'در انتظار',
      'cancelled': 'لغو شده'
    };
    return statusNames[status] || status;
  };

  const getStatusColor = (status: string): string => {
    const statusColors: Record<string, string> = {
      'created': 'bg-blue-100 text-blue-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDateDisplay = (dateStr: string) => {
    if (dateStr.length === 8) {
      return toPersianDigits(formatPersianDateForDisplay(dateStr));
    }
    return toPersianDigits(dateStr);
  };

  const getFullName = (user: any) => {
    if (!user) return '-';
    return `${user.firstName} ${user.lastName || ''}`.trim();
  };

  const fetchChequeDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://alami-b2b-api.liara.run/api'}/cheque/${chequeId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch cheque details');
      }

      const data = await response.json();
      setChequeData(data.data);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to fetch cheque details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chequeId) {
      fetchChequeDetails();
    }
  }, [chequeId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="mr-3 text-gray-600">در حال بارگذاری جزئیات چک...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!chequeData) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2 space-x-reverse">
            <CreditCard className="w-6 h-6 text-blue-500" />
            <span>جزئیات چک</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cheque Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
              <CreditCard className="w-5 h-5 text-blue-500" />
              <span>اطلاعات چک</span>
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">شماره چک:</span>
                <span className="text-gray-900">{toPersianDigits(chequeData.number)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">تاریخ چک:</span>
                <span className="text-gray-900">{formatDateDisplay(chequeData.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">تاریخ ایجاد:</span>
                <span className="text-gray-900">{formatDateDisplay(chequeData.createdDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">مبلغ:</span>
                <span className="text-gray-900 font-semibold">{formatCurrency(chequeData.price)} ریال</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">بانک:</span>
                <span className="text-gray-900">{getBankDisplayName(chequeData.bankName)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">وضعیت:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(chequeData.status)}`}>
                  {getStatusDisplayName(chequeData.status)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">صیادی:</span>
                <span className="text-gray-900">{chequeData.sayyadi ? 'بله' : 'خیر'}</span>
              </div>
              {chequeData.description && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">توضیحات:</span>
                  <span className="text-gray-900 text-sm">{chequeData.description}</span>
                </div>
              )}
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
              <User className="w-5 h-5 text-green-500" />
              <span>اطلاعات مشتری</span>
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">نام:</span>
                <span className="text-gray-900">{getFullName(chequeData.customerData.account)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">کد ملی:</span>
                <span className="text-gray-900">{toPersianDigits(chequeData.customerData.account.nationalCode)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">کد نقش:</span>
                <span className="text-gray-900">{toPersianDigits(chequeData.customerData.account.naghshCode)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">شهر:</span>
                <span className="text-gray-900">{chequeData.customerData.account.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">استان:</span>
                <span className="text-gray-900">{chequeData.customerData.account.state}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">سطح:</span>
                <span className="text-gray-900">{chequeData.customerData.account.grade.name} - {chequeData.customerData.account.grade.description}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">حداکثر اعتبار:</span>
                <span className="text-gray-900">{formatCurrency(parseInt(chequeData.customerData.account.grade.maxCredit))} ریال</span>
              </div>
            </div>

            {/* Customer Brands */}
            {chequeData.customerData.account.brand && chequeData.customerData.account.brand.length > 0 && (
              <div className="mt-4">
                <span className="font-medium text-gray-700">برندها:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {chequeData.customerData.account.brand.map((brand) => (
                    <span
                      key={brand.id}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {brand.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Manager Information */}
        {/* <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
            <Building className="w-5 h-5 text-purple-500" />
            <span>اطلاعات مدیر</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">نام:</span>
                <span className="text-gray-900">{getFullName(chequeData.managerData)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">نقش:</span>
                <span className="text-gray-900">{chequeData.managerData.role.name}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">شناسه کاربر:</span>
                <span className="text-gray-900">{toPersianDigits(chequeData.managerData.userId)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">شناسه مدیر:</span>
                <span className="text-gray-900">{chequeData.managerData.id}</span>
              </div>
            </div>
          </div>
        </div> */}

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChequeDetails; 