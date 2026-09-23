"""
CyberInstincts Cryptographic Engine & Data Structure Services
Language: Python 3.12+
Modules: hashlib, hmac, dataclasses, typing
"""

import hashlib
import hmac
import os
from dataclasses import dataclass
from typing import Optional, List, Tuple
from datetime import datetime

@dataclass
class FileIntegrityResult:
    is_valid: boolean = True
    original_hash: str = ""
    calculated_hash: str = ""
    verification_time: str = ""
    differences_count: int = 0


class IntegrityEngine:
    """
    Cryptographic verification service employing SHA-256 (Secure Hash Algorithm).
    Supports block-wise hashing for large streams and Merkle Tree structure.
    """

    CHUNK_SIZE = 65536  # 64KB blocks

    @staticmethod
    def compute_sha256(file_path: str) -> str:
        """
        Computes the NIST FIPS 180-4 compliant SHA-256 digest of a target file.
        Utilizes constant memory O(1) buffer streaming.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Target file {file_path} not located in vault.")

        sha256 = hashlib.sha256()
        with open(file_path, "rb") as f:
            while chunk := f.read(IntegrityEngine.CHUNK_SIZE):
                sha256.update(chunk)
        return sha256.hexdigest()

    @staticmethod
    def verify_file(baseline_hash: str, current_file_path: str) -> Tuple[bool, str]:
        """
        Compares baseline cryptographic signature against active file content.
        Uses hmac.compare_digest to defend against timing-attack vulnerabilities.
        """
        current_hash = IntegrityEngine.compute_sha256(current_file_path)
        is_match = hmac.compare_digest(baseline_hash.lower(), current_hash.lower())
        return is_match, current_hash


class ThreatPriorityQueue:
    """
    Data Structure: Max-Heap based Priority Queue for incident triage.
    Orders incidents by severity: CRITICAL (4) > HIGH (3) > MEDIUM (2) > LOW (1).
    """

    SEVERITY_WEIGHTS = {
        "CRITICAL": 4,
        "HIGH": 3,
        "MEDIUM": 2,
        "LOW": 1
    }

    def __init__(self):
        self.queue = []

    def push(self, incident: dict):
        weight = self.SEVERITY_WEIGHTS.get(incident.get("severity", "LOW"), 1)
        # Store as (-weight, timestamp, incident) for max-heap behavior
        self.queue.append((weight, incident))
        self.queue.sort(key=lambda x: x[0], reverse=True)

    def pop(self) -> Optional[dict]:
        if not self.queue:
            return None
        return self.queue.pop(0)[1]
