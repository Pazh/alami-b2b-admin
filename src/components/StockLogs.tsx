import React, { useState, useEffect } from 'react';
import { X, Package, User, Calendar, MessageSquare } from 'lucide-react';
import { toPersianDigits } from '../utils/numberUtils';
import { formatCurrency } from '../utils/numberUtils';
import { formatISODateToPersian } from '../utils/dateUtils';
import apiService from '../services/apiService';

interface Brand {
  id: string;
  name: string;
}

interface Product {
  id: string;
  publicId: string;
  slug: string;
  title: {
    fa: string;
  };
  description: {
    fa: string;
  } | null;
  image: string | null;
  tags: any[];
  brandId: {
    id: string;
    fa: string;
    en: string;
    ar: string;
    slug: string;
  };
  status: string;
  date: string;
}

interface StockLog {
  id: string;
  stockId: string;
  prePrice: number;
  price: number | null;
  preAmount: number;
  amount: number | null;
  createdAt: string;
  comment: string;
}

interface StockLogsProps {
  authToken: string;
  stockId: string;
  onClose: () => void;
  onError: (error: string) => void;
}

const StockLogs: React.FC<StockLogsProps> = ({ 
  authToken, 
  stockId, 
  onClose, 
  onError 
}) => {
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stockInfo, setStockInfo] = useState<any>(null);

  const formatDateTime = (dateTimeStr: string) => {
    return formatISODateToPersian(dateTimeStr);
  };

  const getChangeType = (log: StockLog): string => {
    const priceChanged = log.prePrice !== log.price;
    const amountChanged = log.preAmount !== log.amount;
    
    if (priceChanged && amountChanged) {
      return 'قیمت و موجودی تغییر کرد';
    } else if (priceChanged) {
      return 'قیمت تغییر کرد';
    } else if (amountChanged) {
      return 'موجودی تغییر کرد';
    }
    return 'تغییرات دیگر';
  };

  const getChangeColor = (log: StockLog): string => {
    const priceChanged = log.prePrice !== log.price;
    const amountChanged = log.preAmount !== log.amount;
    
    if (priceChanged && amountChanged) {
      return 'bg-purple-100 text-purple-800';
    } else if (priceChanged) {
      return 'bg-blue-100 text-blue-800';
    } else if (amountChanged) {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getPriceChange = (log: StockLog): string => {
    if (log.prePrice === log.price) return 'بدون تغییر';
    if (log.price === null) return `${formatCurrency(log.prePrice)} → حذف شده`;
    if (log.prePrice === null) return `حذف شده → ${formatCurrency(log.price)}`;
    return `${formatCurrency(log.prePrice)} → ${formatCurrency(log.price)}`;
  };

  const getAmountChange = (log: StockLog): string => {
    if (log.preAmount === log.amount) return 'بدون تغییر';
    if (log.amount === null) return `${toPersianDigits(log.preAmount)} → حذف شده`;
    if (log.preAmount === null) return `حذف شده → ${toPersianDigits(log.amount)}`;
    return `${toPersianDigits(log.preAmount)} → ${toPersianDigits(log.amount)}`;
  };

  const fetchStockLogs = async () => {
    try {
      setLoading(true);
      const data = await apiService.getStockLogs({ stockId }, authToken);
      setStockLogs(data.data.data || []);
      
      // Fetch stock info for display
      if (data.data.data && data.data.data.length > 0) {
        try {
          const stockData = await apiService.getStockById(stockId, authToken);
          setStockInfo(stockData.data);
        } catch (err) {
          console.error('Failed to fetch stock info:', err);
        }
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to fetch stock logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (stockId) {
      fetchStockLogs();
    }
  }, [stockId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="mr-3 text-gray-600">در حال بارگذاری تاریخچه محصول...</span>
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
            <Package className="w-6 h-6 text-purple-500" />
            <span>تاریخچه محصول</span>
            {stockLogs.length > 0 && (
              <span className="text-sm text-gray-500">
                ({toPersianDigits(stockLogs.length)} رکورد)
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

        {/* Stock Information Summary */}
        {stockLogs.length > 0 && stockInfo && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center space-x-2 space-x-reverse">
              <Package className="w-5 h-5 text-blue-500" />
              <span>اطلاعات محصول</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">نام محصول: </span>
                <span className="text-gray-900">{stockInfo.name}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">قیمت فعلی: </span>
                <span className="text-gray-900 font-semibold">{formatCurrency(stockInfo.price)} ریال</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">موجودی فعلی: </span>
                <span className="text-gray-900">{toPersianDigits(stockInfo.amount)}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">رزرو شده: </span>
                <span className="text-gray-900">{toPersianDigits(stockInfo.reservedAmount)}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">کد محصول: </span>
                <span className="text-gray-900">{toPersianDigits(stockInfo.orashProductId)}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">برند: </span>
                <span className="text-gray-900">{stockInfo.brand.name}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">وضعیت: </span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  stockInfo.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {stockInfo.isActive ? 'فعال' : 'غیرفعال'}
                </span>
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <span className="font-medium text-gray-700">تعداد تغییرات: </span>
                <span className="text-gray-900 font-semibold">{toPersianDigits(stockLogs.length)} بار</span>
              </div>
            </div>
          </div>
        )}

        {/* Logs List */}
        {stockLogs.length > 0 ? (
          <div className="space-y-4">
            {/* Statistics Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">آمار تغییرات</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-blue-700">تغییرات قیمت: </span>
                  <span className="font-semibold text-blue-900">
                    {toPersianDigits(stockLogs.filter(log => log.prePrice !== log.price).length)}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">تغییرات موجودی: </span>
                  <span className="font-semibold text-blue-900">
                    {toPersianDigits(stockLogs.filter(log => log.preAmount !== log.amount).length)}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">تغییرات همزمان: </span>
                  <span className="font-semibold text-blue-900">
                    {toPersianDigits(stockLogs.filter(log => log.prePrice !== log.price && log.preAmount !== log.amount).length)}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">کل تغییرات: </span>
                  <span className="font-semibold text-blue-900">
                    {toPersianDigits(stockLogs.length)}
                  </span>
                </div>
              </div>
            </div>

            {stockLogs.slice().reverse().map((log, index) => (
              <div
                key={log.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                        <Package className="h-4 w-4 text-white" />
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
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getChangeColor(log)}`}>
                      {getChangeType(log)}
                    </span>
                  </div>
                </div>
                
                {/* Detailed Changes */}
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">تغییرات قیمت: </span>
                      <span className={`font-semibold ${
                        log.prePrice !== log.price ? 'text-blue-600' : 'text-gray-600'
                      }`}>
                        {getPriceChange(log)}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">تغییرات موجودی: </span>
                      <span className={`font-semibold ${
                        log.preAmount !== log.amount ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {getAmountChange(log)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Change Summary */}
                  {(log.prePrice !== log.price || log.preAmount !== log.amount) && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">خلاصه تغییرات:</span>
                        {log.prePrice !== log.price && (
                          <span className="mr-2">
                            {log.price !== null && log.prePrice !== null && (
                              <span className={log.price > log.prePrice ? 'text-green-600' : 'text-red-600'}>
                                {log.price > log.prePrice ? 'افزایش' : 'کاهش'} قیمت
                              </span>
                            )}
                          </span>
                        )}
                        {log.preAmount !== log.amount && (
                          <span className="mr-2">
                            {log.amount !== null && log.preAmount !== null && (
                              <span className={log.amount > log.preAmount ? 'text-green-600' : 'text-red-600'}>
                                {log.amount > log.preAmount ? 'افزایش' : 'کاهش'} موجودی
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <div className="text-gray-500 text-lg mb-2">هیچ تاریخچه‌ای یافت نشد</div>
            <p className="text-gray-400 text-sm">تاریخچه تغییرات این محصول در اینجا نمایش داده می‌شود</p>
          </div>
        )}

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

export default StockLogs; 