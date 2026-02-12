from __future__ import annotations

import logging
from typing import Optional
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


async def log_audit_event(
    db: AsyncSession,
    user_id: Optional[UUID],
    action: str,
    resource_type: Optional[str] = None,
    resource_id: Optional[UUID] = None,
    ip_address: Optional[str] = None,
    details: Optional[dict] = None,
) -> None:
    """Log an audit event to the audit_log table."""
    try:
        await db.execute(
            text(
                """
                INSERT INTO audit_log (user_id, action, resource_type, resource_id, ip_address, details)
                VALUES (:user_id, :action, :resource_type, :resource_id, :ip_address, :details::jsonb)
                """
            ),
            {
                "user_id": str(user_id) if user_id else None,
                "action": action,
                "resource_type": resource_type,
                "resource_id": str(resource_id) if resource_id else None,
                "ip_address": ip_address,
                "details": str(details) if details else None,
            },
        )
        await db.commit()
    except Exception:
        logger.exception("Failed to write audit log entry")
