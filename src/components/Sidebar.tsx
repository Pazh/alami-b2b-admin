import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  CreditCard, 
  Users, 
  UserCheck, 
  Package, 
  UserPlus, 
  Megaphone, 
  Settings,
  Grid3X3,
  Shield,
  Tag
} from 'lucide-react';
import { RoleEnum } from '../types/roles';
import roleService from '../services/roleService';

interface SidebarProps {
  userRole: RoleEnum;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  submenu?: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ userRole }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get current active menu from URL
  const getActiveMenu = () => {
    const path = location.pathname.replace('/admin', '').replace('/', '');
    return path || 'dashboard';
  };

  const activeMenu = getActiveMenu();
  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'داشبورد',
      icon: <LayoutDashboard className="w-5 h-5" />
    },
    {
      id: 'invoices',
      label: 'فاکتورها',
      icon: <FileText className="w-5 h-5" />
    },
    {
      id: 'checks',
      label: 'چک‌ها',
      icon: <CreditCard className="w-5 h-5" />
    },
    {
      id: 'customers',
      label: 'مشتریان',
      icon: <Users className="w-5 h-5" />
    },
    {
      id: 'employees',
      label: 'کارمندان',
      icon: <UserCheck className="w-5 h-5" />
    },
    {
      id: 'products',
      label: 'محصولات',
      icon: <Package className="w-5 h-5" />
    },
    {
      id: 'campaigns',
      label: 'کمپین‌ها',
      icon: <Megaphone className="w-5 h-5" />
    },
    {
      id: 'configuration',
      label: 'پیکربندی',
      icon: <Settings className="w-5 h-5" />,
      submenu: [
        {
          id: 'user-grid',
          label: 'گرید کاربران',
          icon: <Grid3X3 className="w-4 h-4" />
        },
        {
          id: 'brands',
          label: 'برندها',
          icon: <Tag className="w-4 h-4" />
        },
        {
          id: 'tags',
          label: 'برچسب‌ها',
          icon: <Tag className="w-4 h-4" />
        }
      ]
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    roleService.hasAccessToMenu(userRole, item.id)
  );

  const renderMenuItem = (item: MenuItem, isSubmenu = false) => {
    const isActive = activeMenu === item.id;
    const hasSubmenu = item.submenu && item.submenu.length > 0;

    const handleMenuClick = () => {
      const path = item.id === 'dashboard' ? '/admin' : `/admin/${item.id}`;
      navigate(path);
    };

    return (
      <div key={item.id}>
        <button
          onClick={handleMenuClick}
          className={`w-full flex items-center justify-between px-4 py-3 text-right rounded-lg transition-all duration-200 ${
            isActive
              ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-500'
              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
          } ${isSubmenu ? 'pr-8 text-sm' : ''}`}
        >
          <div className="flex items-center space-x-3 space-x-reverse">
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </div>
        </button>
        
        {hasSubmenu && isActive && (
          <div className="mt-2 space-y-1">
            {item.submenu!.map(subItem => renderMenuItem(subItem, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 bg-white h-full shadow-lg border-l border-gray-200">
      <div className="p-6">
        <div className="flex items-center space-x-3 space-x-reverse mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">پنل مدیریت</h2>
            <p className="text-sm text-gray-500">سیستم B2B</p>
          </div>
        </div>

        <nav className="space-y-2">
          {filteredMenuItems.map(item => renderMenuItem(item))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;