import React, { useState, useEffect } from 'react';
import { Plus, Edit, Save, X, Package, Search, Trash2, AlertCircle, CheckCircle, Calculator } from 'lucide-react';
import { FactorStatus, PaymentMethod } from '../types/invoiceTypes';
import { RoleEnum } from '../types/roles';
import { formatCurrency, toPersianDigits } from '../utils/numberUtils';
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

interface FactorItem {
  id: string;
  factorId: string;
  stockId: string;
  amount: number;
  factorData: any;
  stockData: {
    id: string;
    name: string;
    price: number;
    amount: number;
    reservedAmount: number;
    orashProductId: string;
    isActive: boolean;
    product: any;
    brand: {
      id: string;
      name: string;
    };
  };
}

interface InvoiceItemsProps {
  authToken: string;
  userId: number;
  userRole: any;
  selectedFactor: any;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const InvoiceItems: React.FC<InvoiceItemsProps> = ({ 
  authToken, 
  userId,
  userRole,
  selectedFactor, 
  onSuccess, 
  onError 
}) => {
  const [factorItems, setFactorItems] = useState<FactorItem[]>([]);
  const [factorItemsLoading, setFactorItemsLoading] = useState(false);
  const [selectedInvoiceItems, setSelectedInvoiceItems] = useState<FactorItem[]>([]);

  // Add item states
  const [showAddItem, setShowAddItem] = useState(false);
  const [availableStocks, setAvailableStocks] = useState<Stock[]>([]);
  const [stocksLoading, setStocksLoading] = useState(false);
  const [selectedStock, setSelectedStock] = useState('');
  const [itemAmount, setItemAmount] = useState(1);
  const [addingItem, setAddingItem] = useState(false);
  const [addItemError, setAddItemError] = useState<string | null>(null);
  const [stockSearch, setStockSearch] = useState('');
  const [stockPageIndex, setStockPageIndex] = useState(0);
  const [allowedBrandIds, setAllowedBrandIds] = useState<string[]>([]);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemForm, setEditItemForm] = useState<{ stockId: string; amount: number }>({ stockId: '', amount: 1 });
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  // Function to get allowed brands from selected customer
  const fetchAllowedBrands = () => {
    try {
      console.log('🔍 Fetching allowed brands from selected customer...');
      console.log('🔍 Selected factor customer data:', selectedFactor?.customerData);
      
      if (userRole === RoleEnum.MANAGER || userRole === RoleEnum.DEVELOPER || userRole === RoleEnum.FINANCEMANAGER) {
        // High-level roles can see all brands
        console.log('✅ High-level role - allowing all brands');
        setAllowedBrandIds(['ALL_BRANDS_ALLOWED']);
      } else {
        // For sales roles, get brands from the customer in this factor
        if (selectedFactor?.customerData?.account?.brand && Array.isArray(selectedFactor.customerData.account.brand)) {
          const brandIds = selectedFactor.customerData.account.brand.map((brand: Brand) => brand.id);
          console.log('✅ Found customer brands from factor:', brandIds);
          console.log('✅ Brand names:', selectedFactor.customerData.account.brand.map((brand: Brand) => brand.name));
          setAllowedBrandIds(brandIds);
        } else {
          console.log('❌ No brands found for customer - showing no products');
          setAllowedBrandIds(['NO_BRANDS_ASSIGNED']);
        }
      }
    } catch (err) {
      console.error('❌ fetchAllowedBrands failed:', err);
      setAllowedBrandIds(['NO_BRANDS_ASSIGNED']);
    }
  };

