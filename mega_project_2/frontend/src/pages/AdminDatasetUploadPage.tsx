import React, { useState } from 'react';
import { datasetApi } from '../services/api';
import { DatasetPreviewResponse } from '../types';
import { useToast } from '../context/ToastContext';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  Info,
  Layers,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDatasetUploadPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [preview, setPreview] = useState<DatasetPreviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Confirmation state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [overwriteExisting, setOverwriteExisting] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const { showToast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreview(null);
      setError(null);
      setImportResult(null);
      // Auto analyze on selection
      analyzeFile(selected);
    }
  };

  const analyzeFile = async (targetFile: File) => {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await datasetApi.uploadPreview(targetFile);
      setPreview(res);
      if (res.missing_required_columns.length > 0) {
        setError(`File is missing required columns: ${res.missing_required_columns.join(', ')}`);
      } else {
        showToast(`Dataset validated: ${res.valid_count} valid rows found.`, 'success');
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to read and validate dataset.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!preview || !preview.import_token) return;

    setImporting(true);
    try {
      const res = await datasetApi.confirmImport(preview.import_token, overwriteExisting);
      setImportResult(res);
      showToast('Dataset successfully imported and RAG recommendations synced!', 'success');
      setConfirmOpen(false);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Import failed.';
      showToast(msg, 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Batch Welfare Scheme Ingestion
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            Upload Government Scheme Dataset
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Bulk ingest CSV and Excel datasets. Validates schema, checks duplicates, previews rows, and reindexes AI recommendations.
          </p>
        </div>

        {/* Template Download */}
        <a
          href={datasetApi.getTemplateDownloadUrl()}
          download="government_schemes_template.csv"
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 self-start sm:self-center"
        >
          <Download className="w-4 h-4" />
          Download Sample CSV Template
        </a>
      </div>

      {/* Dataset Format Documentation Box */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <Info className="w-4 h-4 text-purple-600" />
          <span>Expected Dataset Format & Specifications</span>
        </div>
        <p>
          Files must be in <span className="font-semibold text-slate-900">.csv</span>, <span className="font-semibold text-slate-900">.xlsx</span>, or <span className="font-semibold text-slate-900">.xls</span> format.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
          <div>
            <span className="font-bold text-slate-900">Required Columns: </span>
            <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-purple-700 font-mono">
              scheme_id, scheme_name, description, category, benefits
            </code>
          </div>
          <div>
            <span className="font-bold text-slate-900">Recommended Attributes: </span>
            <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-emerald-700 font-mono">
              target_occupation, minimum_age, maximum_age, income_limit, state
            </code>
          </div>
        </div>
      </div>

      {/* Upload Dropzone */}
      <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-500 transition-colors text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
          <UploadCloud className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Select or Drag & Drop Scheme Dataset</h3>
          <p className="text-xs text-slate-500 mt-0.5">Supports CSV, Excel (.xlsx, .xls) up to 10MB</p>
        </div>

        <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md transition-all">
          <FileSpreadsheet className="w-4 h-4" />
          <span>Choose Dataset File</span>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {file && (
          <p className="text-xs font-semibold text-emerald-700">
            Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </p>
        )}
      </div>

      {analyzing && (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">
            Validating headers, checking data types, and detecting duplicates...
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Validation Issues Detected</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Success Import Banner if already imported */}
      {importResult && (
        <div className="p-6 bg-emerald-50 border border-emerald-300 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-base">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            <span>{importResult.message}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-white rounded-xl border border-emerald-200">
              <span className="text-slate-500 block">Total Processed</span>
              <span className="text-lg font-black text-slate-900">{importResult.total_processed}</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-emerald-200">
              <span className="text-slate-500 block">Created New</span>
              <span className="text-lg font-black text-emerald-600">{importResult.created_count}</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-emerald-200">
              <span className="text-slate-500 block">Updated Existing</span>
              <span className="text-lg font-black text-blue-600">{importResult.updated_count}</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-emerald-200">
              <span className="text-slate-500 block">RAG Status</span>
              <span className="text-xs font-bold text-purple-700">Reindexed 100%</span>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <Link
              to="/admin/schemes"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Layers className="w-4 h-4" />
              View Schemes Catalog
            </Link>
            <Link
              to="/recommendations"
              className="text-xs font-bold text-emerald-800 hover:underline"
            >
              Inspect Updated Recommendations →
            </Link>
          </div>
        </div>
      )}

      {/* Dataset Validation Preview Section */}
      {preview && !importResult && (
        <div className="space-y-6">
          
          {/* Validation Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Rows</span>
              <span className="text-xl font-black text-slate-900">{preview.total_rows}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/30">
              <span className="text-[10px] font-bold text-emerald-700 uppercase block">Valid Records</span>
              <span className="text-xl font-black text-emerald-600">{preview.valid_count}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-purple-200">
              <span className="text-[10px] font-bold text-purple-700 uppercase block">New Schemes</span>
              <span className="text-xl font-black text-purple-600">{preview.new_count}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-blue-200">
              <span className="text-[10px] font-bold text-blue-700 uppercase block">Will Update</span>
              <span className="text-xl font-black text-blue-600">{preview.update_count}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-amber-200">
              <span className="text-[10px] font-bold text-amber-700 uppercase block">Duplicates</span>
              <span className="text-xl font-black text-amber-600">{preview.duplicate_count}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-rose-200">
              <span className="text-[10px] font-bold text-rose-700 uppercase block">Invalid</span>
              <span className="text-xl font-black text-rose-600">{preview.invalid_count}</span>
            </div>
          </div>

          {/* Table Preview */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Dataset Row Validation Preview (First 50 Rows)
              </span>
              <span className="text-[11px] text-slate-500">
                Filename: {preview.filename}
              </span>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Scheme ID & Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Target Occupation</th>
                    <th className="py-2.5 px-3">Income & Age</th>
                    <th className="py-2.5 px-3">Validation Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preview.rows.map((row) => {
                    let statusBadge = (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        NEW
                      </span>
                    );
                    if (row.status === 'EXISTS_WILL_UPDATE') {
                      statusBadge = (
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                          UPDATE
                        </span>
                      );
                    } else if (row.status === 'DUPLICATE_IN_FILE') {
                      statusBadge = (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                          DUPLICATE
                        </span>
                      );
                    } else if (row.status === 'INVALID') {
                      statusBadge = (
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">
                          INVALID
                        </span>
                      );
                    }

                    return (
                      <tr key={row.row_index} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono text-slate-400">{row.row_index}</td>
                        <td className="py-2.5 px-3">{statusBadge}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono text-[10px] text-slate-400 block font-bold">{row.scheme_id}</span>
                          <span className="font-bold text-slate-900">{row.scheme_name}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">{row.category}</td>
                        <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">{row.target_occupation}</td>
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                          {row.income_limit} • {row.age_range}
                        </td>
                        <td className="py-2.5 px-3 text-xs">
                          {row.errors.length > 0 ? (
                            <span className="text-rose-600 font-semibold">{row.errors.join('; ')}</span>
                          ) : (
                            <span className="text-emerald-600 font-semibold">✓ Ready for import</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Import Action Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="overwrite"
                checked={overwriteExisting}
                onChange={(e) => setOverwriteExisting(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <label htmlFor="overwrite" className="text-xs font-semibold text-slate-800 cursor-pointer">
                Overwrite attributes for existing schemes (matched by <code className="font-mono text-slate-900">scheme_id</code>)
              </label>
            </div>

            <button
              onClick={() => setConfirmOpen(true)}
              disabled={!preview.is_valid_for_import}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Import {preview.valid_count} Scheme(s)</span>
            </button>
          </div>

        </div>
      )}

      {/* Confirmation Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-base text-slate-900">
              Confirm Ingestion into Production Database
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to ingest <span className="font-bold text-emerald-700">{preview?.valid_count} schemes</span> into the live system?
            </p>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1">
              <p>• <strong>{preview?.new_count}</strong> new records will be inserted.</p>
              <p>• <strong>{preview?.update_count}</strong> existing records will be updated.</p>
              <p>• RAG search embeddings & recommendation scores will automatically recalculate.</p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={importing}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {importing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Importing & Syncing RAG...</span>
                  </>
                ) : (
                  'Proceed with Ingestion'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
