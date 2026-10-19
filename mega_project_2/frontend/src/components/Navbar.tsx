import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { notificationApi } from '../services/api';
import { Shield, Bell, LogOut, Menu, Landmark } from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (isAuthenticated) {
      notificationApi.getNotifications()
        .then((items) => {
          setUnreadCount(items.filter((n) => !n.is_read).length);
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Brand / Logo */}
          <div className="flex items-center gap-3">
            {isAuthenticated && onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                aria-label="Toggle menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            )}

            <Link to={isAuthenticated ? (isAdmin ? '/admin' : '/dashboard') : '/'} className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 block leading-tight">
                  Apana <span className="text-emerald-600 font-extrabold">Benefits</span>
                </span>
                <span className="text-[11px] text-slate-700 hidden sm:block font-medium">
                  Informal Worker Welfare & Support Platform
                </span>
              </div>
            </Link>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Trusted Portals Link */}
            <Link
              to="/portals"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg transition-all"
              title={t('trusted_portals')}
            >
              <Landmark className="w-3.5 h-3.5 text-emerald-700" />
              <span>{t('trusted_portals')}</span>
            </Link>

            {/* Bilingual Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  language === 'en'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  language === 'hi'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                हिन्दी
              </button>
              <button
                onClick={() => setLanguage('mr')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  language === 'mr'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                मराठी
              </button>
            </div>

            {isAuthenticated ? (
              <>
                {/* Notifications Link */}
                <Link
                  to="/notifications"
                  className="relative p-2 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
                  title={t('notifications')}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Profile Pill */}
                <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    {user?.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-800 leading-none truncate max-w-[120px]">
                      {user?.full_name}
                    </p>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isAdmin ? 'text-purple-600' : 'text-emerald-600'}`}>
                      {user?.role}
                    </span>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title={t('logout')}
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-emerald-700 transition-colors"
                >
                  {t('login')}
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all"
                >
                  {t('register')}
                </Link>
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
