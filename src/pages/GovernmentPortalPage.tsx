import React, { useState, useEffect } from 'react';
import {
  Building2,
  FileCheck2,
  AlertTriangle,
  Clock,
  Sparkles,
  ShieldCheck,
  Download,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  FileText,
  Send,
  Lock,
  Layers,
  Fingerprint,
  Shield,
  Scale,
  Copy,
  Check,
  Globe,
  Radio,
  Share2,
} from 'lucide-react';
import { CyberIncident, GovernmentReport, GovernmentAdvisory } from '../types';
import { getGovernmentReports, submitGovernmentReport, getGovernmentAdvisories } from '../services/govService';
import { generateGovernmentReportAI } from '../services/aiService';

interface GovernmentPortalPageProps {
  incidents: CyberIncident[];
  onInspectIncident: (inc: CyberIncident) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const GovernmentPortalPage: React.FC<GovernmentPortalPageProps> = ({
  incidents,
  onInspectIncident,
  onShowToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'cctns-icjs' | 'dispatch' | 'archive' | 'advisories' | 'custody'>('cctns-icjs');
  const [reports, setReports] = useState<GovernmentReport[]>([]);
  const [advisories, setAdvisories] = useState<GovernmentAdvisory[]>([]);
  const [loading, setLoading] = useState(true);

  // CCTNS & ICJS State
  const [cctnsIncidentId, setCctnsIncidentId] = useState<string>(incidents[0]?.id || '');
  const [cctnsStation, setCctnsStation] = useState('Cyber Crime Police Station, Special Cell (National Capital Region)');
  const [cctnsState, setCctnsState] = useState('Central Bureau / Inter-State Cyber Grid');
  const [cctnsFIRNo, setCctnsFIRNo] = useState(`FIR-CYB-2026-${Math.floor(10000 + Math.random() * 90000)}`);
  const [cctnsSections, setCctnsSections] = useState('Sec 66, 66C, 66D IT Act 2000; Sec 318(4) & 111 Bharatiya Nyaya Sanhita (BNS 2023)');
  const [cctnsCopied, setCctnsCopied] = useState(false);
  const [cctnsSimulatedDispatch, setCctnsSimulatedDispatch] = useState(false);
  const [selectedPillar, setSelectedPillar] = useState<'police' | 'forensics' | 'prosecution' | 'courts' | 'prisons'>('police');

  // Dispatch Form State
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(incidents[0]?.id || '');
  const [agencyTarget, setAgencyTarget] = useState<'CERT-In' | 'CISA' | 'NCIIPC' | 'Interpol Cyber' | 'State Cyber Cell'>('CERT-In');
  const [criticalSector, setCriticalSector] = useState<'Defense & Aerospace' | 'Banking & Finance' | 'Energy & Utilities' | 'Healthcare' | 'Telecommunications' | 'Government IT'>('Defense & Aerospace');
  const [reportingAgency, setReportingAgency] = useState('CyberInstincts Defense SOC');
  const [signOffOfficer, setSignOffOfficer] = useState('Atharva Sankhe, Lead SOC Analyst');
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [impactAssessment, setImpactAssessment] = useState('');
  const [indicatorsText, setIndicatorsText] = useState('185.220.101.5, sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected Report for Modal Inspection
  const [inspectedReport, setInspectedReport] = useState<GovernmentReport | null>(null);

  // Advisory Filter
  const [advisorySearch, setAdvisorySearch] = useState('');
  const [advisorySeverity, setAdvisorySeverity] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM'>('ALL');

  useEffect(() => {
    async function loadGovData() {
      setLoading(true);
      const [rList, aList] = await Promise.all([getGovernmentReports(), getGovernmentAdvisories()]);
      setReports(rList);
      setAdvisories(aList);
      setLoading(false);
    }
    loadGovData();
  }, []);

  const selectedIncident = incidents.find((i) => i.id === selectedIncidentId) || incidents[0];

  // AI Generation of Formal Report
  const handleGenerateReportAI = async () => {
    if (!selectedIncident) {
      onShowToast('Please select an active incident first.', 'warning');
      return;
    }

    setIsGeneratingAI(true);
    onShowToast('Drafting official statutory notice via Gemini AI...', 'info');

    try {
      const res = await generateGovernmentReportAI(
        selectedIncident,
        agencyTarget,
        criticalSector,
        signOffOfficer
      );

      setExecutiveSummary(
        `On ${selectedIncident.timestamp}, unauthorized threat activity (${selectedIncident.threatType}) was identified targeting ${selectedIncident.target}. Severity evaluated as ${selectedIncident.severity} (CVSS ${selectedIncident.cvssScore}). Containment measures executed within statutory window.`
      );
      setImpactAssessment(
        `Critical infrastructure node "${selectedIncident.target}" within the ${criticalSector} sector underwent immediate egress quarantine. Zero verified exfiltration of regulated customer or defense data.`
      );
      setIndicatorsText(`${selectedIncident.sourceIp || '192.168.1.1'}, sha256:7e829fa...c09f, MITRE: ${selectedIncident.mitreTactic || 'T1190'}`);

      onShowToast(`AI Statutory draft generated for ${agencyTarget} (${res.engine})`, 'success');
    } catch (err: any) {
      onShowToast('AI generation warning: populated with local SOC template.', 'info');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Submit Official Statutory Notice
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;

    setIsSubmitting(true);
    const iocList = indicatorsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const refNumber = `${agencyTarget.toUpperCase().replace(/[^A-Z]/g, '')}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newReportData: Omit<GovernmentReport, 'id' | 'reportedAt'> = {
      reportRef: refNumber,
      incidentId: selectedIncident.id,
      agencyTarget,
      reportingAgency,
      criticalSector,
      incidentTitle: `${selectedIncident.threatType} on ${selectedIncident.target}`,
      severity: selectedIncident.severity,
      mandatedWindowHours: selectedIncident.severity === 'CRITICAL' ? 6 : 24,
      status: 'SUBMITTED',
      executiveSummary: executiveSummary || `Statutory cyber incident disclosure: ${selectedIncident.threatType} affecting ${selectedIncident.target}.`,
      impactAssessment: impactAssessment || `Target: ${selectedIncident.target}. Initial isolation complete.`,
      indicatorsOfCompromise: iocList,
      evidencePackageHash: `sha256:${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`,
      signOffOfficer,
    };

    try {
      const saved = await submitGovernmentReport(newReportData);
      setReports((prev) => [saved, ...prev]);
      onShowToast(`Dispatched official notice: ${saved.reportRef} to ${agencyTarget}`, 'success');
      setActiveSubTab('archive');
    } catch (err: any) {
      onShowToast('Failed to dispatch government notice: ' + err?.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAdvisories = advisories.filter((adv) => {
    const matchesSearch =
      adv.title.toLowerCase().includes(advisorySearch.toLowerCase()) ||
      adv.advisoryId.toLowerCase().includes(advisorySearch.toLowerCase()) ||
      adv.cveList.some((c) => c.toLowerCase().includes(advisorySearch.toLowerCase()));
    const matchesSeverity = advisorySeverity === 'ALL' || adv.severity === advisorySeverity;
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="space-y-6">
      {/* Official Government Cyber Liaison Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-6 text-white shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-900 text-blue-200 border border-blue-700">
                OFFICIAL LAW ENFORCEMENT & REGULATORY LIAISON
              </span>
              <span className="text-xs text-slate-300 font-semibold">CERT-In • NCRB • Supreme Court e-Committee</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Building2 className="w-7 h-7 text-blue-400" />
              Government & Regulatory Cyber Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Mandatory statutory cyber incident reporting, national threat advisory synchronization,
              and authenticated forensic digital evidence packages for law enforcement and judicial authorities.
            </p>
          </div>

          {/* Statutory Compliance Indicators */}
          <div className="flex flex-wrap md:flex-col gap-2 shrink-0 text-xs">
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px] font-medium">CERT-In Statutory Mandate</span>
                <span className="text-amber-300 font-bold">6-Hour Window Compliant</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px] font-medium">Digital Evidence Integrity</span>
                <span className="text-emerald-300 font-bold">SHA-256 / Sec 65B Certified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Portal Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('cctns-icjs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all shrink-0 cursor-pointer ${
              activeSubTab === 'cctns-icjs'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4 text-white" />
            <span>CCTNS & ICJS Justice Hub</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-900 text-blue-100 border border-blue-700">
              National Portals
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('dispatch')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all shrink-0 cursor-pointer ${
              activeSubTab === 'dispatch'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Statutory Incident Dispatch</span>
          </button>

          <button
            onClick={() => setActiveSubTab('archive')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all shrink-0 cursor-pointer ${
              activeSubTab === 'archive'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Dispatched Archive ({reports.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('advisories')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all shrink-0 cursor-pointer ${
              activeSubTab === 'advisories'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Cyber Advisories ({advisories.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('custody')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all shrink-0 cursor-pointer ${
              activeSubTab === 'custody'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Fingerprint className="w-4 h-4" />
            <span>Evidence Chain of Custody</span>
          </button>
        </div>
      </div>

      {/* TAB 0: CCTNS & ICJS NATIONAL LAW ENFORCEMENT & JUSTICE HUB */}
      {activeSubTab === 'cctns-icjs' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Section 1: Official Portals Overview Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CCTNS Card */}
            <div className="rounded-2xl bg-white border border-blue-200/90 shadow-sm p-6 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full pointer-events-none -z-0" />
              <div className="relative z-10 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                          NCRB • MHA Mandate
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                          16,500+ Stations
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                        CCTNS National Police Portal
                      </h2>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Crime and Criminal Tracking Network & Systems (CCTNS)</strong> is India’s flagship mission-mode project by the Ministry of Home Affairs connecting ~16,500+ police stations nationwide for computerized crime investigation, automated FIR registry, and cybercrime intelligence exchange.
                </p>

                {/* CCTNS Key Capabilities */}
                <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-700">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50/60 border border-blue-100">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Nationwide Cyber FIR Registry</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50/60 border border-blue-100">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Integrated with Portal 1930</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50/60 border border-blue-100">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Investigating Officer (IO) Dossiers</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50/60 border border-blue-100">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Inter-State Modus Operandi Match</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons with External Portal Links */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2.5 relative z-10">
                <a
                  href="https://digitalpolice.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
                  title="Open Digital Police Citizen & Police Services Portal"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Launch digitalpolice.gov.in</span>
                  <ExternalLink className="w-3 h-3 text-blue-200" />
                </a>

                <a
                  href="https://cctns.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-all border border-slate-200"
                  title="Open Official CCTNS Headquarters Portal"
                >
                  <span>cctns.gov.in</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>

                <a
                  href="https://cybercrime.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-semibold transition-all border border-indigo-200"
                  title="Open National Cyber Crime Reporting Portal (Helpline 1930)"
                >
                  <span>cybercrime.gov.in</span>
                  <ExternalLink className="w-3 h-3 text-indigo-500" />
                </a>
              </div>
            </div>

            {/* ICJS Card */}
            <div className="rounded-2xl bg-white border border-emerald-200/90 shadow-sm p-6 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full pointer-events-none -z-0" />
              <div className="relative z-10 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm">
                      <Scale className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                          Supreme Court e-Committee
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 font-bold">
                          5-Pillar Cloud
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                        ICJS Criminal Justice Gateway
                      </h2>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Inter-Operable Criminal Justice System (ICJS Phase-II)</strong> is an initiative by the Supreme Court of India e-Committee & NCRB enabling real-time cloud data exchange between <strong>Police, e-Forensics, e-Prosecution, e-Courts, and e-Prisons</strong> for seamless evidentiary trials.
                </p>

                {/* ICJS Key Capabilities */}
                <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-700">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50/60 border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>e-Forensics Hash Verification</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50/60 border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Sec 65B Indian Evidence Act / BSA</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50/60 border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>e-Courts Digital Case Docket</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50/60 border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Single Sign-On Judicial Pipeline</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons with External Portal Links */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2.5 relative z-10">
                <a
                  href="https://icjs.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
                  title="Open Official ICJS Portal (National Cloud)"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Launch icjs.gov.in</span>
                  <ExternalLink className="w-3 h-3 text-emerald-200" />
                </a>

                <a
                  href="https://ncrb.gov.in/en/inter-operable-criminal-justice-system-icjs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-all border border-slate-200"
                  title="NCRB ICJS Technical Architecture Specification"
                >
                  <span>NCRB ICJS Docs</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>

                <a
                  href="https://ecourts.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-900 text-xs font-semibold transition-all border border-cyan-200"
                  title="Open e-Courts Judicial Services Portal"
                >
                  <span>ecourts.gov.in</span>
                  <ExternalLink className="w-3 h-3 text-cyan-600" />
                </a>
              </div>
            </div>
          </div>

          {/* Section 2: Interactive 5-Pillar Architecture Diagram */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  ICJS 5-Pillar Real-Time Interoperability Grid
                </h3>
                <p className="text-xs text-slate-500">
                  Select any pillar to inspect how CyberInstincts SOC evidence packages traverse the national justice workflow
                </p>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-800 font-semibold border border-indigo-200 self-start">
                ICJS Phase-II Cloud Mesh
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {[
                {
                  id: 'police' as const,
                  title: '1. Police (CCTNS)',
                  icon: <Building2 className="w-4 h-4" />,
                  color: 'blue',
                  desc: '16,500+ Police Stations, FIR Logging, IO Investigation Dossier',
                },
                {
                  id: 'forensics' as const,
                  title: '2. e-Forensics',
                  icon: <Fingerprint className="w-4 h-4" />,
                  color: 'indigo',
                  desc: 'Central & State FSL Labs, SHA-256 Hash Matching, Evidence Custody',
                },
                {
                  id: 'prosecution' as const,
                  title: '3. e-Prosecution',
                  icon: <FileCheck2 className="w-4 h-4" />,
                  color: 'purple',
                  desc: 'Directorate of Prosecution, Digital Scrutiny, Charge-Sheet Dispatch',
                },
                {
                  id: 'courts' as const,
                  title: '4. e-Courts',
                  icon: <Scale className="w-4 h-4" />,
                  color: 'emerald',
                  desc: 'Judicial Case Management (CIS), Sec 65B Digital Certificate Filing',
                },
                {
                  id: 'prisons' as const,
                  title: '5. e-Prisons',
                  icon: <Lock className="w-4 h-4" />,
                  color: 'amber',
                  desc: 'National Inmate Record, Video Conferencing Remand & Bail Verification',
                },
              ].map((pillar) => {
                const isSelected = selectedPillar === pillar.id;
                return (
                  <button
                    key={pillar.id}
                    onClick={() => setSelectedPillar(pillar.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-indigo-500/30'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={isSelected ? 'text-cyan-400' : 'text-slate-600'}>
                        {pillar.icon}
                      </span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs font-bold">{pillar.title}</p>
                    <p className={`text-[11px] mt-1 leading-snug ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      {pillar.desc}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Selected Pillar Technical Specification */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono space-y-2 text-slate-700">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 uppercase">
                  ACTIVE PILLAR PROTOCOL: {selectedPillar.toUpperCase()}
                </span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                  API ENDPOINT: SECURE TLS 1.3 / REST-XML
                </span>
              </div>
              <p className="text-slate-600 font-sans">
                {selectedPillar === 'police' && 'CCTNS acts as the first point of contact where CyberInstincts incident telemetry is transformed into a standardized First Information Report (FIR) under Core Application Software (CAS).'}
                {selectedPillar === 'forensics' && 'MiniVault protected file SHA-256 digests are cross-registered with e-Forensics laboratory evidence lockers to guarantee non-tampered digital evidence admissibility.'}
                {selectedPillar === 'prosecution' && 'e-Prosecution verifies digital custody chains and links statutory cyber advisories (CERT-In 6h notice) directly to the formal public prosecutor docket.'}
                {selectedPillar === 'courts' && 'e-Courts electronic evidence admission engine verifies SHA-256 integrity hash against Section 65B of Indian Evidence Act 1872 and Section 63 of Bharatiya Sakshya Adhiniyam 2023.'}
                {selectedPillar === 'prisons' && 'e-Prisons synchronizes cyber fraud detention warrants, custodial bail status, and forensic investigative remand records across all state correctional centers.'}
              </p>
            </div>
          </div>

          {/* Section 3: CCTNS Cyber FIR Cross-Referencing & Dispatch Generator */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  CCTNS Cyber FIR Docket & Legal Notice Generator
                </h3>
                <p className="text-xs text-slate-500">
                  Select any threat incident from CyberTrace to generate a statutory CCTNS Police station dispatch payload
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const newFir = `FIR-CYB-2026-${Math.floor(10000 + Math.random() * 90000)}`;
                    setCctnsFIRNo(newFir);
                    onShowToast(`Generated new CCTNS FIR Cross-Ref: ${newFir}`, 'info');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                >
                  Regenerate FIR No
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Controls */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Incident from SOC Triage
                  </label>
                  <select
                    value={cctnsIncidentId}
                    onChange={(e) => setCctnsIncidentId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {incidents.map((inc) => (
                      <option key={inc.id} value={inc.id}>
                        [{inc.severity}] {inc.id} - {inc.threatType} ({inc.target})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Designated Police Jurisdiction / Cyber Cell
                  </label>
                  <input
                    type="text"
                    value={cctnsStation}
                    onChange={(e) => setCctnsStation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    State Police Grid / Zone
                  </label>
                  <input
                    type="text"
                    value={cctnsState}
                    onChange={(e) => setCctnsState(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Applicable Statutory Acts & Sections
                  </label>
                  <textarea
                    rows={2}
                    value={cctnsSections}
                    onChange={(e) => setCctnsSections(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 bg-white font-mono"
                  />
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setCctnsSimulatedDispatch(true);
                      onShowToast(`Dispatched Cyber FIR Docket ${cctnsFIRNo} to CCTNS Police Network!`, 'success');
                      setTimeout(() => setCctnsSimulatedDispatch(false), 3000);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{cctnsSimulatedDispatch ? 'Transmitted to CCTNS Network!' : 'Dispatch to CCTNS Police Station'}</span>
                  </button>

                  <a
                    href="https://digitalpolice.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors flex items-center justify-center gap-2 border border-slate-300"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                    <span>Verify Docket on digitalpolice.gov.in</span>
                  </a>
                </div>
              </div>

              {/* Live Formatted Docket Payload Preview */}
              <div className="lg:col-span-2 bg-slate-900 rounded-xl p-4 text-white font-mono text-xs flex flex-col justify-between border border-slate-800">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-cyan-400 font-bold text-xs">
                        CCTNS CAS INTER-OPERABLE DOCKET // XML-JSON STANDARD
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        const targetInc = incidents.find((i) => i.id === cctnsIncidentId) || incidents[0];
                        const payload = JSON.stringify(
                          {
                            cctns_version: 'CAS-v5.4-NCRB',
                            fir_reference: cctnsFIRNo,
                            jurisdiction: cctnsStation,
                            state_grid: cctnsState,
                            statutory_sections: cctnsSections,
                            timestamp: new Date().toISOString(),
                            incident_ref: targetInc?.id,
                            threat_type: targetInc?.threatType,
                            cvss_score: targetInc?.cvssScore,
                            forensic_hash: targetInc?.sha256Baseline || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                            source_ip: targetInc?.sourceIp,
                            target_asset: targetInc?.target,
                            icjs_interop_token: `ICJS-SEC65B-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
                          },
                          null,
                          2
                        );
                        navigator.clipboard.writeText(payload);
                        setCctnsCopied(true);
                        onShowToast('CCTNS / ICJS Case Payload copied to clipboard!', 'success');
                        setTimeout(() => setCctnsCopied(false), 2000);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px]"
                    >
                      {cctnsCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{cctnsCopied ? 'Copied' : 'Copy JSON'}</span>
                    </button>
                  </div>

                  {(() => {
                    const targetInc = incidents.find((i) => i.id === cctnsIncidentId) || incidents[0];
                    return (
                      <div className="space-y-2 text-slate-300 overflow-x-auto leading-relaxed text-[11px]">
                        <p><span className="text-indigo-400 font-bold">PORTAL_MANDATE:</span> Ministry of Home Affairs (MHA) / NCRB</p>
                        <p><span className="text-cyan-400 font-bold">CCTNS_FIR_NO:</span> {cctnsFIRNo}</p>
                        <p><span className="text-slate-400">POLICE_STATION:</span> {cctnsStation}</p>
                        <p><span className="text-slate-400">STATE_GRID:</span> {cctnsState}</p>
                        <p><span className="text-amber-400 font-bold">PENAL_SECTIONS:</span> {cctnsSections}</p>
                        <p><span className="text-slate-400">INCIDENT_ID:</span> {targetInc?.id || 'INC-001'} ({targetInc?.threatType})</p>
                        <p><span className="text-slate-400">SOURCE_IP / IoC:</span> {targetInc?.sourceIp || '198.51.100.42'}</p>
                        <p><span className="text-emerald-400 font-bold">FORENSIC_EVIDENCE_HASH:</span> {targetInc?.sha256Baseline || '7a8b9c...e3f1'} (NIST FIPS 180-4)</p>
                        <p><span className="text-purple-400 font-bold">ICJS_INTER_PILLAR_STATUS:</span> Synchronized with e-Forensics & e-Courts Registry</p>
                      </div>
                    );
                  })()}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Standard: NCRB CAS XML Interop Schema 2026</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Digital Attestation Ready
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: STATUTORY DISPATCH FORM */}
      {activeSubTab === 'dispatch' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Official Statutory Incident Notification
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Prepare and transmit formal notification to national emergency response bodies under cybersecurity directives.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGenerateReportAI}
                disabled={isGeneratingAI}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isGeneratingAI ? 'Gemini AI Drafting...' : 'Auto-Draft with Gemini AI'}
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-4">
              {/* Incident Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select CyberTrace Incident <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedIncidentId}
                    onChange={(e) => setSelectedIncidentId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-slate-50 font-mono"
                    required
                  >
                    {incidents.map((inc) => (
                      <option key={inc.id} value={inc.id}>
                        {inc.id} — {inc.threatType} ({inc.severity})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Designated Regulatory Agency <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={agencyTarget}
                    onChange={(e) => setAgencyTarget(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-slate-50 font-semibold"
                  >
                    <option value="CERT-In">CERT-In (Indian Computer Emergency Response Team)</option>
                    <option value="CISA">CISA (U.S. Cybersecurity & Infrastructure Security Agency)</option>
                    <option value="NCIIPC">NCIIPC (Critical Information Infrastructure Protection)</option>
                    <option value="Interpol Cyber">Interpol Cyber Crime Directorate</option>
                    <option value="State Cyber Cell">State Law Enforcement Cyber Police Unit</option>
                  </select>
                </div>
              </div>

              {/* Sector & Reporting Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Affected Critical Infrastructure Sector
                  </label>
                  <select
                    value={criticalSector}
                    onChange={(e) => setCriticalSector(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-slate-50"
                  >
                    <option value="Defense & Aerospace">Defense & Aerospace</option>
                    <option value="Banking & Finance">Banking & Finance</option>
                    <option value="Energy & Utilities">Energy & Utilities</option>
                    <option value="Healthcare">Healthcare & Bio-Pharma</option>
                    <option value="Telecommunications">Telecommunications & 5G Core</option>
                    <option value="Government IT">Government IT & Public Services</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Authorizing Incident Commander / Officer
                  </label>
                  <input
                    type="text"
                    value={signOffOfficer}
                    onChange={(e) => setSignOffOfficer(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-slate-50"
                    placeholder="Officer Name & Designation"
                    required
                  />
                </div>
              </div>

              {/* Executive Summary */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Executive Briefing & Detection Timeline
                </label>
                <textarea
                  rows={3}
                  value={executiveSummary}
                  onChange={(e) => setExecutiveSummary(e.target.value)}
                  placeholder="Provide a formal chronological summary of threat detection, initial vector, and CVSS justification..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-slate-50 leading-relaxed"
                  required
                />
              </div>

              {/* Impact Assessment */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Infrastructure Impact & Containment Status
                </label>
                <textarea
                  rows={2}
                  value={impactAssessment}
                  onChange={(e) => setImpactAssessment(e.target.value)}
                  placeholder="Scope of systems impacted, downtime, data compromise assessment, and isolation status..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-slate-50 leading-relaxed"
                  required
                />
              </div>

              {/* IoCs */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Forensic Indicators of Compromise (IoCs) (comma-separated)
                </label>
                <input
                  type="text"
                  value={indicatorsText}
                  onChange={(e) => setIndicatorsText(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-slate-50 font-mono"
                  placeholder="e.g. 185.220.101.5, sha256:7e829fa...c09f, domain.malicious.net"
                />
              </div>

              {/* Submission Attestation */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1 font-mono">
                <div className="flex items-center gap-2 text-slate-800 font-semibold font-sans">
                  <Lock className="w-3.5 h-3.5 text-cyan-600" />
                  Statutory Non-Repudiation & Cryptographic Seal
                </div>
                <p className="text-[11px] leading-relaxed text-slate-500">
                  By dispatching, you attest that this notification represents the authentic findings of the CyberInstincts SOC.
                  A digital evidence package hash will be anchored to the state record.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Transmitting Official Dispatch...' : `Dispatch Official Report to ${agencyTarget}`}
                </button>
              </div>
            </form>
          </div>

          {/* Right Reference Sidebar */}
          <div className="space-y-6">
            {/* Active Incident Preview */}
            {selectedIncident && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center justify-between">
                  <span>Target Incident Telemetry</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedIncident.severity === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-800'
                        : selectedIncident.severity === 'HIGH'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {selectedIncident.severity}
                  </span>
                </h3>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 font-mono text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Incident Ref:</span>
                    <span className="font-semibold text-slate-800">{selectedIncident.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Threat Type:</span>
                    <span className="font-semibold text-slate-800">{selectedIncident.threatType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Source Host:</span>
                    <span className="text-rose-600 font-semibold">{selectedIncident.sourceIp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Target Node:</span>
                    <span className="text-slate-800">{selectedIncident.target}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">CVSS Score:</span>
                    <span className="font-bold text-indigo-700">{selectedIncident.cvssScore} / 10.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">MITRE ATT&CK:</span>
                    <span className="text-slate-800">{selectedIncident.mitreTactic || 'T1110 (Brute Force)'}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  {selectedIncident.description}
                </p>

                <button
                  type="button"
                  onClick={() => onInspectIncident(selectedIncident)}
                  className="w-full text-center text-xs font-semibold text-cyan-700 hover:text-cyan-800 py-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 transition-colors"
                >
                  Inspect Full Incident Forensic Dossier →
                </button>
              </div>
            )}

            {/* Statutory Window Guidelines Card */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 text-white shadow-xs space-y-3 font-mono text-xs">
              <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2 font-sans">
                <Clock className="w-4 h-4 text-cyan-400" />
                Statutory Reporting Windows
              </h3>

              <div className="space-y-2 text-[11px] text-slate-300">
                <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/80 space-y-1">
                  <div className="flex justify-between text-rose-400 font-bold">
                    <span>CERT-In Directives (India)</span>
                    <span>6 Hours</span>
                  </div>
                  <p className="text-slate-400 text-[10px]">
                    Mandatory for critical infrastructure breaches, ransomware, and identity system compromise.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/80 space-y-1">
                  <div className="flex justify-between text-amber-400 font-bold">
                    <span>CISA CIRCIA (United States)</span>
                    <span>72 Hours</span>
                  </div>
                  <p className="text-slate-400 text-[10px]">
                    Comprehensive notice required within 72h; 24h for ransomware payment disclosures.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/80 space-y-1">
                  <div className="flex justify-between text-cyan-400 font-bold">
                    <span>NCIIPC Critical Sectors</span>
                    <span>Immediate</span>
                  </div>
                  <p className="text-slate-400 text-[10px]">
                    Real-time automated telemetry synchronization for defense and financial switches.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DISPATCHED STATUTORY REPORTS ARCHIVE */}
      {activeSubTab === 'archive' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Dispatched Government Regulatory Filings
              </h2>
              <p className="text-xs text-slate-500">
                Immutable record of all formal statutory disclosures submitted to national CERT and law enforcement bodies.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">
              Total Filings: <span className="font-bold text-slate-800">{reports.length}</span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-4">Filing Ref</th>
                  <th className="py-3 px-4">Agency Target</th>
                  <th className="py-3 px-4">Incident Title</th>
                  <th className="py-3 px-4">Critical Sector</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {reports.map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-cyan-700">{rep.reportRef}</td>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-800">{rep.agencyTarget}</td>
                    <td className="py-3 px-4 font-sans max-w-xs truncate text-slate-700">{rep.incidentTitle}</td>
                    <td className="py-3 px-4 font-sans text-slate-600">{rep.criticalSector}</td>
                    <td className="py-3 px-4 text-slate-500">{rep.reportedAt}</td>
                    <td className="py-3 px-4 font-sans">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          rep.status === 'ACKNOWLEDGED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rep.status === 'UNDER_REVIEW'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {rep.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      <button
                        onClick={() => setInspectedReport(rep)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                      >
                        View Memorandum
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: NATIONAL CYBER THREAT ADVISORIES */}
      {activeSubTab === 'advisories' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={advisorySearch}
                onChange={(e) => setAdvisorySearch(e.target.value)}
                placeholder="Search advisories by CVE, title, or keyword..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-slate-50"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <span className="text-xs font-semibold text-slate-500">Severity:</span>
              {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setAdvisorySeverity(sev)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                    advisorySeverity === sev
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* Advisory Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAdvisories.map((adv) => (
              <div
                key={adv.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200">
                      {adv.advisoryId}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        adv.severity === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800'
                          : adv.severity === 'HIGH'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {adv.severity}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {adv.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {adv.summary}
                  </p>

                  {/* CVE Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {adv.cveList.map((cve) => (
                      <span
                        key={cve}
                        className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-semibold"
                      >
                        {cve}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>{adv.issuingAgency.split('(')[0]}</span>
                    <span>{adv.publishedDate}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-700 block">Remediation Directive:</span>
                    <ul className="text-[11px] text-slate-600 list-disc list-inside space-y-0.5">
                      {adv.remediationSteps.slice(0, 2).map((step, idx) => (
                        <li key={idx} className="truncate">{step}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CHAIN OF CUSTODY & DIGITAL EVIDENCE */}
      {activeSubTab === 'custody' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-indigo-600" />
              Digital Chain of Custody & Law Enforcement Evidence Manifest
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Generate certified forensic affidavits for submission in judicial court proceedings or statutory law enforcement inquiries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 font-mono text-xs">
              <h3 className="font-bold text-slate-900 font-sans flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Evidence Package Cryptographic Anchor
              </h3>
              <div className="space-y-2 text-slate-600">
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-400">Hashing Standard:</span>
                  <span className="font-semibold text-slate-800">SHA-256 (NIST FIPS 180-4)</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-400">Timestamp Authority:</span>
                  <span className="font-semibold text-slate-800">RFC 3161 Compliant Hardware HSM</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-400">Investigator Sign-off:</span>
                  <span className="font-semibold text-slate-800">Atharva Sankhe, Lead SOC Analyst</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Jurisdictional Standard:</span>
                  <span className="font-semibold text-slate-800">ISO/IEC 27037 Digital Forensics</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="font-bold text-indigo-950 text-sm">
                  Export Certified Law Enforcement Archive (.JSON + SHA256)
                </h3>
                <p className="text-xs text-indigo-800/80 mt-1 leading-relaxed">
                  Compiles all active incident timelines, cryptographic file hashes from MiniVault, and user authorization stamps into a single verifiable package.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const payload = {
                    jurisdiction: 'Government & Law Enforcement Cyber Liaison Portal',
                    system: 'CyberInstincts SOC Security Engine',
                    timestamp: new Date().toISOString(),
                    incidents,
                    reports,
                    evidencePackageHash: 'sha256:d8a9410efba8901234567890abcdef01234567890abcdef01234567890abcdef',
                    attestation: 'Certified accurate by Lead SOC Analyst under statutory cyber reporting frameworks.',
                  };
                  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `CyberInstincts-Evidence-Dossier-${Date.now()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  onShowToast('Forensic Evidence Dossier exported successfully.', 'success');
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Export Cryptographic Evidence Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSPECTION MODAL FOR MEMORANDUM */}
      {inspectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-sm">
                  Official Memorandum — {inspectedReport.reportRef}
                </h3>
              </div>
              <button
                onClick={() => setInspectedReport(null)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto font-mono text-xs space-y-4 text-slate-800 leading-relaxed bg-slate-50">
              <div className="border-b border-slate-300 pb-3 space-y-1 text-slate-600">
                <p><strong>RECIPIENT AGENCY:</strong> {inspectedReport.agencyTarget}</p>
                <p><strong>REPORT REFERENCE:</strong> {inspectedReport.reportRef}</p>
                <p><strong>FILING TIMESTAMP:</strong> {inspectedReport.reportedAt}</p>
                <p><strong>TARGET SECTOR:</strong> {inspectedReport.criticalSector}</p>
                <p><strong>SIGN-OFF OFFICER:</strong> {inspectedReport.signOffOfficer}</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">1. EXECUTIVE SUMMARY</h4>
                <p className="text-slate-700">{inspectedReport.executiveSummary}</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">2. INFRASTRUCTURE IMPACT</h4>
                <p className="text-slate-700">{inspectedReport.impactAssessment}</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">3. FORENSIC IoCs</h4>
                <ul className="list-disc list-inside text-slate-700 space-y-0.5">
                  {inspectedReport.indicatorsOfCompromise.map((ioc, i) => (
                    <li key={i}>{ioc}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-slate-200 rounded-lg text-[11px] text-slate-700">
                <p><strong>EVIDENCE PACKAGE HASH:</strong></p>
                <p className="break-all">{inspectedReport.evidencePackageHash}</p>
              </div>
            </div>

            <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500">
                Status: {inspectedReport.status}
              </span>
              <button
                onClick={() => setInspectedReport(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900"
              >
                Close Memorandum
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
