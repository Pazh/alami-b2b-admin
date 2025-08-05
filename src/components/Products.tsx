import React, { useState, useEffect } from 'react';
import { Edit, Save, X, Package, Tag, Eye, ChevronLeft, ChevronRight, Search, Filter, Info } from 'lucide-react';
import { formatCurrency, formatNumber, toPersianDigits, toEnglishDigits } from '../utils/numberUtils';
import apiService from '../services/apiService';

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

interface ProductsProps {
  authToken: string;
  userId: number;
}

const Products: React.FC<ProductsProps> = ({ authToken, userId }) => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [availableBrands, setAvailableBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Stock>>({});
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState({
    name: '',
    price: '',
    amount: '',
    reservedAmount: '',
    orashProductId: '',
    isActive: '',
    brandId: ''
  });
  const [showFilters, setShowFilters] = useState({
    name: false,
    price: false,
    amount: false,
    reservedAmount: false,
    orashProductId: false,
    isActive: false,
    brandId: false
  });

  const fetchStocks = async () => {
    try {
      setLoading(true);

      // Check if we have any filters
      const hasFilters = Object.values(filters).some(filter => filter.trim() !== '');
      
      let data;
      
      if (hasFilters) {
        // Prepare filter data - only include non-empty filters and convert Persian digits to English
        const filterData: any = {};
        if (filters.name.trim()) filterData.name = filters.name.trim();
        if (filters.price.trim()) filterData.price = parseInt(toEnglishDigits(filters.price.trim())) || undefined;
        if (filters.amount.trim()) filterData.amount = parseInt(toEnglishDigits(filters.amount.trim())) || undefined;
        if (filters.reservedAmount.trim()) filterData.reservedAmount = parseInt(toEnglishDigits(filters.reservedAmount.trim())) || undefined;
        if (filters.orashProductId.trim()) filterData.orashProductId = toEnglishDigits(filters.orashProductId.trim());
        if (filters.isActive.trim()) filterData.isActive = filters.isActive === 'true';
        if (filters.brandId.trim()) filterData.brandId = filters.brandId.trim();
        
        data = await apiService.filterStocks(pageSize, pageIndex, filterData, authToken);
      } else {
        data = await apiService.getStocks(pageSize, pageIndex, authToken);
      }
      
      // Set total count and calculate total pages
      const count = data.data?.details?.count || 0;
      setTotalCount(count);
      setTotalPages(Math.ceil(count / pageSize));
      
      setStocks(data.data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stocks');
    } finally {
      setLoading(false);
    }
  };

  const fetchBrands = async () => {
    try {
      const data = await apiService.getBrands(authToken);
      setAvailableBrands(data.data.data || []);
    } catch (err) {
      console.error('Failed to fetch brands:', err);
    }
  };

  const fetchStockById = async (id: string) => {
    try {
      const data = await apiService.getStockById(id, authToken);
      return data.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stock details');
      return null;
    }
  };

  const handleEdit = async (id: string) => {
    const stockData = await fetchStockById(id);
    if (stockData) {
      setEditingId(id);
      setEditForm({
        ...stockData,
        brandId: stockData.brand.id
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editForm) return;

    try {
      const updateData = {
        name: editForm.name,
        price: editForm.price,
        amount: editForm.amount,
        reservedAmount: editForm.reservedAmount,
        orashProductId: editForm.orashProductId,
        isActive: editForm.isActive,
        brandId: editForm.brandId
      };

      await apiService.updateStock(editingId, updateData, authToken);
      await fetchStocks();
      setEditingId(null);
      setEditForm({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stock');
    }
  };

  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFilterSubmit = (field: keyof typeof filters) => {
    setPageIndex(0); // Reset to first page when filtering
    fetchStocks();
    setShowFilters(prev => ({
      ...prev,
      [field]: false
    }));
  };

  const clearFilter = (field: keyof typeof filters) => {
    setFilters(prev => ({
      ...prev,
      [field]: ''
    }));
    setPageIndex(0);
    fetchStocks();
  };

  const clearAllFilters = () => {
    setFilters({
      name: '',
      price: '',
      amount: '',
      reservedAmount: '',
      orashProductId: '',
      isActive: '',
      brandId: ''
    });
    setPageIndex(0);
  };

  const handleToggleStatus = async (stockId: string, newStatus: boolean) => {
    try {
      await apiService.updateStock(stockId, { 
        isActive: newStatus,
        creatorUserId: userId 
      }, authToken);
      await fetchStocks(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stock status');
    }
  };
  const hasActiveFilters = Object.values(filters).some(filter => filter.trim() !== '');

  const handlePageChange = (newPageIndex: number) => {
    if (newPageIndex >= 0 && newPageIndex < totalPages) {
      setPageIndex(newPageIndex);
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPageIndex(0); // Reset to first page when changing page size
  };

  const getProductTitle = (product: Product) => {
    return product.title?.fa || product.name?.fa || 'بدون عنوان';
  };

  const getProductDescription = (product: Product) => {
    return product.description?.fa || 'بدون توضیحات';
  };

  useEffect(() => {
    fetchStocks();
    fetchBrands();
  }, [pageIndex, pageSize, filters]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">محصولات</h2>
        <div className="flex items-center space-x-4 space-x-reverse">
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors flex items-center space-x-1 space-x-reverse"
            >
              <X className="w-4 h-4" />
              <span>پاک کردن فیلترها</span>
            </button>
          )}
          <div className="text-sm text-gray-500">
            تعداد کل: {toPersianDigits(totalCount)}
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <label className="text-sm text-gray-700">تعداد در صفحه:</label>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={5}>{toPersianDigits('5')}</option>
              <option value={10}>{toPersianDigits('10')}</option>
              <option value={20}>{toPersianDigits('20')}</option>
              <option value={50}>{toPersianDigits('50')}</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center justify-between">
                  <span>نام محصول</span>
                  <button
                    onClick={() => setShowFilters(prev => ({ ...prev, name: !prev.name }))}
                    className={`p-1 rounded hover:bg-gray-200 transition-colors ${filters.name ? 'text-blue-600' : 'text-gray-400'}`}
                    title="فیلتر بر اساس نام محصول"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
                {showFilters.name && (
                  <div className="mt-2 flex items-center space-x-2 space-x-reverse">
                    <input
                      type="text"
                      value={filters.name}
                      onChange={(e) => handleFilterChange('name', e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleFilterSubmit('name')}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="جستجو در نام محصول..."
                      autoFocus
                    />
                    <button
                      onClick={() => handleFilterSubmit('name')}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="اعمال فیلتر"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                    {filters.name && (
                      <button
                        onClick={() => clearFilter('name')}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="پاک کردن فیلتر"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center justify-between">
                  <span>قیمت</span>
                  <button
                    onClick={() => setShowFilters(prev => ({ ...prev, price: !prev.price }))}
                    className={`p-1 rounded hover:bg-gray-200 transition-colors ${filters.price ? 'text-blue-600' : 'text-gray-400'}`}
                    title="فیلتر بر اساس قیمت"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
                {showFilters.price && (
                  <div className="mt-2 flex items-center space-x-2 space-x-reverse">
                    <input
                      type="number"
                      value={filters.price}
                      onChange={(e) => handleFilterChange('price', e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleFilterSubmit('price')}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="قیمت..."
                      autoFocus
                    />
                    <button
                      onClick={() => handleFilterSubmit('price')}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="اعمال فیلتر"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                    {filters.price && (
                      <button
                        onClick={() => clearFilter('price')}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="پاک کردن فیلتر"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center justify-between">
                  <span>موجودی</span>
                  <button
                    onClick={() => setShowFilters(prev => ({ ...prev, amount: !prev.amount }))}
                    className={`p-1 rounded hover:bg-gray-200 transition-colors ${filters.amount ? 'text-blue-600' : 'text-gray-400'}`}
                    title="فیلتر بر اساس موجودی"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
                {showFilters.amount && (
                  <div className="mt-2 flex items-center space-x-2 space-x-reverse">
                    <input
                      type="number"
                      value={filters.amount}
                      onChange={(e) => handleFilterChange('amount', e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleFilterSubmit('amount')}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="موجودی..."
                      autoFocus
                    />
                    <button
                      onClick={() => handleFilterSubmit('amount')}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="اعمال فیلتر"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                    {filters.amount && (
                      <button
                        onClick={() => clearFilter('amount')}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="پاک کردن فیلتر"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center justify-between">
                  <span>رزرو شده</span>
                  <button
                    onClick={() => setShowFilters(prev => ({ ...prev, reservedAmount: !prev.reservedAmount }))}
                    className={`p-1 rounded hover:bg-gray-200 transition-colors ${filters.reservedAmount ? 'text-blue-600' : 'text-gray-400'}`}
                    title="فیلتر بر اساس مقدار رزرو شده"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
                {showFilters.reservedAmount && (
                  <div className="mt-2 flex items-center space-x-2 space-x-reverse">
                    <input
                      type="number"
                      value={filters.reservedAmount}
                      onChange={(e) => handleFilterChange('reservedAmount', e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleFilterSubmit('reservedAmount')}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="رزرو شده..."
                      autoFocus
                    />
                    <button
                      onClick={() => handleFilterSubmit('reservedAmount')}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="اعمال فیلتر"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                    {filters.reservedAmount && (
                      <button
                        onClick={() => clearFilter('reservedAmount')}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="پاک کردن فیلتر"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center justify-between">
                  <span>کد محصول</span>
                  <button
                    onClick={() => setShowFilters(prev => ({ ...prev, orashProductId: !prev.orashProductId }))}
                    className={`p-1 rounded hover:bg-gray-200 transition-colors ${filters.orashProductId ? 'text-blue-600' : 'text-gray-400'}`}
                    title="فیلتر بر اساس کد محصول"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
                {showFilters.orashProductId && (
                  <div className="mt-2 flex items-center space-x-2 space-x-reverse">
                    <input
                      type="text"
                      value={filters.orashProductId}
                      onChange={(e) => handleFilterChange('orashProductId', e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleFilterSubmit('orashProductId')}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="کد محصول..."
                      autoFocus
                    />
                    <button
                      onClick={() => handleFilterSubmit('orashProductId')}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="اعمال فیلتر"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                    {filters.orashProductId && (
                      <button
                        onClick={() => clearFilter('orashProductId')}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="پاک کردن فیلتر"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center justify-between">
                  <span>وضعیت</span>
                  <button
                    onClick={() => setShowFilters(prev => ({ ...prev, isActive: !prev.isActive }))}
                    className={`p-1 rounded hover:bg-gray-200 transition-colors ${filters.isActive ? 'text-blue-600' : 'text-gray-400'}`}
                    title="فیلتر بر اساس وضعیت"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
                {showFilters.isActive && (
                  <div className="mt-2 flex items-center space-x-2 space-x-reverse">
                    <select
                      value={filters.isActive}
                      onChange={(e) => handleFilterChange('isActive', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">همه وضعیت‌ها</option>
                      <option value="true">فعال</option>
                      <option value="false">غیرفعال</option>
                    </select>
                    <button
                      onClick={() => handleFilterSubmit('isActive')}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="اعمال فیلتر"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                    {filters.isActive && (
                      <button
                        onClick={() => clearFilter('isActive')}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="پاک کردن فیلتر"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center justify-between">
                  <span>برند</span>
                  <button
                    onClick={() => setShowFilters(prev => ({ ...prev, brandId: !prev.brandId }))}
                    className={`p-1 rounded hover:bg-gray-200 transition-colors ${filters.brandId ? 'text-blue-600' : 'text-gray-400'}`}
                    title="فیلتر بر اساس برند"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
                {showFilters.brandId && (
                  <div className="mt-2 flex items-center space-x-2 space-x-reverse">
                    <select
                      value={filters.brandId}
                      onChange={(e) => handleFilterChange('brandId', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">همه برندها</option>
                      {availableBrands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleFilterSubmit('brandId')}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="اعمال فیلتر"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                    {filters.brandId && (
                      <button
                        onClick={() => clearFilter('brandId')}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="پاک کردن فیلتر"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">اطلاعات کامل</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عملیات</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stocks.map((stock) => (
              <tr key={stock.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4">
                  {editingId === stock.id ? (
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="نام محصول"
                    />
                  ) : (
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                          <Package className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{stock.name}</div>
                        <div className="text-sm text-gray-500">ID: {stock.id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {editingId === stock.id ? (
                    <input
                      type="number"
                      value={editForm.price || 0}
                      onChange={(e) => setEditForm({ ...editForm, price: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  ) : (
                    <div className="text-sm text-gray-900">
                      {formatCurrency(stock.price)} ریال
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {editingId === stock.id ? (
                    <input
                      type="number"
                      value={editForm.amount || 0}
                      onChange={(e) => setEditForm({ ...editForm, amount: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  ) : (
                    <div className="text-sm text-gray-900">
                      {toPersianDigits(stock.amount)}
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {editingId === stock.id ? (
                    <input
                      type="number"
                      value={editForm.reservedAmount || 0}
                      onChange={(e) => setEditForm({ ...editForm, reservedAmount: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  ) : (
                    <div className="text-sm text-gray-900">
                      {toPersianDigits(stock.reservedAmount)}
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {editingId === stock.id ? (
                    <input
                      type="text"
                      value={editForm.orashProductId || ''}
                      onChange={(e) => setEditForm({ ...editForm, orashProductId: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  ) : (
                    <div className="text-sm text-gray-900">
                      {toPersianDigits(stock.orashProductId)}
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {editingId === stock.id ? (
                    <select
                      value={editForm.isActive ? 'true' : 'false'}
                      onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === 'true' })}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="true">فعال</option>
                      <option value="false">غیرفعال</option>
                    </select>
                  ) : (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      stock.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {stock.isActive ? 'فعال' : 'غیرفعال'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {editingId === stock.id ? (
                    <select
                      value={editForm.brandId || ''}
                      onChange={(e) => setEditForm({ ...editForm, brandId: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="">انتخاب برند</option>
                      {availableBrands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <Tag className="w-3 h-3 mr-1" />
                      {stock.brand.name}
                    </span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <a
                    href={`https://www.alamico.ir/fa/p/${stock.product.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors inline-block"
                    title="مشاهده اطلاعات کامل محصول در سایت"
                  >
                    <Info className="w-4 h-4" />
                  </a>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center justify-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={stock.isActive}
                        onChange={() => handleToggleStatus(stock.id, !stock.isActive)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {stocks.length === 0 && !loading && (
          <div className="text-center py-8">
            <div className="text-gray-500 text-lg mb-2">هیچ محصولی یافت نشد</div>
            <p className="text-gray-400 text-sm">محصولات موجود در انبار در اینجا نمایش داده می‌شوند</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            نمایش {toPersianDigits(pageIndex * pageSize + 1)} تا {toPersianDigits(Math.min((pageIndex + 1) * pageSize, totalCount))} از {toPersianDigits(totalCount)} محصول
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              onClick={() => handlePageChange(pageIndex - 1)}
              disabled={pageIndex === 0}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 space-x-reverse"
            >
              <ChevronRight className="w-4 h-4" />
              <span>قبلی</span>
            </button>
            
            <div className="flex items-center space-x-1 space-x-reverse">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i;
                } else if (pageIndex < 3) {
                  pageNum = i;
                } else if (pageIndex >= totalPages - 3) {
                  pageNum = totalPages - 5 + i;
                } else {
                  pageNum = pageIndex - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      pageIndex === pageNum
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {toPersianDigits(pageNum + 1)}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(pageIndex + 1)}
              disabled={pageIndex >= totalPages - 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 space-x-reverse"
            >
              <span>بعدی</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;