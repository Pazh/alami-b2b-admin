import React, { useState, useEffect } from 'react';
import { X, Package, User, Calendar, MessageSquare, FileText } from 'lucide-react';
import { toPersianDigits } from '../utils/numberUtils';
import { formatCurrency } from '../utils/numberUtils';
import apiService from '../services/apiService';
import ProductComment from './ProductComment';
import StockLogs from './StockLogs';

interface Brand {
  id: string;
  name: string;
}

interface ProductTag {
  id: string;
  fa: string;
  en: string;
  ar: string;
  slug: string;
}

interface ProductBrandId {
  id: string;
  fa: string;
  en: string;
  ar: string;
  slug: string;
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
  tags: ProductTag[];
  media: any;
  variants: any;
  contentId: string | null;
  brandId: ProductBrandId;
  claimed: boolean | null;
  date: string;
  version: string;
  authorId: string;
  status: string;
  slogan: string | null;
  categoryIds: any[];
  attributes: any[];
  canonical: string;
  productType: string | null;
  buyerType: string | null;
  productDurability: string | null;
  buyingBehavior: string | null;
  name: {
    fa: string;
  } | null;
}

interface Stock {
  id: string;
  name: string;
  price: number;
  amount: number;
  reservedAmount: number;
  orashProductId: string;
  isActive: boolean;
  product: Product;
  brand: Brand;
}

interface ProductDetailsProps {
  authToken: string;
  stockId: string;
  userId: string;
  onClose: () => void;
  onError: (error: string) => void;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ 
  authToken, 
  stockId, 
  userId,
  onClose, 
  onError 
}) => {
  const [stock, setStock] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStockLogs, setShowStockLogs] = useState(false);

  const formatDateTime = (dateTimeStr: string) => {
    try {
      const date = new Date(dateTimeStr);
      const persianDate = new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
      return toPersianDigits(persianDate);
    } catch (error) {
      return dateTimeStr;
    }
  };

  const getProductTitle = (product: Product) => {
    return product.title?.fa || product.name?.fa || 'بدون عنوان';
  };

  const getProductDescription = (product: Product) => {
    return product.description?.fa || 'بدون توضیحات';
  };

  const fetchStockDetails = async () => {
    try {
      setLoading(true);
      const data = await apiService.getStockById(stockId, authToken);
      setStock(data.data);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to fetch stock details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (stockId) {
      fetchStockDetails();
    }
  }, [stockId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="mr-3 text-gray-600">در حال بارگذاری اطلاعات محصول...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
          <div className="text-center py-8">
            <div className="text-red-500 text-lg mb-2">خطا در بارگذاری اطلاعات محصول</div>
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
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2 space-x-reverse">
            <Package className="w-6 h-6 text-purple-500" />
            <span>جزئیات محصول</span>
          </h2>
          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              onClick={() => setShowStockLogs(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 space-x-reverse"
            >
              <FileText className="w-4 h-4" />
              <span>تاریخچه</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Product Information Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center space-x-2 space-x-reverse">
            <Package className="w-5 h-5 text-blue-500" />
            <span>اطلاعات محصول</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">نام محصول: </span>
              <span className="text-gray-900">{stock.name}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">قیمت: </span>
              <span className="text-gray-900 font-semibold">{formatCurrency(stock.price)} ریال</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">موجودی: </span>
              <span className="text-gray-900">{toPersianDigits(stock.amount)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">رزرو شده: </span>
              <span className="text-gray-900">{toPersianDigits(stock.reservedAmount)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">کد محصول: </span>
              <span className="text-gray-900">{toPersianDigits(stock.orashProductId)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">برند: </span>
              <span className="text-gray-900">{stock.brand.name}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">وضعیت: </span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                stock.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {stock.isActive ? 'فعال' : 'غیرفعال'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">عنوان محصول: </span>
              <span className="text-gray-900">{getProductTitle(stock.product)}</span>
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <span className="font-medium text-gray-700">توضیحات: </span>
              <span className="text-gray-900">{getProductDescription(stock.product)}</span>
            </div>
          </div>
        </div>

        {/* Product Comments */}
        <ProductComment
          authToken={authToken}
          stockId={stockId}
          userId={userId}
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

      {/* Stock Logs Modal */}
      {showStockLogs && (
        <StockLogs
          authToken={authToken}
          stockId={stockId}
          onClose={() => setShowStockLogs(false)}
          onError={onError}
        />
      )}
    </div>
  );
};

export default ProductDetails; 