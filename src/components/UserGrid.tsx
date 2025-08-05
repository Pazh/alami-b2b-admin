import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, Save, X, Eye, ChevronUp, ChevronDown } from 'lucide-react';
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
        maxCredit: editForm.maxCredit
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">گرید کاربران</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 space-x-reverse transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>افزودن گرید جدید</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">افزودن گرید جدید</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نام</label>
              <input
                type="text"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="نام گرید"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات</label>
              <input
                type="text"
                value={addForm.description}
                onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="توضیحات (اختیاری)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">حداکثر اعتبار</label>
              <input
                type="number"
                value={addForm.maxCredit}
                onChange={(e) => setAddForm({ ...addForm, maxCredit: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
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
                setAddForm({ name: '', description: '', maxCredit: 0 });
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
              <th 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center justify-between">
                  <span>نام</span>
                  {getSortIcon('name')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                onClick={() => handleSort('description')}
              >
                <div className="flex items-center justify-between">
                  <span>توضیحات</span>
                  {getSortIcon('description')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                onClick={() => handleSort('maxCredit')}
              >
                <div className="flex items-center justify-between">
                  <span>حداکثر اعتبار</span>
                  {getSortIcon('maxCredit')}
                </div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عملیات</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedGrades.map((grade) => (
              <tr key={grade.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === grade.id ? (
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-900">{grade.name}</div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingId === grade.id ? (
                    <input
                      type="text"
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="توضیحات (اختیاری)"
                    />
                  ) : (
                    <div className="text-sm text-gray-600">{grade.description || '-'}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === grade.id ? (
                    <input
                      type="number"
                      value={editForm.maxCredit || 0}
                      onChange={(e) => setEditForm({ ...editForm, maxCredit: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="text-sm text-gray-900">{formatCurrency(grade.maxCredit)} ریال</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {editingId === grade.id ? (
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
                        onClick={() => handleEdit(grade.id)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                        title="ویرایش"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(grade.id)}
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

        {sortedGrades.length === 0 && !loading && (
          <div className="text-center py-8">
            <div className="text-gray-500 text-lg mb-2">هیچ گریدی یافت نشد</div>
            <p className="text-gray-400 text-sm">برای شروع، گرید جدیدی اضافه کنید</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserGrid;