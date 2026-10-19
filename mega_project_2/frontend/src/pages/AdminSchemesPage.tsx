import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { schemeApi } from '../services/api';
import { Scheme } from '../types';
import { useToast } from '../context/ToastContext';
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  UploadCloud,
  X,
  Power
} from 'lucide-react';

export const AdminSchemesPage: React.FC = () => {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [categories, setCategories] = useState<string[]>([]);
  const [displayLimit, setDisplayLimit] = useState(50);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Scheme>>({
    scheme_id: '',
    scheme_name: '',
    description: '',
    category: 'Social Security',
    department: 'Ministry of Labour & Employment',
    government_level: 'Central',
    state: 'All India',
    target_occupation: 'All Informal Workers',
    minimum_age: 18,
    maximum_age: 60,
    income_limit: 15000,
    gender: 'All',
    education: 'Any',
    disability_eligibility: 'Any',
    family_criteria: '',
    required_documents: '["Aadhaar Card", "Bank Passbook"]',
    benefits: '',
    benefit_amount: 5000,
    application_process: '',
    official_url: '',
    status: 'active'
  });

  const { showToast } = useToast();

  const fetchSchemes = useCallback(() => {
    setLoading(true);
    schemeApi.getSchemes({
      category: categoryFilter === 'All' ? undefined : categoryFilter,
      search: search.trim() ? search.trim() : undefined,
      status_filter: 'all'
    })
      .then((data) => setSchemes(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [categoryFilter, search]);

  useEffect(() => {
    schemeApi.getCategories().then((c) => setCategories(['All', ...c])).catch(() => {});
  }, []);

  useEffect(() => {
    fetchSchemes();
  }, [fetchSchemes]);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setFormData({
      scheme_id: `SCHEME-${Date.now().toString().slice(-4)}`,
      scheme_name: '',
      description: '',
      category: 'Social Security',
      department: 'Ministry of Labour & Employment',
      government_level: 'Central',
      state: 'All India',
      target_occupation: 'All Informal Workers',
      minimum_age: 18,
      maximum_age: 60,
      income_limit: 15000,
      gender: 'All',
      education: 'Any',
      disability_eligibility: 'Any',
      family_criteria: '',
      required_documents: '["Aadhaar Card", "Bank Passbook"]',
      benefits: '',
      benefit_amount: 5000,
      application_process: '',
      official_url: '',
      status: 'active'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (scheme: Scheme) => {
    setIsEditing(true);
    setFormData({ ...scheme });
    setModalOpen(true);
  };

  const handleToggleStatus = async (schemeId: string) => {
    try {
      const updated = await schemeApi.toggleStatus(schemeId);
      setSchemes((prev) => prev.map((s) => (s.scheme_id === schemeId ? updated : s)));
      showToast(`Scheme status toggled to '${updated.status}'. Recommendations re-indexed.`, 'success');
    } catch {
      showToast('Failed to toggle status.', 'error');
    }
  };

  const handleDelete = async (schemeId: string) => {
    if (!window.confirm(`Are you sure you want to delete scheme ${schemeId}?`)) return;
    try {
      await schemeApi.deleteScheme(schemeId);
      setSchemes((prev) => prev.filter((s) => s.scheme_id !== schemeId));
      showToast('Scheme deleted successfully.', 'success');
    } catch {
      showToast('Failed to delete scheme.', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        const updated = await schemeApi.updateScheme(formData.scheme_id!, formData);
        showToast('Scheme updated successfully and re-indexed into RAG system!', 'success');
        setSchemes((prev) => prev.map((s) => (s.scheme_id === updated.scheme_id ? updated : s)));
      } else {
        const created = await schemeApi.createScheme(formData);
        showToast('Scheme created successfully and synced to recommendations!', 'success');
        setSchemes((prev) => [created, ...prev]);
      }
      setModalOpen(false);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Operation failed.';
      showToast(msg, 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-purple-600" />
            Government Scheme Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Add, update, activate/deactivate welfare schemes. Changes automatically sync to AI recommendations and RAG chatbot.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/dataset-upload"
            className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <UploadCloud className="w-4 h-4 text-emerald-600" />
            Upload Dataset
          </Link>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add New Scheme
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search scheme name or code..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white font-medium"
          >
            {categories.map((c) => (
              <option key={c} value={c}>Category: {c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
              <tr>
                <th className="py-3 px-4">Scheme ID & Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Target Trade</th>
                <th className="py-3 px-4">Income Cap</th>
                <th className="py-3 px-4">Age Bracket</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">Loading scheme records...</td>
                </tr>
              ) : schemes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">No schemes found.</td>
                </tr>
              ) : (
                schemes.slice(0, displayLimit).map((scheme) => (
                  <tr key={scheme.scheme_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono text-[10px] text-slate-400 block font-bold">
                        {scheme.scheme_id}
                      </span>
                      <span className="font-bold text-slate-900 line-clamp-1">
                        {scheme.scheme_name}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] uppercase">
                        {scheme.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-[150px] truncate">
                      {scheme.target_occupation || 'All'}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {scheme.income_limit ? `₹${scheme.income_limit.toLocaleString()}` : 'None'}
                    </td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                      {scheme.minimum_age} - {scheme.maximum_age} yrs
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        scheme.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {scheme.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleToggleStatus(scheme.scheme_id)}
                          title={`Toggle status (currently ${scheme.status})`}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-slate-100"
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(scheme)}
                          title="Edit scheme"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(scheme.scheme_id)}
                          title="Delete scheme"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {schemes.length > displayLimit && (
          <div className="p-4 border-t border-slate-100 text-center bg-slate-50">
            <button
              onClick={() => setDisplayLimit((prev) => prev + 50)}
              className="px-5 py-2 bg-white border border-slate-300 hover:border-purple-500 text-slate-800 hover:text-purple-700 font-bold rounded-xl text-xs shadow-xs transition-all inline-flex items-center gap-2"
            >
              <span>Show Next 50 Schemes (Showing {displayLimit} of {schemes.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* Scheme Modal (Add / Edit) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {isEditing ? `Edit Scheme: ${formData.scheme_id}` : 'Create New Welfare Scheme'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Scheme ID *</label>
                  <input
                    type="text"
                    required
                    disabled={isEditing}
                    value={formData.scheme_id || ''}
                    onChange={(e) => setFormData({ ...formData, scheme_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Category *</label>
                  <input
                    type="text"
                    required
                    value={formData.category || ''}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Pension, Health, Insurance"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Scheme Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.scheme_name || ''}
                  onChange={(e) => setFormData({ ...formData, scheme_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Description *</label>
                <textarea
                  rows={2}
                  required
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.department || ''}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Government Level</label>
                  <select
                    value={formData.government_level || 'Central'}
                    onChange={(e) => setFormData({ ...formData, government_level: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Central">Central</option>
                    <option value="State">State</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">State / Jurisdiction</label>
                  <input
                    type="text"
                    value={formData.state || 'All India'}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Target Occupations</label>
                  <input
                    type="text"
                    value={formData.target_occupation || 'All'}
                    onChange={(e) => setFormData({ ...formData, target_occupation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Min / Max Age</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={formData.minimum_age || 18}
                      onChange={(e) => setFormData({ ...formData, minimum_age: Number(e.target.value) })}
                      className="w-1/2 px-2 py-2 rounded-xl border border-slate-300"
                    />
                    <input
                      type="number"
                      value={formData.maximum_age || 60}
                      onChange={(e) => setFormData({ ...formData, maximum_age: Number(e.target.value) })}
                      className="w-1/2 px-2 py-2 rounded-xl border border-slate-300"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Income Limit (₹)</label>
                  <input
                    type="number"
                    value={formData.income_limit || ''}
                    onChange={(e) => setFormData({ ...formData, income_limit: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="Leave blank for none"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Benefits Description *</label>
                <textarea
                  rows={2}
                  required
                  value={formData.benefits || ''}
                  onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                  placeholder="e.g. ₹3,000 monthly pension after age 60"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Benefit Amount (₹)</label>
                  <input
                    type="number"
                    value={formData.benefit_amount || ''}
                    onChange={(e) => setFormData({ ...formData, benefit_amount: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="e.g. 5000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Official Portal URL</label>
                  <input
                    type="url"
                    value={formData.official_url || ''}
                    onChange={(e) => setFormData({ ...formData, official_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md"
                >
                  {isEditing ? 'Update & Sync Scheme' : 'Create Scheme'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
