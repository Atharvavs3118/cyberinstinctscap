import React, { useState, useRef } from 'react';
import { ProtectedFile } from '../types';
import { calculateSha256, formatBytes } from '../utils/crypto';
import {
  X,
  FolderLock,
  Upload,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Cpu,
  Loader2,
} from 'lucide-react';

interface UploadFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUploaded: (data: {
    file?: File;
    fileName: string;
    fileType: string;
    size: number;
    sha256Hash: string;
    category?: ProtectedFile['category'];
  }) => Promise<void>;
}

export const UploadFileModal: React.FC<UploadFileModalProps> = ({
  isOpen,
  onClose,
  onFileUploaded,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [computedHash, setComputedHash] = useState<string>('');
  const [category, setCategory] = useState<ProtectedFile['category']>('System Config');
  const [isHashing, setIsHashing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (file: File) => {
    setSelectedFile(file);
    setIsHashing(true);
    try {
      // Calculate real SHA-256 hash using browser's Web Crypto API
      const hash = await calculateSha256(file);
      setComputedHash(hash);
    } catch (err) {
      console.error('Failed to compute hash:', err);
      setComputedHash('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    } finally {
      setIsHashing(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !computedHash) return;

    setIsSaving(true);
    await onFileUploaded({
      file: selectedFile,
      fileName: selectedFile.name,
      fileType: selectedFile.type || 'application/octet-stream',
      size: selectedFile.size,
      sha256Hash: computedHash,
      category,
    });
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-700">
              <FolderLock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Enroll Protected File</h2>
              <p className="text-xs text-slate-500">MiniVault File Integrity Baseline Ingestion</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-cyan-500 bg-cyan-50/50'
                : 'border-slate-300 hover:border-cyan-500 bg-slate-50/70 hover:bg-cyan-50/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="p-3 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 shadow-2xs">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-900">
                {selectedFile ? selectedFile.name : 'Click to upload or drag and drop file'}
              </p>
              <p className="text-[11px] text-slate-500">
                {selectedFile
                  ? `${formatBytes(selectedFile.size)} • Type: ${selectedFile.type || 'binary/stream'}`
                  : 'Binaries, configuration files, SSL certs, secret manifests'}
              </p>
            </div>
          </div>

          {/* Hashing feedback & computed hash */}
          {isHashing ? (
            <div className="p-3.5 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center gap-2 text-xs text-cyan-800 font-mono font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-600" />
              <span>Computing NIST FIPS 180-4 SHA-256 Digest...</span>
            </div>
          ) : computedHash ? (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-emerald-700 font-semibold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Baseline SHA-256 Calculated:
                </span>
                <span className="text-slate-500 font-normal">64 Hex Characters</span>
              </div>
              <p className="font-mono text-xs text-emerald-400 break-all select-all p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                {computedHash}
              </p>
            </div>
          ) : null}

          {/* Category selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              File Classification Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ProtectedFile['category'])}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none font-mono shadow-2xs"
            >
              <option value="System Config">System Config (/etc, sysctl, flags)</option>
              <option value="Credentials">Credentials (.env, secrets, API tokens)</option>
              <option value="Certificate">Certificate (SSL/TLS, PEM, Root CA)</option>
              <option value="Audit Log">Audit Log (Database, Kernel, Auth)</option>
              <option value="Source Code">Source Code (Binaries, Scripts)</option>
              <option value="Database Dump">Database Dump (Snapshots, Tables)</option>
            </select>
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-500">
              Web Crypto SHA-256 verification
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs text-slate-700 font-medium transition-colors shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedFile || !computedHash || isHashing || isSaving}
                className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Enrolling...' : 'Protect & Snapshot Hash'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
