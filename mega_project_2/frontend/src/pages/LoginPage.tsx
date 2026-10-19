import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [roleType, setRoleType] = useState<'worker' | 'admin'>('worker');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(() =>
    searchParams.get('session_expired') === 'true'
      ? 'Your session has expired. Please log in again.'
      : null
  );

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (searchParams.get('session_expired') === 'true') {
      showToast('Session expired. Please log in again.', 'warning');
    }
  }, [searchParams, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier || !password) {
      setError(`Please enter both your ${roleType === 'admin' ? 'Admin ID / Email' : 'Email / Mobile'} and password.`);
      return;
    }

    setLoading(true);
    try {
      const user = await login(identifier, password);
      
      // Role match check
      if (roleType === 'admin' && user.role !== 'admin') {
        setError('This account does not have administrator privileges. Please switch to the Worker login tab.');
        setLoading(false);
        return;
      }

      showToast(`Welcome back, ${user.full_name}!`, 'success');
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      let detail = 'Invalid credentials. Please verify your ID / email and password.';
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          detail = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          detail = err.response.data.detail.map((item: any) => item.msg || item.message).join('. ');
        }
      } else if (!err.response || (err.message && err.message.includes('Network Error'))) {
        detail = 'Cannot connect to backend server. Please verify backend is running on http://localhost:8000.';
      }
      setError(detail);
      showToast(detail, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
            <Shield className="w-7 h-7" />
          </div>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Sign In to Apana Benefits
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-600">
          Welfare benefit recommendations, application tracking, and administrative portal.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-xl rounded-2xl border border-slate-200">
          
          {/* Role Selection Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setRoleType('worker');
                setError(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                roleType === 'worker'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-emerald-600" />
              <span>Worker / Beneficiary</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRoleType('admin');
                setError(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                roleType === 'admin'
                  ? 'bg-white text-purple-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-purple-600" />
              <span>Administrator</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {roleType === 'admin' ? 'Administrator ID or Official Email' : 'Worker Email or Mobile Number'}
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  {roleType === 'admin' ? (
                    <Shield className="w-4 h-4 text-purple-600" />
                  ) : (
                    <Mail className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={
                    roleType === 'admin'
                      ? 'ADMIN-001 or admin@welfare.gov.in'
                      : 'ramesh.worker@demo.in or 9876543210'
                  }
                  className={`block w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:border-transparent ${
                    roleType === 'admin'
                      ? 'focus:ring-purple-500'
                      : 'focus:ring-emerald-500'
                  }`}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {roleType === 'admin'
                  ? 'Authorized government welfare administrators & nodal officers.'
                  : 'Login with your registered email or 10-digit mobile number.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`block w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:border-transparent ${
                    roleType === 'admin'
                      ? 'focus:ring-purple-500'
                      : 'focus:ring-emerald-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-2 py-3 px-4 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                roleType === 'admin'
                  ? 'bg-purple-700 hover:bg-purple-800'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing In...</span>
                </div>
              ) : (
                <>
                  <span>
                    {roleType === 'admin' ? 'Sign In as Administrator' : 'Sign In as Worker'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {roleType === 'worker' ? (
            <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
              Don't have a worker account?{' '}
              <Link to="/register" className="font-bold text-emerald-600 hover:text-emerald-700">
                Register here
              </Link>
            </div>
          ) : (
            <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
              Government Administrative Portal • Authorized Access Only
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
