import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applicationApi } from '../services/api';
import { Application } from '../types';
import { EligibilityBadge } from '../components/EligibilityBadge';
import { formatStatus } from '../utils/format';
import {
  FileText,
  ArrowRight,
  Layers
} from 'lucide-react';

export const WorkerApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applicationApi.getMyApplications()
      .then((data) => setApplications(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-600" />
            My Welfare Benefit Applications
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Track your submissions from initial review to final benefit disbursement.
          </p>
        </div>
        <Link
          to="/schemes"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-center"
        >
          <Layers className="w-4 h-4" />
          Apply for More Schemes
        </Link>
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-base text-slate-800">No applications submitted yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Explore our recommended welfare benefits tailored for your occupation and apply online with 1-click.
          </p>
          <Link
            to="/recommendations"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
          >
            View Recommendations <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                    {app.application_no}
                  </span>
                  <EligibilityBadge status={formatStatus(app.current_status)} size="sm" />
                  <span className="text-[11px] text-slate-500">
                    Applied on {new Date(app.application_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 leading-snug">
                  {app.scheme?.scheme_name || app.scheme_id}
                </h3>

                {app.admin_remarks && (
                  <p className="text-xs text-slate-600 italic">
                    Remark: "{app.admin_remarks}"
                  </p>
                )}

                {app.benefit_amount && (
                  <p className="text-xs font-semibold text-emerald-800">
                    Benefit Amount: ₹{Number(app.benefit_amount).toLocaleString()}
                  </p>
                )}
              </div>

              {/* Action Button */}
              <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <Link
                  to={`/track/${app.application_no}`}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span>Track Full Timeline</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
