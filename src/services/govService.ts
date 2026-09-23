import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './firebase/config';
import { GovernmentReport, GovernmentAdvisory, CyberIncident } from '../types';

export const INITIAL_ADVISORIES: GovernmentAdvisory[] = [
  {
    id: 'ADV-CERT-2026-089',
    advisoryId: 'CERT-In CI-2026-0089',
    issuingAgency: 'CERT-In (Indian Computer Emergency Response Team)',
    title: 'Critical Remote Code Execution in Linux Kernel eBPF Subsystem',
    severity: 'CRITICAL',
    publishedDate: '2026-09-15',
    affectedSystems: ['Linux Kernel 6.1 through 6.8', 'Enterprise Gateway Routers', 'Kubernetes Ingress Nodes'],
    cveList: ['CVE-2026-38102', 'CVE-2026-38104'],
    summary: 'A boundary check flaw in the kernel eBPF verifier allows unprivileged local or network authenticated attackers to achieve kernel memory corruption and arbitrary code execution.',
    remediationSteps: [
      'Apply vendor kernel patch release immediately (>= 6.8.4-stable).',
      'Disable unprivileged eBPF execution: sysctl -w kernel.unprivileged_bpf_disabled=1.',
      'Verify MiniVault system binary digests for unexpected runtime alterations.',
    ],
    bulletinUrl: 'https://www.cert-in.org.in',
  },
  {
    id: 'ADV-CISA-2026-042',
    advisoryId: 'CISA Alert AA26-042A',
    issuingAgency: 'CISA (Cybersecurity & Infrastructure Security Agency)',
    title: 'Active Exploitation of Edge VPN Appliance Authentication Bypass',
    severity: 'HIGH',
    publishedDate: '2026-09-12',
    affectedSystems: ['SSL-VPN Perimeter Gateways', 'Remote Access Concentrators'],
    cveList: ['CVE-2026-21890'],
    summary: 'Threat actors are actively leveraging an authentication bypass vulnerability to hijack active VPN administrative sessions and exfiltrate enterprise cryptographic keys.',
    remediationSteps: [
      'Enforce hardware FIDO2 MFA across all administrative ingress ports.',
      'Inspect perimeter firewall logs for anomalous outbound TLS sessions on port 8443.',
      'Audit MiniVault enrolled VPN server configuration baselines.',
    ],
    bulletinUrl: 'https://www.cisa.gov',
  },
  {
    id: 'ADV-NCIIPC-2026-015',
    advisoryId: 'NCIIPC Threat Bulletin TB-26-015',
    issuingAgency: 'NCIIPC (National Critical Information Infrastructure Protection Centre)',
    title: 'Targeted Distributed Denial of Service & Credential Stuffing against Financial APIs',
    severity: 'MEDIUM',
    publishedDate: '2026-09-08',
    affectedSystems: ['Banking Gateway Endpoints', 'Core Financial API Switches'],
    cveList: ['CVE-2026-10443'],
    summary: 'Coordinated botnet infrastructure conducting slow-rate brute force credential stuffing combined with volumetric Layer-7 HTTP flood attacks against banking switches.',
    remediationSteps: [
      'Implement adaptive rate limiting (Token Bucket algorithm) on authentication endpoints.',
      'Deploy behavioral IP reputation filters at edge Cloudflare/WAF layers.',
      'Mandate statutory incident reporting if downtime exceeds 15 continuous minutes.',
    ],
    bulletinUrl: 'https://nciipc.gov.in',
  },
];

