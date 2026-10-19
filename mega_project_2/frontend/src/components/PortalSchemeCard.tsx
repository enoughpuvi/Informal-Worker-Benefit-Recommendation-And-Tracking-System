import React from 'react';
import { PortalScheme } from '../types';
import {
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Building2,
  MapPin,
  Briefcase,
  FileText,
  Gift,
  Calendar,
  ArrowUpRight
} from 'lucide-react';

interface PortalSchemeCardProps {
  scheme: PortalScheme;
}

export const PortalSchemeCard: React.FC<PortalSchemeCardProps> = ({ scheme }) => {
  const isVerified = scheme.verification_status === 'Verified';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden">
      {/* Top Details Section */}
      <div className="p-5 sm:p-6 pb-4">
        {/* Badges Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {scheme.category}
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <MapPin className="w-3 h-3 mr-1 text-slate-500" />
              {scheme.state_applicability}
            </span>
          </div>

          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
              isVerified
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            {isVerified ? (
              <>
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Verified
              </>
            ) : (
              <>
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                Needs Verification
              </>
            )}
          </span>
        </div>

        {/* Scheme Name */}
        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
          {scheme.name}
        </h3>

        {/* Portal & Department */}
        <div className="mt-2 text-xs text-slate-500 space-y-1">
          <p className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-400 font-normal">Department:</span>
            <span className="text-slate-700 font-medium">{scheme.responsible_department}</span>
          </p>
          <p className="text-[11px] text-emerald-700 font-medium">
            Sourced via: <strong>{scheme.portal_name}</strong>
          </p>
        </div>

        {/* Target Occupation */}
        {scheme.target_occupation && (
          <div className="mt-3 flex items-start gap-1.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <Briefcase className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-700 text-[11px] block">Target Beneficiaries:</span>
              <span className="text-slate-600">{scheme.target_occupation}</span>
            </div>
          </div>
        )}

        {/* Benefits & Entitlements */}
        <div className="mt-3">
          <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Gift className="w-3 h-3 text-emerald-600" />
            Benefit Entitlements
          </p>
          <p className="text-xs text-slate-700 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100/80 leading-relaxed font-medium">
            {scheme.benefits}
          </p>
        </div>

        {/* Eligibility Criteria */}
        <div className="mt-3">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <FileText className="w-3 h-3 text-slate-400" />
            Eligibility Criteria
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            {scheme.eligibility}
          </p>
        </div>

        {/* Required Documents */}
        {scheme.required_documents && scheme.required_documents.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Required Documents
            </p>
            <div className="flex flex-wrap gap-1.5">
              {scheme.required_documents.map((doc, idx) => (
                <span
                  key={idx}
                  className="inline-block px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-700 rounded-md border border-slate-200"
                >
                  {doc}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="bg-slate-50 p-4 sm:p-5 border-t border-slate-200/80 rounded-b-2xl">
        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-3">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            Verified: <strong className="text-slate-700">{scheme.last_verified_date}</strong>
          </span>
          <span className="text-[10px] text-slate-500 font-medium">Safe external links</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {/* Official Information URL */}
          <a
            href={scheme.official_information_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-300 rounded-xl transition-colors"
            title="Read complete official scheme guideline and entitlement criteria"
          >
            <span>Official Info</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </a>

          {/* Direct Application Portal URL */}
          {scheme.application_url && (
            <a
              href={scheme.application_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-sm transition-colors"
              title="Apply online at the official government portal"
            >
              <span>Apply on Portal</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
