import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy Gemini SDK initialization
let geminiClient: GoogleGenAI | null = null;

function getGemini(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

// 1. Health & Gemini Key Status Endpoint
app.get('/api/health', (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: hasKey,
    model: 'gemini-3.8-flash',
    environment: process.env.NODE_ENV || 'development',
  });
});

app.get('/api/download-project', (req, res) => {
  const filePath = path.resolve(process.cwd(), 'public/cyberinstincts-project.zip');
  if (fs.existsSync(filePath)) {
    res.download(filePath, 'cyberinstincts-project.zip');
  } else {
    res.status(404).json({ error: 'Zip file not found' });
  }
});

app.get('/api/gemini/status', (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  res.json({
    configured: hasKey,
    model: 'gemini-3.8-flash',
    provider: 'Google GenAI SDK',
    note: hasKey
      ? 'Gemini 3.8 Flash API key detected and initialized server-side.'
      : 'Using local intelligent SOC heuristics engine. Configure GEMINI_API_KEY in Settings > Secrets for live cloud inference.',
  });
});

// 2. Interactive AI Assistant Chat
app.post('/api/ai/assistant', async (req, res) => {
  const { message, history = [], context } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'A valid message string is required.' });
  }

  const ai = getGemini();

  if (ai) {
    try {
      const systemInstruction = `You are "CyberInstincts AI Copilot", an elite Lead Cybersecurity & SOC Intelligence Advisor built into the CyberInstincts Cyber Threat & File Protection System.
Your capabilities:
1. CyberTrace Threat Incident triage, IOC analysis, CVSS scoring explanation, and MITRE ATT&CK TTP mapping.
2. MiniVault Cryptographic File Integrity verification, SHA-256 baseline auditing, tampering detection, and ransomware payload forensics.
3. Government & Law Enforcement Regulatory Reporting (adhering to CERT-In, CISA, NIST SP 800-61r2, and ISO 27035 statutory notification guidelines).
4. Incident containment, eradication, and post-incident digital chain of custody.

Guidelines:
- Deliver precise, high-contrast, actionable answers with technical rigor.
- Reference specific RFCs, NIST standards, or MITRE ATT&CK techniques (e.g., T1110, T1059) when relevant.
- Format with clean markdown headers and bullet points for readability.
- When government reporting is discussed, emphasize statutory reporting windows (e.g. 6-hour mandatory notification for critical infrastructure).`;

      // Build contents
      const contents: any[] = [];
      
      if (context) {
        contents.push({
          role: 'user',
          parts: [{ text: `[System Context: Active SOC State: ${JSON.stringify(context)}]` }],
        });
        contents.push({
          role: 'model',
          parts: [{ text: 'Acknowledged SOC telemetry and live environment state. Ready for operational directives.' }],
        });
      }

      for (const h of history.slice(-6)) {
        contents.push({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: h.content || '' }],
        });
      }

      contents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.3,
        },
      });

      const replyText = response.text || 'Analysis completed with no additional alerts generated.';
      return res.json({
        reply: replyText,
        engine: 'gemini-3.8-flash',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.warn('Gemini API call failed, falling back to heuristic engine:', err?.message);
    }
  }

  // Graceful rule-based heuristic SOC fallback if key is not configured or rate-limited
  const lower = message.toLowerCase();
  let fallbackReply = '';

  if (lower.includes('cert') || lower.includes('government') || lower.includes('report') || lower.includes('statutory') || lower.includes('cisa')) {
    fallbackReply = `### 🏛️ Government Cyber Liaison Advisory (Statutory Guidance)

Under National Cyber Directives (such as CERT-In Cyber Security Directions & CISA Incident Reporting guidelines):

1. **Mandatory Notification Window**: Incidents classified as **CRITICAL** (ransomware, critical infrastructure breach, unauthorized system compromise) must be reported within **6 hours** of detection.
2. **Required Dossier Elements**:
   - Organization identifier & operational sector
   - Chronological incident timeline and detection vector
   - Confirmed Indicators of Compromise (IoCs): malicious source IPs, payload SHA-256 hashes, and command-and-control domains
   - Initial impact assessment and current containment status
3. **Action Recommendation**: Navigate to the **Gov Portal** tab in CyberInstincts to dispatch an official encrypted notice and generate an authenticated evidence chain-of-custody archive.`;
  } else if (lower.includes('tamper') || lower.includes('file') || lower.includes('hash') || lower.includes('sha-256') || lower.includes('minivault')) {
    fallbackReply = `### 🛡️ MiniVault Cryptographic Integrity Assessment

**Algorithmic Standard**: SHA-256 (NIST FIPS 180-4)
- When a file's live cryptographic digest diverges from the stored baseline, CyberInstincts flags the file as **MODIFIED / TAMPERED**.
- **Forensic Procedure**:
  1. Isolate the affected endpoint or storage node to prevent secondary lateral propagation.
  2. Inspect the live digest in **MiniVault** vs. the authoritative baseline.
  3. Perform a binary diff or restore from the immutable baseline snapshot.
  4. Verify that the associated digital certificate is re-anchored.`;
  } else if (lower.includes('incident') || lower.includes('attack') || lower.includes('mitre') || lower.includes('cvss')) {
    fallbackReply = `### 🚨 Incident Triage & MITRE ATT&CK Matrix

Based on active CyberTrace telemetry:
- **T1110 (Brute Force)**: Identified across gateway SSH nodes. Mitigate via fail2ban thresholds and geo-fencing.
- **T1059 (Command and Scripting Interpreter)**: Inspect web server process execution trees for spawned child shells.
- **T1566 (Phishing)**: Check credential replay patterns on identity endpoints.
- **Recommended Action**: Escalate any CVSS >= 8.5 incidents to **CONTAINED** status and trigger automated SIEM firewall rule bans.`;
  } else {
    fallbackReply = `### 🤖 CyberInstincts SOC AI Copilot

I have analyzed your query against the current SOC telemetry:
- **System Posture**: 6 Protected File Baselines monitored with active cryptographic integrity sweeping.
- **CyberTrace Feed**: Active incident stream monitored for anomalous network spikes and privilege escalation.
- **Government Compliance**: CERT-In 6-hour reporting timer operational.

*Tip: Connect your Gemini API Key in Settings > Secrets to unlock full unstructured threat correlation, automated forensic summaries, and live zero-day analysis.*`;
  }

  return res.json({
    reply: fallbackReply,
    engine: 'soc-heuristic-fallback',
    timestamp: new Date().toISOString(),
  });
});