export const INITIAL_GOV_REPORTS: GovernmentReport[] = [
  {
    id: 'REP-CERTIN-9102',
    reportRef: 'CERT-IN-2026-9102',
    incidentId: 'INC-9821',
    agencyTarget: 'CERT-In',
    reportingAgency: 'CyberInstincts Defense SOC',
    criticalSector: 'Defense & Aerospace',
    incidentTitle: 'Automated Brute Force & Credential Stuffing Surge on SSH Gateway',
    severity: 'CRITICAL',
    mandatedWindowHours: 6,
    reportedAt: '2026-09-16 14:22:10 UTC',
    status: 'ACKNOWLEDGED',
    executiveSummary: 'Statutory notification submitted adhering to CERT-In 6-hour cybersecurity direction. 1,400+ unauthorized SSH authorization attempts detected from origin 185.220.101.5.',
    impactAssessment: 'Zero credentials compromised. Perimeter ingress isolated and automated dynamic block rules propagated.',
    indicatorsOfCompromise: ['185.220.101.5', '185.220.101.8', 'sha256:7e82...c09f'],
    evidencePackageHash: 'sha256:9f8a27d14210a9918239acbd00129487efba90123456789abcdef0123456789a',
    signOffOfficer: 'Atharva Sankhe, Lead SOC Analyst',
  },
  {
    id: 'REP-CISA-8841',
    reportRef: 'CISA-2026-8841',
    incidentId: 'INC-9823',
    agencyTarget: 'CISA',
    reportingAgency: 'CyberInstincts Defense SOC',
    criticalSector: 'Banking & Finance',
    incidentTitle: 'Cryptographic Hash Mismatch Detected in Core Financial Switch Inode',
    severity: 'HIGH',
    mandatedWindowHours: 24,
    reportedAt: '2026-09-14 09:15:00 UTC',
    status: 'UNDER_REVIEW',
    executiveSummary: 'MiniVault integrity sweep identified unauthorized live hash modification in payment-gateway-config.json. Inode reverted to NIST baseline.',
    impactAssessment: 'Production financial payload protected. Tampered container quarantined and destroyed.',
    indicatorsOfCompromise: ['10.0.1.44', 'sha256:ff90...beef'],
    evidencePackageHash: 'sha256:4b830192a01f9487bc0019283471029384756102938475610293847561029384',
    signOffOfficer: 'Atharva Sankhe, Lead SOC Analyst',
  },
];

export async function getGovernmentReports(): Promise<GovernmentReport[]> {
  try {
    const colRef = collection(db, 'government_reports');
    const q = query(colRef, orderBy('reportedAt', 'desc'), limit(50));
    const snap = await getDocs(q);

    if (snap.empty) {
      // Seed initial reports
      try {
        for (const rep of INITIAL_GOV_REPORTS) {
          await setDoc(doc(db, 'government_reports', rep.id), rep);
        }
      } catch (e) {
        console.warn('Seeding government reports note:', e);
      }
      return INITIAL_GOV_REPORTS;
    }

    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<GovernmentReport, 'id'>),
    }));
  } catch (err) {
    console.warn('Firestore getGovernmentReports fallback:', err);
    return INITIAL_GOV_REPORTS;
  }
}

export async function submitGovernmentReport(
  report: Omit<GovernmentReport, 'id' | 'reportedAt'>
): Promise<GovernmentReport> {
  const id = `REP-${report.agencyTarget.replace(/[^A-Z]/g, '')}-${Date.now().toString().slice(-4)}`;
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  const newReport: GovernmentReport = {
    ...report,
    id,
    reportedAt: now,
  };

  try {
    await setDoc(doc(db, 'government_reports', id), newReport);
  } catch (err) {
    console.warn('Could not save government report to Firestore:', err);
  }

  return newReport;
}

export async function getGovernmentAdvisories(): Promise<GovernmentAdvisory[]> {
  try {
    const colRef = collection(db, 'government_advisories');
    const q = query(colRef, orderBy('publishedDate', 'desc'), limit(20));
    const snap = await getDocs(q);

    if (snap.empty) {
      try {
        for (const adv of INITIAL_ADVISORIES) {
          await setDoc(doc(db, 'government_advisories', adv.id), adv);
        }
      } catch (e) {
        console.warn('Seeding government advisories note:', e);
      }
      return INITIAL_ADVISORIES;
    }

    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<GovernmentAdvisory, 'id'>),
    }));
  } catch (err) {
    console.warn('Firestore getGovernmentAdvisories fallback:', err);
    return INITIAL_ADVISORIES;
  }
}
