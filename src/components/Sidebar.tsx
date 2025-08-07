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
  Tag,
  Sparkles,
  ChevronDown,
  ChevronUp
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
  gradient?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ userRole }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = React.useState<Set<string>>(new Set(['configuration']));
  
  // Get current active menu from URL
  const getActiveMenu = () => {
    const path = location.pathname.replace('/admin', '').replace('/', '');
    if (path.includes('/')) {
      return path.split('/')[0];
    }
    return path || 'dashboard';
  };

  const activeMenu = getActiveMenu();
  
  // Check if any submenu item is active
  const isSubmenuActive = (submenu: MenuItem[]) => {
    return submenu.some(item => activeMenu === item.id);
  };
  
  // Toggle menu expansion
  const toggleMenu = (menuId: string) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(menuId)) {
      newExpanded.delete(menuId);
    } else {
      newExpanded.add(menuId);
    }
    setExpandedMenus(newExpanded);
  };
  
  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'داشبورد',
      icon: <LayoutDashboard className="w-5 h-5" />,
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      id: 'invoices',
      label: 'فاکتورها',
      icon: <FileText className="w-5 h-5" />,
      gradient: 'from-green-500 to-green-600'
    },
    {
      id: 'checks',
      label: 'چک‌ها',
      icon: <CreditCard className="w-5 h-5" />,
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      id: 'customers',
      label: 'مشتریان',
      icon: <Users className="w-5 h-5" />,
      gradient: 'from-orange-500 to-orange-600'
    },
    {
      id: 'employees',
      label: 'کارمندان',
      icon: <UserCheck className="w-5 h-5" />,
      gradient: 'from-indigo-500 to-indigo-600'
    },
    {
      id: 'products',
      label: 'محصولات',
      icon: <Package className="w-5 h-5" />,
      gradient: 'from-pink-500 to-pink-600'
    },
    {
      id: 'campaigns',
      label: 'کمپین‌ها',
      icon: <Megaphone className="w-5 h-5" />,
      gradient: 'from-yellow-500 to-yellow-600'
    },
    {
      id: 'configuration',
      label: 'پیکربندی',
      icon: <Settings className="w-5 h-5" />,
      gradient: 'from-gray-500 to-gray-600',
      submenu: [
        {
          id: 'user-grid',
          label: 'گرید کاربران',
          icon: <Grid3X3 className="w-4 h-4" />,
          gradient: 'from-teal-500 to-teal-600'
        },
        {
          id: 'brands',
          label: 'برندها',
          icon: <Tag className="w-4 h-4" />,
          gradient: 'from-cyan-500 to-cyan-600'
        },
        {
          id: 'tags',
          label: 'برچسب‌ها',
          icon: <Tag className="w-4 h-4" />,
          gradient: 'from-emerald-500 to-emerald-600'
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
    const isExpanded = expandedMenus.has(item.id);
    const hasActiveSubmenu = hasSubmenu && isSubmenuActive(item.submenu!);

    const handleMenuClick = () => {
      if (hasSubmenu) {
        toggleMenu(item.id);
      } else {
        const path = item.id === 'dashboard' ? '/admin' : `/admin/${item.id}`;
        navigate(path);
      }
    };

    return (
      <div key={item.id} className="mb-1">
        <button
          onClick={handleMenuClick}
          className={`w-full sidebar-item ${
            isActive || hasActiveSubmenu
              ? `sidebar-item-active bg-gradient-to-r ${item.gradient || 'from-blue-500 to-blue-600'}`
              : 'sidebar-item-inactive'
          } ${isSubmenu ? 'pr-8 text-sm ml-4' : ''} group`}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className={`p-2 rounded-lg ${
                isActive || hasActiveSubmenu
                  ? 'bg-white/20' 
                  : 'bg-gradient-to-r ' + (item.gradient || 'from-blue-500 to-blue-600') + ' text-white group-hover:shadow-lg'
              } transition-all duration-200`}>
                {item.icon}
              </div>
              <span className="font-medium">{item.label}</span>
            </div>
            {hasSubmenu && (
              <div className={`transition-all duration-200 ${
                isActive || hasActiveSubmenu ? 'text-white/80' : 'text-gray-400 group-hover:text-gray-600'
              }`}>
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            )}
          </div>
        </button>
        
        {hasSubmenu && isExpanded && (
          <div className="mt-2 space-y-1 animate-slide-up">
            {item.submenu!.map(subItem => renderMenuItem(subItem, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-72 h-screen glass-effect sticky top-0 border-l border-white/20">
      <div className="p-6 h-full flex flex-col">
        {/* Logo Section */}
        <div className="flex items-center space-x-3 space-x-reverse mb-8 animate-fade-in">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg floating">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold gradient-text">پنل مدیریت</h2>
            <p className="text-sm text-gray-600">سیستم B2B پیشرفته</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-2 flex-1 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center space-x-2 space-x-reverse">
            <Sparkles className="w-4 h-4" />
            <span>منوی اصلی</span>
          </div>
          {filteredMenuItems.map(item => renderMenuItem(item))}
        </nav>

        {/* Bottom Decoration */}
        <div className="mt-6 flex-shrink-0">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-600/10 rounded-xl p-4 border border-white/20">
            <div className="text-xs text-gray-600 text-center">
              <div className="font-medium">سیستم مدیریت B2B</div>
              <div className="text-gray-500 mt-1">نسخه ۱.۰.۰</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;