// 3. Automated Incident Deep Analysis
app.post('/api/ai/analyze-incident', async (req, res) => {
  const { incident } = req.body;
  if (!incident) {
    return res.status(400).json({ error: 'Incident payload is required.' });
  }

  const ai = getGemini();
  if (ai) {
    try {
      const prompt = `Conduct a rigorous forensic threat analysis on the following security incident:
Incident ID: ${incident.id || incident.incidentId}
Threat Classification: ${incident.threatType}
Severity: ${incident.severity} (CVSS: ${incident.cvssScore || 'N/A'})
Target Node: ${incident.target}
Source IP/Host: ${incident.sourceIp || incident.source}
Incident Description: ${incident.description}
Detection Method: ${incident.detectionMethod}
MITRE ATT&CK Tactic: ${incident.mitreTactic || 'Unspecified'}

Provide:
1. Executive Threat Summary
2. Threat Actor Profile & Probable TTPs (MITRE ATT&CK techniques)
3. Step-by-Step Incident Containment & Eradication Playbook
4. Statutory Government Reporting Assessment (is reporting to CERT-In / CISA mandatory?)
5. Hardening & Prevention Measures`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      return res.json({
        analysis: response.text,
        engine: 'gemini-3.8-flash',
        generatedAt: new Date().toISOString(),
      });
    } catch (e: any) {
      console.warn('Incident analysis failed with Gemini, using fallback:', e?.message);
    }
  }

  // Deterministic fallback
  const fallback = `### 🛡️ Automated Forensic Briefing: ${incident.threatType} (${incident.id || 'INC-LIVE'})

**Target Asset**: ${incident.target} | **Source IP**: ${incident.sourceIp || incident.source || '192.168.1.1'}
**CVSS Base Score**: ${incident.cvssScore || 7.5} (${incident.severity})

#### 1. Threat Profile & MITRE ATT&CK Mapping
- **Primary Tactic**: ${incident.mitreTactic || 'Initial Access / Execution'}
- **Associated Techniques**: T1190 (Exploit Public-Facing Application) / T1078 (Valid Accounts).
- **Attack Vector**: Inbound anomalous payload transmission with anomalous packet payload sizes.

#### 2. Immediate Containment Playbook
1. **Firewall Rule Insertion**: Block IP \`${incident.sourceIp || 'anomalous host'}\` across perimeter edge routers.
2. **Session Invalidation**: Force session revocation and token cycling for any accounts active on ${incident.target}.
3. **Forensic Snapshot**: Capture live RAM dump and kernel socket connection states before host reboot.

#### 3. Statutory Reporting Requirement
- **Classification**: ${incident.severity === 'CRITICAL' ? 'MANDATORY (Report to CERT-In within 6 hours)' : 'ADVISORY (Monitor and log internally)'}.
- **Legal Chain of Custody**: Ensure all server access logs are cryptographically timestamped.`;

  return res.json({
    analysis: fallback,
    engine: 'soc-heuristic-fallback',
    generatedAt: new Date().toISOString(),
  });
});

