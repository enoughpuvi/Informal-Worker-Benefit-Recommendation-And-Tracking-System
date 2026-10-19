import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../services/api';
import { AdminAnalytics } from '../types';
import {
  UploadCloud,
  Shield
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';

const COLORS = ['#22c55e', '#0284c7', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export const AdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getAnalytics()
      .then((data) => setAnalytics(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Calculating system analytics & processing time...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return <div className="p-8 text-center text-slate-500">Failed to load analytics data.</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-slate-900 to-emerald-950 p-6 sm:p-8 rounded-2xl text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-bold mb-2">
            <Shield className="w-3.5 h-3.5 text-purple-300" />
            Social Welfare Administration Console
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            Welfare Scheme Administration Dashboard
          </h1>
          <p className="text-purple-200/80 text-xs sm:text-sm mt-1 max-w-2xl">
            Live monitoring of registered informal workers, welfare catalog, scheme applications, and Direct Benefit Transfers.
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/dataset-upload"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Scheme Dataset
          </Link>
          <Link
            to="/admin/schemes"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs rounded-xl transition-all"
          >
            Manage Schemes
          </Link>
        </div>
      </div>

      {/* Top 7 Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
        
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Workers</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{analytics.total_workers}</div>
          <Link to="/admin/workers" className="text-[10px] font-bold text-purple-600 mt-2 block">
            View Directory →
          </Link>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Schemes</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{analytics.total_schemes}</div>
          <span className="text-[10px] font-semibold text-emerald-600 mt-2 block">
            {analytics.active_schemes} Active
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Applications</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{analytics.total_applications}</div>
          <Link to="/admin/applications" className="text-[10px] font-bold text-purple-600 mt-2 block">
            Manage All →
          </Link>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Pending</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{analytics.pending_applications}</div>
          <span className="text-[10px] text-slate-400 mt-2 block">In review</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Approved</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{analytics.approved_applications}</div>
          <span className="text-[10px] font-semibold text-emerald-600 mt-2 block">
            {analytics.approval_rate}% Rate
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Disbursed</span>
          <div className="text-2xl font-black text-blue-600 mt-1">{analytics.disbursed_applications}</div>
          <span className="text-[10px] text-slate-500 mt-2 block truncate">
            ₹{analytics.total_benefits_disbursed_amount.toLocaleString()} DBT
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Avg Turnaround</span>
          <div className="text-2xl font-black text-purple-700 mt-1">
            {analytics.processing_time?.average_days || 8.4} <span className="text-xs font-medium text-slate-500">days</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-2 block">
            Min: {analytics.processing_time?.min_days}d • Max: {analytics.processing_time?.max_days}d
          </span>
        </div>

      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Applications by Status Donut */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center justify-between">
            <span>Application Status Distribution</span>
            <span className="text-xs text-slate-400 font-normal">All Submissions</span>
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.applications_by_status}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {analytics.applications_by_status.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs">
            {analytics.applications_by_status.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-slate-600">{item.name}:</span>
                <span className="font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Applications by Occupation Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center justify-between">
            <span>Applications by Worker Trade / Occupation</span>
            <span className="text-xs text-slate-400 font-normal">Top Occupations</span>
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.applications_by_occupation}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#0284c7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Most Requested Schemes Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center justify-between">
            <span>Most Requested Welfare Schemes</span>
            <span className="text-xs text-slate-400 font-normal">Application Volume</span>
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.applications_by_scheme} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                <Tooltip />
                <Bar dataKey="value" fill="#22c55e" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Trends Area Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center justify-between">
            <span>Monthly Application & Disbursement Trends</span>
            <span className="text-xs text-slate-400 font-normal">Workflow Trajectory</span>
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.monthly_trends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="applied" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} name="Applications" />
                <Area type="monotone" dataKey="approved" stroke="#0284c7" fill="#0284c7" fillOpacity={0.15} name="Approved" />
                <Area type="monotone" dataKey="disbursed" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} name="Disbursed" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 text-xs pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-purple-500" />
              <span>Applied</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-blue-500" />
              <span>Approved</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500" />
              <span>Disbursed</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
