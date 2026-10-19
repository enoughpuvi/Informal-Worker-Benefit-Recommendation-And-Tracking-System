import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { schemeApi } from '../services/api';
import { Scheme } from '../types';
import {
  Layers,
  Search,
  ArrowRight,
  Briefcase,
  MapPin
} from 'lucide-react';

export const SchemeDiscoveryPage: React.FC = () => {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayLimit, setDisplayLimit] = useState(48);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedState, setSelectedState] = useState('All India');
  const [search, setSearch] = useState('');

  useEffect(() => {
    schemeApi.getCategories().then((c) => setCategories(['All', ...c])).catch(() => {});
  }, []);

  const fetchSchemes = useCallback(() => {
    setLoading(true);
    schemeApi.getSchemes({
      category: selectedCategory === 'All' ? undefined : selectedCategory,
      state: selectedState === 'All India' ? undefined : selectedState,
      search: search.trim() ? search.trim() : undefined,
      status_filter: 'active'
    })
      .then((data) => setSchemes(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedCategory, selectedState, search]);

  useEffect(() => {
    fetchSchemes();
  }, [fetchSchemes]);

  const statesList = [
    'All India', 'Delhi', 'Maharashtra', 'Gujarat', 'Rajasthan',
    'Uttar Pradesh', 'Karnataka', 'Tamil Nadu', 'Bihar', 'West Bengal'
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-emerald-600" />
            Government Welfare Schemes Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Discover social welfare programs, pensions, health insurance, and tool grants available for informal workers.
          </p>
        </div>
        <div className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl self-start sm:self-center">
          Showing {schemes.length} Active Schemes
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search scheme name or trade..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  Category: {cat}
                </option>
              ))}
            </select>
          </div>

          {/* State Dropdown */}
          <div className="relative">
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
            >
              {statesList.map((st) => (
                <option key={st} value={st}>
                  Location: {st}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Schemes Grid */}
      {loading ? (
        <div className="p-12 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : schemes.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
          <Layers className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="font-bold text-sm text-slate-800">No schemes found matching criteria</h3>
          <p className="text-xs text-slate-500">Try clearing your search terms or choosing 'All' categories.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {schemes.slice(0, displayLimit).map((scheme) => (
            <div
              key={scheme.scheme_id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                    {scheme.category}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {scheme.government_level}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 leading-snug line-clamp-2">
                  {scheme.scheme_name}
                </h3>

                <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                  {scheme.description}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate font-medium">Target: {scheme.target_occupation || 'All Informal Workers'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate font-medium">{scheme.state || 'All India'}</span>
                  </div>
                </div>

                <div className="mt-3 p-2.5 bg-emerald-50/70 border border-emerald-200/60 rounded-xl text-xs text-emerald-900">
                  <span className="font-bold block text-[10px] uppercase tracking-wider text-emerald-800">Benefit:</span>
                  <span className="line-clamp-2 font-medium">{scheme.benefits}</span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <Link
                  to={`/schemes/${scheme.scheme_id}`}
                  className="text-xs font-bold text-slate-700 hover:text-emerald-700"
                >
                  View Details
                </Link>

                <Link
                  to={`/schemes/${scheme.scheme_id}`}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1"
                >
                  Apply <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {schemes.length > displayLimit && (
        <div className="text-center pt-2 pb-6">
          <button
            onClick={() => setDisplayLimit((prev) => prev + 48)}
            className="px-6 py-2.5 bg-white border border-slate-300 hover:border-emerald-500 text-slate-800 hover:text-emerald-700 font-bold rounded-xl text-xs shadow-xs transition-all inline-flex items-center gap-2"
          >
            <span>Show Next 48 Schemes (Showing {displayLimit} of {schemes.length})</span>
          </button>
        </div>
      )}

    </div>
  );
};
