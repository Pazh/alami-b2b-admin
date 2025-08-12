import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate, useParams } from 'react-router-dom';
import { User, LogOut, Shield, Activity, TrendingUp, FileText, CreditCard, Sparkles, Plus, Users, Package, Clock, Menu, X } from 'lucide-react';
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
import Campaigns from './Campaigns';
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
    userName?: string;
    fullName?: string;
  };
  isMobile?: boolean;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout, userInfo }) => {
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check mobile responsiveness
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [sidebarOpen]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (sidebarOpen && isMobile) {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Element;
        if (!target.closest('.sidebar-container') && !target.closest('.mobile-menu-button')) {
          setSidebarOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [sidebarOpen, isMobile]);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (sidebarOpen && isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, sidebarOpen, isMobile]);

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
    <div className="section-mobile animate-fade-in">
      {/* Welcome Section */}
      <div className="glass-effect rounded-2xl mobile-card shadow-modern-lg border border-white/20">
        <div className="mobile-flex mobile-space mb-6">
          <div className="w-16 h-16 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg floating mx-auto lg:mx-0">
            <Shield className="icon-mobile-lg text-white" />
          </div>
          <div className="text-center lg:text-right">
            <h2 className="mobile-heading font-bold gradient-text">خوش آمدید!</h2>
            <p className="text-gray-600 mobile-text">به پنل B2B مدیریت بازرگانی پارت   </p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-600/10 rounded-xl mobile-card border border-white/20">
          <p className="text-gray-700 leading-relaxed mobile-text">
            شما با موفقیت وارد پنل مدیریت شده‌اید. از اینجا می‌توانید تمام بخش‌های سیستم را مدیریت کنید.
            برای شروع، یکی از منوهای سمت راست را انتخاب کنید.
          </p>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="mobile-grid">
        <div className="glass-effect rounded-2xl mobile-card border border-white/20 card-hover shadow-modern active:scale-95 transition-transform duration-200 touch-manipulation">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-gray-600 mb-2">فعالیت‌های کارمندان</p>
              <p className="text-2xl lg:text-3xl font-bold gradient-text">{toPersianDigits('24')}</p>
              <p className="text-xs text-green-600 font-medium mt-1">↗ +12% از ماه گذشته</p>
            </div>
            <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Activity className="icon-mobile" />
            </div>
          </div>
        </div>

        <div className="glass-effect rounded-2xl mobile-card border border-white/20 card-hover shadow-modern active:scale-95 transition-transform duration-200 touch-manipulation">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-gray-600 mb-2">فعالیت‌های مشتریان</p>
              <p className="text-2xl lg:text-3xl font-bold gradient-text">{toPersianDigits('156')}</p>
              <p className="text-xs text-green-600 font-medium mt-1">↗ +8% از ماه گذشته</p>
            </div>
            <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
              <TrendingUp className="icon-mobile" />
            </div>
          </div>
        </div>

        <div className="glass-effect rounded-2xl mobile-card border border-white/20 card-hover shadow-modern active:scale-95 transition-transform duration-200 touch-manipulation">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-gray-600 mb-2">فاکتورهای جدید</p>
              <p className="text-2xl lg:text-3xl font-bold gradient-text">{toPersianDigits('89')}</p>
              <p className="text-xs text-green-600 font-medium mt-1">↗ +15% از ماه گذشته</p>
            </div>
            <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FileText className="icon-mobile" />
            </div>
          </div>
        </div>

        <div className="glass-effect rounded-2xl mobile-card border border-white/20 card-hover shadow-modern active:scale-95 transition-transform duration-200 touch-manipulation">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-gray-600 mb-2">چک‌های در انتظار</p>
              <p className="text-2xl lg:text-3xl font-bold gradient-text">{toPersianDigits('12')}</p>
              <p className="text-xs text-orange-600 font-medium mt-1">↘ -3% از ماه گذشته</p>
            </div>
            <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
              <CreditCard className="icon-mobile" />
            </div>
          </div>
        </div>
      </div>

      {/* New Analytics Section */}
      <div className="glass-effect rounded-2xl mobile-card shadow-modern-lg border border-white/20">
        <h3 className="mobile-heading font-bold gradient-text mb-4 lg:mb-6 flex items-center space-x-2 space-x-reverse">
          <TrendingUp className="icon-mobile" />
          <span>تحلیل‌های پیشرفته</span>
        </h3>
        <div className="mobile-grid">
          <div className="p-4 bg-gradient-to-r from-indigo-500/10 to-indigo-600/10 rounded-xl border border-indigo-200">
            <div className="flex items-center space-x-3 space-x-reverse mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium text-gray-900">نرخ تبدیل</span>
            </div>
            <div className="text-2xl font-bold text-indigo-600">{toPersianDigits('68.5%')}</div>
            <div className="text-sm text-gray-600 mt-1">از بازدیدکنندگان به مشتری</div>
          </div>

          <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 rounded-xl border border-emerald-200">
            <div className="flex items-center space-x-3 space-x-reverse mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium text-gray-900">میانگین سفارش</span>
            </div>
            <div className="text-2xl font-bold text-emerald-600">{toPersianDigits('۲,۴۵۰,۰۰۰')} تومان</div>
            <div className="text-sm text-gray-600 mt-1">مبلغ متوسط هر فاکتور</div>
          </div>

          <div className="p-4 bg-gradient-to-r from-rose-500/10 to-rose-600/10 rounded-xl border border-rose-200">
            <div className="flex items-center space-x-3 space-x-reverse mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-rose-600 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium text-gray-900">زمان پاسخ</span>
            </div>
            <div className="text-2xl font-bold text-rose-600">{toPersianDigits('۲.۳')} ساعت</div>
            <div className="text-sm text-gray-600 mt-1">میانگین زمان پاسخگویی</div>
          </div>

          <div className="p-4 bg-gradient-to-r from-amber-500/10 to-amber-600/10 rounded-xl border border-amber-200">
            <div className="flex items-center space-x-3 space-x-reverse mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium text-gray-900">موجودی کالا</span>
            </div>
            <div className="text-2xl font-bold text-amber-600">{toPersianDigits('۱,۲۴۷')}</div>
            <div className="text-sm text-gray-600 mt-1">تعداد محصولات موجود</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-effect rounded-2xl mobile-card shadow-modern-lg border border-white/20">
        <h3 className="mobile-heading font-bold gradient-text mb-4 lg:mb-6 flex items-center space-x-2 space-x-reverse">
          <Plus className="icon-mobile" />
          <span>عملیات سریع</span>
        </h3>
        <div className="mobile-grid">
          <button 
            onClick={() => navigate('/admin/customers')}
            className="p-4 bg-gradient-to-r from-blue-500/10 to-blue-600/10 hover:from-blue-500/20 hover:to-blue-600/20 rounded-xl border border-blue-200 transition-all duration-200 hover:shadow-lg group active:scale-95 touch-manipulation"
          >
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="icon-mobile-sm" />
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900">مشتری جدید</div>
                <div className="text-sm text-gray-600">افزودن مشتری</div>
              </div>
            </div>
          </button>

          <button 
            onClick={() => navigate('/admin/invoices')}
            className="p-4 bg-gradient-to-r from-green-500/10 to-green-600/10 hover:from-green-500/20 hover:to-green-600/20 rounded-xl border border-green-200 transition-all duration-200 hover:shadow-lg group active:scale-95 touch-manipulation"
          >
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="icon-mobile-sm" />
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900">فاکتور جدید</div>
                <div className="text-sm text-gray-600">ایجاد فاکتور</div>
              </div>
            </div>
          </button>

          <button 
            onClick={() => navigate('/admin/products')}
            className="p-4 bg-gradient-to-r from-purple-500/10 to-purple-600/10 hover:from-purple-500/20 hover:to-purple-600/20 rounded-xl border border-purple-200 transition-all duration-200 hover:shadow-lg group active:scale-95 touch-manipulation"
          >
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Package className="icon-mobile-sm" />
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900">محصول جدید</div>
                <div className="text-sm text-gray-600">افزودن محصول</div>
              </div>
            </div>
          </button>

          <button 
            onClick={() => navigate('/admin/checks')}
            className="p-4 bg-gradient-to-r from-orange-500/10 to-orange-600/10 hover:from-orange-500/20 hover:to-orange-600/20 rounded-xl border border-orange-200 transition-all duration-200 hover:shadow-lg group active:scale-95 touch-manipulation"
          >
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <CreditCard className="icon-mobile-sm" />
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900">چک جدید</div>
                <div className="text-sm text-gray-600">ثبت چک</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="glass-effect rounded-2xl mobile-card shadow-modern-lg border border-white/20">
        <h3 className="mobile-heading font-bold gradient-text mb-4 lg:mb-6 flex items-center space-x-2 space-x-reverse">
          <Activity className="icon-mobile" />
          <span>فعالیت‌های اخیر</span>
        </h3>
        <div className="space-y-3">
          {[
            { type: 'invoice', message: 'فاکتور جدید برای شرکت آلفا ایجاد شد', time: '۲ ساعت پیش', color: 'from-green-500 to-green-600' },
            { type: 'customer', message: 'مشتری جدید "شرکت بتا" اضافه شد', time: '۴ ساعت پیش', color: 'from-blue-500 to-blue-600' },
            { type: 'check', message: 'چک جدید به مبلغ ۵,۰۰۰,۰۰۰ تومان ثبت شد', time: '۶ ساعت پیش', color: 'from-purple-500 to-purple-600' },
            { type: 'product', message: 'محصول "لپ تاپ ایسوس" به‌روزرسانی شد', time: '۸ ساعت پیش', color: 'from-orange-500 to-orange-600' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center space-x-3 space-x-reverse p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
              <div className={`w-3 h-3 bg-gradient-to-r ${activity.color} rounded-full`}></div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">{activity.message}</p>
                <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Status */}
      <div className="glass-effect rounded-2xl mobile-card shadow-modern-lg border border-white/20">
        <h3 className="mobile-heading font-bold gradient-text mb-4 lg:mb-6 flex items-center space-x-2 space-x-reverse">
          <Clock className="icon-mobile" />
          <span>وضعیت سیستم</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col lg:flex-row" dir="rtl">
      {/* Mobile Menu Overlay */}
      {sidebarOpen && (
        <div 
          className="nav-overlay animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Mobile Overlay */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`sidebar-container nav-mobile w-72 ${
        isMobile 
          ? `fixed top-0 right-0 h-full z-[100] transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`
          : 'relative'
      }`}>
        <Sidebar userRole={userInfo.role} onClose={() => setSidebarOpen(false)} isMobile={isMobile} />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="glass-effect shadow-modern border-b border-white/20">
          <div className="flex justify-between items-center h-16 lg:h-20 mobile-container">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="mobile-menu-button lg:hidden p-3 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-white/60 transition-all duration-200 active:scale-95 touch-manipulation touch-target"
            >
              <Menu className="icon-mobile" />
            </button>
            
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="w-1 h-6 lg:h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
              <h1 className="mobile-heading font-bold gradient-text">
                {getPageTitle()}
              </h1>
            </div>
            
            <div className="flex items-center space-x-3 lg:space-x-6 space-x-reverse">
              {/* Role Badge - Hide on very small screens */}
              <div className="hidden sm:flex items-center space-x-3 space-x-reverse">
                <div className={`px-3 lg:px-4 py-2 rounded-xl text-xs lg:text-sm font-medium shadow-lg ${ROLE_COLORS[userInfo.role]} border border-white/20`}>
                  {ROLE_DISPLAY_NAMES[userInfo.role]}
                </div>
              </div>
              
              {/* User Info - Responsive */}
              <div className="flex items-center space-x-2 space-x-reverse bg-white/60 backdrop-blur-sm px-3 lg:px-4 py-2 rounded-xl border border-white/20">
                <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="icon-mobile-sm" />
                </div>
                <span className="text-xs lg:text-sm font-medium text-gray-700 hidden sm:block">
                  {userInfo.fullName || userInfo.userName || 'کاربر'}
                </span>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 space-x-reverse px-3 lg:px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white rounded-xl transition-all duration-200 border border-red-200 hover:border-red-500 shadow-lg hover:shadow-xl transform hover:scale-105 touch-target"
              >
                <LogOut className="icon-mobile-sm" />
                <span className="hidden sm:block">خروج</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 mobile-container overflow-auto">
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
            <Route path="/campaigns" element={<Campaigns authToken={userInfo.authToken} userId={userInfo.userId} />} />
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