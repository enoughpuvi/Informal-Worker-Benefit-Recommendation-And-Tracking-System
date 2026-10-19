import React from 'react';
import { TrustedPortal } from '../types';
import {
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Building2,
  MapPin,
  FileCheck,
  Languages,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

interface PortalCardProps {
  portal: TrustedPortal;
  onOpenReviewModal?: (portal: TrustedPortal) => void;
  isAdmin?: boolean;
}

export const PortalCard: React.FC<PortalCardProps> = ({
  portal,
  onOpenReviewModal,
  isAdmin = false
}) => {
  const isVerified = portal.verification_status === 'Verified';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group">
      {/* Top Header Section */}
      <div className="p-5 sm:p-6 pb-4">
        {/* Badges Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold tracking-wide ${
                portal.government_level === 'Central'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-purple-50 text-purple-700 border border-purple-200'
              }`}
            >
              <Building2 className="w-3 h-3 mr-1" />
              {portal.government_level} Government
            </span>

            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <MapPin className="w-3 h-3 mr-1 text-slate-500" />
              {portal.state}
            </span>
          </div>

          {/* Verification Status Badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
              isVerified
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            {isVerified ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Verified Portal
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Needs Verification
              </>
            )}
          </span>
        </div>

        {/* Portal Title & Hindi Title */}
        <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
          {portal.name}
        </h3>
        {portal.hindi_name && (
          <p className="text-xs font-medium text-emerald-800 mt-0.5">
            {portal.hindi_name}
          </p>
        )}

        {/* Responsible Department */}
        <p className="text-xs font-semibold text-slate-500 mt-2 flex items-start gap-1.5">
          <span className="text-slate-400 font-normal">Department:</span>
          <span className="text-slate-700 font-medium">{portal.responsible_department}</span>
        </p>

        {/* Description */}
        <p className="text-xs text-slate-600 mt-3 leading-relaxed line-clamp-3">
          {portal.description}
        </p>

        {/* Scheme Categories */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Layers className="w-3 h-3 text-slate-400" />
            Scheme Categories Covered
          </p>
          <div className="flex flex-wrap gap-1.5">
            {portal.categories.slice(0, 4).map((cat, idx) => (
              <span
                key={idx}
                className="inline-block px-2 py-0.5 text-[11px] font-medium bg-slate-50 text-slate-700 rounded-md border border-slate-200"
              >
                {cat}
              </span>
            ))}
            {portal.categories.length > 4 && (
              <span className="inline-block px-1.5 py-0.5 text-[11px] font-semibold text-slate-500 bg-slate-100 rounded-md">
                +{portal.categories.length - 4} more
              </span>
            )}
          </div>
        </div>

        {/* Information Available */}
        {portal.information_available && portal.information_available.length > 0 && (
          <div className="mt-3">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <FileCheck className="w-3 h-3 text-slate-400" />
              Information Available
            </p>
            <ul className="text-xs text-slate-600 space-y-1">
              {portal.information_available.slice(0, 3).map((info, idx) => (
                <li key={idx} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate">{info}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Supported Languages */}
        {portal.supported_languages && portal.supported_languages.length > 0 && (
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <Languages className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-600 text-[11px]">Languages:</span>
            <span className="truncate text-slate-600 text-[11px]">
              {portal.supported_languages.slice(0, 5).join(', ')}
              {portal.supported_languages.length > 5 && ` (+${portal.supported_languages.length - 5})`}
            </span>
          </div>
        )}
      </div>

      {/* Footer & Actions */}
      <div className="bg-slate-50 p-4 sm:p-5 border-t border-slate-200/80 rounded-b-2xl">
        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-3">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            Last verified: <strong className="text-slate-700">{portal.last_verified_date}</strong>
          </span>
          <span className="font-medium text-slate-600">
            {portal.schemes_count ? `~${portal.schemes_count} schemes` : 'Unified Portal'}
          </span>
        </div>

        {/* Primary and Secondary Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Official Website Button */}
          <a
            href={portal.official_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-sm transition-colors"
            title={`Open official portal: ${portal.name}`}
          >
            <span>Official Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Direct Application Link if available */}
          {portal.application_url && (
            <a
              href={portal.application_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-100/70 hover:bg-emerald-200/80 rounded-xl transition-colors"
              title="Direct Citizen Application / Registration Link"
            >
              <span>Apply Online</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          )}

          {/* Admin Audit Review Button */}
          {isAdmin && onOpenReviewModal && (
            <button
              onClick={() => onOpenReviewModal(portal)}
              className="inline-flex items-center justify-center px-2.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors"
              title="Review portal link and verify status"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