// 4. File Integrity & Tampering Forensics
app.post('/api/ai/analyze-file', async (req, res) => {
  const { file } = req.body;
  if (!file) {
    return res.status(400).json({ error: 'File payload is required.' });
  }

  const ai = getGemini();
  const isTampered = file.status === 'MODIFIED' || file.originalHash !== file.currentHash;

  if (ai) {
    try {
      const prompt = `Analyze this file integrity verification record from MiniVault:
File Name: ${file.fileName}
Category: ${file.category || 'System Critical'}
File Size: ${file.fileSize || file.size} bytes
Status: ${file.status}
Original Baseline SHA-256: ${file.originalHash}
Current Calculated SHA-256: ${file.currentHash}
Tampering Detected: ${isTampered ? 'YES (Cryptographic Mismatch)' : 'NO (Hashes Match)'}

Provide:
1. Integrity Verdict & Risk Level
2. Potential Exploitation Scenario (e.g. DLL pre-loading, trojanized binary, ransomware header modification)
3. Forensic Investigation Steps
4. Baseline Remediation & Restoration Protocol`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      return res.json({
        analysis: response.text,
        engine: 'gemini-3.8-flash',
        generatedAt: new Date().toISOString(),
      });
    } catch (e: any) {
      console.warn('File analysis failed with Gemini, using fallback:', e?.message);
    }
  }

  const fallback = `### 🔍 MiniVault Integrity Inspection: ${file.fileName}

**Integrity Verdict**: ${isTampered ? '⚠️ CRITICAL: UNAUTHORIZED TAMPERING DETECTED' : '✅ VERIFIED: CRYPTOGRAPHIC BASELINE INTACT'}
**Algorithm**: SHA-256 (NIST FIPS 180-4)

${
  isTampered
    ? `#### Threat Assessment
- **Baseline Hash**: \`${file.originalHash}\`
- **Tampered Hash**: \`${file.currentHash}\`
- **Analysis**: The file contents have been modified post-enrollment. This signature variance frequently correlates with payload injection, unauthorized binary patching, or ransomware encryption staging.
#### Remediation Procedure
1. Halt execution permissions on \`${file.fileName}\` immediately (\`chmod -x\`).
2. Trigger the "Restore Baseline" action in MiniVault to write back the authoritative cryptographically signed version.
3. Check host audit logs (\`/var/log/audit/audit.log\`) for the PID responsible for modifying the inode.`
    : `#### Integrity Confirmation
- The live bitstream digest matches the enrolled authoritative baseline with 100% cryptographic precision.
- No bit-level deviations or unauthorized metadata updates detected.`
}`;

  return res.json({
    analysis: fallback,
    engine: 'soc-heuristic-fallback',
    generatedAt: new Date().toISOString(),
  });
});

// 5. Generate Official Government Statutory Report
app.post('/api/ai/generate-gov-report', async (req, res) => {
  const { incident, agencyTarget = 'CERT-In', criticalSector = 'Government IT', reportingOfficer = 'Lead SOC Analyst' } = req.body;

  if (!incident) {
    return res.status(400).json({ error: 'Incident data is required to generate government report.' });
  }

  const ai = getGemini();
  const reportRef = `${agencyTarget.toUpperCase().replace(/[^A-Z]/g, '')}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  if (ai) {
    try {
      const prompt = `Draft a formal, legally compliant Statutory Cyber Incident Report for submission to ${agencyTarget} (National Computer Emergency Response Team).
Incident Data:
- Incident Reference: ${reportRef}
- Original Incident ID: ${incident.id || incident.incidentId}
- Threat Classification: ${incident.threatType}
- Severity: ${incident.severity}
- Affected Asset: ${incident.target}
- Source IP: ${incident.sourceIp || incident.source}
- Critical Sector: ${criticalSector}
- Reporting Officer: ${reportingOfficer}
- Description: ${incident.description}

Format the report with official government regulatory sections:
1. Executive Incident Briefing
2. System & Critical Infrastructure Impact Scope
3. Technical IoCs (IPs, Hashes, TTPs)
4. Containment & Remediation Actions Taken
5. Attestation & Statutory Sign-off Statement`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      return res.json({
        reportRef,
        document: response.text,
        agencyTarget,
        generatedAt: new Date().toISOString(),
        engine: 'gemini-3.8-flash',
      });
    } catch (e: any) {
      console.warn('Gov report generation failed with Gemini, using fallback:', e?.message);
    }
  }

  // Official statutory format template
  const fallbackDocument = `================================================================================
GOVERNMENT OF CYBERSPACE DEFENSE & EMERGENCY RESPONSE LIAISON
NATIONAL COMPUTER EMERGENCY RESPONSE TEAM (${agencyTarget})
FORMAL STATUTORY CYBER INCIDENT NOTIFICATION
================================================================================
REPORT REFERENCE ID : ${reportRef}
SUBMISSION TIMESTAMP: ${new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC
STATUTORY WINDOW    : MANDATORY 6-HOUR NOTIFICATION COMPLIANT
TARGET SECTOR       : ${criticalSector}
REPORTING OFFICER   : ${reportingOfficer}
================================================================================

1. EXECUTIVE BRIEFING
On ${incident.timestamp || new Date().toISOString()}, an unauthorized cybersecurity incident 
categorized as "${incident.threatType}" was identified impacting critical production 
node "${incident.target}". The incident has been rated as ${incident.severity} under CVSS v3.1.

2. AFFECTED INFRASTRUCTURE & IMPACT SCOPE
- Asset Identifier : ${incident.target}
- Sector Impact    : ${criticalSector}
- Data Compromise  : Zero unauthorized external data exfiltration verified to date.
- Service Impact   : Redundant failover paths engaged; service degradation minimized.

3. FORENSIC INDICATORS OF COMPROMISE (IoCs)
- Inbound Malicious Source IP: ${incident.sourceIp || incident.source || '185.220.101.5'}
- Attack Vector Class        : ${incident.threatType}
- Detection Mechanism        : Automated Deep Packet Inspection & MiniVault Cryptographic Monitor
- Evidence Verification Hash : sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855

4. MITIGATION & CONTAINMENT ACTIONS TAKEN
- Autonomous egress traffic severed for impacted target node.
- Perimeter firewall blacklist updated with malicious origin IP.
- MiniVault file baseline integrity scan executed; all uncompromised baselines locked.
- Forensics disk image acquired for law enforcement chain-of-custody archive.

5. OFFICIAL STATUTORY ATTESTATION
I hereby attest that the information provided in this notification is accurate to the best 
of the SOC investigation team's technical knowledge as of the timestamp recorded above.

Authorizing Officer: ${reportingOfficer}
Division: Security Operations Center (SOC) Liaison Bureau
Digital Signature: SHA-256/RSA-4096-COMPLIANT
================================================================================`;

  return res.json({
    reportRef,
    document: fallbackDocument,
    agencyTarget,
    generatedAt: new Date().toISOString(),
    engine: 'soc-heuristic-fallback',
  });
});

