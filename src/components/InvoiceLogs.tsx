import React, { useState, useEffect } from 'react';
import { FileText, Tag, RefreshCw } from 'lucide-react';
import { toPersianDigits } from '../utils/numberUtils';
import { formatPersianDateForDisplay, formatISODateToPersian } from '../utils/dateUtils';
import { FactorStatus, PaymentMethod, FACTOR_STATUS_DISPLAY_NAMES, FACTOR_STATUS_COLORS } from '../types/invoiceTypes';
import apiService from '../services/apiService';

interface Tag {
  id: string;
  name: string;
}

interface FactorLog {
  id: string;
  factorId: string;
  status: string;
  comment: string;
  createdAt: string;
  factor: Factor;
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

interface CustomerData {
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
    brand: Brand[];
    grade: Grade;
  };
}

interface CreatorData {
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
    brand: Brand[];
    grade: Grade;
  };
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

interface InvoiceLogsProps {
  authToken: string;
  factorId: string;
  onError: (error: string) => void;
  refreshTrigger?: number; // برای به‌روزرسانی از خارج
}



const InvoiceLogs: React.FC<InvoiceLogsProps> = ({ authToken, factorId, onError, refreshTrigger }) => {
  const [factorLogs, setFactorLogs] = useState<FactorLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const formatDateDisplay = (dateStr: string) => {
    if (dateStr.length === 8) {
      return toPersianDigits(formatPersianDateForDisplay(dateStr));
    }
    return toPersianDigits(dateStr);
  };

  const formatDateTime = (dateTimeStr: string) => {
    return formatISODateToPersian(dateTimeStr);
  };

  const getFullName = (account: any) => {
    if (!account) return '-';
    return `${account.firstName} ${account.lastName || ''}`.trim();
  };

  const fetchFactorLogs = async () => {
    try {
      setLoadingLogs(true);
      const data = await apiService.getFactorLogs({ factorId }, authToken);
      setFactorLogs(data.data.data || []);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to fetch factor logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchFactorLogs();
  }, [factorId, refreshTrigger]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2 space-x-reverse">
          <FileText className="w-5 h-5 text-purple-500" />
          <span>تاریخچه تغییرات فاکتور</span>
          {factorLogs.length > 0 && (
            <span className="text-sm text-gray-500">
              ({toPersianDigits(factorLogs.length)} رکورد)
            </span>
          )}
        </h3>
        <button
          onClick={fetchFactorLogs}
          disabled={loadingLogs}
          className="p-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
          title="بارگذاری مجدد"
        >
          <RefreshCw className={`w-4 h-4 ${loadingLogs ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loadingLogs ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          <span className="mr-3 text-gray-600">در حال بارگذاری تاریخچه...</span>
        </div>
      ) : factorLogs.length > 0 ? (
        <div className="space-y-4">
          {factorLogs.slice().reverse().map((log, index) => (
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
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${FACTOR_STATUS_COLORS[log.status as FactorStatus]}`}>
                    {FACTOR_STATUS_DISPLAY_NAMES[log.status as FactorStatus]}
                  </span>
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
          <p className="text-gray-400 text-sm">تاریخچه تغییرات این فاکتور در اینجا نمایش داده می‌شود</p>
        </div>
      )}
    </div>
  );
};

export default InvoiceLogs; 