  // Filter stocks by allowed brands (pure JavaScript filter)
  const filterStocksByBrand = (stocks: Stock[]): Stock[] => {
    console.log('🔧 Filtering stocks by brand. Total stocks:', stocks.length);
    console.log('🔧 Allowed brand IDs:', allowedBrandIds);
    console.log('🔧 User role:', userRole);
    
    // If high-level role, show all
    if (allowedBrandIds.includes('ALL_BRANDS_ALLOWED')) {
      console.log('✅ High-level role - showing all stocks');
      return stocks;
    }
    
    // If sales role but no brands assigned, show nothing
    if (allowedBrandIds.includes('NO_BRANDS_ASSIGNED')) {
      console.log('❌ No brands assigned - showing no stocks');
      return [];
    }
    
    // If sales role with specific brands, filter
    if ((userRole === RoleEnum.SALEMANAGER || userRole === RoleEnum.MARKETER) && allowedBrandIds.length > 0) {
      const filteredStocks = stocks.filter((stock: Stock) => {
        // Try multiple ways to get brand ID from stock object
        let stockBrandId = null;
        
        // Method 1: stock.brand.id (most common)
        if (stock.brand && stock.brand.id) {
          stockBrandId = stock.brand.id;
        }
        // Method 2: stock.brandId (direct property)
        else if ((stock as any).brandId) {
          stockBrandId = (stock as any).brandId;
        }
        // Method 3: stock.brand_id (snake_case)
        else if ((stock as any).brand_id) {
          stockBrandId = (stock as any).brand_id;
        }
        // Method 4: stock.product.brandId (brand in product)
        else if (stock.product && (stock.product as any).brandId) {
          stockBrandId = (stock.product as any).brandId;
        }
        // Method 5: stock.product.brandId.id (brand object in product)
        else if (stock.product && stock.product.brandId && stock.product.brandId.id) {
          stockBrandId = stock.product.brandId.id;
        }
        
        const isAllowed = stockBrandId && allowedBrandIds.includes(stockBrandId);
        
        console.log(`🔍 Stock: "${stock.product?.title?.fa || stock.name || 'Unknown'}" - Brand ID: ${stockBrandId} - Allowed: ${isAllowed}`);
        
        if (!isAllowed) {
          console.log(`🚫 Blocking stock - Brand ID: ${stockBrandId} not in allowed list: [${allowedBrandIds.join(', ')}]`);
        }
        
        return isAllowed;
      });
      
      console.log(`✅ Filtered ${stocks.length} stocks down to ${filteredStocks.length} allowed stocks`);
      return filteredStocks;
    }
    
    // Default: show all
    console.log('✅ Default case - showing all stocks');
    return stocks;
  };

  const fetchFactorItems = async (factorId: string) => {
    try {
      setFactorItemsLoading(true);
      const data = await apiService.getInvoiceItems(factorId, authToken);
      setFactorItems(data.data?.data || []);
      setSelectedInvoiceItems(data.data?.data || []);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to fetch factor items');
    } finally {
      setFactorItemsLoading(false);
    }
  };

  const fetchAvailableStocks = async () => {
    try {
      setStocksLoading(true);
      
      let data;
      if (stockSearch.trim()) {
        // Use the stock filter API when searching
        data = await apiService.searchStocksByName(stockSearch.trim(), authToken);
      } else {
        // Use regular stocks API when not searching
        data = await apiService.getStocks(20, stockPageIndex, authToken);
      }
      
      let stocks = data.data.data || [];
      
      console.log('📦 Raw stocks received:', stocks.length);
      
      // Log first few stocks structure for debugging
      if (stocks.length > 0) {
        console.log('📋 Sample stock structure:', JSON.stringify(stocks[0], null, 2));
      }
      
      // Only show active stocks with available amount
      stocks = stocks.filter((stock: Stock) => stock.isActive && stock.amount > 0);
      console.log('📦 Active stocks with inventory:', stocks.length);
      
      // Apply brand filter using our JavaScript function
      stocks = filterStocksByBrand(stocks);
      console.log('📦 Final stocks after brand filter:', stocks.length);
      
      setAvailableStocks(stocks);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to fetch stocks');
    } finally {
      setStocksLoading(false);
    }
  };

  const handleEditItem = (item: any) => {
    setEditingItemId(item.id);
    setEditItemForm({
      stockId: item.stockData.id, // Keep the current stock ID
      amount: item.amount
    });
  };

