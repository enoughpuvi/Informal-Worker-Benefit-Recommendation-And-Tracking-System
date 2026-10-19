import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Shield, User, Mail, Lock, Phone, ArrowRight, AlertCircle } from 'lucide-react';
import {
  indianStates,
  stateDistrictsMap,
  informalOccupations
} from '../data/locationAndOccupations';

export const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    age: 30,
    gender: 'Male',
    state: 'Delhi',
    district: '',
    city: '',
    occupation: 'Construction Worker / निर्माण श्रमिक'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await register({
        ...formData,
        age: Number(formData.age)
      });
      showToast('Registration successful! Welcome to the welfare platform.', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      let detail = 'Registration failed. Please check your inputs.';
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
    <div className="min-h-screen bg-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
              <Shield className="w-6 h-6" />
            </div>
            <span className="font-bold text-xl text-slate-900">Apana Benefits</span>
          </Link>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Worker Registration
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Sign up to discover schemes tailored for your occupation and income bracket.
          </p>
        </div>

        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-slate-200">
          
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ramesh@example.com"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 6 chars"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    placeholder="Repeat password"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Age *
                </label>
                <input
                  type="number"
                  min="16"
                  max="80"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Gender *
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Transgender">Transgender</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Primary Trade / Occupation *
                </label>
                <select
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="">-- Choose Trade / Occupation --</option>
                  {informalOccupations.map((occ) => (
                    <option key={occ} value={occ}>{occ}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  State / UT *
                </label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={(e) => {
                    const newState = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      state: newState,
                      district: '',
                      city: ''
                    }));
                  }}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="">-- Choose State / UT --</option>
                  {indianStates.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  District / City *
                </label>
                <select
                  name="district"
                  value={formData.district || formData.city}
                  onChange={(e) => {
                    const newDist = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      district: newDist,
                      city: newDist
                    }));
                  }}
                  disabled={!formData.state}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {formData.state ? '-- Choose District / City --' : 'Select State first'}
                  </option>
                  {(stateDistrictsMap[formData.state] || []).map((dist) => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Creating Worker Account...' : 'Complete Registration & Get Recommendations'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
            Already registered?{' '}
            <Link to="/login" className="font-bold text-emerald-600 hover:text-emerald-700">
              Sign In here
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};
