import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, Save, X } from 'lucide-react';
import { toPersianDigits } from '../utils/numberUtils';
import apiService from '../services/apiService';

interface Brand {
  id: string;
  name: string;
}

interface BrandsProps {
  authToken: string;
}

const Brands: React.FC<BrandsProps> = ({ authToken }) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Brand>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<Omit<Brand, 'id'>>({
    name: ''
  });
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(100);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams({
        pageSize: pageSize.toString(),
        pageIndex: pageIndex.toString()
      });
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://alami-b2b-api.liara.run/api'}/brand?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch brands');
      }

      const data = await response.json();
      
      // Set total count and calculate total pages
      const count = data.data?.details?.count || 0;
      setTotalCount(count);
      setTotalPages(Math.ceil(count / pageSize));
      
      setBrands(data.data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch brands');
    } finally {
      setLoading(false);
    }
  };

  const fetchBrandById = async (id: string) => {
    try {
      const data = await apiService.getBrandById(id, authToken);
      return data.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch brand details');
      return null;
    }
  };

  const handleEdit = async (id: string) => {
    const brandData = await fetchBrandById(id);
    if (brandData) {
      setEditingId(id);
      setEditForm(brandData);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editForm.name) return;

    try {
      await apiService.updateBrand(editingId, { name: editForm.name }, authToken);
      await fetchBrands();
      setEditingId(null);
      setEditForm({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update brand');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این برند اطمینان دارید؟')) return;

    try {
      await apiService.deleteBrand(id, authToken);
      await fetchBrands();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete brand');
    }
  };

  const handleAdd = async () => {
    if (!addForm.name) return;

    try {
      await apiService.createBrand({ name: addForm.name }, authToken);
      await fetchBrands();
      setShowAddForm(false);
      setAddForm({ name: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create brand');
    }
  };

  useEffect(() => {
    fetchBrands();
  }, [pageIndex, pageSize]);

  const handlePageChange = (newPageIndex: number) => {
    if (newPageIndex >= 0 && newPageIndex < totalPages) {
      setPageIndex(newPageIndex);
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPageIndex(0); // Reset to first page when changing page size
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">برندها</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 space-x-reverse transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>افزودن برند جدید</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">افزودن برند جدید</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نام برند</label>
              <input
                type="text"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="نام برند"
              />
            </div>
          </div>
          <div className="flex space-x-2 space-x-reverse">
            <button
              onClick={handleAdd}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center space-x-2 space-x-reverse transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>ذخیره</span>
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setAddForm({ name: '' });
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md flex items-center space-x-2 space-x-reverse transition-colors"
            >
              <X className="w-4 h-4" />
              <span>انصراف</span>
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نام برند</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عملیات</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {brands.map((brand) => (
              <tr key={brand.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === brand.id ? (
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-900">{brand.name}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {editingId === brand.id ? (
                    <div className="flex space-x-2 space-x-reverse">
                      <button
                        onClick={handleSaveEdit}
                        className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                        title="ذخیره"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditForm({});
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
                        onClick={() => handleEdit(brand.id)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                        title="ویرایش"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(brand.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {brands.length === 0 && !loading && (
          <div className="text-center py-8">
            <div className="text-gray-500 text-lg mb-2">هیچ برندی یافت نشد</div>
            <p className="text-gray-400 text-sm">برای شروع، برند جدیدی اضافه کنید</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Brands;