import React from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate, useParams } from 'react-router-dom';
import { User, LogOut, Shield, Activity, TrendingUp, FileText, CreditCard, Sparkles, Plus, Users, Package, Clock } from 'lucide-react';
import { RoleEnum, ROLE_DISPLAY_NAMES, ROLE_COLORS } from '../types/roles';
import Sidebar from './Sidebar';
import UserGrid from './UserGrid';
import Brands from './Brands';
import Customers from './Customers';
import Employees from './Employees';
import EmployeeCustomers from './EmployeeCustomers';
import Products from './Products';
import Checks from './Checks';
import CheckEdit from './CheckEdit';
import CustomerEdit from './CustomerEdit';
import Invoices from './Invoices';
import InvoiceDetails from './InvoiceDetails';
import CustomerDetails from './CustomerDetails';
import Tags from './Tags';
import { formatNumber, toPersianDigits } from '../utils/numberUtils';
import apiService from '../services/apiService';

// Customer Details Route Component
const CustomerDetailsRoute: React.FC<{
  authToken: string;
  userId: number;
  userRole: RoleEnum;
}> = ({ authToken, userId, userRole }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedCustomer, setSelectedCustomer] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchCustomerDetails = async () => {
      if (!id) {
        navigate('/admin/customers');
        return;
      }

      try {
        setLoading(true);
        const response = await apiService.getCustomerById(id, authToken);
        setSelectedCustomer(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch customer details');
        setTimeout(() => navigate('/admin/customers'), 3000);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerDetails();
  }, [id, authToken, navigate]);

  const handleBack = () => {
    navigate('/admin/customers');
  };

  const handleSuccess = (message: string) => {
    // You can implement a toast notification here
    console.log('Success:', message);
  };

  const handleError = (message: string) => {
    // You can implement a toast notification here
    console.error('Error:', message);
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

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <div className="text-red-500 text-lg mb-2">خطا در بارگذاری جزئیات مشتری</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleBack}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            بازگشت به لیست مشتریان
          </button>
        </div>
      </div>
    );
  }

  if (!selectedCustomer) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <div className="text-gray-500 text-lg mb-2">مشتری یافت نشد</div>
          <button
            onClick={handleBack}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            بازگشت به لیست مشتریان
          </button>
        </div>
      </div>
    );
  }

  return (
    <CustomerDetails
      authToken={authToken}
      userId={userId}
      userRole={userRole}
      selectedCustomer={selectedCustomer}
      onBack={handleBack}
      onSuccess={handleSuccess}
      onError={handleError}
      onNavigate={navigate}
    />
  );
};

