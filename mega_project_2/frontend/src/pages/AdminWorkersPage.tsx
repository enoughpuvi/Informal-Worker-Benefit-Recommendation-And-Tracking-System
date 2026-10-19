import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../services/api';
import { Users, Search } from 'lucide-react';

export const AdminWorkersPage: React.FC = () => {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [occupationFilter, setOccupationFilter] = useState('All');
  const [displayLimit, setDisplayLimit] = useState(50);

  const fetchWorkers = useCallback(async () => {
    try {
      const data = await adminApi.getWorkers({
        search: search.trim() || undefined,
        occupation: occupationFilter === 'All' ? undefined : occupationFilter
      });
      setWorkers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, occupationFilter]);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const occupationsList = [
    'All', 'Construction Worker', 'Street Vendor', 'Domestic Helper',
    'Auto-Rickshaw Driver', 'Agricultural Laborer', 'Tailor / Garment Worker',
    'Carpenter', 'Electrician', 'Plumber'
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-600" />
            Registered Informal Workers Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Directory of informal and unorganized trade workers registered on the welfare platform.
          </p>
        </div>
        <div className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl self-start sm:self-center">
          {workers.length} Registered Workers
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search worker by name, phone or email..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={occupationFilter}
            onChange={(e) => setOccupationFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white font-medium"
          >
            {occupationsList.map((occ) => (
              <option key={occ} value={occ}>Filter Trade: {occ}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
              <tr>
                <th className="py-3 px-4">Worker Profile</th>
                <th className="py-3 px-4">Primary Trade</th>
                <th className="py-3 px-4">Monthly Income</th>
                <th className="py-3 px-4">State / District</th>
                <th className="py-3 px-4">Profile Completion</th>
                <th className="py-3 px-4 text-right">Applications</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">Loading workers directory...</td>
                </tr>
              ) : workers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">No workers found.</td>
                </tr>
              ) : (
                workers.slice(0, displayLimit).map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs">
                          {w.full_name?.charAt(0) || 'W'}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{w.full_name}</span>
                          <span className="text-[11px] text-slate-500">{w.phone || w.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {w.occupation || 'Not specified'}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {w.monthly_income ? `₹${Number(w.monthly_income).toLocaleString()}` : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {w.state || 'India'} {w.district ? `(${w.district})` : ''}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-1.5 rounded-full"
                            style={{ width: `${w.profile_completion}%` }}
                          />
                        </div>
                        <span className="font-bold text-[10px] text-slate-700">{w.profile_completion}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-purple-700">
                      {w.applications_count} submitted
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {workers.length > displayLimit && (
          <div className="p-4 border-t border-slate-100 text-center bg-slate-50">
            <button
              onClick={() => setDisplayLimit((prev) => prev + 50)}
              className="px-5 py-2 bg-white border border-slate-300 hover:border-purple-500 text-slate-800 hover:text-purple-700 font-bold rounded-xl text-xs shadow-xs transition-all inline-flex items-center gap-2"
            >
              <span>Show Next 50 Workers (Showing {displayLimit} of {workers.length})</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
