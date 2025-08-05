import React, { useState, useEffect } from 'react';
import { Plus, Edit, Save, X, Package, Search, Trash2, AlertCircle, CheckCircle, Calculator } from 'lucide-react';
import { FactorStatus, PaymentMethod } from '../types/invoiceTypes';
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
  selectedFactor: any;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const InvoiceItems: React.FC<InvoiceItemsProps> = ({ 
  authToken, 
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

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemForm, setEditItemForm] = useState<{ stockId: string; amount: number }>({ stockId: '', amount: 1 });
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

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
      const data = await apiService.getStocks(100, stockPageIndex, authToken);
      let stocks = data.data.data || [];
      
      // Filter by search query if provided
      if (stockSearch.trim()) {
        stocks = stocks.filter((stock: Stock) => 
          stock.name.toLowerCase().includes(stockSearch.toLowerCase()) ||
          stock.orashProductId.includes(stockSearch)
        );
      }
      
      // Only show active stocks with available amount
      stocks = stocks.filter((stock: Stock) => stock.isActive && stock.amount > 0);
      
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
      
      await apiService.updateInvoiceItem(editingItemId, {
        stockId: editItemForm.stockId,
        factorId: selectedFactor.id,
        amount: editItemForm.amount,
        creatorUserId: selectedFactor.creatorData.personal.userId ,
      }, authToken);

      // Reset form
      setEditingItemId(null);
      setEditItemForm({ stockId: '', amount: 0 });
      
      // Refresh data
      await fetchFactorItems(selectedFactor.id);
      
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
      
      await apiService.deleteInvoiceItem(itemId, authToken);
      
      // Refresh data
      await fetchFactorItems(selectedFactor.id);
      
    } catch (err) {
      setAddItemError(err instanceof Error ? err.message : 'خطا در حذف آیتم');
    } finally {
      setDeletingItemId(null);
    }
  };

  const getSelectedStockInfo = () => {
    return availableStocks.find(stock => stock.id === selectedStock);
  };

  const handleAddItem = async () => {
    if (!selectedStock || !selectedFactor || itemAmount <= 0) return;

    const stockInfo = getSelectedStockInfo();
    if (!stockInfo) return;

    if (itemAmount > stockInfo.amount) {
      setAddItemError(`تعداد درخواستی (${itemAmount}) بیشتر از موجودی (${stockInfo.amount}) است`);
      return;
    }

    try {
      setAddingItem(true);
      setAddItemError(null);

      await apiService.createInvoiceItem({
        stockId: selectedStock,
        factorId: selectedFactor.id,
        amount: itemAmount,
        creatorUserId: selectedFactor.creatorData.personal.userId ,
      }, authToken);

      onSuccess('آیتم با موفقیت اضافه شد');
      await fetchFactorItems(selectedFactor.id);
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
    if (showAddItem) {
      fetchAvailableStocks();
    }
  }, [showAddItem, stockSearch, stockPageIndex]);

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
                    <div className="flex space-x-2 space-x-reverse">
                      <input
                        type="text"
                        value={stockSearch}
                        onChange={(e) => setStockSearch(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="نام محصول را جستجو کنید..."
                      />
                      <button
                        onClick={() => {
                          setStockPageIndex(0);
                          fetchAvailableStocks();
                        }}
                        className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                      >
                        <Search className="w-4 h-4" />
                      </button>
                    </div>
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
                            هیچ محصول فعالی یافت نشد
                          </div>
                        ) : (
                          availableStocks.map((stock) => (
                            <div
                              key={stock.id}
                              className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                                selectedStock === stock.id ? 'bg-green-50 border-green-200' : ''
                              }`}
                              onClick={() => setSelectedStock(stock.id)}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-medium text-gray-900">{stock.name}</div>
                                  <div className="text-sm text-gray-600">
                                    کد: {toPersianDigits(stock.orashProductId)} | 
                                    موجودی: {toPersianDigits(stock.amount)} | 
                                    قیمت: {formatCurrency(stock.price)} ریال
                                  </div>
                                </div>
                                <input
                                  type="radio"
                                  name="selectedStock"
                                  checked={selectedStock === stock.id}
                                  onChange={() => setSelectedStock(stock.id)}
                                  className="text-green-600"
                                />
                              </div>
                            </div>
                          ))
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
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <h6 className="font-medium text-gray-900 mb-2">اطلاعات محصول انتخاب شده:</h6>
                      <div className="text-sm text-gray-700 space-y-1">
                        <div>نام: {getSelectedStockInfo()!.name}</div>
                        <div>قیمت واحد: {formatCurrency(getSelectedStockInfo()!.price)} ریال</div>
                        <div>موجودی: {toPersianDigits(getSelectedStockInfo()!.amount)}</div>
                        <div>قیمت کل: {formatCurrency(getSelectedStockInfo()!.price * itemAmount)} ریال</div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2 space-x-reverse">
                    <button
                      onClick={handleAddItem}
                      disabled={!selectedStock || itemAmount <= 0 || addingItem}
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