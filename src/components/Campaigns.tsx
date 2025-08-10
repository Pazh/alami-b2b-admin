import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Target, Calendar, Users, TrendingUp, BarChart3, Filter, Search, Download, Mail, MessageSquare, Share2, Printer } from 'lucide-react';
import { formatNumber, toPersianDigits } from '../utils/numberUtils';
import apiService from '../services/apiService';

interface Campaign {
  id: string;
  name: string;
  description: string;
  targetAudience: string;
  startDate: string;
  endDate: string;
  budget: number;
  status: 'active' | 'paused' | 'completed' | 'draft';
  reach: number;
  conversions: number;
  roi: number;
  type: 'email' | 'sms' | 'social' | 'print' | 'other';
  createdBy: string;
  createdAt: string;
}

interface CampaignsProps {
  authToken: string;
  userId: number;
}

const Campaigns: React.FC<CampaignsProps> = ({ authToken, userId }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  // Mock data for demonstration
  const mockCampaigns: Campaign[] = [
    {
      id: '1',
      name: 'کمپین تابستانه ۱۴۰۳',
      description: 'کمپین ویژه فروش محصولات تابستانه با تخفیف ۲۰٪',
      targetAudience: 'مشتریان موجود و جدید',
      startDate: '۱۴۰۳/۰۴/۰۱',
      endDate: '۱۴۰۳/۰۶/۳۱',
      budget: 50000000,
      status: 'active',
      reach: 15000,
      conversions: 450,
      roi: 3.2,
      type: 'email',
      createdBy: 'مدیر فروش',
      createdAt: '۱۴۰۳/۰۳/۱۵'
    },
    {
      id: '2',
      name: 'تبلیغات شبکه‌های اجتماعی',
      description: 'کمپین تبلیغاتی در اینستاگرام و تلگرام',
      targetAudience: 'جوانان ۱۸-۳۵ سال',
      startDate: '۱۴۰۳/۰۳/۰۱',
      endDate: '۱۴۰۳/۰۵/۳۱',
      budget: 30000000,
      status: 'active',
      reach: 25000,
      conversions: 320,
      roi: 2.8,
      type: 'social',
      createdBy: 'کارشناس بازاریابی',
      createdAt: '۱۴۰۳/۰۲/۲۰'
    },
    {
      id: '3',
      name: 'کمپین وفاداری مشتریان',
      description: 'برنامه وفاداری برای مشتریان قدیمی',
      targetAudience: 'مشتریان با بیش از ۲ سال سابقه',
      startDate: '۱۴۰۳/۰۱/۰۱',
      endDate: '۱۴۰۳/۱۲/۲۹',
      budget: 20000000,
      status: 'active',
      reach: 8000,
      conversions: 1200,
      roi: 4.5,
      type: 'email',
      createdBy: 'مدیر کل',
      createdAt: '۱۴۰۲/۱۱/۱۵'
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setCampaigns(mockCampaigns);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'sms': return <MessageSquare className="w-4 h-4" />;
      case 'social': return <Share2 className="w-4 h-4" />;
      case 'print': return <Printer className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email': return 'from-blue-500 to-blue-600';
      case 'sms': return 'from-green-500 to-green-600';
      case 'social': return 'from-purple-500 to-purple-600';
      case 'print': return 'from-orange-500 to-orange-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    const matchesType = typeFilter === 'all' || campaign.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleCreateCampaign = () => {
    setShowCreateModal(true);
    setEditingCampaign(null);
  };

  const handleEditCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setShowCreateModal(true);
  };

  const handleDeleteCampaign = async (id: string) => {
    if (window.confirm('آیا از حذف این کمپین اطمینان دارید؟')) {
      try {
        // API call would go here
        setCampaigns(campaigns.filter(c => c.id !== id));
      } catch (error) {
        setError('خطا در حذف کمپین');
      }
    }
  };

  if (loading) {
    return (
      <div className="section-mobile animate-fade-in">
        <div className="glass-effect rounded-2xl mobile-card shadow-modern-lg border border-white/20">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section-mobile animate-fade-in">
      {/* Header */}
      <div className="glass-effect rounded-2xl mobile-card shadow-modern-lg border border-white/20 mb-6">
        <div className="mobile-flex mobile-space">
          <div>
            <h2 className="text-xl lg:text-2xl font-bold gradient-text">کمپین‌های بازاریابی</h2>
          </div>
          <button
            onClick={handleCreateCampaign}
            className="btn-primary flex items-center space-x-2 space-x-reverse"
          >
            <Plus className="w-5 h-5" />
            <span>کمپین جدید</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="mobile-grid mb-6">
        <div className="glass-effect rounded-2xl mobile-card border border-white/20">
          <div className="p-4">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">کمپین‌های فعال</p>
                <p className="text-2xl font-bold text-blue-600">
                  {toPersianDigits(campaigns.filter(c => c.status === 'active').length)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-effect rounded-2xl mobile-card border border-white/20">
          <div className="p-4">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">کل مخاطبان</p>
                <p className="text-2xl font-bold text-green-600">
                  {toPersianDigits(campaigns.reduce((sum, c) => sum + c.reach, 0))}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-effect rounded-2xl mobile-card border border-white/20">
          <div className="p-4">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">میانگین ROI</p>
                <p className="text-2xl font-bold text-purple-600">
                  {toPersianDigits((campaigns.reduce((sum, c) => sum + c.roi, 0) / campaigns.length).toFixed(1))}x
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-effect rounded-2xl mobile-card border border-white/20">
          <div className="p-4">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">کل بودجه</p>
                <p className="text-2xl font-bold text-orange-600">
                  {toPersianDigits(formatNumber(campaigns.reduce((sum, c) => sum + c.budget, 0)))} تومان
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="glass-effect rounded-2xl mobile-card shadow-modern-lg border border-white/20 mb-6">
        <div className="mobile-flex mobile-space">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="جستجو در کمپین‌ها..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-modern pr-10"
              />
            </div>
          </div>
          
          <div className="flex space-x-3 space-x-reverse">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-modern"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="active">فعال</option>
              <option value="paused">متوقف</option>
              <option value="completed">تکمیل شده</option>
              <option value="draft">پیش‌نویس</option>
            </select>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input-modern"
            >
              <option value="all">همه انواع</option>
              <option value="email">ایمیل</option>
              <option value="sms">پیامک</option>
              <option value="social">شبکه‌های اجتماعی</option>
              <option value="print">چاپ</option>
              <option value="other">سایر</option>
            </select>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
              <div className="glass-effect rounded-2xl mobile-card shadow-modern-lg border border-white/20 hidden lg:block">
        <div className="overflow-x-auto">
          <table className="table-modern w-full">
            <thead className="table-header">
              <tr>
                <th className="table-mobile-header-cell">نام کمپین</th>
                <th className="table-mobile-header-cell">نوع</th>
                <th className="table-mobile-header-cell">وضعیت</th>
                <th className="table-mobile-header-cell">بودجه</th>
                <th className="table-mobile-header-cell">دسترسی</th>
                <th className="table-mobile-header-cell">ROI</th>
                <th className="table-mobile-header-cell">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filteredCampaigns.map((campaign) => (
                <tr key={campaign.id} className="table-mobile-row">
                  <td className="table-mobile-cell">
                    <div>
                      <div className="font-medium text-gray-900">{campaign.name}</div>
                      <div className="text-sm text-gray-500">{campaign.description}</div>
                    </div>
                  </td>
                  <td className="table-mobile-cell">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <div className={`w-8 h-8 bg-gradient-to-br ${getTypeColor(campaign.type)} rounded-lg flex items-center justify-center`}>
                        {getTypeIcon(campaign.type)}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {campaign.type === 'email' ? 'ایمیل' :
                         campaign.type === 'sms' ? 'پیامک' :
                         campaign.type === 'social' ? 'شبکه‌های اجتماعی' :
                         campaign.type === 'print' ? 'چاپ' : 'سایر'}
                      </span>
                    </div>
                  </td>
                  <td className="table-mobile-cell">
                    <span className={`status-badge ${getStatusColor(campaign.status)}`}>
                      {campaign.status === 'active' ? 'فعال' :
                       campaign.status === 'paused' ? 'متوقف' :
                       campaign.status === 'completed' ? 'تکمیل شده' : 'پیش‌نویس'}
                    </span>
                  </td>
                  <td className="table-mobile-cell">
                    <div className="text-sm font-medium text-gray-900">
                      {toPersianDigits(formatNumber(campaign.budget))} تومان
                    </div>
                  </td>
                  <td className="table-mobile-cell">
                    <div className="text-sm text-gray-900">
                      {toPersianDigits(campaign.reach.toLocaleString())}
                    </div>
                  </td>
                  <td className="table-mobile-cell">
                    <div className="text-sm font-medium text-green-600">
                      {toPersianDigits(campaign.roi.toFixed(1))}x
                    </div>
                  </td>
                  <td className="table-mobile-cell">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleEditCampaign(campaign)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCampaign(campaign.id)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredCampaigns.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500 text-lg mb-2">کمپینی یافت نشد</div>
            <p className="text-gray-400">کمپین جدید ایجاد کنید یا فیلترها را تغییر دهید</p>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-4 mt-6">
        {filteredCampaigns.map((campaign) => (
          <div key={campaign.id} className="glass-effect rounded-2xl mobile-card border border-white/20 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className={`w-12 h-12 bg-gradient-to-br ${getTypeColor(campaign.type)} rounded-xl flex items-center justify-center shadow-lg`}>
                  {getTypeIcon(campaign.type)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm leading-tight">
                    {campaign.name}
                  </h3>
                  <p className="text-gray-500 text-xs mt-1">
                    {campaign.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <button
                  onClick={() => handleEditCampaign(campaign)}
                  className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                  title="ویرایش"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteCampaign(campaign.id)}
                  className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                  title="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-white/20 rounded-lg p-3">
                <div className="text-gray-500 text-xs mb-1">بودجه</div>
                <div className="font-bold text-gray-900">{toPersianDigits(formatNumber(campaign.budget))} تومان</div>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <div className="text-gray-500 text-xs mb-1">دسترسی</div>
                <div className="font-bold text-gray-900">{toPersianDigits(campaign.reach.toLocaleString())}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/20 rounded-lg p-3">
                <div className="text-gray-500 text-xs mb-1">ROI</div>
                <div className="font-bold text-green-600">{toPersianDigits(campaign.roi.toFixed(1))}x</div>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <div className="text-gray-500 text-xs mb-1">وضعیت</div>
                <span className={`status-badge ${getStatusColor(campaign.status)}`}>
                  {campaign.status === 'active' ? 'فعال' :
                   campaign.status === 'paused' ? 'متوقف' :
                   campaign.status === 'completed' ? 'تکمیل شده' : 'پیش‌نویس'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-3 border-t border-white/20">
              <span className="text-gray-500 text-xs">
                {campaign.startDate} تا {campaign.endDate}
              </span>
              <span className="text-gray-400 text-xs">
                {campaign.createdBy}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal would go here */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="glass-effect rounded-2xl p-6 w-full max-w-2xl mx-4">
            <h3 className="text-xl font-bold mb-4">
              {editingCampaign ? 'ویرایش کمپین' : 'کمپین جدید'}
            </h3>
            {/* Form would go here */}
            <div className="flex space-x-3 space-x-reverse mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary"
              >
                انصراف
              </button>
              <button className="btn-primary">
                {editingCampaign ? 'به‌روزرسانی' : 'ایجاد'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns; 