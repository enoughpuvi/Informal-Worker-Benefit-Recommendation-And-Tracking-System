import React, { useState, useEffect } from 'react';
import { workerApi } from '../services/api';
import { WorkerProfile } from '../types';
import { useToast } from '../context/ToastContext';
import {
  User,
  Briefcase,
  Users,
  FileCheck2,
  Save,
  AlertCircle,
  Sparkles,
  CreditCard
} from 'lucide-react';
import {
  indianStates,
  stateDistrictsMap,
  informalOccupations,
  identityAndCardsList
} from '../data/locationAndOccupations';

export const WorkerProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<WorkerProfile>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'employment' | 'family' | 'identity'>('personal');
  const { showToast } = useToast();

  useEffect(() => {
    workerApi.getProfile()
      .then((data) => setProfile(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setProfile((prev) => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setProfile((prev) => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
    } else {
      setProfile((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await workerApi.updateProfile(profile);
      setProfile(updated);
      showToast('Profile updated successfully! Recommendation scores refreshed.', 'success');
    } catch {
      showToast('Failed to save profile changes.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const completion = profile.profile_completion || 0;
  const missing = profile.missing_fields || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Profile Header & Completion Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Worker Profile Management</h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Accurate profile details enable our AI recommendation engine to match maximum welfare benefits.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl">
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Completion</span>
              <span className="text-xl font-black text-emerald-700">{completion}%</span>
            </div>
            <Sparkles className="w-6 h-6 text-emerald-600" />
          </div>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${completion}%` }}
          />
        </div>

        {missing.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Complete missing fields for higher match accuracy: </span>
              <span>{missing.join(', ')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('personal')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'personal'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <User className="w-4 h-4" /> Personal & Location
        </button>
        <button
          onClick={() => setActiveTab('employment')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'employment'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Briefcase className="w-4 h-4" /> Employment & Income
        </button>
        <button
          onClick={() => setActiveTab('family')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'family'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" /> Family & Dependents
        </button>
        <button
          onClick={() => setActiveTab('identity')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'identity'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileCheck2 className="w-4 h-4" /> Identity & Cards
        </button>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        
        {/* Personal Tab */}
        {activeTab === 'personal' && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">Personal & Residence</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Age</label>
                <input
                  type="number"
                  name="age"
                  value={profile.age || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Date of Birth</label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={profile.date_of_birth || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Gender</label>
                <select
                  name="gender"
                  value={profile.gender || 'Male'}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Transgender">Transgender</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">State / UT *</label>
                <select
                  name="state"
                  value={profile.state || ''}
                  onChange={(e) => {
                    const newState = e.target.value;
                    setProfile((prev) => ({
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
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">District / City *</label>
                <select
                  name="district"
                  value={profile.district || profile.city || ''}
                  onChange={(e) => {
                    const newDist = e.target.value;
                    setProfile((prev) => ({
                      ...prev,
                      district: newDist,
                      city: newDist
                    }));
                  }}
                  disabled={!profile.state}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {profile.state ? '-- Choose District --' : 'Select State first'}
                  </option>
                  {(stateDistrictsMap[profile.state || ''] || []).map((dist) => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={profile.pincode || ''}
                  onChange={handleChange}
                  placeholder="110053"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Address</label>
              <textarea
                name="address"
                rows={2}
                value={profile.address || ''}
                onChange={handleChange}
                placeholder="House No, Ward, Street, Landmark..."
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        )}

        {/* Employment Tab */}
        {activeTab === 'employment' && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">Trade, Income & Employment</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Occupation / Trade *</label>
                <select
                  name="occupation"
                  value={profile.occupation || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="">-- Choose Worker Occupation / Trade --</option>
                  {informalOccupations.map((occ) => {
                    const tradeKey = occ.split('(')[0].trim();
                    return (
                      <option key={tradeKey} value={tradeKey}>
                        {occ}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Employment Type</label>
                <select
                  name="employment_type"
                  value={profile.employment_type || 'Daily Wage'}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Daily Wage">Daily Wage</option>
                  <option value="Piece-rate">Piece-rate</option>
                  <option value="Contract">Contract</option>
                  <option value="Self-Employed">Self-Employed / Vendor</option>
                  <option value="Part-Time">Part-Time</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Monthly Income (₹)</label>
                <input
                  type="number"
                  name="monthly_income"
                  value={profile.monthly_income || ''}
                  onChange={handleChange}
                  placeholder="e.g. 12000"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Experience (Years)</label>
                <input
                  type="number"
                  name="experience_years"
                  value={profile.experience_years || 0}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Avg Working Days/Month</label>
                <input
                  type="number"
                  name="working_days_month"
                  value={profile.working_days_month || 25}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Education Level</label>
              <select
                name="education_level"
                value={profile.education_level || 'Primary School'}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="No Formal Education">No Formal Education</option>
                <option value="Primary School">Primary School (Class 1-5)</option>
                <option value="Middle School">Middle School (Class 6-8)</option>
                <option value="High School">High School (Class 9-10)</option>
                <option value="Higher Secondary">Higher Secondary (Class 11-12)</option>
                <option value="Graduate">Graduate / Technical ITI</option>
              </select>
            </div>
          </div>
        )}

        {/* Family Tab */}
        {activeTab === 'family' && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">Family & Vulnerability</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Marital Status</label>
                <select
                  name="marital_status"
                  value={profile.marital_status || 'Married'}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Married">Married</option>
                  <option value="Unmarried">Unmarried</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Separated">Separated</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Total Family Members</label>
                <input
                  type="number"
                  name="family_members"
                  value={profile.family_members || 1}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Dependents Count</label>
                <input
                  type="number"
                  name="dependents_count"
                  value={profile.dependents_count || 0}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Children Count</label>
                <input
                  type="number"
                  name="children_count"
                  value={profile.children_count || 0}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Elderly (60+ yrs)</label>
                <input
                  type="number"
                  name="elderly_count"
                  value={profile.elderly_count || 0}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
              <input
                type="checkbox"
                id="disability_status"
                name="disability_status"
                checked={!!profile.disability_status}
                onChange={handleChange}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <label htmlFor="disability_status" className="text-sm font-semibold text-slate-800">
                Person with Disability (PwD) / Divyangjan quota
              </label>
            </div>
          </div>
        )}

        {/* Identity Tab */}
        {activeTab === 'identity' && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">Identity & Benefits</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Primary Identity Document</label>
                <select
                  name="identity_proof_type"
                  value={profile.identity_proof_type || 'Aadhaar Card'}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Aadhaar Card">Aadhaar Card</option>
                  <option value="Voter ID">Voter ID</option>
                  <option value="Ration Card">Ration Card</option>
                  <option value="e-Shram Card">e-Shram Card</option>
                  <option value="Driving Licence">Driving Licence</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Bank Account Status</label>
                <select
                  name="bank_account"
                  value={profile.bank_account ? 'true' : 'false'}
                  onChange={(e) => setProfile((p) => ({ ...p, bank_account: e.target.value === 'true' }))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="true">Active Bank / Jan Dhan Account</option>
                  <option value="false">No Bank Account</option>
                </select>
              </div>
            </div>

            {/* Cards & Identity Checkboxes */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Existing Welfare Cards & Identity Documents (Check all you possess)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {identityAndCardsList.map((card) => {
                  let currentCards: string[] = [];
                  try {
                    const raw = profile.existing_benefits || '[]';
                    const parsed = JSON.parse(raw);
                    currentCards = Array.isArray(parsed) ? parsed : [];
                  } catch {
                    currentCards = (profile.existing_benefits || '').split(',').map((s) => s.trim()).filter(Boolean);
                  }
                  const isChecked = currentCards.includes(card.id) || currentCards.includes(card.name);

                  return (
                    <label
                      key={card.id}
                      className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                        isChecked
                          ? 'border-emerald-500 bg-emerald-50/70 shadow-2xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          let nextCards: string[];
                          if (e.target.checked) {
                            nextCards = Array.from(new Set([...currentCards, card.id]));
                          } else {
                            nextCards = currentCards.filter((c) => c !== card.id && c !== card.name);
                          }
                          setProfile((p) => ({
                            ...p,
                            existing_benefits: JSON.stringify(nextCards)
                          }));
                        }}
                        className="w-4 h-4 mt-0.5 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-slate-900 truncate">{card.name}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium shrink-0">
                            {card.category}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 block mt-0.5 leading-tight">
                          {card.description}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Cards selected here are automatically verified against scheme eligibility criteria to increase your welfare match score.
              </p>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </div>

      </form>
    </div>
  );
};
