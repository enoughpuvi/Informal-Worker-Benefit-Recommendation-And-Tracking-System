import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  LayoutDashboard,
  User,
  Sparkles,
  Layers,
  FileText,
  Search,
  UploadCloud,
  FileCheck2,
  Users,
  BarChart3,
  DownloadCloud,
  History,
  LifeBuoy,
  Landmark,
  Mic,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { isAdmin } = useAuth();
  const { t } = useLanguage();

  const workerNav = [
    { to: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { to: '/profile', label: t('my_profile'), icon: User },
    { to: '/recommendations', label: t('recommended_benefits'), icon: Sparkles },
    { to: '/schemes', label: t('all_schemes'), icon: Layers },
    { to: '/portals', label: t('trusted_portals'), icon: Landmark },
    { to: '/applications', label: t('my_applications'), icon: FileText },
    { to: '/track', label: t('track_applications'), icon: Search },
    { to: '/documents', label: t('documents'), icon: FileCheck2 },
    { to: '/voice-assistant', label: t('voice_assistant_title', 'Talk to Apana AI'), icon: Mic },
    { to: '/issues', label: t('issues_grievances'), icon: LifeBuoy },
  ];

  const adminNav = [
    { to: '/admin', label: t('dashboard'), icon: LayoutDashboard },
    { to: '/admin/schemes', label: t('schemes_mgmt'), icon: Layers },
    { to: '/portals', label: t('trusted_portals'), icon: Landmark },
    { to: '/admin/dataset-upload', label: t('dataset_upload'), icon: UploadCloud },
    { to: '/admin/applications', label: t('all_applications'), icon: FileText },
    { to: '/admin/workers', label: t('workers_directory'), icon: Users },
    { to: '/admin/issues', label: t('admin_issues'), icon: LifeBuoy },
    { to: '/admin/analytics', label: t('analytics'), icon: BarChart3 },
    { to: '/admin/reports', label: t('reports'), icon: DownloadCloud },
    { to: '/admin/audit-logs', label: t('audit_logs'), icon: History },
  ];

  const navItems = isAdmin ? adminNav : workerNav;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between overflow-y-auto`}
      >
        <div className="p-4 space-y-6">
          
          {/* Header on mobile */}
          <div className="flex items-center justify-between md:hidden pb-2 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {isAdmin ? t('admin_portal') : t('worker_portal')}
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-500 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Section Indicator */}
          <div className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 flex items-center justify-between">
            <span>Portal:</span>
            <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-800'}`}>
              {isAdmin ? 'Administration' : 'Worker Portal'}
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/admin' || item.to === '/dashboard'}
                  onClick={() => onClose()}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer Support Info */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="text-[11px] text-slate-600 space-y-1">
            <p className="font-semibold text-slate-700">Welfare Helpline: 14434</p>
            <p>National Social Security Board</p>
            <p className="text-[10px] text-slate-600">Apana Benefits v2.0</p>
          </div>
        </div>
      </aside>
    </>
  );
};
