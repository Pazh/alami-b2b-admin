import React, { useState, useEffect } from 'react';
import { X, FileText, User, Calendar, MessageSquare } from 'lucide-react';
import { toPersianDigits } from '../utils/numberUtils';
import { formatCurrency } from '../utils/numberUtils';
import { formatISODateToPersian } from '../utils/dateUtils';
import apiService from '../services/apiService';
import ChequeComment from './ChequeComment';

interface ChequeLog {
  id: string;
  chequeId: string;
  status: string;
  sayyadi: boolean | null;
  comment: string;
  createdAt: string;
  cheque: {
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
  };
}

interface ChequeLogsProps {
  authToken: string;
  chequeId: string;
  onClose: () => void;
  onError: (error: string) => void;
}

const ChequeLogs: React.FC<ChequeLogsProps> = ({ 
  authToken, 
  chequeId, 
  onClose, 
  onError 
}) => {
  const [chequeLogs, setChequeLogs] = useState<ChequeLog[]>([]);
  const [loading, setLoading] = useState(true);

  const getStatusDisplayName = (status: string): string => {
    const statusNames: Record<string, string> = {
      'created': 'ایجاد شده',
      'approved': 'تایید شده',
      'rejected': 'رد شده',
      'pending': 'در انتظار',
      'cancelled': 'لغو شده',
      'passed': 'پاس شده'
    };
    return statusNames[status] || status;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr.length !== 8) return dateStr;
    return `${dateStr.slice(0, 4)}/${dateStr.slice(4, 6)}/${dateStr.slice(6, 8)}`;
  };

  const getStatusColor = (status: string): string => {
    const statusColors: Record<string, string> = {
      'created': 'bg-blue-100 text-blue-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'cancelled': 'bg-gray-100 text-gray-800',
      'passed': 'bg-green-100 text-green-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDateTime = (dateTimeStr: string) => {
    return formatISODateToPersian(dateTimeStr);
  };

  const getFullName = (user: any) => {
    if (!user) return '-';
    return `${user.firstName} ${user.lastName || ''}`.trim();
  };

  const fetchChequeLogs = async () => {
    try {
      setLoading(true);
      const data = await apiService.getChequeLogs({ chequeId }, authToken);
      setChequeLogs(data.data.data || []);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to fetch cheque logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chequeId) {
      fetchChequeLogs();
    }
  }, [chequeId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="mr-3 text-gray-600">در حال بارگذاری تاریخچه چک...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2 space-x-reverse">
            <FileText className="w-6 h-6 text-purple-500" />
            <span>تاریخچه چک</span>
            {chequeLogs.length > 0 && (
              <span className="text-sm text-gray-500">
                ({toPersianDigits(chequeLogs.length)} رکورد)
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Cheque Information Summary */}
        {chequeLogs.length > 0 && chequeLogs[0].cheque && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center space-x-2 space-x-reverse">
              <FileText className="w-5 h-5 text-blue-500" />
              <span>اطلاعات چک</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">شماره چک: </span>
                <span className="text-gray-900">{toPersianDigits(chequeLogs[0].cheque.number)}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">مبلغ: </span>
                <span className="text-gray-900 font-semibold">{formatCurrency(chequeLogs[0].cheque.price)} ریال</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">مشتری: </span>
                <span className="text-gray-900">{getFullName(chequeLogs[0].cheque.customerData.account)}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">تاریخ سررسید: </span>
                <span className="text-gray-900">{toPersianDigits(formatDate(chequeLogs[0].cheque.date))}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">ایجادکننده: </span>
                <span className="text-gray-900">{getFullName(chequeLogs[0].cheque.managerData)}</span>
              </div>
             
              <div>
                <span className="font-medium text-gray-700">تاریخ ایجاد: </span>
                <span className="text-gray-900">{formatDateTime(chequeLogs[0].cheque.createdDate)}</span>
              </div>
            
              <div>
                <span className="font-medium text-gray-700">توضیحات: </span>
                <span className="text-gray-900">{chequeLogs[0].cheque.description || '-'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Logs List */}
        {chequeLogs.length > 0 ? (
          <div className="space-y-4">
            {chequeLogs.slice().reverse().map((log, index) => (
              <div
                key={log.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {log.comment}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDateTime(log.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                      {getStatusDisplayName(log.status)}
                    </span>
                    {log.sayyadi !== null && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        log.sayyadi ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {log.sayyadi ? 'صیادی' : 'غیر صیادی'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <div className="text-gray-500 text-lg mb-2">هیچ تاریخچه‌ای یافت نشد</div>
            <p className="text-gray-400 text-sm">تاریخچه تغییرات این چک در اینجا نمایش داده می‌شود</p>
          </div>
        )}

        {/* Cheque Comments */}
        <ChequeComment
          authToken={authToken}
          chequeId={chequeId}
          userId={chequeLogs.length > 0 ? chequeLogs[0].cheque.creatorUserId : ''}
          onError={onError}
        />

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

export default ChequeLogs; 