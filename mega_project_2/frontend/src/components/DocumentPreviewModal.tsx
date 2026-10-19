import React, { useState } from 'react';
import { DocumentItem } from '../types';
import { documentApi } from '../services/api';
import { EligibilityBadge } from './EligibilityBadge';
import {
  X,
  Download,
  ExternalLink,
  FileText,
  CheckCircle2,
  XCircle,
  FileCheck,
  ZoomIn
} from 'lucide-react';

interface DocumentPreviewModalProps {
  document: DocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  onVerify?: (documentId: number, status: 'Verified' | 'Rejected', remarks?: string) => Promise<void>;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document: doc,
  isOpen,
  onClose,
  isAdmin = false,
  onVerify
}) => {
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [imageZoomed, setImageZoomed] = useState(false);

  if (!isOpen || !doc) return null;

  const viewUrl = documentApi.getDocumentViewUrl(doc.id);
  const downloadUrl = documentApi.getDocumentDownloadUrl(doc.id);
  const ext = (doc.file_name.split('.').pop() || '').toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
  const isPdf = ext === 'pdf';

  const handleAction = async (status: 'Verified' | 'Rejected') => {
    if (!onVerify) return;
    setActionLoading(true);
    try {
      await onVerify(doc.id, status, remarks);
      setRemarks('');
      onClose();
    } catch (err) {
      console.error('Document verification error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in duration-150">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base text-slate-900">{doc.document_type}</h3>
                <EligibilityBadge status={doc.status} size="sm" />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                File: <span className="font-mono text-slate-800">{doc.file_name}</span> •{' '}
                {(doc.file_size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={downloadUrl}
              download={doc.file_name}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              title="Download Original Document"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Preview Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100/50 flex flex-col items-center justify-center min-h-[300px]">
          {isImage ? (
            <div className="relative group max-w-full flex flex-col items-center">
              <img
                src={viewUrl}
                alt={doc.document_type}
                className={`rounded-xl border border-slate-200 shadow-md object-contain transition-all bg-white ${
                  imageZoomed ? 'max-h-[75vh] scale-110' : 'max-h-[55vh]'
                }`}
                onError={(e) => {
                  // Fallback in case of image load error
                  (e.target as HTMLElement).style.display = 'none';
                  const fallback = document.getElementById(`doc-fallback-${doc.id}`);
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <button
                type="button"
                onClick={() => setImageZoomed(!imageZoomed)}
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-2xs"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                {imageZoomed ? 'Reset Zoom' : 'Zoom In'}
              </button>
            </div>
          ) : isPdf ? (
            <div className="w-full flex flex-col items-center space-y-3">
              <iframe
                src={`${viewUrl}#toolbar=1`}
                className="w-full h-[52vh] rounded-xl border border-slate-200 bg-white shadow-xs"
                title={doc.document_type}
              />
              <div className="flex items-center gap-3">
                <a
                  href={viewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-purple-700 hover:text-purple-900 inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open in New Window
                </a>
              </div>
            </div>
          ) : (
            <div
              id={`doc-fallback-${doc.id}`}
              className="p-8 text-center space-y-3 bg-white rounded-2xl border border-slate-200 shadow-xs max-w-md"
            >
              <FileText className="w-12 h-12 text-slate-400 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">{doc.file_name}</h4>
              <p className="text-xs text-slate-500">
                This document is ready for official verification. Click below to download and view on your device.
              </p>
              <a
                href={downloadUrl}
                download={doc.file_name}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                <Download className="w-4 h-4" />
                Download Document ({doc.document_type})
              </a>
            </div>
          )}

          {doc.admin_remarks && (
            <div className="w-full mt-4 p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 space-y-0.5">
              <span className="font-bold text-slate-900">Current Officer Remark:</span>
              <p className="italic text-slate-600">{doc.admin_remarks}</p>
            </div>
          )}
        </div>

        {/* Modal Footer: Admin Verification Controls */}
        {isAdmin && onVerify && (
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-white space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional verification remarks (e.g. Verified with state Aadhaar database)..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleAction('Verified')}
                  className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Verify Document
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleAction('Rejected')}
                  className="flex-1 sm:flex-none px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Reject Document
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
