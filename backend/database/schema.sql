-- ============================================================================
-- CyberInstincts Database Schema (PostgreSQL 16+)
-- Cyber Threat & File Protection Operations System
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum types for strict cybersecurity categorization
CREATE TYPE threat_severity AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
CREATE TYPE incident_status AS ENUM ('INVESTIGATING', 'RESOLVED', 'MONITORING', 'MITIGATED');
CREATE TYPE threat_category AS ENUM (
    'Malware', 'Phishing', 'Brute Force', 'Suspicious Login',
    'Unauthorized Access', 'File Tampering', 'Unknown Threat'
);
CREATE TYPE file_status AS ENUM ('VERIFIED', 'MODIFIED', 'MISSING', 'WARNING');

-- 1. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(128) NOT NULL,
    username VARCHAR(64) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(64) DEFAULT 'Security Analyst',
    department VARCHAR(128) DEFAULT 'SOC Operations',
    mfa_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- 2. Cyber Incidents Table
CREATE TABLE cyber_incidents (
    id VARCHAR(32) PRIMARY KEY, -- e.g. INC-001
    threat_type threat_category NOT NULL,
    source_ip VARCHAR(64) NOT NULL,
    target VARCHAR(255) NOT NULL,
    severity threat_severity NOT NULL,
    status incident_status DEFAULT 'INVESTIGATING',
    description TEXT NOT NULL,
    detection_method VARCHAR(255) NOT NULL,
    evidence TEXT,
    resolution TEXT,
    cvss_score NUMERIC(3, 1),
    mitre_tactic VARCHAR(128),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 3. Incident Action Timeline
CREATE TABLE incident_timeline_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id VARCHAR(32) REFERENCES cyber_incidents(id) ON DELETE CASCADE,
    step_name VARCHAR(64) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    note TEXT NOT NULL,
    actor VARCHAR(128) NOT NULL
);

-- 4. Protected Files (MiniVault)
CREATE TABLE protected_files (
    id VARCHAR(32) PRIMARY KEY, -- e.g. file-001
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(128) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    original_sha256_hash CHAR(64) NOT NULL,
    current_sha256_hash CHAR(64) NOT NULL,
    status file_status DEFAULT 'VERIFIED',
    category VARCHAR(64) DEFAULT 'System Config',
    uploaded_by UUID REFERENCES users(id),
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_verified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. File Integrity Audit Logs
CREATE TABLE file_integrity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id VARCHAR(32) REFERENCES protected_files(id) ON DELETE CASCADE,
    check_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    result VARCHAR(16) NOT NULL, -- 'MATCH' or 'MISMATCH'
    original_hash CHAR(64) NOT NULL,
    calculated_hash CHAR(64) NOT NULL,
    verified_by VARCHAR(128) NOT NULL
);

-- 6. Notifications Table
CREATE TABLE security_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(32) DEFAULT 'info',
    read BOOLEAN DEFAULT FALSE,
    entity_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for lightning-fast SOC queries
CREATE INDEX idx_incidents_severity ON cyber_incidents(severity);
CREATE INDEX idx_incidents_status ON cyber_incidents(status);
CREATE INDEX idx_protected_files_status ON protected_files(status);
CREATE INDEX idx_integrity_logs_file ON file_integrity_logs(file_id);
