import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { workerApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { EligibilityBadge } from '../components/EligibilityBadge';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Search,
  ChevronRight
} from 'lucide-react';

export const WorkerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [trackInput, setTrackInput] = useState('');

  useEffect(() => {
    workerApi.getDashboard()
      .then((data) => setDashboardData(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackInput.trim()) {
      navigate(`/track?app_no=${encodeURIComponent(trackInput.trim())}`);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Loading your welfare dashboard...</p>
        </div>
      </div>
    );
  }

  const profile = dashboardData?.profile;
  const stats = dashboardData?.stats;
  const recommendations = dashboardData?.top_recommendations || [];
  const pendingActions = dashboardData?.pending_actions || [];

  return (
    <div className="space-y-6">
      
      {/* Welcome & Quick Track Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Informal Worker Social Security
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            Welcome back, {user?.full_name}!
          </h1>
          <p className="text-emerald-100/80 text-xs sm:text-sm mt-1 max-w-xl">
            {profile?.occupation} • {profile?.state} • Monthly Income: ₹{Number(profile?.monthly_income || 0).toLocaleString()}
          </p>
        </div>

        {/* Track search form */}
        <form onSubmit={handleTrackSubmit} className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={trackInput}
              onChange={(e) => setTrackInput(e.target.value)}
              placeholder="Track App (e.g. APP-2026-000101)"
              className="w-full pl-9 pr-3 py-2 text-xs bg-white text-slate-900 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            Track
          </button>
        </form>
      </div>

      {/* Top 5 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Profile Completion */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Profile</span>
            <span className="text-emerald-600 font-black">{profile?.profile_completion}%</span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${profile?.profile_completion}%` }}
            />
          </div>
          <Link to="/profile" className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 mt-3 inline-flex items-center gap-1">
            Update Profile <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Recommended */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block">Recommended</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{recommendations.length}</div>
          <Link to="/recommendations" className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 mt-2 inline-flex items-center gap-1">
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Applications */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block">Applications</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats?.total_applications || 0}</div>
          <Link to="/applications" className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 mt-2 inline-flex items-center gap-1">
            My Applications <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Benefits Disbursed */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block">Benefits Received</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{stats?.benefits_received || 0}</div>
          <span className="text-[11px] text-slate-500 block mt-2">
            ₹{Number(stats?.total_benefit_amount || 0).toLocaleString()} Total
          </span>
        </div>

        {/* Under Review */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block">In Progress</span>
          <div className="text-2xl font-black text-blue-600 mt-1">{stats?.under_review || 0}</div>
          <span className="text-[11px] text-slate-500 block mt-2">
            {stats?.pending_documents || 0} docs pending
          </span>
        </div>

      </div>

      {/* Pending Actions Alert if any */}
      {pendingActions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Action Required on Your Account</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {pendingActions.map((act: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-amber-200 text-xs">
                <div>
                  <p className="font-bold text-slate-900">{act.title}</p>
                  <p className="text-slate-600">{act.description}</p>
                </div>
                <Link
                  to={act.link}
                  className="px-3 py-1 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 shrink-0 ml-2"
                >
                  Resolve
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended for You (Top 5) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              Recommended Welfare Schemes
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Ranked with explainable 0–100 match scoring based on your profile
            </p>
          </div>
          <Link
            to="/recommendations"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            See All Ranked <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.slice(0, 3).map((item: any) => (
            <div
              key={item.scheme.scheme_id}
              className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between bg-slate-50/50"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                    {item.scheme.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-black text-emerald-700">{item.match_score}%</span>
                    <span className="text-[10px] text-slate-600 font-semibold">Match</span>
                  </div>
                </div>

                <h3 className="font-bold text-sm text-slate-900 line-clamp-2">
                  {item.scheme.scheme_name}
                </h3>

                <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                  {item.scheme.benefits}
                </p>

                {/* Reasons checklist */}
                <div className="mt-3 pt-2 border-t border-slate-200/60 space-y-1">
                  {item.reasons?.slice(0, 2).map((r: string, i: number) => (
                    <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                <EligibilityBadge status={item.eligibility_status} size="sm" />
                <Link
                  to={`/schemes/${item.scheme.scheme_id}`}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
                >
                  Apply <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
