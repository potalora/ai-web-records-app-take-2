from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from dateutil import parser as dateutil_parser


def parse_datetime(value: str | None) -> Optional[datetime]:
    """Parse a datetime string into a timezone-aware datetime, or None."""
    if not value:
        return None
    try:
        dt = dateutil_parser.parse(value)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except (ValueError, TypeError):
        return None