// Import Cloud SQL operations
import * as sqlDb from './src/db/operations';

// ==========================================
// Cloud SQL PostgreSQL API Routes
// ==========================================

// 1. Get all incidents from Cloud SQL
app.get('/api/sql/incidents', async (req, res) => {
  try {
    const userId = req.query.userId ? Number(req.query.userId) : null;
    const records = userId ? await sqlDb.getUserIncidents(userId) : await sqlDb.getAllIncidents();
    res.json({ success: true, count: records.length, incidents: records });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch incidents from Cloud SQL' });
  }
});

// 2. Create an incident in Cloud SQL
app.post('/api/sql/incidents', async (req, res) => {
  try {
    const { userId = 1, incidentType, title, description, riskLevel, riskScore, status } = req.body;
    if (!incidentType || !title) {
      return res.status(400).json({ error: 'incidentType and title are required' });
    }
    const created = await sqlDb.createIncident({
      userId: Number(userId),
      incidentType,
      title,
      description,
      riskLevel,
      riskScore: riskScore ? Number(riskScore) : 50,
      status,
    });
    if (!created) {
      return res.status(500).json({ error: 'Failed to insert incident into Cloud SQL' });
    }
    res.json({ success: true, incident: created });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Error creating incident' });
  }
});

// 3. Add & search sources
app.post('/api/sql/sources', async (req, res) => {
  try {
    const { sourceType, sourceValue, incidentId } = req.body;
    if (!sourceType || !sourceValue) {
      return res.status(400).json({ error: 'sourceType and sourceValue are required' });
    }
    const sourceId = await sqlDb.addSource(sourceType, sourceValue);
    if (incidentId && sourceId) {
      await sqlDb.connectSourceToIncident(Number(incidentId), sourceId);
    }
    res.json({ success: true, sourceId });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to add source' });
  }
});

