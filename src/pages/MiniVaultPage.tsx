import React, { useState, useMemo } from 'react';
import { ProtectedFile } from '../types';
import {
  FolderLock,
  Upload,
  RefreshCw,
  Flame,
  CheckCircle2,
  FileWarning,
  Eye,
  Copy,
  Check,
  Search,
  RotateCcw,
  ShieldCheck,
  Cpu,
  Info,
  Download,
  Trash2,
} from 'lucide-react';

interface MiniVaultPageProps {
  files: ProtectedFile[];
  onInspectFile: (file: ProtectedFile) => void;
  onOpenUploadModal: () => void;
  onVerifyFile: (id: string) => Promise<void>;
  onVerifyAllFiles: () => Promise<void>;
  onTamperFile: (id: string) => Promise<void>;
  onRestoreFile: (id: string) => Promise<void>;
  onDeleteFile?: (id: string) => Promise<void>;
}

export const MiniVaultPage: React.FC<MiniVaultPageProps> = ({
  files,
  onInspectFile,
  onOpenUploadModal,
  onVerifyFile,
  onVerifyAllFiles,
  onTamperFile,
  onRestoreFile,
  onDeleteFile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [verifyingAll, setVerifyingAll] = useState(false);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [copiedHashId, setCopiedHashId] = useState<string | null>(null);

  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          f.fileName.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q) ||
          f.originalHash.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (statusFilter !== 'ALL' && f.status !== statusFilter) return false;
      if (categoryFilter !== 'ALL' && f.category !== categoryFilter) return false;
      return true;
    });
  }, [files, searchQuery, statusFilter, categoryFilter]);

  const verifiedCount = files.filter((f) => f.status === 'VERIFIED').length;
  const modifiedCount = files.filter((f) => f.status === 'MODIFIED').length;
  const warningCount = files.filter((f) => f.status === 'WARNING' || f.status === 'MISSING').length;

  const handleVerifyAll = async () => {
    setVerifyingAll(true);
    await onVerifyAllFiles();
    setVerifyingAll(false);
  };

  const handleSingleVerify = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveActionId(id);
    await onVerifyFile(id);
    setActiveActionId(null);
  };

  const handleSingleTamper = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveActionId(id);
    await onTamperFile(id);
    setActiveActionId(null);
  };

  const handleSingleRestore = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveActionId(id);
    await onRestoreFile(id);
    setActiveActionId(null);
  };

  const handleDownloadFile = (file: ProtectedFile, e: React.MouseEvent) => {
    e.stopPropagation();
    if (file.storageUrl) {
      window.open(file.storageUrl, '_blank');
      return;
    }
    const content = `MiniVault Protected File Baseline\nFilename: ${file.fileName}\nSHA-256: ${file.originalHash}\nLast Verified: ${file.lastVerified}\nStatus: ${file.status}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteFile = async (file: ProtectedFile, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDeleteFile) return;
    if (window.confirm(`Delete ${file.fileName} from MiniVault?`)) {
      setActiveActionId(file.id);
      await onDeleteFile(file.id);
      setActiveActionId(null);
    }
  };

  const copyHash = (hash: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopiedHashId(id);
    setTimeout(() => setCopiedHashId(null), 2000);
  };

  const formatHashShort = (hash: string) => {
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-700">
            <FolderLock className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                MiniVault File Integrity & Cryptographic Shield
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                SHA-256 Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cryptographic baseline monitoring to detect unauthorized file manipulation, ransomware encryption, or tampering.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleVerifyAll}
            disabled={verifyingAll}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-mono flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${verifyingAll ? 'animate-spin' : ''}`} />
            <span>{verifyingAll ? 'Verifying Hashes...' : 'Verify All Files'}</span>
          </button>

          <button
            onClick={onOpenUploadModal}
            className="px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Add Protected File</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-200 border-t-2 border-t-cyan-600 bg-white shadow-xs">
          <span className="text-[11px] font-mono uppercase text-slate-500 font-bold block mb-1">Enrolled Files</span>
          <p className="text-3xl font-black font-mono text-slate-900">{files.length}</p>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
            Watched by SHA-256 daemon
          </p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-200 border-t-2 border-t-emerald-600 bg-white shadow-xs">
          <span className="text-[11px] font-mono uppercase text-emerald-800 font-bold block mb-1">Verified Valid</span>
          <p className="text-3xl font-black font-mono text-emerald-700">{verifiedCount}</p>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            100% Cryptographic match
          </p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-200 border-t-2 border-t-rose-600 bg-white shadow-xs">
          <span className="text-[11px] font-mono uppercase text-rose-800 font-bold block mb-1">Modified / Tampered</span>
          <p className={`text-3xl font-black font-mono ${modifiedCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
            {modifiedCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${modifiedCount > 0 ? 'bg-rose-500 animate-ping' : 'bg-slate-300'}`} />
            {modifiedCount > 0 ? 'Tamper alarm triggered!' : 'Zero hash deviations'}
          </p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-200 border-t-2 border-t-amber-600 bg-white shadow-xs">
          <span className="text-[11px] font-mono uppercase text-amber-800 font-bold block mb-1">Warnings / Unverified</span>
          <p className="text-3xl font-black font-mono text-amber-700">{warningCount}</p>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Awaiting integrity sweep
          </p>
        </div>
      </div>

      {/* Educational Banner: The Avalanche Effect in File Integrity */}
      <div className="p-4 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-start gap-3 shadow-xs">
        <Info className="w-5 h-5 text-cyan-700 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <h4 className="font-bold text-cyan-950 font-mono flex items-center gap-2">
            <span>Academic Principle: Cryptographic SHA-256 Avalanche Effect</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-cyan-100 text-cyan-800 border border-cyan-300 font-bold">NIST FIPS 180-4</span>
          </h4>
          <p className="text-cyan-900/90 leading-relaxed">
            In cryptography, a strict avalanche criterion ensures that modifying even a single byte in an enrolled file causes ~50% of the output digest bits to invert unpredictably. Click{' '}
            <strong className="text-rose-800 font-mono bg-rose-100 px-1 rounded border border-rose-300">"Tamper"</strong> on any file to simulate an adversary byte modification, then inspect the live hash difference and mitigation checklist.
          </p>
        </div>
      </div>

      {/* Quick Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
            statusFilter === 'ALL'
              ? 'bg-slate-100 text-slate-900 border-slate-300/80 shadow-2xs'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200'
          }`}
        >
          <span>All Files</span>
          <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-slate-100 text-slate-700 font-semibold">
            {files.length}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('VERIFIED')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
            statusFilter === 'VERIFIED'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs'
              : 'bg-white text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/40 border-slate-200'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Verified Valid</span>
          <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-emerald-100 text-emerald-800 font-semibold">
            {verifiedCount}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('MODIFIED')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
            statusFilter === 'MODIFIED'
              ? 'bg-rose-50 text-rose-800 border-rose-200 shadow-2xs'
              : 'bg-white text-slate-600 hover:text-rose-700 hover:bg-rose-50/40 border-slate-200'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          <span>Modified / Altered</span>
          <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-rose-100 text-rose-800 font-semibold">
            {modifiedCount}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('WARNING')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
            statusFilter === 'WARNING'
              ? 'bg-amber-50 text-amber-900 border-amber-200 shadow-2xs'
              : 'bg-white text-slate-600 hover:text-amber-700 hover:bg-amber-50/40 border-slate-200'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span>Warnings</span>
          <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-amber-100 text-amber-800 font-semibold">
            {warningCount}
          </span>
        </button>
      </div>

      {/* Toolbar & Filters */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by file name, category, or hash..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-600 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-cyan-600 focus:outline-none font-mono"
            >
              <option value="ALL">All Verification Statuses</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="MODIFIED">MODIFIED (Altered)</option>
              <option value="WARNING">WARNING</option>
              <option value="MISSING">MISSING</option>
            </select>
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-cyan-600 focus:outline-none font-mono"
            >
              <option value="ALL">All Categories</option>
              <option value="System Config">System Config</option>
              <option value="Credentials">Credentials</option>
              <option value="Certificate">Certificate</option>
              <option value="Audit Log">Audit Log</option>
              <option value="Source Code">Source Code</option>
              <option value="Database Dump">Database Dump</option>
            </select>
          </div>
        </div>
      </div>

      {/* File Integrity Table */}
      <div className="glass-panel rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-mono text-[11px] uppercase tracking-wider">
                <th className="p-3.5 font-semibold">Protected File</th>
                <th className="p-3.5 font-semibold">Category</th>
                <th className="p-3.5 font-semibold">File Size</th>
                <th className="p-3.5 font-semibold">Baseline SHA-256</th>
                <th className="p-3.5 font-semibold">Current Hash</th>
                <th className="p-3.5 font-semibold">Integrity Status</th>
                <th className="p-3.5 font-semibold">Last Checked</th>
                <th className="p-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
              {filteredFiles.map((file) => {
                const isModified = file.status === 'MODIFIED';
                const isWorking = activeActionId === file.id;

                return (
                  <tr
                    key={file.id}
                    onClick={() => onInspectFile(file)}
                    className="hover:bg-slate-50 transition-colors group cursor-pointer"
                  >
                    <td className="p-3.5 font-mono font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <FolderLock className="w-4 h-4 text-cyan-600 shrink-0" />
                        <span className="truncate max-w-[170px]">{file.fileName}</span>
                      </div>
                    </td>

                    <td className="p-3.5 font-mono text-slate-600 text-[11px]">{file.category}</td>

                    <td className="p-3.5 font-mono text-slate-700">{file.formattedSize}</td>

                    <td className="p-3.5 font-mono text-[11px] text-emerald-700 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span>{formatHashShort(file.originalHash)}</span>
                        <button
                          onClick={(e) => copyHash(file.originalHash, `orig-${file.id}`, e)}
                          className="text-slate-400 hover:text-cyan-700 transition-colors"
                          title="Copy Full SHA-256"
                        >
                          {copiedHashId === `orig-${file.id}` ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="p-3.5 font-mono text-[11px]">
                      <span
                        className={
                          file.originalHash === file.currentHash
                            ? 'text-emerald-700 font-medium'
                            : 'text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200'
                        }
                      >
                        {formatHashShort(file.currentHash)}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          file.status === 'VERIFIED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : file.status === 'MODIFIED'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {file.status}
                      </span>
                    </td>

                    <td className="p-3.5 font-mono text-[11px] text-slate-500">
                      {file.lastVerified.split(' ')[1] || file.lastVerified}
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {/* Verify Button */}
                        <button
                          onClick={(e) => handleSingleVerify(file.id, e)}
                          disabled={isWorking}
                          title="Execute cryptographic verification check"
                          className="px-2.5 py-1 rounded bg-white hover:bg-cyan-50 hover:text-cyan-800 border border-slate-200 text-[11px] font-mono text-slate-700 transition-colors flex items-center gap-1 shadow-xs"
                        >
                          <RefreshCw className={`w-3 h-3 ${isWorking ? 'animate-spin' : ''}`} />
                          <span>Verify</span>
                        </button>

                        {/* Tamper / Restore Simulator Toggle */}
                        {isModified ? (
                          <button
                            onClick={(e) => handleSingleRestore(file.id, e)}
                            disabled={isWorking}
                            title="Re-baseline or restore original hash"
                            className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-[11px] font-mono transition-colors flex items-center gap-1 shadow-xs font-semibold"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Restore</span>
                          </button>
                        ) : (
                          <button
                            onClick={(e) => handleSingleTamper(file.id, e)}
                            disabled={isWorking}
                            title="Simulate 1-byte adversary file tampering to evaluate detection"
                            className="px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[11px] font-mono transition-colors flex items-center gap-1 shadow-xs font-semibold"
                          >
                            <Flame className="w-3 h-3" />
                            <span>Tamper</span>
                          </button>
                        )}

                        {/* Download File */}
                        <button
                          onClick={(e) => handleDownloadFile(file, e)}
                          className="p-1 rounded bg-white hover:bg-cyan-50 text-slate-600 hover:text-cyan-800 border border-slate-200 text-[11px] transition-colors shadow-xs"
                          title="Download file"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete File */}
                        {onDeleteFile && (
                          <button
                            onClick={(e) => handleDeleteFile(file, e)}
                            className="p-1 rounded bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 text-[11px] transition-colors shadow-xs"
                            title="Delete file from MiniVault"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Inspect Details Button */}
                        <button
                          onClick={() => onInspectFile(file)}
                          className="p-1 rounded bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-[11px] transition-colors shadow-xs"
                          title="View full hash diff and verification log"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