  const handleUpdateItem = async (itemId: string) => {
    if (!editingItemId || editItemForm.amount <= 0) {
      setAddItemError('لطفاً تعداد معتبر وارد کنید');
      return;
    }

    try {
      setUpdatingItemId(itemId);
      setAddItemError(null);
      
      // Find the current item to get its original amount
      const currentItem = factorItems.find(item => item.id === itemId);
      if (!currentItem) {
        throw new Error('آیتم مورد نظر یافت نشد');
      }

      const originalAmount = currentItem.amount;
      const newAmount = editItemForm.amount;
      const amountDifference = newAmount - originalAmount;

      // Check if the new amount exceeds available stock
      const currentStock = availableStocks.find(stock => stock.id === currentItem.stockId);
      if (currentStock && amountDifference > 0 && amountDifference > currentStock.amount) {
        throw new Error(`تعداد درخواستی (${newAmount}) بیشتر از موجودی (${currentStock.amount + originalAmount}) است`);
      }

      // First, update the invoice item
      await apiService.updateInvoiceItem(editingItemId, {
        stockId: editItemForm.stockId,
        factorId: selectedFactor.id,
        amount: editItemForm.amount,
        creatorUserId: selectedFactor.creatorData.personal.userId ,
      }, authToken);

      // Then, update the stock based on the amount difference
      if (currentStock && amountDifference !== 0) {
        const newStockAmount = currentStock.amount - amountDifference;
        const newReservedAmount = currentStock.reservedAmount + amountDifference;
        
        await apiService.updateStock(currentItem.stockId, {
          amount: newStockAmount,
          reservedAmount: newReservedAmount
        }, authToken);
      }

      // Reset form
      setEditingItemId(null);
      setEditItemForm({ stockId: '', amount: 0 });
      
      // Refresh data
      await fetchFactorItems(selectedFactor.id);
      await fetchAvailableStocks(); // Refresh the available stocks to show updated amounts
      
      onSuccess('آیتم با موفقیت به‌روزرسانی شد و موجودی به‌روزرسانی شد');
      
    } catch (err) {
      setAddItemError(err instanceof Error ? err.message : 'خطا در بروزرسانی آیتم');
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('آیا از حذف این آیتم اطمینان دارید؟')) return;

    try {
      setDeletingItemId(itemId);
      
      // Find the item to get its details before deleting
      const itemToDelete = factorItems.find(item => item.id === itemId);
      if (!itemToDelete) {
        throw new Error('آیتم مورد نظر یافت نشد');
      }

      // First, delete the invoice item
      await apiService.deleteInvoiceItem(itemId, authToken);
      
      // Then, restore the stock by increasing amount and decreasing reservedAmount
      const currentStock = availableStocks.find(stock => stock.id === itemToDelete.stockId);
      if (currentStock) {
        const newAmount = currentStock.amount + itemToDelete.amount;
        const newReservedAmount = Math.max(0, currentStock.reservedAmount - itemToDelete.amount);
        
        await apiService.updateStock(itemToDelete.stockId, {
          amount: newAmount,
          reservedAmount: newReservedAmount
        }, authToken);
      } else {
        // If stock is not found in availableStocks, try to get it from the item data
        const stockFromItem = itemToDelete.stockData;
        if (stockFromItem) {
          const newAmount = stockFromItem.amount + itemToDelete.amount;
          const newReservedAmount = Math.max(0, stockFromItem.reservedAmount - itemToDelete.amount);
          
          await apiService.updateStock(itemToDelete.stockId, {
            amount: newAmount,
            reservedAmount: newReservedAmount
          }, authToken);
        }
      }
      
      // Refresh data
      await fetchFactorItems(selectedFactor.id);
      await fetchAvailableStocks(); // Refresh the available stocks to show updated amounts
      
      onSuccess('آیتم با موفقیت حذف شد و موجودی به‌روزرسانی شد');
      
    } catch (err) {
      setAddItemError(err instanceof Error ? err.message : 'خطا در حذف آیتم');
    } finally {
      setDeletingItemId(null);
    }
  };

  const getSelectedStockInfo = () => {
    return availableStocks.find(stock => stock.id === selectedStock);
  };

  // Helper function to check if a brand is allowed for the customer
  const isBrandAllowedForCustomer = (brandId: string) => {
    const customerAllowedBrands = selectedFactor.customerData?.account?.brand || [];
    if (customerAllowedBrands.length === 0) return true; // If no brands are specified, all brands are allowed
    return customerAllowedBrands.some((brand: Brand) => brand.id === brandId);
  };