// Invoice Details Route Component
const InvoiceDetailsRoute: React.FC<{
  authToken: string;
  userId: number;
  userRole: RoleEnum;
}> = ({ authToken, userId, userRole }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedFactor, setSelectedFactor] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchInvoiceDetails = async () => {
      if (!id) {
        navigate('/admin/invoices');
        return;
      }

      try {
        setLoading(true);
        const response = await apiService.getInvoiceById(id, authToken);
        setSelectedFactor(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch invoice details');
        setTimeout(() => navigate('/admin/invoices'), 3000);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceDetails();
  }, [id, authToken, navigate]);

  const handleBack = () => {
    navigate('/admin/invoices');
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

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <div className="text-red-500 text-lg mb-2">خطا در بارگذاری جزئیات فاکتور</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleBack}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            بازگشت به لیست فاکتورها
          </button>
        </div>
      </div>
    );
  }

  if (!selectedFactor) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <div className="text-gray-500 text-lg mb-2">فاکتور یافت نشد</div>
          <button
            onClick={handleBack}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            بازگشت به لیست فاکتورها
          </button>
        </div>
      </div>
    );
  }

  return (
    <InvoiceDetails
      authToken={authToken}
      userId={userId}
      userRole={userRole}
      selectedFactor={selectedFactor}
      onBack={handleBack}
    />
  );
};
interface AdminPanelProps {
  onLogout: () => void;
  userInfo: {
    userId: number;
    role: RoleEnum;
    authToken: string;
  };
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout, userInfo }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedEmployee, setSelectedEmployee] = React.useState<any>(null);

  // Get current active menu from URL
  const getActiveMenu = () => {
    const path = location.pathname.replace('/admin', '').replace('/', '');
    return path || 'dashboard';
  };

  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/customers/') && path !== '/admin/customers') {
      return 'جزئیات مشتری';
    }
    if (path.includes('/invoices/') && path !== '/admin/invoices') {
      return 'جزئیات فاکتور';
    }
    return activeMenu === 'dashboard' ? 'داشبورد' : 
           activeMenu === 'invoices' ? 'فاکتورها' :
           activeMenu === 'checks' ? 'چک‌ها' :
           activeMenu === 'customers' ? 'مشتریان' :
           activeMenu === 'employees' ? 'کارمندان' :
           activeMenu === 'products' ? 'محصولات' :
           activeMenu === 'campaigns' ? 'کمپین‌ها' :
           activeMenu === 'user-grid' ? 'گرید کاربران' :
           activeMenu === 'employee-access' ? 'دسترسی کارمندان' :
           activeMenu === 'brands' ? 'برندها' :
           activeMenu === 'tags' ? 'برچسب‌ها' :
           activeMenu === 'employee-customers' ? 'مدیریت مشتریان کارمند' : 'داشبورد';
  };

  const activeMenu = getActiveMenu();

  // If user is a customer, show access denied message BEFORE any hooks
  if (userInfo.role === RoleEnum.CUSTOMER) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center" dir="rtl">
        <div className="glass-effect rounded-3xl shadow-2xl p-10 border border-white/20 max-w-md w-full text-center animate-scale-in">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">دسترسی محدود</h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            شما به عنوان مشتری به این بخش دسترسی ندارید. این پنل مخصوص مدیران بیزینس است.
          </p>
          <div className={`inline-block px-6 py-3 rounded-xl text-sm font-medium mb-8 shadow-lg ${ROLE_COLORS[userInfo.role]} border border-white/20`}>
            {ROLE_DISPLAY_NAMES[userInfo.role]}
          </div>
          <button
            onClick={onLogout}
            className="w-full btn-danger flex items-center justify-center space-x-2 space-x-reverse"
          >
            <LogOut className="w-5 h-5" />
            <span>خروج</span>
          </button>
        </div>
      </div>
    );
  }

  const renderDashboard = () => (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="glass-effect rounded-2xl p-8 shadow-modern-lg border border-white/20">
        <div className="flex items-center space-x-4 space-x-reverse mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg floating">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold gradient-text">خوش آمدید!</h2>
            <p className="text-gray-600 text-lg">به پنل مدیریت B2B پیشرفته</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-600/10 rounded-xl p-6 border border-white/20">
          <p className="text-gray-700 leading-relaxed">
            شما با موفقیت وارد پنل مدیریت شده‌اید. از اینجا می‌توانید تمام بخش‌های سیستم را مدیریت کنید.
            برای شروع، یکی از منوهای سمت راست را انتخاب کنید.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-effect rounded-2xl p-6 border border-white/20 card-hover shadow-modern">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">فعالیت‌های کارمندان</p>
              <p className="text-3xl font-bold gradient-text">{toPersianDigits('24')}</p>
              <p className="text-xs text-green-600 font-medium mt-1">↗ +12% از ماه گذشته</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Activity className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="glass-effect rounded-2xl p-6 border border-white/20 card-hover shadow-modern">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">فعالیت‌های مشتریان</p>
              <p className="text-3xl font-bold gradient-text">{toPersianDigits('156')}</p>
              <p className="text-xs text-green-600 font-medium mt-1">↗ +8% از ماه گذشته</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="glass-effect rounded-2xl p-6 border border-white/20 card-hover shadow-modern">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">چک‌های فعال</p>
              <p className="text-3xl font-bold gradient-text">{toPersianDigits('89')}</p>
              <p className="text-xs text-blue-600 font-medium mt-1">↗ +5% از ماه گذشته</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <CreditCard className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="glass-effect rounded-2xl p-6 border border-white/20 card-hover shadow-modern">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">فاکتورهای ماه</p>
              <p className="text-3xl font-bold gradient-text">{toPersianDigits('342')}</p>
              <p className="text-xs text-orange-600 font-medium mt-1">↗ +15% از ماه گذشته</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FileText className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-effect rounded-2xl p-6 border border-white/20 shadow-modern">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2 space-x-reverse">
            <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <Plus className="w-4 h-4 text-white" />
            </div>
            <span>عملیات سریع</span>
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/admin/invoices')}
              className="p-4 bg-gradient-to-r from-green-500/10 to-green-600/10 rounded-xl border border-green-200 hover:border-green-300 transition-all duration-200 hover:shadow-lg group"
            >
              <FileText className="w-8 h-8 text-green-600 mb-2 group-hover:scale-110 transition-transform duration-200" />
              <div className="text-sm font-medium text-gray-900">فاکتور جدید</div>
            </button>
            <button
              onClick={() => navigate('/admin/customers')}
              className="p-4 bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-xl border border-blue-200 hover:border-blue-300 transition-all duration-200 hover:shadow-lg group"
            >
              <Users className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform duration-200" />
              <div className="text-sm font-medium text-gray-900">مشتری جدید</div>
            </button>
            <button
              onClick={() => navigate('/admin/checks')}
              className="p-4 bg-gradient-to-r from-purple-500/10 to-purple-600/10 rounded-xl border border-purple-200 hover:border-purple-300 transition-all duration-200 hover:shadow-lg group"
            >
              <CreditCard className="w-8 h-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform duration-200" />
              <div className="text-sm font-medium text-gray-900">چک جدید</div>
            </button>
            <button
              onClick={() => navigate('/admin/products')}
              className="p-4 bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-xl border border-orange-200 hover:border-orange-300 transition-all duration-200 hover:shadow-lg group"
            >
              <Package className="w-8 h-8 text-orange-600 mb-2 group-hover:scale-110 transition-transform duration-200" />
              <div className="text-sm font-medium text-gray-900">محصولات</div>
            </button>
          </div>
        </div>

        <div className="glass-effect rounded-2xl p-6 border border-white/20 shadow-modern">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2 space-x-reverse">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span>آمار سریع</span>
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-500/5 to-blue-600/5 rounded-xl border border-blue-100">
              <span className="text-gray-700 font-medium">فاکتورهای امروز</span>
              <span className="text-blue-600 font-bold text-lg">{toPersianDigits('12')}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-500/5 to-green-600/5 rounded-xl border border-green-100">
              <span className="text-gray-700 font-medium">چک‌های تایید شده</span>
              <span className="text-green-600 font-bold text-lg">{toPersianDigits('8')}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-500/5 to-purple-600/5 rounded-xl border border-purple-100">
              <span className="text-gray-700 font-medium">مشتریان فعال</span>
              <span className="text-purple-600 font-bold text-lg">{toPersianDigits('45')}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-500/5 to-orange-600/5 rounded-xl border border-orange-100">
              <span className="text-gray-700 font-medium">محصولات موجود</span>
              <span className="text-orange-600 font-bold text-lg">{toPersianDigits('234')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-effect rounded-2xl p-6 border border-white/20 shadow-modern">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2 space-x-reverse">
          <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Clock className="w-4 h-4 text-white" />
          </div>
          <span>فعالیت‌های اخیر</span>
        </h3>
        <div className="space-y-3">
          {[
            { action: 'فاکتور جدید ایجاد شد', user: 'احمد محمدی', time: '5 دقیقه پیش', color: 'green' },
            { action: 'چک تایید شد', user: 'فاطمه احمدی', time: '15 دقیقه پیش', color: 'blue' },
            { action: 'مشتری جدید اضافه شد', user: 'علی رضایی', time: '30 دقیقه پیش', color: 'purple' },
            { action: 'محصول به‌روزرسانی شد', user: 'مریم کریمی', time: '1 ساعت پیش', color: 'orange' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center space-x-4 space-x-reverse p-3 bg-white/40 rounded-xl border border-white/20 hover:bg-white/60 transition-all duration-200">
              <div className={`w-10 h-10 bg-gradient-to-br from-${activity.color}-500 to-${activity.color}-600 rounded-xl flex items-center justify-center shadow-md`}>
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{activity.action}</div>
                <div className="text-xs text-gray-600">{activity.user} • {activity.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Status */}
      <div className="glass-effect rounded-2xl p-6 border border-white/20 shadow-modern">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2 space-x-reverse">
          <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span>وضعیت سیستم</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gradient-to-r from-green-500/10 to-green-600/10 rounded-xl border border-green-200">
            <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2 animate-pulse"></div>
            <div className="text-sm font-medium text-gray-900">API سرور</div>
            <div className="text-xs text-green-600">آنلاین</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-r from-green-500/10 to-green-600/10 rounded-xl border border-green-200">
            <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2 animate-pulse"></div>
            <div className="text-sm font-medium text-gray-900">پایگاه داده</div>
            <div className="text-xs text-green-600">متصل</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-xl border border-blue-200">
            <div className="w-3 h-3 bg-blue-500 rounded-full mx-auto mb-2 animate-pulse"></div>
            <div className="text-sm font-medium text-gray-900">کش سیستم</div>
            <div className="text-xs text-blue-600">بهینه</div>
          </div>
        </div>
      </div>
    </div>
  );



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex" dir="rtl">
      <Sidebar userRole={userInfo.role} />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="glass-effect shadow-modern border-b border-white/20">
          <div className="flex justify-between items-center h-20 px-8">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
              <h1 className="text-2xl font-bold gradient-text">
                {getPageTitle()}
              </h1>
            </div>
            <div className="flex items-center space-x-6 space-x-reverse">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className={`px-4 py-2 rounded-xl text-sm font-medium shadow-lg ${ROLE_COLORS[userInfo.role]} border border-white/20`}>
                  {ROLE_DISPLAY_NAMES[userInfo.role]}
                </div>
                <div className="flex items-center space-x-2 space-x-reverse bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">کاربر: {toPersianDigits(userInfo.userId)}</span>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white rounded-xl transition-all duration-200 border border-red-200 hover:border-red-500 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <LogOut className="w-5 h-5" />
                <span>خروج</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-auto">
          <Routes>
            <Route path="/" element={renderDashboard()} />
            <Route path="/checks" element={<Checks authToken={userInfo.authToken} userId={userInfo.userId} userRole={userInfo.role} />} />
            <Route path="/checks/:id/edit" element={<CheckEdit authToken={userInfo.authToken} userId={userInfo.userId} userRole={userInfo.role} />} />
                           <Route path="/customers" element={<Customers authToken={userInfo.authToken} userId={userInfo.userId} userRole={userInfo.role} />} />
               <Route path="/customers/:id" element={<CustomerDetailsRoute authToken={userInfo.authToken} userId={userInfo.userId} userRole={userInfo.role} />} />
               <Route path="/customers/:id/edit" element={<CustomerEdit authToken={userInfo.authToken} userId={userInfo.userId} userRole={userInfo.role} />} />
            <Route path="/invoices" element={<Invoices authToken={userInfo.authToken} userId={userInfo.userId} userRole={userInfo.role} />} />
            <Route path="/invoices/:id" element={<InvoiceDetailsRoute authToken={userInfo.authToken} userId={userInfo.userId} userRole={userInfo.role} />} />
            <Route path="/employees" element={<Employees authToken={userInfo.authToken} onViewCustomers={(employee) => {
              setSelectedEmployee(employee);
              navigate('/admin/employee-customers');
            }} />} />
            <Route path="/employee-customers" element={
              selectedEmployee ? (
                <EmployeeCustomers 
                  authToken={userInfo.authToken} 
                  employee={selectedEmployee}
                  onBack={() => {
                    setSelectedEmployee(null);
                    navigate('/admin/employees');
                  }}
                />
              ) : <Navigate to="/admin/employees" replace />
            } />
            <Route path="/products" element={<Products authToken={userInfo.authToken} userId={userInfo.userId} />} />
            <Route path="/campaigns" element={<div className="glass-effect rounded-2xl shadow-modern p-8 border border-white/20"><h2 className="text-2xl font-bold gradient-text">کمپین‌ها</h2></div>} />
            <Route path="/user-grid" element={<UserGrid authToken={userInfo.authToken} />} />
            <Route path="/brands" element={<Brands authToken={userInfo.authToken} />} />
            <Route path="/tags" element={<Tags authToken={userInfo.authToken} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;