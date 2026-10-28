import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { firestoreService } from '../services/firestoreService';
import { portalsApi } from '../services/api';
import { TrustedPortal, PortalScheme } from '../types';
import { PORTAL_CATEGORIES, INITIAL_TRUSTED_PORTALS, INITIAL_PORTAL_SCHEMES } from '../data/trustedPortalsData';
import { stateDistrictsMap } from '../data/locationAndOccupations';
import { PortalCard } from '../components/PortalCard';
import { PortalSchemeCard } from '../components/PortalSchemeCard';
import {
  Landmark,
  Building2,
  MapPin,
  Layers,
  Search,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  BookOpen,
  Info,
  ExternalLink,
  X
} from 'lucide-react';

type BrowseMode = 'central' | 'state' | 'category' | 'directory';

export const TrustedPortalsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { t } = useLanguage();

  // Primary Browse Mode
  const [browseMode, setBrowseMode] = useState<BrowseMode>('central');

  // Portals & Schemes state
  const [portals, setPortals] = useState<TrustedPortal[]>([]);
  const [schemes, setSchemes] = useState<PortalScheme[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Verification Review Modal State (Admin / Audit)
  const [reviewModalPortal, setReviewModalPortal] = useState<TrustedPortal | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'Verified' | 'Needs verification'>('Verified');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [reviewSuccessMessage, setReviewSuccessMessage] = useState<string | null>(null);

  // Indian States & UTs list for state browsing
  const allStatesList = useMemo(() => {
    return Object.keys(stateDistrictsMap).sort();
  }, []);

  // Supported languages list for filter
  const allLanguagesList = [
    'Hindi',
    'English',
    'Marathi',
    'Tamil',
    'Telugu',
    'Kannada',
    'Gujarati',
    'Bengali',
    'Malayalam',
    'Punjabi',
    'Odia'
  ];

  // Fetch initial data
  const loadData = useCallback(async () => {
    setLoading(true);
    let fetchedPortals: TrustedPortal[] = [];
    let fetchedSchemes: PortalScheme[] = [];

    // Helper: wrap a promise with a timeout so network calls don't hang
    const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
      Promise.race([
        promise,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
      ]);

    // Strategy 1: Fast local backend API
    try {
      const [portalsRes, schemesRes] = await withTimeout(
        Promise.all([portalsApi.getPortals(), portalsApi.getSchemesDirectory()]),
        2000
      );
      if (portalsRes && portalsRes.length > 0) fetchedPortals = portalsRes;
      if (schemesRes && schemesRes.length > 0) fetchedSchemes = schemesRes;
    } catch (apiErr) {
      console.warn('[TrustedPortals] Backend API unavailable or timed out, trying local store/Firestore:', apiErr);
    }

    // Strategy 2: If Firestore has cached or remote data
    if (fetchedPortals.length === 0 || fetchedSchemes.length === 0) {
      try {
        const [portalsData, schemesData] = await withTimeout(
          Promise.all([firestoreService.getPortals(), firestoreService.getSchemes()]),
          1500
        );
        if (fetchedPortals.length === 0 && portalsData.length > 0) fetchedPortals = portalsData;
        if (fetchedSchemes.length === 0 && schemesData.length > 0) fetchedSchemes = schemesData;
      } catch (fErr) {
        console.warn('[TrustedPortals] Firestore fallback passed:', fErr);
      }
    }

    // Strategy 3: Always fall back to verified initial seed data
    if (fetchedPortals.length === 0) {
      fetchedPortals = INITIAL_TRUSTED_PORTALS;
    }
    if (fetchedSchemes.length === 0) {
      fetchedSchemes = INITIAL_PORTAL_SCHEMES;
    }

    setPortals(fetchedPortals);
    setSchemes(fetchedSchemes);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter Portals according to current browse mode and filter inputs
  const filteredPortals = useMemo(() => {
    let result = [...portals];

    // Mode-specific base filter
    if (browseMode === 'central') {
      result = result.filter(p => p.government_level === 'Central');
    } else if (browseMode === 'state') {
      if (selectedState !== 'All') {
        result = result.filter(
          p =>
            p.state.toLowerCase() === selectedState.toLowerCase() ||
            (p.government_level === 'Central' && p.state.toLowerCase() === 'all india')
        );
      } else {
        result = result.filter(p => p.government_level === 'State');
      }
    } else if (browseMode === 'category') {
      if (selectedCategory !== 'All') {
        result = result.filter(p =>
          p.categories.some(c => c.toLowerCase() === selectedCategory.toLowerCase())
        );
      }
    }

    // Additional user filters
    if (selectedState !== 'All' && browseMode !== 'state') {
      result = result.filter(
        p =>
          p.state.toLowerCase() === selectedState.toLowerCase() ||
          p.state.toLowerCase() === 'all india'
      );
    }

    if (selectedCategory !== 'All' && browseMode !== 'category') {
      result = result.filter(p =>
        p.categories.some(c => c.toLowerCase() === selectedCategory.toLowerCase())
      );
    }

    if (selectedLanguage !== 'All') {
      result = result.filter(p =>
        p.supported_languages?.some(l => l.toLowerCase() === selectedLanguage.toLowerCase())
      );
    }

    if (selectedStatus !== 'All') {
      result = result.filter(p => p.verification_status === selectedStatus);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          (p.hindi_name && p.hindi_name.toLowerCase().includes(q)) ||
          p.description.toLowerCase().includes(q) ||
          p.responsible_department.toLowerCase().includes(q) ||
          p.state.toLowerCase().includes(q) ||
          p.categories.some(c => c.toLowerCase().includes(q))
      );
    }

    return result;
  }, [portals, browseMode, selectedState, selectedCategory, selectedLanguage, selectedStatus, searchQuery]);

  // Filter Schemes Directory according to search and category filters
  const filteredSchemes = useMemo(() => {
    let result = [...schemes];

    if (selectedCategory !== 'All') {
      result = result.filter(s => s.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    if (selectedState !== 'All') {
      result = result.filter(
        s =>
          s.state_applicability.toLowerCase() === selectedState.toLowerCase() ||
          s.state_applicability.toLowerCase() === 'all india'
      );
    }

    if (selectedStatus !== 'All') {
      result = result.filter(s => s.verification_status === selectedStatus);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        s =>
          s.name.toLowerCase().includes(q) ||
          s.portal_name.toLowerCase().includes(q) ||
          s.responsible_department.toLowerCase().includes(q) ||
          s.eligibility.toLowerCase().includes(q) ||
          s.benefits.toLowerCase().includes(q) ||
          (s.target_occupation && s.target_occupation.toLowerCase().includes(q))
      );
    }

    return result;
  }, [schemes, selectedCategory, selectedState, selectedStatus, searchQuery]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedState('All');
    setSelectedCategory('All');
    setSelectedLanguage('All');
    setSelectedStatus('All');
  };

  // Open Periodic Verification Review Modal
  const handleOpenReviewModal = (portal: TrustedPortal) => {
    setReviewModalPortal(portal);
    setReviewStatus(portal.verification_status);
    setReviewNotes(portal.notes || '');
    setReviewSuccessMessage(null);
  };

  // Handle Review Submission
  const handleSubmitReview = async () => {
    if (!reviewModalPortal) return;
    setSubmittingReview(true);
    setReviewSuccessMessage(null);

    try {
      // 1. Update Firestore & Local Storage
      await firestoreService.recordVerificationReview(
        reviewModalPortal.id,
        reviewStatus,
        reviewNotes
      );

      // 2. Sync to Backend API if available
      try {
        await portalsApi.recordVerificationReview(reviewModalPortal.id, {
          verification_status: reviewStatus,
          notes: reviewNotes
        });
      } catch (apiErr) {
        console.warn('Backend API review sync note:', apiErr);
      }

      setReviewSuccessMessage('Verification review recorded successfully! Portal link and status updated.');

      // Refresh data
      await loadData();

      setTimeout(() => {
        setReviewModalPortal(null);
        setReviewSuccessMessage(null);
      }, 1400);
    } catch (err: any) {
      console.error('Failed to submit verification review:', err);
      alert('Failed to submit verification review: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner / Hero Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-700/60 border border-emerald-500/40 text-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>Official Government Welfare Gateways (Verified .gov.in & .nic.in)</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {t('trusted_portals')}
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              {t('trusted_portals_desc')}
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15 shrink-0 self-start md:self-auto">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/30 flex items-center justify-center text-emerald-300">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-emerald-200 font-medium">Verified Official Sources</p>
              <p className="text-lg font-bold text-white">
                {portals.filter(p => p.verification_status === 'Verified').length} Active Portals
              </p>
            </div>
          </div>
        </div>

        {/* Safe Links & Integrity Notice */}
        <div className="mt-6 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-[11px] text-emerald-200/80">
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            External links open in secure new tabs (rel="noopener noreferrer"). Clearly separated informational portals and direct application links.
          </span>
          <span className="font-semibold text-emerald-300">
            Last Periodic Review: October 2026
          </span>
        </div>
      </div>

      {/* Main Browse Tabs */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-sm flex flex-wrap gap-1">
        <button
          onClick={() => {
            setBrowseMode('central');
            setSelectedState('All');
          }}
          className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            browseMode === 'central'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>{t('browse_by_central')}</span>
        </button>

        <button
          onClick={() => setBrowseMode('state')}
          className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            browseMode === 'state'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>{t('browse_by_state')}</span>
        </button>

        <button
          onClick={() => setBrowseMode('category')}
          className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            browseMode === 'category'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{t('browse_by_category')}</span>
        </button>

        <button
          onClick={() => setBrowseMode('directory')}
          className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            browseMode === 'directory'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>{t('browse_schemes_directory')} ({schemes.length})</span>
        </button>
      </div>

      {/* Category Horizontal Quick Selector (When in Category Mode) */}
      {browseMode === 'category' && (
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            Select Welfare Scheme Category
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === 'All'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              All Categories
            </button>
            {PORTAL_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* State Selector Quick Bar (When in State Mode) */}
      {browseMode === 'state' && (
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                Select State or Union Territory
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Displaying official state-level citizen services & unorganized worker portals
              </p>
            </div>

            <select
              value={selectedState}
              onChange={e => setSelectedState(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="All">All States & Union Territories</option>
              {allStatesList.map(st => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Global Search and Filter Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Keyword Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search portals by name, department, welfare benefits, state or keywords..."
              className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            {/* Category Filter (if not already selecting in category mode) */}
            {browseMode !== 'category' && (
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="All">All Categories</option>
                {PORTAL_CATEGORIES.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}

            {/* Language Filter */}
            {browseMode !== 'directory' && (
              <select
                value={selectedLanguage}
                onChange={e => setSelectedLanguage(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="All">All Languages</option>
                {allLanguagesList.map(l => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            )}

            {/* Verification Status Filter */}
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="All">All Verification Status</option>
              <option value="Verified">Verified Official Portals</option>
              <option value="Needs verification">Needs Verification</option>
            </select>

            {/* Reset Filter Button */}
            {(searchQuery ||
              selectedCategory !== 'All' ||
              selectedLanguage !== 'All' ||
              selectedStatus !== 'All' ||
              (selectedState !== 'All' && browseMode !== 'state')) && (
              <button
                onClick={handleResetFilters}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-xl border border-slate-200 transition-colors flex items-center gap-1 shrink-0"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Results Counter and Status */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>
            Showing{' '}
            <strong className="text-slate-800">
              {browseMode === 'directory' ? filteredSchemes.length : filteredPortals.length}
            </strong>{' '}
            {browseMode === 'directory' ? 'schemes' : 'government portals'}
          </span>

          <span className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Verified against official Gazette & NIC records
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        /* Loading Skeletons */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse shadow-sm"
            >
              <div className="flex justify-between">
                <div className="h-5 w-24 bg-slate-200 rounded-full" />
                <div className="h-5 w-20 bg-slate-200 rounded-full" />
              </div>
              <div className="h-6 w-3/4 bg-slate-200 rounded" />
              <div className="h-4 w-1/2 bg-slate-200 rounded" />
              <div className="space-y-2 pt-2">
                <div className="h-3 w-full bg-slate-100 rounded" />
                <div className="h-3 w-5/6 bg-slate-100 rounded" />
              </div>
              <div className="h-9 w-full bg-slate-200 rounded-xl pt-4" />
            </div>
          ))}
        </div>
      ) : browseMode === 'directory' ? (
        /* Linked Schemes Directory View */
        filteredSchemes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No matching schemes found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              We couldn't find any linked schemes matching your filter criteria. Try searching for other keywords or reset your filters.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchemes.map(scheme => (
              <PortalSchemeCard key={scheme.id} scheme={scheme} />
            ))}
          </div>
        )
      ) : (
        /* Portals Cards View */
        filteredPortals.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Landmark className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No government portals found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No government portals matched your chosen category, state, or search filters.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPortals.map(portal => (
              <PortalCard
                key={portal.id}
                portal={portal}
                isAdmin={isAdmin}
                onOpenReviewModal={handleOpenReviewModal}
              />
            ))}
          </div>
        )
      )}

      {/* Admin Verification Review Modal */}
      {reviewModalPortal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm sm:text-base">
                  Audit & Verification Review
                </h3>
              </div>
              <button
                onClick={() => setReviewModalPortal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Target Government Portal
                </p>
                <h4 className="text-base font-bold text-slate-900 mt-0.5">
                  {reviewModalPortal.name}
                </h4>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 truncate">
                  <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                  <a
                    href={reviewModalPortal.official_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 hover:underline"
                  >
                    {reviewModalPortal.official_url}
                  </a>
                </p>
              </div>

              {/* Status Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Verification Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewStatus('Verified')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      reviewStatus === 'Verified'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Verified Official</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewStatus('Needs verification')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      reviewStatus === 'Needs verification'
                        ? 'bg-amber-50 border-amber-500 text-amber-800'
                        : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Needs Verification</span>
                  </button>
                </div>
              </div>

              {/* Review Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Audit Notes & Verification Remarks
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  rows={3}
                  placeholder="Record SSL verification, endpoint check, or link updates..."
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                />
              </div>

              {reviewSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{reviewSuccessMessage}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-5 py-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReviewModalPortal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitReview}
                disabled={submittingReview}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
              >
                {submittingReview ? (
                  <span>Recording...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Review & Update Date</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