  const handleAddItem = async () => {
    if (!selectedStock || !selectedFactor || itemAmount <= 0) return;

    const stockInfo = getSelectedStockInfo();
    if (!stockInfo) return;

    if (itemAmount > stockInfo.amount) {
      setAddItemError(`تعداد درخواستی (${itemAmount}) بیشتر از موجودی (${stockInfo.amount}) است`);
      return;
    }

    // Check if the product's brand is in the customer's allowed brands
    const customerAllowedBrands = selectedFactor.customerData?.account?.brand || [];
    const stockBrandId = stockInfo.brand?.id;
    
    if (customerAllowedBrands.length > 0 && stockBrandId) {
      const isBrandAllowed = customerAllowedBrands.some((brand: Brand) => brand.id === stockBrandId);
      
      if (!isBrandAllowed) {
        const brandName = stockInfo.brand?.name || 'نامشخص';
        setAddItemError(`برند "${brandName}" جز برندهای مجاز این مشتری نیست. لطفاً محصولی از برندهای مجاز انتخاب کنید.`);
        return;
      }
    }

    try {
      setAddingItem(true);
      setAddItemError(null);

      // First, create the invoice item
      await apiService.createInvoiceItem({
        stockId: selectedStock,
        factorId: selectedFactor.id,
        amount: itemAmount,
        creatorUserId: selectedFactor.creatorData.personal.userId ,
      }, authToken);

      // Then, update the stock to reduce amount and increase reservedAmount
      const newAmount = stockInfo.amount - itemAmount;
      const newReservedAmount = stockInfo.reservedAmount + itemAmount;
      
      await apiService.updateStock(selectedStock, {
        amount: newAmount,
        reservedAmount: newReservedAmount
      }, authToken);

      onSuccess('آیتم با موفقیت اضافه شد و موجودی به‌روزرسانی شد');
      await fetchFactorItems(selectedFactor.id);
      await fetchAvailableStocks(); // Refresh the available stocks to show updated amounts
      setShowAddItem(false);
      setSelectedStock('');
      setItemAmount(1);
      setStockSearch('');
    } catch (err) {
      setAddItemError(err instanceof Error ? err.message : 'خطا در اضافه کردن آیتم');
    } finally {
      setAddingItem(false);
    }
  };

  const calculateTotalPrice = () => {
    return factorItems.reduce((total, item) => {
      return total + (item.stockData.price * item.amount);
    }, 0);
  };

  useEffect(() => {
    fetchFactorItems(selectedFactor.id);
  }, [selectedFactor.id]);

  useEffect(() => {
    console.log('🔍 useEffect triggered - selectedFactor changed:', selectedFactor?.id);
    fetchAllowedBrands();
  }, [userId, userRole, selectedFactor]);

  useEffect(() => {
    if (showAddItem) {
      fetchAvailableStocks();
    }
  }, [showAddItem, stockSearch, stockPageIndex, allowedBrandIds]);

