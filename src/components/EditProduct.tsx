import React, { useState } from 'react';
import { ArrowLeft, Save, X, Package } from 'lucide-react';
import apiService from '../services/apiService';

interface Brand { id: string; name: string }

interface Product {
  id: string;
  slug: string;
}

interface Stock {
  id: string;
  name: string;
  price: number;
  amount: number;
  orashProductId: string;
  isActive: boolean;
  product: Product;
  brand: Brand;
}

interface EditProductProps {
  authToken: string;
  availableBrands: Brand[];
  stock: Stock;
  onBack: () => void;
  onSuccess: () => void;
}

const EditProduct: React.FC<EditProductProps> = ({ authToken, availableBrands, stock, onBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: stock.name || '',
    price: String(stock.price),
    amount: String(stock.amount),
    orashProductId: stock.orashProductId || '',
    isActive: !!stock.isActive,
    brandId: stock.brand.id,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as any;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const validate = () => {
    if (!formData.name.trim()) { setError('نام الزامی است'); return false; }
    if (!formData.price || isNaN(Number(formData.price))) { setError('قیمت معتبر نیست'); return false; }
    if (!formData.amount || isNaN(Number(formData.amount))) { setError('مقدار معتبر نیست'); return false; }
    if (!formData.brandId) { setError('انتخاب برند الزامی است'); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      setError(null);

      await apiService.updateStock(stock.id, {
        name: formData.name.trim(),
        price: Number(formData.price),
        amount: Number(formData.amount),
        orashProductId: formData.orashProductId.trim(),
        isActive: !!formData.isActive,
        brandId: formData.brandId,
      }, authToken);

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در به‌روزرسانی محصول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <button onClick={onBack} className="flex items-center space-x-2 space-x-reverse text-gray-600 hover:text-gray-800 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>بازگشت</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2 space-x-reverse">
              <Package className="w-5 h-5 text-indigo-500" />
              <span>ویرایش محصول</span>
            </h1>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center space-x-2 space-x-reverse">
                <X className="w-5 h-5 text-red-500" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نام *</label>
                <input name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="نام محصول" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">قیمت *</label>
                <input name="price" value={formData.price} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="قیمت" inputMode="numeric" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">موجودی *</label>
                <input name="amount" value={formData.amount} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="مقدار" inputMode="numeric" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Orash Product Id</label>
                <input name="orashProductId" value={formData.orashProductId} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="orashProductId" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">برند *</label>
                <select name="brandId" value={formData.brandId} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                  <option value="">انتخاب کنید</option>
                  {availableBrands.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <input id="isActive" name="isActive" type="checkbox" checked={!!formData.isActive} onChange={handleChange} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <label htmlFor="isActive" className="text-sm text-gray-700">فعال</label>
              </div>
            </div>

            <div className="flex justify-end space-x-4 space-x-reverse">
              <button type="button" onClick={onBack} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">انصراف</button>
              <button type="submit" disabled={loading} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 space-x-reverse">
                {loading ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div><span>در حال ذخیره...</span></>) : (<><Save className="w-4 h-4" /><span>ذخیره تغییرات</span></>)}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProduct;