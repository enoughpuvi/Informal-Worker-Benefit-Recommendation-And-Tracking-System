import React from 'react';
import { adminApi } from '../services/api';
import { DownloadCloud, FileText, Users, Layers } from 'lucide-react';

export const AdminReportsPage: React.FC = () => {
  const reports = [
    {
      title: 'Workers Directory & Demographic Report',
      desc: 'Complete export of all registered informal workers, contact details, trades, monthly income, states, and profile completion rates.',
      type: 'workers' as const,
      icon: Users,
      color: 'text-purple-600 bg-purple-50 border-purple-200'
    },
    {
      title: 'Applications Full Lifecycle Report',
      desc: 'Complete log of submitted welfare applications, current status, applied date, benefit amounts, and official remarks.',
      type: 'applications' as const,
      icon: FileText,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200'
    },
    {
      title: 'Government Schemes Catalog Report',
      desc: 'Detailed inventory of all active and inactive welfare schemes, target trades, income caps, benefits, and statutory guidelines.',
      type: 'schemes' as const,
      icon: Layers,
      color: 'text-blue-600 bg-blue-50 border-blue-200'
    }
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
          <DownloadCloud className="w-6 h-6 text-purple-600" />
          Administrative Export Reports
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Export production database records in standard CSV format for offline reporting, data auditing, and policy research.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {reports.map((r, i) => {
          const Icon = r.icon;
          return (
            <div
              key={i}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${r.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">{r.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">{r.desc}</p>
                </div>
              </div>

              <a
                href={adminApi.getExportReportUrl(r.type)}
                download={`${r.type}_report.csv`}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 shrink-0 self-start sm:self-center"
              >
                <DownloadCloud className="w-4 h-4" />
                Export to CSV
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
};
