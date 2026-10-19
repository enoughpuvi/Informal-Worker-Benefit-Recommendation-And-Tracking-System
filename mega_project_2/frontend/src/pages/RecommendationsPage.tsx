import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { recommendationApi } from '../services/api';
import { RecommendationItem } from '../types';
import { EligibilityBadge } from '../components/EligibilityBadge';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Sliders,
  Landmark,
  Search,
  MapPin,
  Filter,
  X,
  RotateCcw,
} from 'lucide-react';

/* ─── Filter Constants ─── */

const ALL_CATEGORIES = [
  'Education',
  'Loan',
  'Insurance',
  'Pension',
  'Health',
  'Housing',
  'Financial Assistance',
  'Social Security',
  'Skill Development',
  'Maternity',
  'Food Security',
  'Disability Support',
  'Women & Child Welfare',
  'Agriculture',
  'SC/ST/OBC Welfare',
  'Minority Welfare',
  'Youth & Sports',
  'Legal Aid',
];

const ALL_LOCATIONS = [
  'All India',
  'Andhra Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

const ELIGIBILITY_OPTIONS = [
  'All',
  'Eligible',
  'Potentially Eligible',
  'Not Eligible',
] as const;

/* ─── Component ─── */

export const RecommendationsPage: React.FC = () => {
  const [data, setData] = useState<{
    worker_name: string;
    total_schemes_evaluated: number;
    recommendations: RecommendationItem[];
    profile_completion: number;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [expandedSchemeId, setExpandedSchemeId] = useState<string | null>(null);
  const [displayLimit, setDisplayLimit] = useState(50);

  /* ─── Filter State ─── */
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedEligibility, setSelectedEligibility] = useState<string>('All');
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    recommendationApi.getMyRecommendations()
      .then((res) => {
        setData(res);
        if (res.recommendations?.length > 0) {
          setExpandedSchemeId(res.recommendations[0].scheme.scheme_id);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (schemeId: string) => {
    setExpandedSchemeId(expandedSchemeId === schemeId ? null : schemeId);
  };

  /* ─── Category Toggle ─── */
  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
    setDisplayLimit(50);
  };

  /* ─── Reset Filters ─── */
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setSelectedLocation('All');
    setSelectedEligibility('All');
    setDisplayLimit(50);
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategories.length > 0 ||
    selectedLocation !== 'All' ||
    selectedEligibility !== 'All';

  /* ─── Dynamic categories from API data ─── */
  const dynamicCategories = useMemo(() => {
    const raw = data?.recommendations?.map((r) => r.scheme.category) || [];
    const uniqueFromData = [...new Set(raw)];
    // Merge with our predefined list, de-duplicate
    const merged = [...ALL_CATEGORIES];
    for (const cat of uniqueFromData) {
      if (!merged.some((c) => c.toLowerCase() === cat.toLowerCase())) {
        merged.push(cat);
      }
    }
    return merged;
  }, [data]);

  /* ─── Dynamic locations from API data ─── */
  const dynamicLocations = useMemo(() => {
    const raw = data?.recommendations?.map((r) => r.scheme.state || 'All India') || [];
    const uniqueFromData = [...new Set(raw)];
    const merged = [...ALL_LOCATIONS];
    for (const loc of uniqueFromData) {
      if (loc && !merged.some((l) => l.toLowerCase() === loc.toLowerCase())) {
        merged.push(loc);
      }
    }
    return merged;
  }, [data]);

  /* ─── Filtered Recommendations ─── */
  const filteredRecommendations = useMemo(() => {
    const all = data?.recommendations || [];
    return all.filter((item) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          item.scheme.scheme_name.toLowerCase().includes(q) ||
          item.scheme.description?.toLowerCase().includes(q) ||
          item.scheme.category?.toLowerCase().includes(q) ||
          item.scheme.benefits?.toLowerCase().includes(q) ||
          item.scheme.target_occupation?.toLowerCase().includes(q) ||
          item.scheme.department?.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (selectedCategories.length > 0) {
        const schemeCat = item.scheme.category?.toLowerCase() || '';
        const matches = selectedCategories.some((c) => c.toLowerCase() === schemeCat);
        if (!matches) return false;
      }

      // Location filter
      if (selectedLocation !== 'All') {
        const schemeState = (item.scheme.state || 'All India').toLowerCase();
        const filterLoc = selectedLocation.toLowerCase();
        // "All India" schemes should show for any location filter
        if (schemeState !== 'all india' && schemeState !== filterLoc) return false;
      }

      // Eligibility filter
      if (selectedEligibility !== 'All') {
        if (item.eligibility_status !== selectedEligibility) return false;
      }

      return true;
    });
  }, [data, searchQuery, selectedCategories, selectedLocation, selectedEligibility]);

  /* ─── Category counts ─── */
  const categoryCounts = useMemo(() => {
    const all = data?.recommendations || [];
    const counts: Record<string, number> = {};
    for (const item of all) {
      const cat = item.scheme.category || 'Other';
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [data]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Calculating explainable AI recommendations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Explainable AI Recommendation Engine
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            Recommended Benefits for {data?.worker_name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Evaluated {data?.total_schemes_evaluated} active government schemes using 8 multi-attribute criteria.
          </p>
        </div>

        <Link
          to="/portals"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs transition-all shrink-0 self-start sm:self-auto"
        >
          <Landmark className="w-4 h-4 text-emerald-600" />
          <span>Trusted Government Portals</span>
        </Link>
      </div>

      {/* ═══════ Filter & Search Bar ═══════ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">

        {/* Search + Toggle Row */}
        <div className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setDisplayLimit(50); }}
              placeholder="Search schemes by name, benefit, occupation..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 p-0.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Location Dropdown */}
          <div className="relative shrink-0">
            <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <select
              value={selectedLocation}
              onChange={(e) => { setSelectedLocation(e.target.value); setDisplayLimit(50); }}
              className="pl-8 pr-8 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium appearance-none cursor-pointer min-w-[160px]"
            >
              <option value="All">📍 All Locations</option>
              {dynamicLocations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Eligibility Dropdown */}
          <div className="shrink-0">
            <select
              value={selectedEligibility}
              onChange={(e) => { setSelectedEligibility(e.target.value); setDisplayLimit(50); }}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium cursor-pointer min-w-[150px]"
            >
              {ELIGIBILITY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === 'All' ? '🎯 All Eligibility' : opt}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Toggle + Reset */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                showFilters
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              Categories
              {selectedCategories.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 bg-emerald-600 text-white rounded-full text-[10px] font-bold leading-none">
                  {selectedCategories.length}
                </span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        {showFilters && (
          <div className="px-4 pb-4 border-t border-slate-100 pt-3">
            <div className="flex flex-wrap gap-2">
              {dynamicCategories.map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                const count = categoryCounts[cat] || 0;
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : count > 0
                        ? 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400 hover:text-emerald-700'
                        : 'bg-slate-50 text-slate-400 border-slate-100 cursor-default'
                    }`}
                    disabled={count === 0 && !isSelected}
                  >
                    {cat}
                    {count > 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                        isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {count}
                      </span>
                    )}
                    {isSelected && <X className="w-3 h-3 ml-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-600">
          Showing {Math.min(displayLimit, filteredRecommendations.length)} of {filteredRecommendations.length} recommendations
          {hasActiveFilters && (
            <span className="text-slate-400 ml-1">
              (filtered from {data?.recommendations?.length || 0} total)
            </span>
          )}
        </p>
      </div>

      {/* ═══════ Recommendations List ═══════ */}
      {filteredRecommendations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Search className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-sm text-slate-800">No matching recommendations found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try clearing some filters or adjusting your search query to see more results.
          </p>
          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors mt-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecommendations.slice(0, displayLimit).map((item, index) => {
            const isExpanded = expandedSchemeId === item.scheme.scheme_id;
            const score = item.match_score;
            const b = item.breakdown;

            return (
              <div
                key={item.scheme.scheme_id}
                className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                  isExpanded ? 'border-emerald-500 shadow-md ring-1 ring-emerald-400' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Header Bar */}
                <div
                  onClick={() => toggleExpand(item.scheme.scheme_id)}
                  className="p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 hover:bg-slate-50"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                          {item.scheme.category}
                        </span>
                        {item.scheme.state && item.scheme.state !== 'All India' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" />
                            {item.scheme.state}
                          </span>
                        )}
                        <span className="text-xs text-slate-600 font-medium">
                          {item.scheme.department || item.scheme.government_level}
                        </span>
                        <EligibilityBadge status={item.eligibility_status} size="sm" />
                      </div>
                      <h3 className="font-bold text-base text-slate-900">
                        {item.scheme.scheme_name}
                      </h3>
                    </div>
                  </div>

                  {/* Score & Toggle */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 pl-12 sm:pl-0">
                    <div className="text-right">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-emerald-700">{score}%</span>
                        <span className="text-xs font-semibold text-slate-600">Match</span>
                      </div>
                      <div className="w-24 bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${score >= 80 ? 'bg-emerald-600' : score >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-slate-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-100 space-y-5">
                    
                    {/* Scheme Benefits */}
                    <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                        Key Benefit Entitlement:
                      </span>
                      <p className="text-xs text-slate-800 font-medium leading-relaxed">
                        {item.scheme.benefits}
                      </p>
                    </div>

                    {/* Explainable Criteria Breakdown (0-100 transparent) */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                        <Sliders className="w-4 h-4 text-emerald-600" />
                        Transparent Scoring Attribution Breakdown (Total: {score}/100)
                      </h4>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                          <span className="text-slate-500 block text-[11px]">Trade Match (25)</span>
                          <span className="font-bold text-slate-900 text-sm">{b.occupation} / 25 pts</span>
                        </div>
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                          <span className="text-slate-500 block text-[11px]">Income Cap (20)</span>
                          <span className="font-bold text-slate-900 text-sm">{b.income} / 20 pts</span>
                        </div>
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                          <span className="text-slate-500 block text-[11px]">Age Bracket (15)</span>
                          <span className="font-bold text-slate-900 text-sm">{b.age} / 15 pts</span>
                        </div>
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                          <span className="text-slate-500 block text-[11px]">Location Match (15)</span>
                          <span className="font-bold text-slate-900 text-sm">{b.location} / 15 pts</span>
                        </div>
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                          <span className="text-slate-500 block text-[11px]">Family Need (10)</span>
                          <span className="font-bold text-slate-900 text-sm">{b.family} / 10 pts</span>
                        </div>
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                          <span className="text-slate-500 block text-[11px]">Disability Quota (5)</span>
                          <span className="font-bold text-slate-900 text-sm">{b.disability} / 5 pts</span>
                        </div>
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                          <span className="text-slate-500 block text-[11px]">Education (5)</span>
                          <span className="font-bold text-slate-900 text-sm">{b.education} / 5 pts</span>
                        </div>
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                          <span className="text-slate-500 block text-[11px]">Non-Duplication (5)</span>
                          <span className="font-bold text-slate-900 text-sm">{b.other} / 5 pts</span>
                        </div>
                      </div>
                    </div>

                    {/* Why Recommended Checklist */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Why Recommended for You:
                        </span>
                        <ul className="space-y-1.5 text-xs text-slate-700">
                          {item.reasons?.map((r, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-emerald-600 font-bold">✓</span>
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {item.caveats && item.caveats.length > 0 && (
                        <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200 space-y-2">
                          <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            Requirements to Complete:
                          </span>
                          <ul className="space-y-1.5 text-xs text-slate-700">
                            {item.caveats?.map((c, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-amber-600 font-bold">⚠</span>
                                <span>{c}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                      <Link
                        to={`/schemes/${item.scheme.scheme_id}`}
                        className="text-xs font-bold text-slate-600 hover:text-slate-900"
                      >
                        View Complete Scheme Rules & Official Portal →
                      </Link>

                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/portals?search=${encodeURIComponent(item.scheme.scheme_name.split('(')[0].trim())}`}
                          className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                          title="Search verified official government portal for this scheme"
                        >
                          <Landmark className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Verify on Official Portal</span>
                        </Link>

                        <Link
                          to={`/schemes/${item.scheme.scheme_id}`}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                        >
                          Apply for this Scheme <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {filteredRecommendations.length > displayLimit && (
        <div className="text-center pt-2 pb-6">
          <button
            onClick={() => setDisplayLimit((prev) => prev + 50)}
            className="px-6 py-2.5 bg-white border border-slate-300 hover:border-emerald-500 text-slate-800 hover:text-emerald-700 font-bold rounded-xl text-xs shadow-xs transition-all inline-flex items-center gap-2"
          >
            <span>Show Next 50 Recommendations (Showing {displayLimit} of {filteredRecommendations.length})</span>
          </button>
        </div>
      )}

    </div>
  );
};