  // Debounced search effect
  useEffect(() => {
    if (!showAddItem) return;
    
    const timeoutId = setTimeout(() => {
      fetchAvailableStocks();
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [stockSearch]);

  return (
    <div className="space-y-6">
      {/* Factor Items */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
          <Package className="w-5 h-5 text-orange-500" />
          <span>آیتم‌های فاکتور</span>
        </h3>
        
        {factorItemsLoading ? (
          <div className="animate-pulse">
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-md font-medium text-gray-900 flex items-center">
                <Package className="w-5 h-5 mr-2" />
                اقلام فاکتور ({toPersianDigits(selectedInvoiceItems.length)} قلم)
              </h4>
              {selectedFactor.status !== FactorStatus.APPROVED_BY_FINANCE && (
                <button
                  onClick={() => setShowAddItem(true)}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm flex items-center space-x-1 space-x-reverse transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>افزودن آیتم</span>
                </button>
              )}
            </div>

            {/* Add Item Form */}
            {showAddItem && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h5 className="text-md font-medium text-gray-900 mb-3">افزودن آیتم جدید</h5>
                
                {/* Brand Restriction Info */}
                {selectedFactor.customerData?.account?.brand && selectedFactor.customerData.account.brand.length > 0 && (
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-800 text-sm flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      <strong>توجه:</strong> این مشتری فقط می‌تواند محصولات از برندهای زیر را خریداری کند:
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedFactor.customerData.account.brand.map((brand: Brand) => (
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

                {addItemError && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {addItemError}
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Stock Search */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">جستجو محصول</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={stockSearch}
                        onChange={(e) => setStockSearch(e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="نام محصول را جستجو کنید..."
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                    {stockSearch.trim() && (
                      <p className="text-xs text-gray-500 mt-1 flex items-center">
                        {stocksLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-500 mr-1"></div>
                            در حال جستجو...
                          </>
                        ) : (
                          'جستجو خودکار بعد از ۵۰۰ میلی‌ثانیه'
                        )}
                      </p>
                    )}
                  </div>

                  {/* Stock Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">انتخاب محصول</label>
                    {stocksLoading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
                        <p className="text-sm text-gray-600 mt-2">در حال بارگذاری محصولات...</p>
                      </div>
                    ) : (
                      <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md">
                        {availableStocks.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            {stockSearch.trim() ? 'هیچ محصولی با این نام یافت نشد' : 'هیچ محصول فعالی یافت نشد'}
                          </div>
                        ) : (
                          availableStocks.map((stock) => {
                            const isAllowed = isBrandAllowedForCustomer(stock.brand?.id || '');
                            return (
                              <div
                                key={stock.id}
                                className={`p-3 border-b border-gray-200 ${
                                  !isAllowed ? 'opacity-50 bg-gray-100' : 'cursor-pointer hover:bg-gray-50'
                                } ${
                                  selectedStock === stock.id ? 'bg-green-50 border-green-200' : ''
                                }`}
                                onClick={() => isAllowed && setSelectedStock(stock.id)}
                              >
                                <div className="flex justify-between items-center">
                                  <div>
                                    <div className="font-medium text-gray-900 flex items-center">
                                      {stock.name}
                                      {!isAllowed && (
                                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                          برند غیرمجاز
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      کد: {toPersianDigits(stock.orashProductId)} | 
                                      موجودی: {toPersianDigits(stock.amount)} | 
                                      رزرو شده: {toPersianDigits(stock.reservedAmount)} | 
                                      قیمت: {formatCurrency(stock.price)} ریال | 
                                      برند: {stock.brand?.name || 'نامشخص'}
                                    </div>
                                  </div>
                                  <input
                                    type="radio"
                                    name="selectedStock"
                                    checked={selectedStock === stock.id}
                                    onChange={() => isAllowed && setSelectedStock(stock.id)}
                                    disabled={!isAllowed}
                                    className={`${isAllowed ? 'text-green-600' : 'text-gray-400'}`}
                                  />
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>

                  {/* Amount Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">تعداد</label>
                    <input
                      type="number"
                      min="1"
                      value={itemAmount}
                      onChange={(e) => setItemAmount(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="تعداد مورد نظر"
                    />
                  </div>

                  {/* Selected Stock Info */}
                  {selectedStock && getSelectedStockInfo() && (
                    <div className={`p-3 border rounded-md ${
                      isBrandAllowedForCustomer(getSelectedStockInfo()!.brand?.id || '') 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <h6 className="font-medium text-gray-900 mb-2 flex items-center">
                        اطلاعات محصول انتخاب شده:
                        {!isBrandAllowedForCustomer(getSelectedStockInfo()!.brand?.id || '') && (
                          <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            برند غیرمجاز
                          </span>
                        )}
                      </h6>
                      <div className="text-sm text-gray-700 space-y-1">
                        <div>نام: {getSelectedStockInfo()!.name}</div>
                        <div>برند: {getSelectedStockInfo()!.brand?.name || 'نامشخص'}</div>
                        <div>قیمت واحد: {formatCurrency(getSelectedStockInfo()!.price)} ریال</div>
                        <div>موجودی: {toPersianDigits(getSelectedStockInfo()!.amount)}</div>
                        <div>رزرو شده: {toPersianDigits(getSelectedStockInfo()!.reservedAmount)}</div>
                        <div>قیمت کل: {formatCurrency(getSelectedStockInfo()!.price * itemAmount)} ریال</div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2 space-x-reverse">
                    <button
                      onClick={handleAddItem}
                      disabled={!selectedStock || itemAmount <= 0 || addingItem || (!!selectedStock && !isBrandAllowedForCustomer(getSelectedStockInfo()?.brand?.id || ''))}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 space-x-reverse"
                    >
                      {addingItem ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>در حال اضافه کردن...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>اضافه کردن</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddItem(false);
                        setSelectedStock('');
                        setItemAmount(1);
                        setAddItemError(null);
                        setStockSearch('');
                      }}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
                    >
                      انصراف
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">محصول</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">برند</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">قیمت واحد</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تعداد</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">قیمت کل</th>
                    {selectedFactor.status !== FactorStatus.APPROVED_BY_FINANCE && (
                      <th className="px-4 py-3 text-sm font-bold text-blue-600">
                        عملیات
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {factorItems.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        {editingItemId === item.id ? (
                          <div className="text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded border">
                            {item.stockData.name}
                          </div>
                        ) : (
                          item.stockData.name
                        )}
                        <div className="text-sm text-gray-500">کد: {toPersianDigits(item.stockData.orashProductId)}</div>
                      </td>
                      <td className="px-4 py-4">
                        {editingItemId === item.id ? (
                          <div className="text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded border">
                            {item.stockData.brand.name}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {item.stockData.brand.name}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingItemId === item.id ? (
                          <div className="text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded border">
                            {formatCurrency(item.stockData.price)} ریال
                          </div>
                        ) : (
                          formatCurrency(item.stockData.price) + ' ریال'
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingItemId === item.id ? (
                          <input
                            type="number"
                            min="1"
                            value={editItemForm.amount || 1}
                            onChange={(e) => setEditItemForm({ ...editItemForm, amount: parseInt(e.target.value) || 1 })}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                          />
                        ) : (
                          toPersianDigits(item.amount)
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {editingItemId === item.id ? (
                          formatCurrency(item.stockData.price * editItemForm.amount) + ' ریال'
                        ) : (
                          formatCurrency(item.stockData.price * item.amount) + ' ریال'
                        )}
                      </td>
                      {selectedFactor.status !== FactorStatus.APPROVED_BY_FINANCE && (
                        <td className="px-4 py-3 text-sm font-medium">
                          {editingItemId === item.id ? (
                            <div className="flex space-x-2 space-x-reverse">
                              <button
                                onClick={() => handleUpdateItem(item.id)}
                                disabled={updatingItemId === item.id}
                                className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="ذخیره تغییرات"
                              >
                                {updatingItemId === item.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                                ) : (
                                  <Save className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingItemId(null);
                                  setEditItemForm({ stockId: '', amount: 1 });
                                }}
                                className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50 transition-colors"
                                title="انصراف"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex space-x-2 space-x-reverse">
                              <button
                                onClick={() => handleEditItem(item)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                                title="ویرایش آیتم"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                disabled={deletingItemId === item.id}
                                className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="حذف آیتم"
                              >
                                {deletingItemId === item.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {factorItems.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-500 text-lg mb-2">هیچ آیتمی یافت نشد</div>
                  <p className="text-gray-400 text-sm">آیتم‌های این فاکتور در اینجا نمایش داده می‌شوند</p>
                </div>
              )}
            </div>

            {/* Information message for approved invoices */}
            {selectedFactor.status === FactorStatus.APPROVED_BY_FINANCE && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <strong>این فاکتور تایید نهایی شده است و قابل ویرایش نمی‌باشد.</strong>
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Total Price */}
      {factorItems.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2 space-x-reverse">
              <Calculator className="w-5 h-5 text-green-500" />
              <span>مجموع کل فاکتور</span>
            </h3>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(calculateTotalPrice())} ریال
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceItems; 