import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { applicationApi, documentApi } from '../services/api';
import { Application, DocumentItem } from '../types';
import { Timeline } from '../components/Timeline';
import { EligibilityBadge } from '../components/EligibilityBadge';
import { DocumentPreviewModal } from '../components/DocumentPreviewModal';
import { useToast } from '../context/ToastContext';
import { formatStatus } from '../utils/format';
import {
  Search,
  FileText,
  Clock,
  AlertCircle,
  Upload,
  History,
  FileCheck2,
  Eye,
  Download
} from 'lucide-react';

export const TrackApplicationPage: React.FC = () => {
  const { appNo } = useParams<{ appNo: string }>();
  const [searchParams] = useSearchParams();
  const queryAppNo = searchParams.get('app_no') || appNo || '';

  const [inputNo, setInputNo] = useState(queryAppNo);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);

  // Document upload state
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('Income Certificate');
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const { showToast } = useToast();

  const fetchApplication = useCallback(async (searchNo: string) => {
    if (!searchNo.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await applicationApi.trackByNumber(searchNo.trim());
      setApplication(data);
    } catch (err: any) {
      const msg = err.response?.data?.detail || `Application with reference '${searchNo}' was not found.`;
      setError(msg);
      setApplication(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (queryAppNo) {
      fetchApplication(queryAppNo);
    }
  }, [queryAppNo, fetchApplication]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchApplication(inputNo);
  };

  const handleDocUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!application || !docFile) return;

    setUploadingDoc(true);
    try {
      await documentApi.uploadDocument(application.id, docType, docFile);
      showToast('Document uploaded successfully!', 'success');
      setDocFile(null);
      // Refresh application details
      fetchApplication(application.application_no);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to upload document.';
      showToast(msg, 'error');
    } finally {
      setUploadingDoc(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Search Header */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Search className="w-6 h-6 text-emerald-600" />
            Track Welfare Benefit Application
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Enter your 14-character Application Reference ID to view live progress, document status, and review remarks.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-2 pt-2">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              required
              value={inputNo}
              onChange={(e) => setInputNo(e.target.value)}
              placeholder="e.g. APP-2026-000101"
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Track Progress'}
          </button>
        </form>

        {/* Quick Demo App IDs */}
        <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
          <span className="font-semibold">Sample Reference IDs:</span>
          {['APP-2026-0001', 'APP-2026-0002', 'APP-2026-0003'].map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => {
                setInputNo(sample);
                fetchApplication(sample);
              }}
              className="font-mono text-emerald-700 underline hover:text-emerald-900"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Application Not Found</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Application Tracking View */}
      {application && (
        <div className="space-y-6">
          
          {/* Main Info Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Application Reference ID
                </span>
                <span className="font-mono text-xl font-black text-slate-900">
                  {application.application_no}
                </span>
              </div>
              <EligibilityBadge status={formatStatus(application.current_status)} size="lg" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Scheme</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block truncate">
                  {application.scheme?.scheme_name || application.scheme_id}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Applied Date</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {new Date(application.application_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Benefit Entitlement</span>
                <span className="font-bold text-emerald-700 text-sm mt-0.5 block">
                  {application.benefit_amount ? `₹${Number(application.benefit_amount).toLocaleString()}` : 'Statutory'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Last Updated</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {new Date(application.last_updated || application.application_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>

            {application.admin_remarks && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800">
                <span className="font-bold text-slate-900">Current Administrative Remark: </span>
                {application.admin_remarks}
              </div>
            )}
          </div>

          {/* Visual Step Timeline */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              Lifecycle Progress Timeline
            </h3>

            <Timeline
              steps={application.timeline_steps}
              currentStatus={application.current_status}
            />
          </div>

          {/* Uploaded Documents List & Additional Upload */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                Submitted Supporting Documents
              </h3>
              <span className="text-xs text-slate-500">
                {application.documents?.length || 0} Files Uploaded
              </span>
            </div>

            {(!application.documents || application.documents.length === 0) ? (
              <p className="text-xs text-slate-500 py-2">No documents uploaded yet.</p>
            ) : (
              <div className="space-y-2">
                {application.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="font-bold text-slate-900">{doc.document_type}</p>
                        <p className="text-[11px] text-slate-500">{doc.file_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <EligibilityBadge status={doc.status} size="sm" />
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-lg transition-colors inline-flex items-center gap-1 border border-emerald-200"
                        title="View document"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                      <a
                        href={documentApi.getDocumentDownloadUrl(doc.id)}
                        download={doc.file_name}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg transition-colors inline-flex items-center gap-1 border border-slate-300"
                        title="Download document"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Additional Document */}
            <form onSubmit={handleDocUpload} className="pt-4 border-t border-slate-100 space-y-3">
              <span className="text-xs font-bold text-slate-800 block">
                Attach Additional Document / Certificate
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                >
                  <option value="Income Certificate">Income Certificate</option>
                  <option value="Identity Proof (Aadhaar Card)">Aadhaar Card</option>
                  <option value="Ration Card">Ration Card</option>
                  <option value="Bank Passbook">Bank Passbook</option>
                  <option value="Trade / Work Certificate">Trade / Work Certificate</option>
                </select>

                <input
                  type="file"
                  required
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setDocFile(e.target.files ? e.target.files[0] : null)}
                  className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700"
                />

                <button
                  type="submit"
                  disabled={uploadingDoc || !docFile}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {uploadingDoc ? 'Uploading...' : 'Upload Document'}
                </button>
              </div>
            </form>
          </div>

          {/* Complete Status History Table (Audit Trail) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <History className="w-4 h-4 text-emerald-600" />
              Complete Status Audit Trail History
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase font-bold text-[10px]">
                    <th className="py-2.5">Date & Time</th>
                    <th className="py-2.5">Stage Transition</th>
                    <th className="py-2.5">Updated By</th>
                    <th className="py-2.5">Official Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {application.status_history?.map((h) => (
                    <tr key={h.id}>
                      <td className="py-2.5 font-medium text-slate-600 whitespace-nowrap">
                        {new Date(h.timestamp).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5">
                        <span className="font-bold text-slate-900">
                          {formatStatus(h.new_status)}
                        </span>
                        {h.previous_status && (
                          <span className="text-slate-400 block text-[10px]">
                            from {formatStatus(h.previous_status)}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-slate-700 font-medium">
                        {h.changed_by_name || 'System / Officer'}
                      </td>
                      <td className="py-2.5 text-slate-600 max-w-xs">
                        {h.remarks || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        document={previewDoc}
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        isAdmin={false}
      />

    </div>
  );
};
