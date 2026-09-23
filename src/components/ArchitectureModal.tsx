import React, { useState, useEffect } from 'react';
import { SystemArchitectureInfo } from '../types';
import { apiService } from '../services/api';
import {
  X,
  Cpu,
  Database,
  Terminal,
  Code2,
  Copy,
  Check,
  Server,
  Shield,
  Layers,
  Download,
} from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'postgres' | 'python' | 'structures'>('overview');
  const [sysInfo, setSysInfo] = useState<SystemArchitectureInfo | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      apiService.getSystemInfo().then(setSysInfo);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copyDdl = () => {
    navigator.clipboard.writeText(`-- CyberInstincts PostgreSQL Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE threat_severity AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
CREATE TYPE incident_status AS ENUM ('INVESTIGATING', 'RESOLVED', 'MONITORING', 'MITIGATED');
CREATE TYPE file_status AS ENUM ('VERIFIED', 'MODIFIED', 'MISSING', 'WARNING');

CREATE TABLE cyber_incidents (
    id VARCHAR(32) PRIMARY KEY,
    threat_type VARCHAR(64) NOT NULL,
    source_ip VARCHAR(64) NOT NULL,
    target VARCHAR(255) NOT NULL,
    severity threat_severity NOT NULL,
    status incident_status DEFAULT 'INVESTIGATING',
    description TEXT NOT NULL,
    detection_method VARCHAR(255) NOT NULL,
    cvss_score NUMERIC(3, 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE protected_files (
    id VARCHAR(32) PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(128) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    original_sha256_hash CHAR(64) NOT NULL,
    current_sha256_hash CHAR(64) NOT NULL,
    status file_status DEFAULT 'VERIFIED',
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_verified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-4xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-700">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">System Architecture & Engineering Specs</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-50 border border-cyan-200 text-cyan-800 font-semibold">
                  Architecture Blueprint
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Integration of Python, PostgreSQL, Data Structures, and Cryptographic File Integrity
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/download-project"
              download="cyberinstincts-project.zip"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Download Full Project Source Code (.ZIP)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Project .ZIP</span>
            </a>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 bg-slate-50/70 overflow-x-auto text-xs font-mono">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-3 py-2 border-b-2 transition-all ${
              activeTab === 'overview'
                ? 'border-cyan-600 text-cyan-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>System Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('postgres')}
            className={`flex items-center gap-2 px-3 py-2 border-b-2 transition-all ${
              activeTab === 'postgres'
                ? 'border-cyan-600 text-cyan-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>PostgreSQL Schema (DDL)</span>
          </button>

          <button
            onClick={() => setActiveTab('python')}
            className={`flex items-center gap-2 px-3 py-2 border-b-2 transition-all ${
              activeTab === 'python'
                ? 'border-cyan-600 text-cyan-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Python FastAPI Routes</span>
          </button>

          <button
            onClick={() => setActiveTab('structures')}
            className={`flex items-center gap-2 px-3 py-2 border-b-2 transition-all ${
              activeTab === 'structures'
                ? 'border-cyan-600 text-cyan-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Data Structures & Cryptography</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[72vh] overflow-y-auto space-y-4 font-sans">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-mono text-cyan-700 font-bold uppercase block mb-1">Backend Runtime</span>
                  <p className="text-sm font-bold text-slate-900 font-mono">{sysInfo?.pythonRuntime || 'Python 3.12 • FastAPI Core'}</p>
                  <p className="text-xs text-slate-500 mt-1">Asynchronous non-blocking event loops for high-concurrency ingestion.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-mono text-cyan-700 font-bold uppercase block mb-1">Relational Database</span>
                  <p className="text-sm font-bold text-slate-900 font-mono">{sysInfo?.databaseEngine || 'PostgreSQL 16.2 (pgcrypto)'}</p>
                  <p className="text-xs text-slate-500 mt-1">Strict ACID transactions, UUID keys, pg_audit trails, and indexed severity columns.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-mono text-cyan-700 font-bold uppercase block mb-1">Cryptographic Standard</span>
                  <p className="text-sm font-bold text-slate-900 font-mono">{sysInfo?.cryptoSuite || 'SHA-256 (NIST FIPS 180-4)'}</p>
                  <p className="text-xs text-slate-500 mt-1">Constant memory 64KB block streaming with timing-attack resistant comparisons.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h3 className="text-xs font-bold font-mono text-slate-800 uppercase">
                  Engineering Architecture Highlights
                </h3>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-5 leading-relaxed">
                  <li>
                    <strong className="text-slate-900">Separation of Concerns:</strong> Clean decoupled frontend (React 19) communicating via typed service interfaces mapped directly to REST API routes (`/api/v1/*`).
                  </li>
                  <li>
                    <strong className="text-slate-900">Algorithmic File Verification:</strong> Real-time hashing via browser Web Crypto API and server-side constant-time comparison to detect single-bit tampering.
                  </li>
                  <li>
                    <strong className="text-slate-900">Max-Heap Priority Queue:</strong> Custom data structure ensuring critical cyber incidents immediately jump to top priority triage.
                  </li>
                  <li>
                    <strong className="text-slate-900">Academic Safety:</strong> Operates entirely as a safe monitoring and verification simulator with zero exploit payloads or intrusive scanning.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'postgres' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600">
                  Target PostgreSQL schema definition (`backend/database/schema.sql`).
                </p>
                <button
                  onClick={copyDdl}
                  className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-xs font-mono text-cyan-800 font-medium flex items-center gap-1 transition-colors shadow-2xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied DDL' : 'Copy SQL'}</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre leading-relaxed">
{`-- PostgreSQL 16+ Relational Schema for CyberInstincts
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE threat_severity AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
CREATE TYPE incident_status AS ENUM ('INVESTIGATING', 'RESOLVED', 'MONITORING', 'MITIGATED');
CREATE TYPE file_status AS ENUM ('VERIFIED', 'MODIFIED', 'MISSING', 'WARNING');

CREATE TABLE cyber_incidents (
    id VARCHAR(32) PRIMARY KEY,
    threat_type VARCHAR(64) NOT NULL,
    source_ip VARCHAR(64) NOT NULL,
    target VARCHAR(255) NOT NULL,
    severity threat_severity NOT NULL,
    status incident_status DEFAULT 'INVESTIGATING',
    description TEXT NOT NULL,
    detection_method VARCHAR(255) NOT NULL,
    evidence TEXT,
    resolution TEXT,
    cvss_score NUMERIC(3, 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE protected_files (
    id VARCHAR(32) PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(128) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    original_sha256_hash CHAR(64) NOT NULL,
    current_sha256_hash CHAR(64) NOT NULL,
    status file_status DEFAULT 'VERIFIED',
    category VARCHAR(64) DEFAULT 'System Config',
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_verified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_incidents_severity ON cyber_incidents(severity);
CREATE INDEX idx_protected_files_status ON protected_files(status);`}
              </div>
            </div>
          )}

          {activeTab === 'python' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                FastAPI endpoint controllers matching the frontend service layer (`src/services/api.ts`).
              </p>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto whitespace-pre leading-relaxed">
{`# Python FastAPI Endpoints (backend/routes/api_routes.py)
from fastapi import FastAPI, UploadFile, File, Depends
from pydantic import BaseModel

app = FastAPI(title="CyberInstincts SOC API")

@app.get("/api/v1/dashboard/stats")
async def get_dashboard_stats():
    return {"threats_detected": 6, "critical_incidents": 1, "security_score": 88}

@app.get("/api/v1/incidents")
async def get_incidents(severity: str = None, status: str = None):
    return query_incidents_from_postgres(severity, status)

@app.post("/api/v1/incidents")
async def create_incident(payload: IncidentCreate):
    return insert_incident_to_postgres(payload)

@app.get("/api/v1/vault/files")
async def get_protected_files():
    return query_files_from_postgres()

@app.post("/api/v1/vault/files/upload")
async def upload_file(file: UploadFile = File(...)):
    sha256_hash = IntegrityEngine.compute_sha256(file.file)
    return save_vault_file(file.filename, sha256_hash)

@app.post("/api/v1/vault/files/{file_id}/verify")
async def verify_file(file_id: str):
    is_intact, current_hash = IntegrityEngine.verify_file(file_id)
    return {"verified": is_intact, "hash": current_hash}`}
              </div>
            </div>
          )}

          {activeTab === 'structures' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Core Computer Science Data Structures & Cryptographic Primitives utilized in this platform.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="text-xs font-bold font-mono text-cyan-800 uppercase mb-1">
                    Max-Heap Priority Queue
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Orders incoming cyber incidents with O(log n) insertion and O(1) peek so the SOC triage operator always handles CRITICAL (weight 4) and HIGH (weight 3) threats first.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="text-xs font-bold font-mono text-cyan-800 uppercase mb-1">
                    SHA-256 Merkle Verification
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Cryptographic one-way hash function producing 256-bit (32-byte) hashes. Demonstrates collision-resistance where changing even a single bit alters ~50% of output bits (Avalanche effect).
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="text-xs font-bold font-mono text-cyan-800 uppercase mb-1">
                    Constant-Time Hash Comparison
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Python `hmac.compare_digest` prevents side-channel timing attack vectors by comparing byte sequences in fixed time regardless of difference position.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="text-xs font-bold font-mono text-cyan-800 uppercase mb-1">
                    Dynamic Security Health Function
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Mathematical model computing real-time security posture score (0–100) based on active file integrity ratios, unresolved critical vectors, and coverage volume.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-500">
            Node Alpha SOC Gateway • Architecture v2.4
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs text-slate-700 font-medium transition-colors shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
