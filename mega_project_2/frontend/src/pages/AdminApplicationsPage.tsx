import React, { useState, useEffect, useCallback } from 'react';
import { applicationApi, documentApi } from '../services/api';
import { Application, DocumentItem } from '../types';
import { EligibilityBadge } from '../components/EligibilityBadge';
import { Timeline } from '../components/Timeline';
import { DocumentPreviewModal } from '../components/DocumentPreviewModal';
import { useToast } from '../context/ToastContext';
import { formatStatus } from '../utils/format';
import {
  FileText,
  Search,
  Eye,
  Download,
  X,
  Send,
  FileCheck2,
  ShieldAlert
} from 'lucide-react';

export const AdminApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [displayLimit, setDisplayLimit] = useState(50);

  // Selected application for detail drawer/modal
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [benefitAmount, setBenefitAmount] = useState<number | ''>('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const { showToast } = useToast();

  const fetchApplications = useCallback(() => {
    setLoading(true);
    applicationApi.getAllApplications({
      status_filter: statusFilter === 'All' ? undefined : statusFilter,
      search: search.trim() ? search.trim() : undefined
    })
      .then((data) => setApplications(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [statusFilter, search]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleOpenDetail = async (app: Application) => {
    setSelectedApp(app);
    setNewStatus('');
    setRemarks('');
    setBenefitAmount(app.benefit_amount || '');
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp || !newStatus) return;

    setUpdatingStatus(true);
    try {
      const updated = await applicationApi.updateStatus(
        selectedApp.id,
        newStatus,
        remarks,
        benefitAmount ? Number(benefitAmount) : undefined
      );
      setSelectedApp(updated);
      setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      showToast(`Status updated to ${formatStatus(newStatus)}! Worker notified.`, 'success');
      setNewStatus('');
      setRemarks('');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to update status.';
      showToast(msg, 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleVerifyDocument = async (docId: number, status: 'Verified' | 'Rejected', customRemarks?: string) => {
    let reason = customRemarks;
    if (reason === undefined) {
      const input = window.prompt(`Enter verification remark for ${status}:`, status === 'Verified' ? 'Document verified against UIDAI/State records.' : 'Incomplete/blurred copy.');
      if (input === null) return;
      reason = input;
    }

    try {
      await documentApi.verifyDocument(docId, status, reason);
      showToast(`Document marked as ${status}.`, 'success');
      // Refresh current app
      if (selectedApp) {
        const freshApp = await applicationApi.getApplication(selectedApp.id);
        setSelectedApp(freshApp);
        setApplications((prev) => prev.map((a) => (a.id === freshApp.id ? freshApp : a)));
      }
    } catch {
      showToast('Failed to verify document.', 'error');
    }
  };

  const statusesList = [
    'All', 'APPLIED', 'DOCUMENTS_PENDING', 'DOCUMENTS_VERIFIED',
    'UNDER_REVIEW', 'APPROVED', 'BENEFIT_DISBURSED', 'REJECTED'
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-purple-600" />
            Welfare Benefit Applications Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Process worker submissions, verify identity documents, transition statuses, and disburse grants.
          </p>
        </div>
        <div className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl self-start sm:self-center">
          {applications.length} Applications Listed
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
            placeholder="Search by Application ID, Worker Name or Scheme..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white font-medium"
          >
            {statusesList.map((st) => (
              <option key={st} value={st}>Filter Status: {formatStatus(st)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
              <tr>
                <th className="py-3 px-4">Application ID</th>
                <th className="py-3 px-4">Worker Details</th>
                <th className="py-3 px-4">Scheme Applied</th>
                <th className="py-3 px-4">Applied Date</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4">Documents</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">Loading applications...</td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">No applications found.</td>
                </tr>
              ) : (
                applications.slice(0, displayLimit).map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {app.application_no}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{app.worker?.full_name || 'Worker'}</span>
                      <span className="text-[11px] text-slate-500">{app.worker?.phone || app.worker?.email}</span>
                    </td>
                    <td className="py-3 px-4 max-w-[200px]">
                      <span className="font-bold text-slate-900 block truncate">{app.scheme?.scheme_name || app.scheme_id}</span>
                      <span className="text-[10px] text-slate-500">{app.scheme?.category}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {new Date(app.application_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-4">
                      <EligibilityBadge status={formatStatus(app.current_status)} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {app.documents?.length || 0} file(s)
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenDetail(app)}
                        className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect & Action
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {applications.length > displayLimit && (
          <div className="p-4 border-t border-slate-100 text-center bg-slate-50">
            <button
              onClick={() => setDisplayLimit((prev) => prev + 50)}
              className="px-5 py-2 bg-white border border-slate-300 hover:border-purple-500 text-slate-800 hover:text-purple-700 font-bold rounded-xl text-xs shadow-xs transition-all inline-flex items-center gap-2"
            >
              <span>Show Next 50 Applications (Showing {displayLimit} of {applications.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* Application Detail & Action Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-black text-slate-900">{selectedApp.application_no}</span>
                  <EligibilityBadge status={formatStatus(selectedApp.current_status)} size="sm" />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Applied by {selectedApp.worker?.full_name} ({selectedApp.worker?.email})
                </p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scheme & Worker Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Scheme Applied:</span>
                <p className="font-bold text-slate-900">{selectedApp.scheme?.scheme_name || selectedApp.scheme_id}</p>
                <p className="text-slate-600">{selectedApp.scheme?.category} • {selectedApp.scheme?.government_level}</p>
                <p className="text-emerald-700 font-semibold pt-1">
                  Benefit: {selectedApp.scheme?.benefits}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Worker Contact:</span>
                <p className="font-bold text-slate-900">{selectedApp.worker?.full_name}</p>
                <p className="text-slate-600">Phone: {selectedApp.worker?.phone || 'N/A'}</p>
                <p className="text-slate-600">Registered: {new Date(selectedApp.application_date).toLocaleDateString('en-IN')}</p>
              </div>
            </div>

            {/* Uploaded Documents & Verification Controls */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-purple-600" />
                Submitted Documents Verification
              </h4>

              {(!selectedApp.documents || selectedApp.documents.length === 0) ? (
                <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl">
                  No documents attached yet for this submission.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedApp.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{doc.document_type}</span>
                          <EligibilityBadge status={doc.status} size="sm" />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{doc.file_name}</p>
                        {doc.admin_remarks && (
                          <p className="text-[11px] text-slate-700 italic mt-0.5">
                            Remark: {doc.admin_remarks}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(doc)}
                          className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold rounded-lg text-[11px] inline-flex items-center gap-1 transition-colors"
                          title="View and preview document"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                        <a
                          href={documentApi.getDocumentDownloadUrl(doc.id)}
                          download={doc.file_name}
                          className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg text-[11px] inline-flex items-center gap-1 transition-colors"
                          title="Download document for verification"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </a>
                        <button
                          type="button"
                          onClick={() => handleVerifyDocument(doc.id, 'Verified')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px]"
                        >
                          Verify
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVerifyDocument(doc.id, 'Rejected')}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[11px]"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lifecycle Status Change Form */}
            <form onSubmit={handleUpdateStatus} className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-purple-700" />
                Administrative Status Transition
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">New Workflow Stage *</label>
                  <select
                    required
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="">-- Choose Next Transition --</option>
                    <option value="DOCUMENTS_VERIFIED">DOCUMENTS_VERIFIED (Documents Approved)</option>
                    <option value="UNDER_REVIEW">UNDER_REVIEW (Welfare Officer Review)</option>
                    <option value="APPROVED">APPROVED (Application Approved)</option>
                    <option value="BENEFIT_DISBURSED">BENEFIT_DISBURSED (Funds Transferred)</option>
                    <option value="REJECTED">REJECTED (Reject with Reason)</option>
                    <option value="DOCUMENTS_PENDING">DOCUMENTS_PENDING (Request More Documents)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Disbursed Benefit Amount (₹)</label>
                  <input
                    type="number"
                    value={benefitAmount}
                    onChange={(e) => setBenefitAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 5000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-xs">
                  Administrative Remarks (Mandatory if Rejecting) *
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Verified against state database; approved for DBT transfer."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={updatingStatus || !newStatus}
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {updatingStatus ? 'Updating & Notifying Worker...' : 'Execute Status Transition'}
                </button>
              </div>
            </form>

            {/* Visual Timeline View */}
            <div className="pt-2 border-t border-slate-100">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-4">
                Lifecycle Timeline Progress
              </h4>
              <Timeline
                steps={selectedApp.timeline_steps}
                currentStatus={selectedApp.current_status}
              />
            </div>

          </div>
        </div>
      )}

      {/* Document Inspection & Verification Preview Modal */}
      <DocumentPreviewModal
        document={previewDoc}
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        isAdmin={true}
        onVerify={(id, st, rem) => handleVerifyDocument(id, st, rem)}
      />

    </div>
  );
};
