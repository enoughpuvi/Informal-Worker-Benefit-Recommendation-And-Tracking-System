import React, { useState, useEffect } from 'react';
import { applicationApi, documentApi } from '../services/api';
import { Application, DocumentItem } from '../types';
import { EligibilityBadge } from '../components/EligibilityBadge';
import { DocumentPreviewModal } from '../components/DocumentPreviewModal';
import { useToast } from '../context/ToastContext';
import {
  FileCheck2,
  FileText,
  Eye,
  Download,
  PlusCircle,
  Edit3,
  Trash2,
  AlertTriangle,
  UploadCloud,
  X,
  CheckCircle,
  Link as LinkIcon,
  Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const STANDARD_DOCUMENT_TYPES = [
  'Aadhaar Card',
  'e-Shram Card',
  'BPL / NFSA Ration Card',
  'Income Certificate / आय प्रमाण पत्र',
  'Bank Passbook / Cancelled Cheque',
  'Voter ID Card (EPIC)',
  'BOCW Labor Registration Card',
  'Street Vendor Vending Certificate / LoR',
  'Caste / Category Certificate',
  'Disability Certificate (UDID)',
  'Ayushman Bharat Health Card',
  'Passport Size Photograph',
  'Duly Signed Self-Declaration'
];

export const WorkerDocumentsPage: React.FC = () => {
  const { showToast } = useToast();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDocForUpdate, setSelectedDocForUpdate] = useState<DocumentItem | null>(null);
  const [selectedDocForDelete, setSelectedDocForDelete] = useState<DocumentItem | null>(null);

  // Add Document Form State
  const [addDocType, setAddDocType] = useState(STANDARD_DOCUMENT_TYPES[0]);
  const [addFile, setAddFile] = useState<File | null>(null);
  const [addApplicationId, setAddApplicationId] = useState<string>('');
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Update Document Form State
  const [updateDocType, setUpdateDocType] = useState('');
  const [updateFile, setUpdateFile] = useState<File | null>(null);
  const [submittingUpdate, setSubmittingUpdate] = useState(false);

  // Delete State
  const [submittingDelete, setSubmittingDelete] = useState(false);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [docsData, appsData] = await Promise.all([
        documentApi.getMyDocuments(),
        applicationApi.getMyApplications().catch(() => [])
      ]);
      setDocuments(docsData);
      setApplications(appsData);
    } catch (err) {
      console.error('Failed to load documents:', err);
      showToast('Could not load your documents. Please refresh.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Duplicate Check for Adding: Is document type already added?
  const isAddDuplicate = documents.some(
    (d) => d.document_type.trim().toLowerCase() === addDocType.trim().toLowerCase()
  );

  // Duplicate Check for Updating: Is document type taken by another document?
  const isUpdateDuplicate = selectedDocForUpdate
    ? documents.some(
        (d) =>
          d.id !== selectedDocForUpdate.id &&
          d.document_type.trim().toLowerCase() === updateDocType.trim().toLowerCase()
      )
    : false;

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFile) {
      showToast('Please select a file to upload.', 'error');
      return;
    }
    if (isAddDuplicate) {
      showToast(`A document of type "${addDocType}" is already uploaded. Please update the existing document instead.`, 'error');
      return;
    }

    setSubmittingAdd(true);
    try {
      await documentApi.uploadNewDocument(
        addDocType,
        addFile,
        addApplicationId ? Number(addApplicationId) : undefined
      );
      showToast(`Document "${addDocType}" uploaded successfully!`, 'success');
      setShowAddModal(false);
      setAddFile(null);
      setAddDocType(STANDARD_DOCUMENT_TYPES[0]);
      setAddApplicationId('');
      loadAllData();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to upload document.';
      showToast(msg, 'error');
    } finally {
      setSubmittingAdd(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocForUpdate) return;
    if (isUpdateDuplicate) {
      showToast(`Another document with type "${updateDocType}" already exists. Duplicate types are not allowed.`, 'error');
      return;
    }

    setSubmittingUpdate(true);
    try {
      await documentApi.updateDocument(
        selectedDocForUpdate.id,
        updateDocType !== selectedDocForUpdate.document_type ? updateDocType : undefined,
        updateFile || undefined
      );
      showToast(`Document "${updateDocType}" updated successfully!`, 'success');
      setSelectedDocForUpdate(null);
      setUpdateFile(null);
      loadAllData();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to update document.';
      showToast(msg, 'error');
    } finally {
      setSubmittingUpdate(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedDocForDelete) return;

    setSubmittingDelete(true);
    try {
      await documentApi.deleteDocument(selectedDocForDelete.id);
      showToast(`Document "${selectedDocForDelete.document_type}" deleted successfully.`, 'success');
      setSelectedDocForDelete(null);
      loadAllData();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to delete document.';
      showToast(msg, 'error');
    } finally {
      setSubmittingDelete(false);
    }
  };

  const openUpdateModal = (doc: DocumentItem) => {
    setSelectedDocForUpdate(doc);
    setUpdateDocType(doc.document_type);
    setUpdateFile(null);
  };

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-emerald-600" />
            My Uploaded Welfare Documents
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            View, upload, update, or remove your official identity proofs, income certificates, and bank documents.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
            {documents.length} Total Documents
          </span>
          <button
            onClick={() => {
              // Pre-select first non-uploaded document type if possible
              const firstAvailable = STANDARD_DOCUMENT_TYPES.find(
                (type) => !documents.some((d) => d.document_type.toLowerCase() === type.toLowerCase())
              );
              setAddDocType(firstAvailable || STANDARD_DOCUMENT_TYPES[0]);
              setAddFile(null);
              setAddApplicationId('');
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            Add New Document
          </button>
        </div>
      </div>

      {/* Documents List */}
      {documents.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-800">No documents uploaded yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Upload your Aadhaar Card, e-Shram Card, Ration Card, or Bank Passbook to streamline verification across all welfare applications.
          </p>
          <button
            onClick={() => {
              setAddDocType(STANDARD_DOCUMENT_TYPES[0]);
              setAddFile(null);
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition"
          >
            <PlusCircle className="w-4 h-4" />
            Upload Your First Document
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 transition"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-sm text-slate-900">{doc.document_type}</span>
                    <EligibilityBadge status={doc.status} size="sm" />
                  </div>
                  <p className="text-xs text-slate-600">
                    File: <span className="font-mono text-slate-800">{doc.file_name}</span> • Size: {(doc.file_size / 1024).toFixed(1)} KB • Uploaded on: {new Date(doc.upload_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  
                  {doc.application_no ? (
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-slate-400" />
                      Linked Application: <span className="font-mono font-semibold text-emerald-700">{doc.application_no}</span>
                      {doc.scheme_name && ` (${doc.scheme_name})`}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-1">
                      General Document Vault (Available for all schemes)
                    </p>
                  )}

                  {doc.admin_remarks && (
                    <p className="text-xs text-slate-700 italic mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      Officer Remark: "{doc.admin_remarks}"
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons: View, Download, Update, Delete */}
              <div className="flex items-center gap-2 self-start md:self-center flex-wrap pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 w-full md:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setPreviewDoc(doc)}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1 border border-emerald-200"
                  title="View document in browser"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View
                </button>

                <a
                  href={documentApi.getDocumentDownloadUrl(doc.id)}
                  download={doc.file_name}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1 border border-slate-300"
                  title="Download file"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </a>

                <button
                  type="button"
                  onClick={() => openUpdateModal(doc)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1 border border-blue-200"
                  title="Update document type or replace file"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Update
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDocForDelete(doc)}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1 border border-rose-200"
                  title="Delete document"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>

                {doc.application_no && (
                  <Link
                    to={`/track/${doc.application_no}`}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1"
                  >
                    Track App
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ==================== ADD DOCUMENT MODAL ==================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Add New Document</h3>
                  <p className="text-[11px] text-slate-500">Upload identity or income proofs (Duplicate types prevented)</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              {/* Document Type Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Document Type *
                </label>
                <select
                  value={addDocType}
                  onChange={(e) => setAddDocType(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {STANDARD_DOCUMENT_TYPES.map((type) => {
                    const alreadyExists = documents.some(
                      (d) => d.document_type.toLowerCase() === type.toLowerCase()
                    );
                    return (
                      <option key={type} value={type}>
                        {type} {alreadyExists ? '— (Already Uploaded)' : ''}
                      </option>
                    );
                  })}
                </select>
                <span className="text-[10px] text-slate-400">
                  Select the official document classification.
                </span>
              </div>

              {/* Duplicate Warning Alert */}
              {isAddDuplicate && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Duplicate Document Detected:</span> A document of type{' '}
                    <strong>"{addDocType}"</strong> already exists in your vault. To replace or renew this file, please use the <strong>Update</strong> option on the existing document rather than creating a duplicate.
                  </div>
                </div>
              )}

              {/* Optional Application Association */}
              {applications.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Link to Application (Optional)
                  </label>
                  <select
                    value={addApplicationId}
                    onChange={(e) => setAddApplicationId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="">General Documents Vault (All Schemes)</option>
                    {applications.map((app) => (
                      <option key={app.id} value={app.id}>
                        {app.application_no} — {app.scheme?.scheme_name || app.scheme_id} ({app.current_status})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* File Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Document File (PDF, PNG, JPG, WEBP - Max 10MB) *
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setAddFile(e.target.files[0]);
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 border border-slate-200 rounded-xl p-1.5"
                />
                {addFile && (
                  <p className="text-[11px] text-emerald-700 font-medium mt-1">
                    Selected: {addFile.name} ({(addFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd || isAddDuplicate || !addFile}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingAdd ? 'Uploading...' : 'Upload Document'}
                  <CheckCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== UPDATE DOCUMENT MODAL ==================== */}
      {selectedDocForUpdate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Update Document</h3>
                  <p className="text-[11px] text-slate-500">Change classification or replace with a new file</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDocForUpdate(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="text-slate-500 font-semibold">Current Document:</div>
                <div className="font-bold text-slate-800">{selectedDocForUpdate.document_type}</div>
                <div className="text-slate-600 font-mono text-[11px]">
                  {selectedDocForUpdate.file_name} ({(selectedDocForUpdate.file_size / 1024).toFixed(1)} KB)
                </div>
              </div>

              {/* Document Type Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Document Type *
                </label>
                <select
                  value={updateDocType}
                  onChange={(e) => setUpdateDocType(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {STANDARD_DOCUMENT_TYPES.map((type) => {
                    const isTaken = documents.some(
                      (d) =>
                        d.id !== selectedDocForUpdate.id &&
                        d.document_type.toLowerCase() === type.toLowerCase()
                    );
                    return (
                      <option key={type} value={type}>
                        {type} {isTaken ? '— (Used by another document)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Update Duplicate Warning */}
              {isUpdateDuplicate && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Duplicate Type Conflict:</strong> Another document is already categorized as "{updateDocType}". Please select a distinct document type.
                  </div>
                </div>
              )}

              {/* Replacement File (Optional if only renaming, or new file) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Replacement File (Optional - Leave blank to keep existing file)
                </label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUpdateFile(e.target.files[0]);
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-slate-200 rounded-xl p-1.5"
                />
                <span className="text-[10px] text-slate-400">
                  Uploading a new file will reset the verification status to "Uploaded" for administrative review.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedDocForUpdate(null)}
                  className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingUpdate || isUpdateDuplicate}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingUpdate ? 'Updating...' : 'Save Changes'}
                  <CheckCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== DELETE DOCUMENT CONFIRMATION MODAL ==================== */}
      {selectedDocForDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Delete Document</h3>
                <p className="text-xs text-slate-500">This action will remove the document permanently.</p>
              </div>
            </div>

            <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-200 text-xs text-rose-900 space-y-1">
              <p>Are you sure you want to delete this document from your profile?</p>
              <div className="font-bold text-slate-900 mt-1">
                {selectedDocForDelete.document_type}
              </div>
              <div className="font-mono text-slate-600 text-[11px]">
                {selectedDocForDelete.file_name}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedDocForDelete(null)}
                className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                disabled={submittingDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {submittingDelete ? 'Deleting...' : 'Yes, Delete Document'}
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DOCUMENT INSPECTION MODAL ==================== */}
      <DocumentPreviewModal
        document={previewDoc}
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        isAdmin={false}
      />

    </div>
  );
};
