# CyberInstincts
**Cyber Threat & File Protection System**  
*Enterprise Security Operations Center*

CyberInstincts is an integrated cybersecurity operations center (SOC) and cryptographic file integrity monitoring system designed to monitor cyber incidents, conduct threat analysis, and secure critical system files against unauthorized modification.

---

### Key Pillars & Engineering Concepts
1. **Cryptographic File Integrity (MiniVault)**
   - FIPS 180-4 SHA-256 digest hashing
   - Baseline hash snapshotting and continuous live verification
   - Real-time tamper detection alerting and cryptographic diff inspection
2. **Cyber Incident Triage & Analysis (CyberTrace)**
   - Structured incident lifecycle: `Detected → Analyzed → Investigating → Mitigated → Resolved`
   - CVSS-based severity scoring and MITRE ATT&CK tactic categorization
   - Incident audit trails with evidence attachment
3. **Security Score Engine**
   - Transparent 0–100 application-level health score
   - Evaluated across file integrity status, unresolved critical threats, and active incident volume
4. **Full-Stack Architecture**
   - **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Web Crypto API
   - **Backend**: Python 3.12 (FastAPI), AsyncIO, Max-Heap Priority Queues
   - **Database**: PostgreSQL 16 with `pgcrypto` and `pg_audit` extensions