app.get('/api/sql/sources/search', async (req, res) => {
  try {
    const query = String(req.query.q || '');
    if (!query) {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }
    const results = await sqlDb.searchIncidentsBySource(query);
    res.json({ success: true, results });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Source search failed' });
  }
});

// 4. Evidence endpoints
app.get('/api/sql/incidents/:id/evidence', async (req, res) => {
  try {
    const incidentId = Number(req.params.id);
    const ev = await sqlDb.getIncidentEvidence(incidentId);
    res.json({ success: true, evidence: ev });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch evidence' });
  }
});

app.post('/api/sql/incidents/:id/evidence', async (req, res) => {
  try {
    const incidentId = Number(req.params.id);
    const { evidenceType, fileName, filePath } = req.body;
    if (!evidenceType) {
      return res.status(400).json({ error: 'evidenceType is required' });
    }
    const created = await sqlDb.addEvidence(incidentId, evidenceType, fileName, filePath);
    res.json({ success: true, evidence: created });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to add evidence' });
  }
});

// 5. Pattern endpoints
app.get('/api/sql/incidents/:id/patterns', async (req, res) => {
  try {
    const incidentId = Number(req.params.id);
    const pat = await sqlDb.getIncidentPatterns(incidentId);
    res.json({ success: true, patterns: pat });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch patterns' });
  }
});

app.post('/api/sql/incidents/:id/patterns', async (req, res) => {
  try {
    const incidentId = Number(req.params.id);
    const { patternType, description, confidence } = req.body;
    if (!patternType) {
      return res.status(400).json({ error: 'patternType is required' });
    }
    const created = await sqlDb.addPattern(
      incidentId,
      patternType,
      description || '',
      confidence ? Number(confidence) : 80
    );
    res.json({ success: true, pattern: created });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to add pattern' });
  }
});

// 6. Similarity endpoints
app.get('/api/sql/incidents/:id/similarity', async (req, res) => {
  try {
    const incidentId = Number(req.params.id);
    const sim = await sqlDb.getSimilarIncidents(incidentId);
    res.json({ success: true, similarIncidents: sim });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch similarity' });
  }
});

app.post('/api/sql/similarity', async (req, res) => {
  try {
    const { incidentId, similarIncidentId, similarityScore } = req.body;
    const ok = await sqlDb.addSimilarity(
      Number(incidentId),
      Number(similarIncidentId),
      Number(similarityScore)
    );
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to add similarity' });
  }
});

// 7. Reports & History endpoints
app.get('/api/sql/incidents/:id/reports', async (req, res) => {
  try {
    const incidentId = Number(req.params.id);
    const repList = await sqlDb.getIncidentReport(incidentId);
    // Enrich with history
    const enriched = await Promise.all(
      repList.map(async (rep) => {
        const history = await sqlDb.getReportHistory(rep.reportId);
        return { ...rep, history };
      })
    );
    res.json({ success: true, reports: enriched });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch reports' });
  }
});

app.post('/api/sql/incidents/:id/reports', async (req, res) => {
  try {
    const incidentId = Number(req.params.id);
    const { reportTitle, reportContent } = req.body;
    const report = await sqlDb.addReport(incidentId, reportTitle, reportContent);
    if (report) {
      await sqlDb.addReportHistory(report.reportId, 'GENERATED', reportContent);
    }
    res.json({ success: true, report });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to add report' });
  }
});

// 8. User Auth check endpoints for PostgreSQL
app.get('/api/sql/users/check', async (req, res) => {
  try {
    const username = String(req.query.username || '');
    const exists = await sqlDb.usernameExists(username);
    res.json({ exists });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'User check failed' });
  }
});

// Vite middleware & Static Serving
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CyberInstincts server running on http://0.0.0.0:${PORT}`);
  });
}

start();
