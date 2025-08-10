import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, Save, X, ChevronUp, ChevronDown, Building } from 'lucide-react';
import { toPersianDigits } from '../utils/numberUtils';
import apiService from '../services/apiService';

interface Brand {
  id: string;
  name: string;
}

type SortField = 'name';
type SortDirection = 'asc' | 'desc';

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
  const [sortField, setSortField] = useState<SortField | null>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const data = await apiService.getBrands(100, 0, authToken);
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedBrands = React.useMemo(() => {
    if (!sortField) return brands;

    return [...brands].sort((a, b) => {
      const aValue = a.name.toLowerCase();
      const bValue = b.name.toLowerCase();

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [brands, sortField, sortDirection]);

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronUp className="w-4 h-4 text-gray-300" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 text-blue-600" /> : 
      <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  if (loading) {
    return (
      <div className="glass-effect rounded-2xl shadow-modern mobile-card border border-white/20">
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
    <div className="glass-effect rounded-2xl shadow-modern mobile-card border border-white/20">
      {/* Header Section - Responsive */}
      <div className="mobile-flex mobile-space mb-6">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Building className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl lg:text-2xl font-bold gradient-text">برندها</h2>
        </div>
        <div className="mobile-flex mobile-space items-start sm:items-center">
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-mobile bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white flex items-center space-x-2 space-x-reverse justify-center"
          >
            <Plus className="icon-mobile-sm" />
            <span>افزودن برند جدید</span>
          </button>
        </div>
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">افزودن برند جدید</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label-mobile">نام برند</label>
              <input
                type="text"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                className="input-mobile"
                placeholder="نام برند"
              />
            </div>
          </div>
          <div className="btn-group-mobile">
            <button
              onClick={handleAdd}
              className="btn-mobile bg-green-500 hover:bg-green-600 text-white flex items-center space-x-2 space-x-reverse justify-center"
            >
              <Save className="icon-mobile-sm" />
              <span>ذخیره</span>
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setAddForm({ name: '' });
              }}
              className="btn-mobile bg-gray-500 hover:bg-gray-600 text-white flex items-center space-x-2 space-x-reverse justify-center"
            >
              <X className="icon-mobile-sm" />
              <span>انصراف</span>
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Mobile View - Cards */}
      <div className="block lg:hidden space-y-4">
        {sortedBrands.map((brand) => (
          <div key={brand.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <div className="text-base font-medium text-gray-900">{brand.name}</div>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <button
                  onClick={() => handleEdit(brand.id)}
                  className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                  title="ویرایش"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(brand.id)}
                  className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                  title="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View - Table */}
      <div className="hidden lg:block table-responsive">
        <table className="table-mobile">
          <thead>
            <tr className="table-mobile-header">
              <th className="table-mobile-header-cell">
                <div className="flex items-center justify-between">
                  <span>نام برند</span>
                  <button
                    onClick={() => handleSort('name')}
                    className="p-2 rounded-xl hover:bg-white/20 transition-all duration-200 text-gray-400 hover:text-gray-600"
                    title="مرتب‌سازی بر اساس نام"
                  >
                    {getSortIcon('name')}
                  </button>
                </div>
              </th>
              <th className="table-mobile-header-cell">عملیات</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedBrands.map((brand) => (
              <tr key={brand.id} className="table-mobile-row">
                <td className="table-mobile-cell">
                  {editingId === brand.id ? (
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="input-mobile"
                      placeholder="نام برند"
                    />
                  ) : (
                    <div className="mobile-text font-medium text-gray-900">{brand.name}</div>
                  )}
                </td>
                <td className="table-mobile-cell">
                  {editingId === brand.id ? (
                    <div className="btn-group-mobile">
                      <button
                        onClick={handleSaveEdit}
                        className="btn-mobile bg-green-500 hover:bg-green-600 text-white flex items-center space-x-2 space-x-reverse justify-center"
                        title="ذخیره"
                      >
                        <Save className="icon-mobile-sm" />
                        <span>ذخیره</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditForm({});
                        }}
                        className="btn-mobile bg-gray-500 hover:bg-gray-600 text-white flex items-center space-x-2 space-x-reverse justify-center"
                        title="انصراف"
                      >
                        <X className="icon-mobile-sm" />
                        <span>انصراف</span>
                      </button>
                    </div>
                  ) : (
                    <div className="btn-group-mobile">
                      <button
                        onClick={() => handleEdit(brand.id)}
                        className="btn-mobile bg-blue-500 hover:bg-blue-600 text-white flex items-center space-x-2 space-x-reverse justify-center"
                        title="ویرایش"
                      >
                        <Edit className="icon-mobile-sm" />
                        <span>ویرایش</span>
                      </button>
                      <button
                        onClick={() => handleDelete(brand.id)}
                        className="btn-mobile bg-red-500 hover:bg-red-600 text-white flex items-center space-x-2 space-x-reverse justify-center"
                        title="حذف"
                      >
                        <Trash2 className="icon-mobile-sm" />
                        <span>حذف</span>
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedBrands.length === 0 && !loading && (
        <div className="text-center py-8">
          <div className="text-gray-500 text-lg mb-2">هیچ برندی یافت نشد</div>
          <p className="text-gray-400 text-sm">برای شروع، برند جدیدی اضافه کنید</p>
        </div>
      )}
    </div>
  );
};

export default Brands;