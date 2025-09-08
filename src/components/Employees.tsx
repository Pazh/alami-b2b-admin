import React, { useState, useEffect } from 'react';
import { Edit, Save, X, User, Shield, ChevronLeft, ChevronRight, Search, Filter, Users, Plus } from 'lucide-react';
import { RoleEnum, ROLE_DISPLAY_NAMES, ROLE_COLORS } from '../types/roles';
import { formatNumber, toPersianDigits } from '../utils/numberUtils';
import AddEmployee from './AddEmployee';

interface Role {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  role: Role;
}

interface EditForm {
  userId?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

interface EmployeesProps {
  authToken: string;
  onViewCustomers: (employee: Employee) => void;
}

const Employees: React.FC<EmployeesProps> = ({ authToken, onViewCustomers }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({});
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState({
    firstName: '',
    lastName: '',
    role: ''
  });
  const [showFilters, setShowFilters] = useState({
    firstName: false,
    lastName: false,
    role: false
  });
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [showAddEmployee, setShowAddEmployee] = useState(false);

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://alami-b2b-api.liara.run/api';

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams({
        pageSize: pageSize.toString(),
        pageIndex: pageIndex.toString()
      });

      // Check if we have any filters
      const hasFilters = Object.values(filters).some(filter => filter.trim() !== '');
      
      let response;
      
      if (hasFilters) {
        // Prepare filter data - only include non-empty filters
        const filterData: any = {};
        if (filters.firstName.trim()) filterData.firstName = filters.firstName.trim();
        if (filters.lastName.trim()) filterData.lastName = filters.lastName.trim();
        if (filters.role.trim()) filterData.roleName = filters.role.trim();
        
        response = await fetch(`${baseUrl}/manager-user/filter?${queryParams}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify(filterData),
        });
      } else {
        // Use regular API if no filters
        response = await fetch(`${baseUrl}/manager-user?${queryParams}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        });
      }

      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }

      const data = await response.json();
      
      // Set total count and calculate total pages
      const count = data.data?.details?.count || 0;
      setTotalCount(count);
      setTotalPages(Math.ceil(count / pageSize));
      
      setEmployees(data.data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch(`${baseUrl}/role`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableRoles(data.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingId(employee.id);
    setEditForm({
      ...employee,
      role: employee.role.id
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editForm) return;

    try {
      const updateData = {
        userId: editForm.userId,
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        roleId: editForm.role
      };

      const response = await fetch(`${baseUrl}/manager-user/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update employee');
      }

      await fetchEmployees();
      setEditingId(null);
      setEditForm({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update employee');
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
    fetchEmployees();
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
    fetchEmployees();
  };

  const clearAllFilters = () => {
    setFilters({
      firstName: '',
      lastName: '',
      role: ''
    });
    setPageIndex(0);
  };

  const hasActiveFilters = Object.values(filters).some(filter => filter.trim() !== '');

  const getFullName = (employee: Employee) => {
    return `${employee.firstName}${employee.lastName ? ` ${employee.lastName}` : ''}`;
  };

  const getRoleDisplayName = (roleName: string): string => {
    const roleKey = Object.keys(RoleEnum).find(key => 
      RoleEnum[key as keyof typeof RoleEnum] === roleName
    ) as keyof typeof RoleEnum;
    
    return roleKey ? ROLE_DISPLAY_NAMES[RoleEnum[roleKey]] : roleName;
  };

  const getRoleColor = (roleName: string): string => {
    const roleKey = Object.keys(RoleEnum).find(key => 
      RoleEnum[key as keyof typeof RoleEnum] === roleName
    ) as keyof typeof RoleEnum;
    
    return roleKey ? ROLE_COLORS[RoleEnum[roleKey]] : 'bg-gray-100 text-gray-800';
  };

  useEffect(() => {
    fetchEmployees();
    fetchRoles();
  }, [pageIndex, pageSize, filters]);

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
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const mainContent = (
    <div className="glass-effect rounded-2xl shadow-modern mobile-card border border-white/20">
      {/* Header Section - Responsive */}
      <div className="mobile-flex mobile-space mb-6">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl lg:text-2xl font-bold gradient-text">کارمندان</h2>
        </div>
        <div className="mobile-flex mobile-space items-start sm:items-center">
          <button
            onClick={() => setShowAddEmployee(true)}
            className="btn-mobile bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all duration-200 active:scale-95 touch-manipulation flex items-center space-x-1 space-x-reverse justify-center"
          >
            <Plus className="icon-mobile-sm" />
            <span>افزودن کارمند</span>
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="btn-mobile bg-red-100 text-red-700 hover:bg-red-200 transition-all duration-200 active:scale-95 touch-manipulation flex items-center space-x-1 space-x-reverse justify-center"
            >
              <X className="icon-mobile-sm" />
              <span>پاک کردن فیلترها</span>
            </button>
          )}
          <div className="mobile-text text-gray-500 bg-white/80 px-3 py-2 rounded-xl backdrop-blur-sm">
            تعداد کل: {toPersianDigits(totalCount)}
          </div>
          <div className="flex items-center space-x-2 space-x-reverse justify-center">
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
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-200/50">
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">کارمند</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center justify-between">
                  <span>نام</span>
                  <button
                    onClick={() => setShowFilters(prev => ({ ...prev, firstName: !prev.firstName }))}
                    className={`p-1 rounded hover:bg-gray-200 transition-colors ${filters.firstName ? 'text-blue-600' : 'text-gray-400'}`}
                    title="فیلتر بر اساس نام"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
                {showFilters.firstName && (
                  <div className="mt-2 flex items-center space-x-2 space-x-reverse">
                    <input
                      type="text"
                      value={filters.firstName}
                      onChange={(e) => handleFilterChange('firstName', e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleFilterSubmit('firstName')}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="جستجو در نام..."
                      autoFocus
                    />
                    <button
                      onClick={() => handleFilterSubmit('firstName')}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="اعمال فیلتر"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                    {filters.firstName && (
                      <button
                        onClick={() => clearFilter('firstName')}
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
                  <span>نام خانوادگی</span>
                  <button
                    onClick={() => setShowFilters(prev => ({ ...prev, lastName: !prev.lastName }))}
                    className={`p-1 rounded hover:bg-gray-200 transition-colors ${filters.lastName ? 'text-blue-600' : 'text-gray-400'}`}
                    title="فیلتر بر اساس نام خانوادگی"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
                {showFilters.lastName && (
                  <div className="mt-2 flex items-center space-x-2 space-x-reverse">
                    <input
                      type="text"
                      value={filters.lastName}
                      onChange={(e) => handleFilterChange('lastName', e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleFilterSubmit('lastName')}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="جستجو در نام خانوادگی..."
                      autoFocus
                    />
                    <button
                      onClick={() => handleFilterSubmit('lastName')}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="اعمال فیلتر"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                    {filters.lastName && (
                      <button
                        onClick={() => clearFilter('lastName')}
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
                  <span>نقش</span>
                  <button
                    onClick={() => setShowFilters(prev => ({ ...prev, role: !prev.role }))}
                    className={`p-1 rounded hover:bg-gray-200 transition-colors ${filters.role ? 'text-blue-600' : 'text-gray-400'}`}
                    title="فیلتر بر اساس نقش"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
                {showFilters.role && (
                  <div className="mt-2 flex items-center space-x-2 space-x-reverse">
                    <select
                      value={filters.role}
                      onChange={(e) => handleFilterChange('role', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">همه نقش‌ها</option>
                      {availableRoles.map((role) => (
                        <option key={role.id} value={role.name}>
                          {getRoleDisplayName(role.name)}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleFilterSubmit('role')}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="اعمال فیلتر"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                    {filters.role && (
                      <button
                        onClick={() => clearFilter('role')}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="پاک کردن فیلتر"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عملیات</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">اختصاص مشتری</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.map((employee) => (
              <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {getFullName(employee)}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {toPersianDigits(employee.userId)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  {editingId === employee.id ? (
                    <input
                      type="text"
                      value={editForm.firstName || ''}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="نام"
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-900">
                      {employee.firstName}
                    </div>
                  )}
                </td>
                <td className="px-4 py-4">
                  {editingId === employee.id ? (
                    <input
                      type="text"
                      value={editForm.lastName || ''}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="نام خانوادگی"
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-900">
                      {employee.lastName || '-'}
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {editingId === employee.id ? (
                    <select
                      value={editForm.role || ''}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="">انتخاب نقش</option>
                      {availableRoles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {getRoleDisplayName(role.name)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(employee.role.name)}`}>
                      <Shield className="w-3 h-3 mr-1" />
                      {getRoleDisplayName(employee.role.name)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                  {editingId === employee.id ? (
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
                        onClick={() => handleEdit(employee)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                        title="ویرایش اطلاعات کارمند"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => onViewCustomers(employee)}
                    className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors"
                    title="مشاهده و مدیریت مشتریان"
                  >
                    <Users className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {employees.length === 0 && !loading && (
          <div className="text-center py-8">
            <div className="text-gray-500 text-lg mb-2">هیچ کارمندی یافت نشد</div>
            <p className="text-gray-400 text-sm">کارمندان سیستم در اینجا نمایش داده می‌شوند</p>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-4">
        {employees.map((employee) => (
          <div key={employee.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center space-x-3 space-x-reverse mb-3">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="text-base font-medium text-gray-900">
                  {getFullName(employee)}
                </div>
                <div className="text-sm text-gray-500">
                  ID: {toPersianDigits(employee.userId)}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
              <div>
                <span className="text-gray-500">نام:</span>
                <div className="font-medium">{employee.firstName}</div>
              </div>
              <div>
                <span className="text-gray-500">نام خانوادگی:</span>
                <div className="font-medium">{employee.lastName || '-'}</div>
              </div>
              <div>
                <span className="text-gray-500">نقش:</span>
                <div className="font-medium">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(employee.role.name)}`}>
                    <Shield className="w-3 h-3 mr-1" />
                    {getRoleDisplayName(employee.role.name)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2 space-x-reverse justify-end">
              <button
                onClick={() => handleEdit(employee)}
                className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50 transition-colors"
                title="ویرایش اطلاعات کارمند"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => onViewCustomers(employee)}
                className="text-green-600 hover:text-green-900 p-2 rounded hover:bg-green-50 transition-colors"
                title="مشاهده و مدیریت مشتریان"
              >
                <Users className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="text-sm text-gray-700">
            نمایش {toPersianDigits(pageIndex * pageSize + 1)} تا {toPersianDigits(Math.min((pageIndex + 1) * pageSize, totalCount))} از {toPersianDigits(totalCount)} کارمند
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
    </div>
  );

  if (showAddEmployee) {
    return (
      <AddEmployee
        authToken={authToken}
        availableRoles={availableRoles}
        onBack={() => setShowAddEmployee(false)}
        onSuccess={() => {
          setShowAddEmployee(false);
          fetchEmployees();
        }}
      />
    );
  }

  return mainContent;
};

export default Employees;