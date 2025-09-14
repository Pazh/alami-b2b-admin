import React, { useState, useEffect } from 'react';
import { X, Package, Tag, Eye, ChevronLeft, ChevronRight, Search, Filter, Info, Plus, Edit } from 'lucide-react';
import { formatCurrency, formatNumber, toPersianDigits, toEnglishDigits } from '../utils/numberUtils';
import apiService from '../services/apiService';
import ProductDetails from './ProductDetails';
import AddProduct from './AddProduct';
import EditProduct from './EditProduct';
import { RoleEnum } from '../types/roles';

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
  productId?: string;
  isActive: boolean;
  product: Product;
  brand: Brand;
}

interface ProductsProps {
  authToken: string;
  userId: number;
  userRole?: RoleEnum;
}

const Products: React.FC<ProductsProps> = ({ authToken, userId, userRole }) => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [availableBrands, setAvailableBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  const [selectedProductForDetails, setSelectedProductForDetails] = useState<string | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [mobileFilters, setMobileFilters] = useState({
    name: '',
    price: '',
    amount: '',
    reservedAmount: '',
    orashProductId: '',
    isActive: '',
    brandId: ''
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
      const data = await apiService.getBrands(100, 0, authToken);
      setAvailableBrands(data.data.data || []);
    } catch (err) {
      console.error('Failed to fetch brands:', err);
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
    setMobileFilters({
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

  const handleMobileFilterChange = (field: keyof typeof mobileFilters, value: string) => {
    setMobileFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applyMobileFilters = () => {
    setFilters(mobileFilters);
    setPageIndex(0);
    setShowMobileFilter(false);
  };

  const clearMobileFilters = () => {
    setMobileFilters({
      name: '',
      price: '',
      amount: '',
      reservedAmount: '',
      orashProductId: '',
      isActive: '',
      brandId: ''
    });
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

  // Sync mobile filters with main filters when mobile filter panel opens
  useEffect(() => {
    if (showMobileFilter) {
      setMobileFilters(filters);
    }
  }, [showMobileFilter, filters]);

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

  const mainContent = (
    <div className="glass-effect rounded-2xl shadow-modern mobile-card border border-white/20">
      {/* Header Section */}
      <div className="mobile-flex mobile-space mb-6">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <Package className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl lg:text-2xl font-bold gradient-text">محصولات</h2>
        </div>
        <div className="mobile-flex mobile-space items-start sm:items-center">
          {(userRole === RoleEnum.MANAGER || userRole === RoleEnum.DEVELOPER) && (
            <button
              onClick={() => setShowAddProduct(true)}
              className="btn-mobile bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all duration-200 active:scale-95 touch-manipulation flex items-center space-x-1 space-x-reverse justify-center"
            >
              <Plus className="icon-mobile-sm" />
              <span>افزودن محصول</span>
            </button>
          )}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="btn-mobile bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors flex items-center space-x-2 space-x-reverse shadow-md justify-center"
            >
              <X className="icon-mobile-sm" />
              <span>پاک کردن فیلترها</span>
            </button>
          )}
          <div className="mobile-text text-gray-500 bg-white/80 px-3 py-2 rounded-xl backdrop-blur-sm">
            تعداد کل: {toPersianDigits(totalCount)}
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <label className="mobile-text text-gray-700 hidden sm:inline">تعداد در صفحه:</label>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-xl mobile-text focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/90 backdrop-blur-sm shadow-sm"
            >
              <option value={5}>{toPersianDigits('5')}</option>
              <option value={10}>{toPersianDigits('10')}</option>
              <option value={20}>{toPersianDigits('20')}</option>
              <option value={50}>{toPersianDigits('50')}</option>
            </select>
          </div>
          <div className="flex items-center gap-x-4 justify-center">
            {/* Mobile Filter Button */}
            <button
              onClick={() => setShowMobileFilter(true)}
              className="lg:hidden p-3 bg-gradient-to-r from-blue-500/10 to-blue-600/10 hover:from-blue-500/20 hover:to-blue-600/20 text-blue-600 rounded-xl border border-blue-200 transition-all duration-200 hover:shadow-lg flex items-center justify-center"
              title="فیلتر"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="mobile-text text-red-600">{error}</p>
        </div>
      )}

      {/* Mobile Filter Panel */}
      {showMobileFilter && (
        <div className="fixed inset-0 z-[100] lg:hidden !rounded-2xl !h-max">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm !rounded-xl h-full"
            onClick={() => setShowMobileFilter(false)}
          />

          {/* Filter Panel */}
          <div className="sticky top-0 left-0 w-full overflow-y-auto bg-white shadow-2xl transform transition-transform duration-300 ease-in-out !rounded-2xl">
            <div className="h-calc[(100vh - 2rem)] flex flex-col !rounded-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <h3 className="text-lg font-bold">فیلترها</h3>
                <button
                  onClick={() => setShowMobileFilter(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filter Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Name Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نام محصول
                  </label>
                  <input
                    type="text"
                    value={mobileFilters.name}
                    onChange={(e) => handleMobileFilterChange('name', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                    placeholder="نام محصول..."
                  />
                </div>

                {/* Price Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    قیمت
                  </label>
                  <input
                    type="text"
                    value={toPersianDigits(mobileFilters.price)}
                    onChange={(e) => {
                      const persianValue = e.target.value;
                      const englishValue = toEnglishDigits(persianValue);
                      handleMobileFilterChange('price', englishValue);
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                    placeholder="قیمت..."
                    dir="ltr"
                  />
                </div>

                {/* Amount Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    موجودی
                  </label>
                  <input
                    type="text"
                    value={toPersianDigits(mobileFilters.amount)}
                    onChange={(e) => {
                      const persianValue = e.target.value;
                      const englishValue = toEnglishDigits(persianValue);
                      handleMobileFilterChange('amount', englishValue);
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                    placeholder="موجودی..."
                    dir="ltr"
                  />
                </div>

                {/* Reserved Amount Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رزرو شده
                  </label>
                  <input
                    type="text"
                    value={toPersianDigits(mobileFilters.reservedAmount)}
                    onChange={(e) => {
                      const persianValue = e.target.value;
                      const englishValue = toEnglishDigits(persianValue);
                      handleMobileFilterChange('reservedAmount', englishValue);
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                    placeholder="رزرو شده..."
                    dir="ltr"
                  />
                </div>

                {/* Product ID Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    کد محصول
                  </label>
                  <input
                    type="text"
                    value={toPersianDigits(mobileFilters.orashProductId)}
                    onChange={(e) => {
                      const persianValue = e.target.value;
                      const englishValue = toEnglishDigits(persianValue);
                      handleMobileFilterChange('orashProductId', englishValue);
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                    placeholder="کد محصول..."
                    dir="ltr"
                  />
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    وضعیت
                  </label>
                  <select
                    value={mobileFilters.isActive}
                    onChange={(e) => handleMobileFilterChange('isActive', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                  >
                    <option value="">همه وضعیت‌ها</option>
                    <option value="true">فعال</option>
                    <option value="false">غیرفعال</option>
                  </select>
                </div>

                {/* Brand Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    برند
                  </label>
                  <select
                    value={mobileFilters.brandId}
                    onChange={(e) => handleMobileFilterChange('brandId', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                  >
                    <option value="">همه برندها</option>
                    {availableBrands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-2">
                <button
                  onClick={() => {
                    clearMobileFilters();
                  }}
                  className="w-full px-4 py-2 text-sm bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center space-x-2 space-x-reverse"
                >
                  <X className="w-4 h-4" />
                  <span>پاک کردن همه</span>
                </button>
                <button
                  onClick={applyMobileFilters}
                  className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 space-x-reverse"
                >
                  <Search className="w-4 h-4" />
                  <span>اعمال فیلتر</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="table-responsive bg-white/90 backdrop-blur-sm rounded-xl shadow-lg hidden lg:block">
        <table className="table-mobile">
          <thead>
            <tr className="table-mobile-header">
              <th className="table-mobile-header-cell">
                <div className="flex items-center justify-between">
                  <span>نام محصول</span>
                  <button
                    onClick={() => setShowFilters(prev => ({ ...prev, name: !prev.name }))}
                    className={`p-2 rounded-xl hover:bg-white/20 transition-all duration-200 ${filters.name ? 'text-purple-600 bg-purple-100' : 'text-gray-400'}`}
                    title="فیلتر بر اساس نام محصول"
                  >
                    <Filter className="icon-mobile-sm" />
                  </button>
                </div>
                {showFilters.name && (
                  <div className="mt-2 space-y-2">
                    <input
                      type="text"
                      value={filters.name}
                      onChange={(e) => handleFilterChange('name', e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleFilterSubmit('name')}
                      className="input-mobile border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                      placeholder="جستجو در نام محصول..."
                      autoFocus
                    />
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleFilterSubmit('name')}
                        className="p-1 text-purple-600 hover:text-purple-800"
                        title="اعمال فیلتر"
                      >
                        <Search className="icon-mobile-sm" />
                      </button>
                      {filters.name && (
                        <button
                          onClick={() => clearFilter('name')}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="پاک کردن فیلتر"
                        >
                          <X className="icon-mobile-sm" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </th>
              <th className="px-3 lg:px-6 py-3 lg:py-4 text-right text-xs lg:text-sm font-bold text-gray-700">
                <div className="flex items-center justify-between">
                  <span>قیمت</span>
                  <button
                    onClick={() => setShowFilters(prev => ({ ...prev, price: !prev.price }))}
                    className={`p-2 rounded-xl hover:bg-white/20 transition-all duration-200 ${filters.price ? 'text-purple-600 bg-purple-100' : 'text-gray-400'}`}
                    title="فیلتر بر اساس قیمت"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
                {showFilters.price && (
                  <div className="mt-2 space-y-2">
                    <input
                      type="number"
                      value={filters.price}
                      onChange={(e) => handleFilterChange('price', e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleFilterSubmit('price')}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                      placeholder="قیمت..."
                      autoFocus
                    />
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleFilterSubmit('price')}
                        className="p-1 text-purple-600 hover:text-purple-800"
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
                  </div>
                )}
              </th>
              <th className="px-3 lg:px-6 py-3 lg:py-4 text-right text-xs lg:text-sm font-bold text-gray-700">
                <div className="flex items-center justify-between">
                  <span>موجودی</span>
                  <button
                    onClick={() => setShowFilters(prev => ({ ...prev, amount: !prev.amount }))}
                    className={`p-2 rounded-xl hover:bg-white/20 transition-all duration-200 ${filters.amount ? 'text-purple-600 bg-purple-100' : 'text-gray-400'}`}
                    title="فیلتر بر اساس موجودی"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
                {showFilters.amount && (
                  <div className="mt-2 space-y-2">
                    <input
                      type="number"
                      value={filters.amount}
                      onChange={(e) => handleFilterChange('amount', e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleFilterSubmit('amount')}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                      placeholder="موجودی..."
                      autoFocus
                    />
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleFilterSubmit('amount')}
                        className="p-1 text-purple-600 hover:text-purple-800"
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
                  </div>
                )}
              </th>
              <th className="px-3 lg:px-6 py-3 lg:py-4 text-right text-xs lg:text-sm font-bold text-gray-700">
                <div className="flex items-center justify-between">
                  <span>رزرو شده</span>
                  <button
                    onClick={() => setShowFilters(prev => ({ ...prev, reservedAmount: !prev.reservedAmount }))}
                    className={`p-2 rounded-xl hover:bg-white/20 transition-all duration-200 ${filters.reservedAmount ? 'text-purple-600 bg-purple-100' : 'text-gray-400'}`}
                    title="فیلتر بر اساس مقدار رزرو شده"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
                {showFilters.reservedAmount && (
                  <div className="mt-2 space-y-2">
                    <input
                      type="number"
                      value={filters.reservedAmount}
                      onChange={(e) => handleFilterChange('reservedAmount', e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleFilterSubmit('reservedAmount')}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                      placeholder="رزرو شده..."
                      autoFocus
                    />
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleFilterSubmit('reservedAmount')}
                        className="p-1 text-purple-600 hover:text-purple-800"
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
                  </div>
                )}
              </th>
              <th className="px-3 lg:px-6 py-3 lg:py-4 text-right text-xs lg:text-sm font-bold text-gray-700">
                <div className="flex items-center justify-between">
                  <span>کد محصول</span>
                  <button
                    onClick={() => setShowFilters(prev => ({ ...prev, orashProductId: !prev.orashProductId }))}
                    className={`p-2 rounded-xl hover:bg-white/20 transition-all duration-200 ${filters.orashProductId ? 'text-purple-600 bg-purple-100' : 'text-gray-400'}`}
                    title="فیلتر بر اساس کد محصول"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
                {showFilters.orashProductId && (
                  <div className="mt-2 space-y-2">
                    <input
                      type="text"
                      value={filters.orashProductId}
                      onChange={(e) => handleFilterChange('orashProductId', e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleFilterSubmit('orashProductId')}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                      placeholder="کد محصول..."
                      autoFocus
                    />
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleFilterSubmit('orashProductId')}
                        className="p-1 text-purple-600 hover:text-purple-800"
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
                  </div>
                )}
              </th>
              <th className="px-3 lg:px-6 py-3 lg:py-4 text-right text-xs lg:text-sm font-bold text-gray-700">
                <div className="flex items-center justify-between">
                  <span>وضعیت</span>
                  <button
                    onClick={() => setShowFilters(prev => ({ ...prev, isActive: !prev.isActive }))}
                    className={`p-2 rounded-xl hover:bg-white/20 transition-all duration-200 ${filters.isActive ? 'text-purple-600 bg-purple-100' : 'text-gray-400'}`}
                    title="فیلتر بر اساس وضعیت"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
                {showFilters.isActive && (
                  <div className="mt-2 space-y-2">
                    <select
                      value={filters.isActive}
                      onChange={(e) => handleFilterChange('isActive', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                    >
                      <option value="">همه وضعیت‌ها</option>
                      <option value="true">فعال</option>
                      <option value="false">غیرفعال</option>
                    </select>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleFilterSubmit('isActive')}
                        className="p-1 text-purple-600 hover:text-purple-800"
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
                  </div>
                )}
              </th>
              <th className="px-3 lg:px-6 py-3 lg:py-4 text-right text-xs lg:text-sm font-bold text-gray-700">
                <div className="flex items-center justify-between">
                  <span>برند</span>
                  <button
                    onClick={() => setShowFilters(prev => ({ ...prev, brandId: !prev.brandId }))}
                    className={`p-2 rounded-xl hover:bg-white/20 transition-all duration-200 ${filters.brandId ? 'text-purple-600 bg-purple-100' : 'text-gray-400'}`}
                    title="فیلتر بر اساس برند"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
                {showFilters.brandId && (
                  <div className="mt-2 space-y-2">
                    <select
                      value={filters.brandId}
                      onChange={(e) => handleFilterChange('brandId', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                    >
                      <option value="">همه برندها</option>
                      {availableBrands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleFilterSubmit('brandId')}
                        className="p-1 text-purple-600 hover:text-purple-800"
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
                  </div>
                )}
              </th>
              <th className="px-3 lg:px-6 py-3 lg:py-4 text-right text-xs lg:text-sm font-bold text-gray-700">اطلاعات کامل</th>
              <th className="px-3 lg:px-6 py-3 lg:py-4 text-right text-xs lg:text-sm font-bold text-gray-700">عملیات</th>
              <th className="px-3 lg:px-6 py-3 lg:py-4 text-right text-xs lg:text-sm font-bold text-gray-700">وضعیت فعال بودن</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stocks.map((stock) => (
              <tr key={stock.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 lg:px-6 py-4">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                        <Package className="h-3 w-3 md:h-5 md:w-5 text-white" />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs md:text-sm font-medium text-gray-900">{stock.name}</div>
                      <div className="text-xs text-gray-500">ID: {stock.id.slice(0, 8)}...</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                  <div className="text-xs md:text-sm text-gray-900">
                    {formatCurrency(stock.price)} ریال
                  </div>
                </td>
                <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                  <div className="text-xs md:text-sm text-gray-900">
                    {toPersianDigits(stock.amount)}
                  </div>
                </td>
                <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                  <div className="text-xs md:text-sm text-gray-900">
                    {toPersianDigits(stock.reservedAmount)}
                  </div>
                </td>
                <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                  <div className="text-xs md:text-sm text-gray-900">
                    {toPersianDigits(stock.orashProductId)}
                  </div>
                </td>
                <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    stock.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {stock.isActive ? 'فعال' : 'غیرفعال'}
                  </span>
                </td>
                <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <Tag className="w-3 h-3 mr-1" />
                    {stock.brand.name}
                  </span>
                </td>
                <td className="px-3 lg:px-6 py-4">
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
                <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2 space-x-reverse">
                    <button
                      onClick={() => setSelectedProductForDetails(stock.id)}
                      className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                      title="مشاهده جزئیات"
                    >
                      <Eye className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                    {(userRole === RoleEnum.MANAGER || userRole === RoleEnum.DEVELOPER) && (
                      <button
                        onClick={() => setEditingStockId(stock.id)}
                        className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50 transition-colors"
                        title="ویرایش محصول"
                      >
                        <Edit className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center justify-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={stock.isActive}
                        onChange={() => handleToggleStatus(stock.id, !stock.isActive)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
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

      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-4 mt-6">
        {stocks.map((stock) => (
          <div key={stock.id} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-gray-100">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm leading-tight">
                    {getProductTitle(stock.product)}
                  </h3>
                  <p className="text-gray-500 text-xs mt-1">
                    {getProductDescription(stock.product)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <button
                  onClick={() => setSelectedProductForDetails(stock.id)}
                  className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors"
                  title="مشاهده جزئیات"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {(userRole === RoleEnum.MANAGER || userRole === RoleEnum.DEVELOPER) && (
                  <button
                    onClick={() => setEditingStockId(stock.id)}
                    className="text-purple-600 hover:text-purple-900 p-2 rounded-lg hover:bg-purple-50 transition-colors"
                    title="ویرایش محصول"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
                <a
                  href={`https://www.alamico.ir/fa/p/${stock.product.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                  title="مشاهده اطلاعات کامل محصول در سایت"
                >
                  <Info className="w-4 h-4" />
                </a>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500 text-xs mb-1">قیمت</div>
                <div className="font-bold text-gray-900">{formatCurrency(stock.price)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500 text-xs mb-1">موجودی</div>
                <div className="font-bold text-gray-900">{formatNumber(stock.amount)}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500 text-xs mb-1">رزرو شده</div>
                <div className="font-bold text-gray-900">{formatNumber(stock.reservedAmount)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500 text-xs mb-1">وضعیت</div>
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    stock.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {stock.isActive ? 'فعال' : 'غیرفعال'}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stock.isActive}
                      onChange={() => handleToggleStatus(stock.id, !stock.isActive)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <Tag className="w-3 h-3 mr-1" />
                {stock.brand.name}
              </span>
              <span className="text-gray-400 text-xs">{stock.name}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="text-sm text-gray-700">
            نمایش {toPersianDigits(pageIndex * pageSize + 1)} تا {toPersianDigits(Math.min((pageIndex + 1) * pageSize, totalCount))} از {toPersianDigits(totalCount)} محصول
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              onClick={() => handlePageChange(pageIndex - 1)}
              disabled={pageIndex === 0}
              className="px-2 md:px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 space-x-reverse"
            >
              <ChevronRight className="w-4 h-4" />
              <span className="hidden md:inline">قبلی</span>
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
                    className={`px-2 md:px-3 py-2 text-sm font-medium rounded-md ${
                      pageIndex === pageNum
                        ? 'bg-purple-500 text-white'
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
              className="px-2 md:px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 space-x-reverse"
            >
              <span className="hidden md:inline">بعدی</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      {selectedProductForDetails && (
        <ProductDetails
          authToken={authToken}
          stockId={selectedProductForDetails}
          userId={userId.toString()}
          onClose={() => setSelectedProductForDetails(null)}
          onError={setError}
        />
      )}
    </div>
  );

  if (showAddProduct) {
    return (
      <AddProduct
        authToken={authToken}
        availableBrands={availableBrands}
        onBack={() => setShowAddProduct(false)}
        onSuccess={() => {
          setShowAddProduct(false);
          fetchStocks();
        }}
      />
    );
  }

  if (editingStockId) {
    const stock = stocks.find(s => s.id === editingStockId) || null;
    if (stock) {
      return (
        <EditProduct
          authToken={authToken}
          availableBrands={availableBrands}
          stock={stock}
          onBack={() => setEditingStockId(null)}
          onSuccess={() => {
            setEditingStockId(null);
            fetchStocks();
          }}
        />
      );
    }
  }

  return mainContent;
};

export default Products;