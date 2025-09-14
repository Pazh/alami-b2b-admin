import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, Save, X, Eye, ChevronUp, ChevronDown, Users } from 'lucide-react';
import { formatCurrency, formatNumber, toPersianDigits } from '../utils/numberUtils';
import apiService from '../services/apiService';

interface Grade {
  id: string;
  name: string;
  description: string | null;
  maxCredit: number;
}

type SortField = 'name' | 'description' | 'maxCredit';
type SortDirection = 'asc' | 'desc';

interface UserGridProps {
  authToken: string;
}

const UserGrid: React.FC<UserGridProps> = ({ authToken }) => {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Grade>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<Omit<Grade, 'id'>>({
    name: '',
    description: '',
    maxCredit: 0
  });
  const [sortField, setSortField] = useState<SortField | null>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const data = await apiService.getGrades(authToken);
      setGrades(data.data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch grades');
    } finally {
      setLoading(false);
    }
  };

  const fetchGradeById = async (id: string) => {
    try {
      const data = await apiService.getGradeById(id, authToken);
      return data.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch grade details');
      return null;
    }
  };

  const handleEdit = async (id: string) => {
    const gradeData = await fetchGradeById(id);
    if (gradeData) {
      setEditingId(id);
      setEditForm(gradeData);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editForm.name) return;

    try {
      await apiService.updateGrade(editingId, {
        name: editForm.name,
        description: editForm.description || undefined,
        maxCredit: editForm.maxCredit || 0
      }, authToken);
      await fetchGrades();
      setEditingId(null);
      setEditForm({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update grade');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این گرید اطمینان دارید؟')) return;

    try {
      await apiService.deleteGrade(id, authToken);
      await fetchGrades();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete grade');
    }
  };

  const handleAdd = async () => {
    if (!addForm.name) return;

    try {
      await apiService.createGrade({
        name: addForm.name,
        description: addForm.description || undefined,
        maxCredit: addForm.maxCredit
      }, authToken);
      await fetchGrades();
      setShowAddForm(false);
      setAddForm({ name: '', description: '', maxCredit: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create grade');
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // اگر همان فیلد کلیک شده، جهت را تغییر بده
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // اگر فیلد جدید کلیک شده، آن را انتخاب کن و جهت را asc قرار بده
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedGrades = React.useMemo(() => {
    if (!sortField) return grades;

    return [...grades].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'description':
          aValue = (a.description || '').toLowerCase();
          bValue = (b.description || '').toLowerCase();
          break;
        case 'maxCredit':
          aValue = a.maxCredit;
          bValue = b.maxCredit;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [grades, sortField, sortDirection]);

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronUp className="w-4 h-4 text-gray-300" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 text-blue-600" /> : 
      <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  useEffect(() => {
    fetchGrades();
  }, []);

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
    <div className="glass-effect rounded-2xl shadow-modern mobile-card border border-white/20">
      {/* Header Section - Responsive */}
      <div className="mobile-flex mobile-space mb-6">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl lg:text-2xl font-bold gradient-text">گرید کاربران</h2>
        </div>
        <div className="mobile-flex mobile-space items-start sm:items-center">
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-mobile bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white flex items-center space-x-2 space-x-reverse justify-center"
          >
            <Plus className="icon-mobile-sm" />
            <span>افزودن گرید جدید</span>
          </button>
        </div>
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">افزودن گرید جدید</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="label-mobile">نام</label>
              <input
                type="text"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                className="input-mobile"
                placeholder="نام گرید"
              />
            </div>
            <div>
              <label className="label-mobile">توضیحات</label>
              <input
                type="text"
                value={addForm.description || ''}
                onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                className="input-mobile"
                placeholder="توضیحات (اختیاری)"
              />
            </div>
            <div>
              <label className="label-mobile">حداکثر اعتبار</label>
              <input
                type="number"
                value={addForm.maxCredit}
                onChange={(e) => setAddForm({ ...addForm, maxCredit: parseInt(e.target.value) || 0 })}
                className="input-mobile"
                placeholder="0"
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
                setAddForm({ name: '', description: '', maxCredit: 0 });
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
        {sortedGrades.map((grade) => (
          <div key={grade.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            {editingId === grade.id ? (
              // Edit mode for mobile
              <div>
                <div className="mb-4">
                  <label className="label-mobile">نام گرید</label>
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="input-mobile"
                    placeholder="نام گرید"
                  />
                </div>
                <div className="mb-4">
                  <label className="label-mobile">توضیحات</label>
                  <input
                    type="text"
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="input-mobile"
                    placeholder="توضیحات"
                  />
                </div>
                <div className="mb-4">
                  <label className="label-mobile">حداکثر اعتبار</label>
                  <input
                    type="number"
                    value={editForm.maxCredit || ''}
                    onChange={(e) => setEditForm({ ...editForm, maxCredit: Number(e.target.value) })}
                    className="input-mobile"
                    placeholder="حداکثر اعتبار"
                  />
                </div>
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
              </div>
            ) : (
              // View mode for mobile
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <div className="text-base font-medium text-gray-900">{grade.name}</div>
                    <div className="text-sm text-gray-500">{grade.description || 'بدون توضیحات'}</div>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <button
                      onClick={() => handleEdit(grade.id)}
                      className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                      title="ویرایش"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(grade.id)}
                      className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-700">
                  <span className="font-medium">حداکثر اعتبار:</span> {formatCurrency(grade.maxCredit)} ریال
                </div>
              </div>
            )}
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
                  <span>نام</span>
                  <button
                    onClick={() => handleSort('name')}
                    className="p-2 rounded-xl hover:bg-white/20 transition-all duration-200 text-gray-400 hover:text-gray-600"
                    title="مرتب‌سازی بر اساس نام"
                  >
                    {getSortIcon('name')}
                  </button>
                </div>
              </th>
              <th className="table-mobile-header-cell">
                <div className="flex items-center justify-between">
                  <span>توضیحات</span>
                  <button
                    onClick={() => handleSort('description')}
                    className="p-2 rounded-xl hover:bg-white/20 transition-all duration-200 text-gray-400 hover:text-gray-600"
                    title="مرتب‌سازی بر اساس توضیحات"
                  >
                    {getSortIcon('description')}
                  </button>
                </div>
              </th>
              <th className="table-mobile-header-cell">
                <div className="flex items-center justify-between">
                  <span>حداکثر اعتبار</span>
                  <button
                    onClick={() => handleSort('maxCredit')}
                    className="p-2 rounded-xl hover:bg-white/20 transition-all duration-200 text-gray-400 hover:text-gray-600"
                    title="مرتب‌سازی بر اساس اعتبار"
                  >
                    {getSortIcon('maxCredit')}
                  </button>
                </div>
              </th>
              <th className="table-mobile-header-cell">عملیات</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedGrades.map((grade) => (
              <tr key={grade.id} className="table-mobile-row">
                <td className="table-mobile-cell">
                  {editingId === grade.id ? (
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="input-mobile"
                      placeholder="نام گرید"
                    />
                  ) : (
                    <div className="mobile-text font-medium text-gray-900">{grade.name}</div>
                  )}
                </td>
                <td className="table-mobile-cell">
                  {editingId === grade.id ? (
                    <input
                      type="text"
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="input-mobile"
                      placeholder="توضیحات (اختیاری)"
                    />
                  ) : (
                    <div className="mobile-text text-gray-600">{grade.description || '-'}</div>
                  )}
                </td>
                <td className="table-mobile-cell">
                  {editingId === grade.id ? (
                    <input
                      type="number"
                      value={editForm.maxCredit || 0}
                      onChange={(e) => setEditForm({ ...editForm, maxCredit: parseInt(e.target.value) || 0 })}
                      className="input-mobile"
                      placeholder="حداکثر اعتبار"
                    />
                  ) : (
                    <div className="mobile-text text-gray-900">{formatCurrency(grade.maxCredit)} ریال</div>
                  )}
                </td>
                <td className="table-mobile-cell">
                  {editingId === grade.id ? (
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
                        onClick={() => handleEdit(grade.id)}
                        className="btn-mobile bg-blue-500 hover:bg-blue-600 text-white flex items-center space-x-2 space-x-reverse justify-center"
                        title="ویرایش"
                      >
                        <Edit className="icon-mobile-sm" />
                        <span>ویرایش</span>
                      </button>
                      <button
                        onClick={() => handleDelete(grade.id)}
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

      {sortedGrades.length === 0 && !loading && (
        <div className="text-center py-8">
          <div className="text-gray-500 text-lg mb-2">هیچ گریدی یافت نشد</div>
          <p className="text-gray-400 text-sm">برای شروع، گرید جدیدی اضافه کنید</p>
        </div>
      )}
    </div>
  );
};

export default UserGrid;