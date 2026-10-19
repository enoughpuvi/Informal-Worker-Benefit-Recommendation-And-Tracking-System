import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { schemeApi, eligibilityApi, applicationApi, documentApi } from '../services/api';
import { Scheme, EligibilityResult } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { EligibilityBadge } from '../components/EligibilityBadge';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  FileText,
  ArrowRight,
  X,
  ShieldCheck
} from 'lucide-react';

export const SchemeDetailPage: React.FC = () => {
  const { schemeId } = useParams<{ schemeId: string }>();
  const [scheme, setScheme] = useState<Scheme | null>(null);
  const [loading, setLoading] = useState(true);

  // Eligibility Check state
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  // Apply Modal state
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applyRemarks, setApplyRemarks] = useState('');
  const [uploadDocFile, setUploadDocFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('Identity Proof (Aadhaar Card)');
  const [submittingApp, setSubmittingApp] = useState(false);

  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const getCleanBenefits = (benefits?: string) => {
    if (!benefits || benefits.trim().toLowerCase() === 'nan' || benefits.trim().toLowerCase() === 'none') {
      return t(
        'scheme_guideline_benefits',
        'Financial assistance and social welfare entitlement as per official government policy.'
      );
    }
    return benefits;
  };

  useEffect(() => {
    if (schemeId) {
      schemeApi.getScheme(schemeId)
        .then((data) => setScheme(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));

      if (isAuthenticated) {
        eligibilityApi.checkEligibility(schemeId)
          .then((res) => setEligibility(res))
          .catch(() => {})
          .finally(() => setCheckingEligibility(false));
      }
    }
  }, [schemeId, isAuthenticated]);

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheme) return;

    setSubmittingApp(true);
    try {
      const newApp = await applicationApi.apply(scheme.scheme_id, applyRemarks);
      
      // If user uploaded a document during application modal
      if (uploadDocFile) {
        try {
          await documentApi.uploadDocument(newApp.id, docType, uploadDocFile);
        } catch (docErr) {
          console.error('Doc upload note:', docErr);
        }
      }

      showToast(`Application ${newApp.application_no} submitted successfully!`, 'success');
      setApplyModalOpen(false);
      navigate(`/track/${newApp.application_no}`);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Application submission failed.';
      showToast(msg, 'error');
    } finally {
      setSubmittingApp(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!scheme) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <h2 className="text-base font-bold text-slate-900">Welfare scheme not found</h2>
        <Link to="/schemes" className="text-xs font-bold text-emerald-600 mt-2 inline-block">
          Return to all schemes
        </Link>
      </div>
    );
  }

  let requiredDocs: string[] = [];
  try {
    requiredDocs = JSON.parse(scheme.required_documents || '[]');
  } catch {
    requiredDocs = [scheme.required_documents || 'Identity Proof'];
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-extrabold rounded-full uppercase tracking-wider">
              {scheme.category}
            </span>
            <span className="text-xs font-bold text-slate-500">
              {scheme.government_level} Government Scheme
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">
            ID: {scheme.scheme_id}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
          {scheme.scheme_name}
        </h1>

        <p className="text-sm text-slate-700 leading-relaxed">
          {scheme.description}
        </p>

        {/* Benefits Highlight Box */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
          <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            {t('statutory_entitlement', 'Statutory Welfare Benefit Entitlement:')}
          </span>
          <p className="text-sm font-semibold text-slate-900">
            {getCleanBenefits(scheme.benefits)}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
          {scheme.official_url && (
            <a
              href={scheme.official_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              {t('official_gov_portal', 'Official Government Portal')} <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={() => setApplyModalOpen(true)}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                {t('apply_now', 'Apply for Benefit')} <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <Link
                to="/login"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all"
              >
                {t('login', 'Log In to Apply')}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Eligibility Checker Result Card */}
      {isAuthenticated && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              {t('automated_eligibility_check', 'Automated Eligibility Check for Your Profile')}
            </h2>
            {eligibility && <EligibilityBadge status={eligibility.status} size="md" />}
          </div>

          {checkingEligibility ? (
            <div className="py-4 text-center text-xs text-slate-500">{t('processing', 'Checking eligibility against rules...')}</div>
          ) : eligibility ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 font-medium">
                {eligibility.remarks}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Satisfied */}
                <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {t('satisfied_criteria', 'Satisfied Criteria')} ({eligibility.satisfied_criteria.length}):
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-800">
                    {eligibility.satisfied_criteria.map((c, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Missing or Failed */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    {t('missing_requirements', 'Requirements to Verify / Missing Details:')}
                  </span>
                  {eligibility.missing_criteria.length === 0 && eligibility.failed_criteria.length === 0 ? (
                    <p className="text-xs text-emerald-700 font-medium">{language === 'hi' ? 'कोई नहीं! आप सभी पात्रता नियमों को पूरा करते हैं।' : 'None! You meet all listed rules.'}</p>
                  ) : (
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {eligibility.failed_criteria.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-rose-700 font-semibold">
                          <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                      {eligibility.missing_criteria.map((m, i) => (
                        <li key={i} className="flex items-start gap-2 text-amber-800 font-medium">
                          <span className="text-amber-600 font-bold">⚠</span>
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Rules & Requirements Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Eligibility Criteria */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
            Scheme Eligibility Specifications
          </h3>
          <div className="space-y-2.5 text-slate-700">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="font-semibold text-slate-500">Target Trades:</span>
              <span className="font-bold text-slate-900 text-right">{scheme.target_occupation || 'All Informal Workers'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="font-semibold text-slate-500">Age Bracket:</span>
              <span className="font-bold text-slate-900">{scheme.minimum_age} to {scheme.maximum_age} years</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="font-semibold text-slate-500">Monthly Income Limit:</span>
              <span className="font-bold text-slate-900">
                {scheme.income_limit ? `Up to ₹${scheme.income_limit.toLocaleString()}` : 'No limit specified'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="font-semibold text-slate-500">Gender Eligibility:</span>
              <span className="font-bold text-slate-900">{scheme.gender || 'All'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="font-semibold text-slate-500">Jurisdiction:</span>
              <span className="font-bold text-slate-900">{scheme.state || 'All India'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="font-semibold text-slate-500">Disability Criteria:</span>
              <span className="font-bold text-slate-900">{scheme.disability_eligibility || 'Any'}</span>
            </div>
          </div>
        </div>

        {/* Required Documents */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
            Required Documents for Verification
          </h3>
          <ul className="space-y-2 text-xs text-slate-700">
            {requiredDocs.map((doc, idx) => (
              <li key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold text-slate-900">{doc}</span>
              </li>
            ))}
          </ul>

          {scheme.application_process && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Application Procedure:
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">
                {scheme.application_process}
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Apply Modal */}
      {applyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Confirm Application Submission</h3>
                <p className="text-xs text-slate-500">{scheme.scheme_name}</p>
              </div>
              <button
                onClick={() => setApplyModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Worker Notes / Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  value={applyRemarks}
                  onChange={(e) => setApplyRemarks(e.target.value)}
                  placeholder="e.g. Applying as construction worker with 8 years experience."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Document upload during apply */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">
                  Upload Supporting Document (Optional Now, Can Upload Later)
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Identity Proof (Aadhaar Card)">Aadhaar Card</option>
                    <option value="Income Certificate">Income Certificate</option>
                    <option value="Ration Card">Ration Card</option>
                    <option value="Bank Passbook">Bank Passbook</option>
                    <option value="Trade / Occupation Certificate">Trade Certificate</option>
                  </select>

                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setUploadDocFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
                By clicking Submit, your application will be assigned an official Application ID and entered into the 7-stage verification workflow.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setApplyModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingApp}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {submittingApp ? 'Generating Application ID...' : 'Submit Application Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
