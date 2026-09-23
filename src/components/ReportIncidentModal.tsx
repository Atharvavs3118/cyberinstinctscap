import React, { useState } from 'react';
import { ThreatCategory, ThreatSeverity } from '../types';
import {
  X,
  ShieldAlert,
  Upload,
  Calendar,
  Crosshair,
  Server,
  FileText,
  AlertOctagon,
  Sparkles,
} from 'lucide-react';

interface ReportIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    threatType: ThreatCategory;
    sourceIp: string;
    target: string;
    severity: ThreatSeverity;
    description: string;
    detectionMethod: string;
    evidence?: string;
    evidenceFile?: File;
    cvssScore?: number;
    mitreTactic?: string;
  }) => Promise<void>;
}

export const ReportIncidentModal: React.FC<ReportIncidentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [threatType, setThreatType] = useState<ThreatCategory>('Malware');
  const [severity, setSeverity] = useState<ThreatSeverity>('HIGH');
  const [sourceIp, setSourceIp] = useState('198.51.100.77');
  const [target, setTarget] = useState('Production Core API Cluster');
  const [description, setDescription] = useState('');
  const [detectionMethod, setDetectionMethod] = useState('SIEM Anomaly Sensor & Host EDR');
  const [evidenceName, setEvidenceName] = useState<string>('');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [mitreTactic, setMitreTactic] = useState('TA0001: Initial Access');
  const [cvssScore, setCvssScore] = useState<number>(7.8);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const threatCategories: ThreatCategory[] = [
    'Malware',
    'Phishing',
    'Brute Force',
    'Suspicious Login',
    'Unauthorized Access',
    'File Tampering',
    'Unknown Threat',
  ];

  const handleSimulateEvidence = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setEvidenceFile(e.target.files[0]);
      setEvidenceName(e.target.files[0].name);
    }
  };

  const handleQuickPreset = (type: ThreatCategory) => {
    setThreatType(type);
    switch (type) {
      case 'Malware':
        setSeverity('CRITICAL');
        setCvssScore(9.2);
        setDescription('Unsigned payload detected executing in memory with obfuscated command line arguments.');
        setDetectionMethod('EDR Behavioral Heuristic Guard');
        setMitreTactic('TA0005: Defense Evasion (T1055 Process Injection)');
        break;
      case 'Phishing':
        setSeverity('MEDIUM');
        setCvssScore(6.5);
        setDescription('Spoofed sender address containing credential harvesting link mimicking internal SSO portal.');
        setDetectionMethod('Mail Gateway DKIM/SPF Engine');
        setMitreTactic('TA0001: Initial Access (T1566 Phishing)');
        break;
      case 'Brute Force':
        setSeverity('MEDIUM');
        setCvssScore(5.3);
        setDescription('Dictionary attack spraying common usernames against SSH Bastion host.');
        setDetectionMethod('Fail2ban & Suricata IDS');
        setMitreTactic('TA0006: Credential Access (T1110 Brute Force)');
        break;
      case 'Suspicious Login':
        setSeverity('HIGH');
        setCvssScore(7.5);
        setDescription('Simultaneous login attempts from two geographically disparate coordinates within 3 minutes.');
        setDetectionMethod('Geo-velocity Anomaly Engine');
        setMitreTactic('TA0001: Initial Access (T1078 Valid Accounts)');
        break;
      case 'Unauthorized Access':
        setSeverity('HIGH');
        setCvssScore(8.1);
        setDescription('Privilege escalation attempt query targeting restricted user salted hash table.');
        setDetectionMethod('pg_audit Database Monitoring');
        setMitreTactic('TA0007: Discovery (T1083 File Discovery)');
        break;
      case 'File Tampering':
        setSeverity('CRITICAL');
        setCvssScore(9.0);
        setDescription('Cryptographic SHA-256 mismatch detected in protected configuration binary.');
        setDetectionMethod('MiniVault FS-Event Integrity Daemon');
        setMitreTactic('TA0009: Impact (T1565 Data Manipulation)');
        break;
      default:
        setSeverity('MEDIUM');
        setCvssScore(5.0);
        setDescription('Unclassified security anomaly flagged by edge perimeter firewall.');
        setDetectionMethod('Perimeter Firewall Logs');
        setMitreTactic('TA0001: Initial Access');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    await onSubmit({
      threatType,
      sourceIp: sourceIp.trim() || 'Unknown IP',
      target: target.trim() || 'Internal Subnet',
      severity,
      description: description.trim(),
      detectionMethod: detectionMethod.trim() || 'Automated SIEM Rule',
      evidence: evidenceName ? `Captured artifact: ${evidenceName}` : undefined,
      evidenceFile: evidenceFile || undefined,
      cvssScore,
      mitreTactic,
    });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Log Cyber Incident</h2>
              <p className="text-xs text-slate-500">CyberTrace Security Event Submission Form</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[78vh] overflow-y-auto space-y-4">
          {/* Quick Presets */}
          <div>
            <span className="text-[11px] font-mono text-slate-600 flex items-center gap-1 mb-2 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
              Quick Threat Incident Templates:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {threatCategories.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => handleQuickPreset(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                    threatType === cat
                      ? 'bg-cyan-50 text-cyan-800 border border-cyan-300 font-semibold shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Threat Type & Severity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Threat Type *</label>
              <select
                value={threatType}
                onChange={(e) => setThreatType(e.target.value as ThreatCategory)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none font-mono shadow-2xs"
              >
                {threatCategories.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Severity Rating *</label>
              <select
                value={severity}
                onChange={(e) => {
                  const s = e.target.value as ThreatSeverity;
                  setSeverity(s);
                  if (s === 'CRITICAL') setCvssScore(9.2);
                  else if (s === 'HIGH') setCvssScore(7.8);
                  else if (s === 'MEDIUM') setCvssScore(5.4);
                  else setCvssScore(3.2);
                }}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none font-mono shadow-2xs"
              >
                <option value="CRITICAL">CRITICAL (Score 9.0 - 10.0)</option>
                <option value="HIGH">HIGH (Score 7.0 - 8.9)</option>
                <option value="MEDIUM">MEDIUM (Score 4.0 - 6.9)</option>
                <option value="LOW">LOW (Score 0.1 - 3.9)</option>
              </select>
            </div>
          </div>

          {/* Source IP & Target Host */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Crosshair className="w-3.5 h-3.5 text-cyan-600" /> Source IP / Origin *
              </label>
              <input
                type="text"
                required
                value={sourceIp}
                onChange={(e) => setSourceIp(e.target.value)}
                placeholder="e.g. 198.51.100.42"
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-mono text-slate-900 focus:border-cyan-500 focus:outline-none shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Server className="w-3.5 h-3.5 text-cyan-600" /> Target Asset / Host *
              </label>
              <input
                type="text"
                required
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="e.g. Auth Gateway Node-01"
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none shadow-2xs"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Incident Description & Forensic Observations *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the anomalous pattern, payload signatures, or suspicious telemetry observed..."
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none shadow-2xs leading-relaxed"
            />
          </div>

          {/* Detection Method & MITRE Tactic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Detection Sensor / Engine
              </label>
              <input
                type="text"
                value={detectionMethod}
                onChange={(e) => setDetectionMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                MITRE ATT&CK Tactic
              </label>
              <input
                type="text"
                value={mitreTactic}
                onChange={(e) => setMitreTactic(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-mono text-slate-900 focus:border-cyan-500 focus:outline-none shadow-2xs"
              />
            </div>
          </div>

          {/* Evidence Upload Simulator */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Upload className="w-3.5 h-3.5 text-cyan-600" /> Attach Evidence (Logs, PCAP, Memory Dump)
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer px-3.5 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-300 text-xs text-slate-700 flex items-center gap-2 transition-colors shadow-2xs font-medium">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Select Evidence File</span>
                <input
                  type="file"
                  onChange={handleSimulateEvidence}
                  className="hidden"
                />
              </label>
              {evidenceName ? (
                <span className="text-xs font-mono text-cyan-800 font-semibold truncate max-w-xs">
                  {evidenceName}
                </span>
              ) : (
                <span className="text-xs text-slate-400 italic">No file selected (optional)</span>
              )}
            </div>
          </div>

          {/* Footer actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-500">
              Auto-timestamps & assigns initial triage step
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
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Submitting to SIEM...' : 'Submit Incident'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
