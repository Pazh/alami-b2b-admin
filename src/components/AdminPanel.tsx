import React from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate, useParams } from 'react-router-dom';
import { User, LogOut, Shield, Activity, TrendingUp, FileText, CreditCard } from 'lucide-react';
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">دسترسی محدود</h1>
          <p className="text-gray-600 mb-6">
            شما به عنوان مشتری به این بخش دسترسی ندارید. این پنل مخصوص مدیران بیزینس است.
          </p>
          <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium mb-6 ${ROLE_COLORS[userInfo.role]}`}>
            {ROLE_DISPLAY_NAMES[userInfo.role]}
          </div>
          <button
            onClick={onLogout}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-4 rounded-lg font-medium hover:from-red-600 hover:to-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center space-x-2 space-x-reverse"
          >
            <LogOut className="w-5 h-5" />
            <span>خروج</span>
          </button>
        </div>
      </div>
    );
  }

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">فعالیت‌های اخیر کارمندان</p>
              <p className="text-2xl font-bold text-gray-900">{toPersianDigits('24')}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">فعالیت‌های اخیر مشتریان</p>
              <p className="text-2xl font-bold text-gray-900">{toPersianDigits('156')}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">چک‌ها</p>
              <p className="text-2xl font-bold text-gray-900">{toPersianDigits('89')}</p>
            </div>
            <CreditCard className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">فاکتورها</p>
              <p className="text-2xl font-bold text-gray-900">{toPersianDigits('342')}</p>
            </div>
            <FileText className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">خوش آمدید به پنل مدیریت</h3>
        <p className="text-gray-600 mb-4">
          شما با موفقیت وارد پنل مدیریت B2B شده‌اید. از اینجا می‌توانید سیستم و کاربران خود را مدیریت کنید.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            <strong>آماده برای مراحل بعدی:</strong> اکنون می‌توانید عملکردهای مخصوص ادمین را پیاده‌سازی کرده و با استفاده از توکن احراز هویت ذخیره شده به API های بک‌اند متصل شوید.
          </p>
        </div>
      </div>
    </div>
  );



  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      <Sidebar userRole={userInfo.role} />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4 space-x-reverse px-6">
              <h1 className="text-xl font-semibold text-gray-900">
                {getPageTitle()}
              </h1>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse px-6">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[userInfo.role]}`}>
                  {ROLE_DISPLAY_NAMES[userInfo.role]}
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-700">کاربر: {toPersianDigits(userInfo.userId)}</span>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 text-gray-700 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>خروج</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Routes>
            <Route path="/" element={renderDashboard()} />
            <Route path="/checks" element={<Checks authToken={userInfo.authToken} userId={userInfo.userId} userRole={userInfo.role} />} />
            <Route path="/checks/:id/edit" element={<CheckEdit authToken={userInfo.authToken} userId={userInfo.userId} userRole={userInfo.role} />} />
                           <Route path="/customers" element={<Customers authToken={userInfo.authToken} userId={userInfo.userId} userRole={userInfo.role} />} />
               <Route path="/customers/:id" element={<CustomerDetailsRoute authToken={userInfo.authToken} userId={userInfo.userId} userRole={userInfo.role} />} />
               <Route path="/customers/:id/edit" element={<CustomerEdit authToken={userInfo.authToken} userId={userInfo.userId} userRole={userInfo.role} />} />
            <Route path="/invoices" element={<Invoices authToken={userInfo.authToken} userId={userInfo.userId} userRole={userInfo.role} />} />
            <Route path="/invoices/:id" element={<InvoiceDetailsRoute authToken={userInfo.authToken} userId={userInfo.userId} userRole={userInfo.role} />} />
            <Route path="/employees" element={<Employees authToken={userInfo.authToken} onViewCustomers={setSelectedEmployee} />} />
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
            <Route path="/campaigns" element={<div className="bg-white rounded-lg shadow-md p-6"><h2 className="text-xl font-semibold">کمپین‌ها</h2></div>} />
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