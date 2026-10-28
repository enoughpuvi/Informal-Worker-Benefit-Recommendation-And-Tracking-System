import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { issueApi } from '../services/api';
import { IssueReport } from '../types';
import {
  LifeBuoy,
  PlusCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Search,
  MessageSquare,
  FileText,
  X,
  Filter,
  CheckCircle,
  UserCheck
} from 'lucide-react';

export const GrievanceReportPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  const [issues, setIssues] = useState<IssueReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Issue Form State
  const [category, setCategory] = useState('Scheme Application');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [relatedApplicationNo, setRelatedApplicationNo] = useState('');

  // Admin filter and resolution modal states
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIssueForAction, setSelectedIssueForAction] = useState<IssueReport | null>(null);
  const [updateStatus, setUpdateStatus] = useState<string>('Resolved');
  const [adminResponseNote, setAdminResponseNote] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const data = await issueApi.getAllIssues({
          status_filter: statusFilter === 'all' ? undefined : statusFilter,
          search: searchQuery.trim() || undefined
        });
        setIssues(data);
      } else {
        const data = await issueApi.getMyIssues();
        setIssues(data);
      }
    } catch (err) {
      console.error('Failed to load issues:', err);
      showToast('Failed to load issue reports.', 'error');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, statusFilter, searchQuery, showToast]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchIssues();
  };

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      showToast('Please provide both a subject and detailed description.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const created = await issueApi.submitIssue({
        category,
        priority,
        subject: subject.trim(),
        description: description.trim(),
        related_application_no: relatedApplicationNo.trim() || undefined
      });

      showToast(`Issue Ticket ${created.ticket_no} submitted successfully!`, 'success');
      setShowCreateModal(false);
      setSubject('');
      setDescription('');
      setRelatedApplicationNo('');
      fetchIssues();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to submit report.';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssueForAction) return;

    setUpdatingStatus(true);
    try {
      await issueApi.updateIssueStatus(
        selectedIssueForAction.id,
        updateStatus,
        adminResponseNote.trim() || undefined
      );

      showToast(`Ticket ${selectedIssueForAction.ticket_no} status updated to ${updateStatus}!`, 'success');
      setSelectedIssueForAction(null);
      setAdminResponseNote('');
      fetchIssues();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to update ticket status.';
      showToast(msg, 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Open':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> Open
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-3.5 h-3.5" /> In Progress
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" /> Resolved
          </span>
        );
      case 'Closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'Urgent':
        return <span className="px-2 py-0.5 rounded text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-200 uppercase">Urgent</span>;
      case 'High':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-100 text-orange-800 border border-orange-200">High</span>;
      case 'Medium':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">Medium</span>;
      case 'Low':
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">Low</span>;
    }
  };

  // Metrics for Admin
  const openCount = issues.filter(i => i.status === 'Open').length;
  const inProgressCount = issues.filter(i => i.status === 'In Progress').length;
  const resolvedCount = issues.filter(i => i.status === 'Resolved' || i.status === 'Closed').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 mb-1.5 border border-emerald-100">
            <LifeBuoy className="w-3.5 h-3.5" />
            {isAdmin ? 'Administrative Grievance Portal' : 'Worker Support Desk'}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {isAdmin ? 'Issue & Grievance Management' : 'Report an Issue / Help & Grievance'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            {isAdmin
              ? 'Review, track, and resolve system or scheme-related difficulties reported by workers and administrators.'
              : 'Facing an issue with document verification, application submission, or benefit release? Submit a report here to receive administrative assistance.'}
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 self-start md:self-center"
        >
          <PlusCircle className="w-4 h-4" />
          Report New Issue
        </button>
      </div>

      {/* Admin Stats Banner */}
      {isAdmin && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-slate-500 text-xs font-bold uppercase">Total Tickets</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{issues.length}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/30 shadow-2xs">
            <div className="text-amber-800 text-xs font-bold uppercase">Open / Pending</div>
            <div className="text-2xl font-black text-amber-700 mt-1">{openCount}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/30 shadow-2xs">
            <div className="text-blue-800 text-xs font-bold uppercase">In Progress</div>
            <div className="text-2xl font-black text-blue-700 mt-1">{inProgressCount}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-2xs">
            <div className="text-emerald-800 text-xs font-bold uppercase">Resolved / Closed</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">{resolvedCount}</div>
          </div>
        </div>
      )}

      {/* Admin Search & Filters */}
      {isAdmin && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by ticket no, subject, worker..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </form>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs font-bold text-slate-600">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
            <button
              onClick={() => fetchIssues()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
            >
              Refresh
            </button>
          </div>
        </div>
      )}

      {/* Issues List */}
      {loading ? (
        <div className="p-12 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : issues.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <LifeBuoy className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-800">No issues or grievances found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {isAdmin
              ? 'There are currently no reported issues matching the selected filters.'
              : 'You have not submitted any issue reports yet. If you encounter any technical difficulty or delay with welfare schemes, click "Report New Issue" above.'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            Create First Report
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => (
            <div
              key={issue.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition space-y-3"
            >
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md">
                    {issue.ticket_no}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                    {issue.category}
                  </span>
                  {getPriorityBadge(issue.priority)}
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(issue.status)}
                  <span className="text-[11px] text-slate-400">
                    {new Date(issue.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              {/* Subject & Description */}
              <div>
                <h3 className="font-black text-base text-slate-900 mb-1">{issue.subject}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {issue.description}
                </p>
              </div>

              {/* Metadata details */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                {issue.related_application_no && (
                  <div className="flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    <FileText className="w-3.5 h-3.5" />
                    <span>App Ref: {issue.related_application_no}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reported by: <strong>{issue.user_name}</strong> ({issue.user_role})</span>
                </div>
              </div>

              {/* Admin Response Box (if available) */}
              {issue.admin_response && (
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Administrative Authority Response {issue.resolved_by && `(by ${issue.resolved_by})`}:</span>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed pl-5">
                    {issue.admin_response}
                  </p>
                </div>
              )}

              {/* Admin Action Button */}
              {isAdmin && (
                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => {
                      setSelectedIssueForAction(issue);
                      setUpdateStatus(issue.status === 'Open' ? 'In Progress' : 'Resolved');
                      setAdminResponseNote(issue.admin_response || '');
                    }}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Take Action / Update Resolution
                  </button>
                </div>
              )}

            </div>
          ))}
        </div>
      )}

      {/* CREATE ISSUE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Submit Grievance / Report Issue</h3>
                  <p className="text-[11px] text-slate-500">Provide details so our administrators can review and assist you.</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIssue} className="space-y-3.5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Issue Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Scheme Application">Scheme Application Problem</option>
                    <option value="Document Verification">Document Verification Issue</option>
                    <option value="Benefit Disbursement">Benefit / Payment Disbursement</option>
                    <option value="Technical / Bug">Technical Error / Website Bug</option>
                    <option value="Profile & Login">Profile Update or Login Issue</option>
                    <option value="Other Feedback">Other Suggestion or Grievance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Priority Level *
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                  >
                    <option value="Low">Low - General query</option>
                    <option value="Medium">Medium - Normal assistance</option>
                    <option value="High">High - Application blocked</option>
                    <option value="Urgent">Urgent - Critical / Emergency</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Subject / Summary *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cannot view uploaded e-Shram card preview"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Related Application ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. APP-2026-003763"
                  value={relatedApplicationNo}
                  onChange={(e) => setRelatedApplicationNo(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Detailed Description *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Explain exactly what happened, when it occurred, and any error message you noticed..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Register Report'}
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ADMIN STATUS & RESOLUTION MODAL */}
      {selectedIssueForAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Resolve Grievance: {selectedIssueForAction.ticket_no}</h3>
                <p className="text-[11px] text-slate-500">Applicant: {selectedIssueForAction.user_name} ({selectedIssueForAction.user_email})</p>
              </div>
              <button
                onClick={() => setSelectedIssueForAction(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-800">{selectedIssueForAction.subject}</div>
              <p className="text-slate-600">{selectedIssueForAction.description}</p>
            </div>

            <form onSubmit={handleUpdateStatusSubmit} className="space-y-3.5">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Update Resolution Status *
                </label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white font-bold"
                >
                  <option value="Open">Open (Pending Inspection)</option>
                  <option value="In Progress">In Progress (Under Review)</option>
                  <option value="Resolved">Resolved (Completed & Rectified)</option>
                  <option value="Closed">Closed (Concluded)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Resolution Remarks / Note to Worker *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide detailed feedback on what steps were taken or instructions for the worker..."
                  value={adminResponseNote}
                  onChange={(e) => setAdminResponseNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-400">
                  This note will appear directly in the worker's issue tracking dashboard and trigger an in-app alert.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedIssueForAction(null)}
                  className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {updatingStatus ? 'Saving...' : 'Submit Resolution'}
                  <CheckCircle className="w-3.5 h-3.5" />
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
