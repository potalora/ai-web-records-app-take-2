from __future__ import annotations

import hashlib
from pathlib import Path


def compute_file_hash(file_path: Path) -> str:
    """Compute SHA-256 hash of a file."""
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


def detect_file_type(filename: str) -> str:
    """Detect the format type from a filename."""
    lower = filename.lower()
    if lower.endswith(".json"):
        return "fhir_r4"
    elif lower.endswith(".tsv"):
        return "epic_ehi"
    elif lower.endswith(".zip"):
        return "zip_archive"
    elif lower.endswith(".pdf"):
        return "pdf"
    elif lower.endswith((".png", ".jpg", ".jpeg", ".tiff")):
        return "image"
    return "unknown"
