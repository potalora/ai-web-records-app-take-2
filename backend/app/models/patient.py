from __future__ import annotations

import uuid

from sqlalchemy import ForeignKey, LargeBinary, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Patient(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "patients"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    fhir_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    mrn_encrypted: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    name_encrypted: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    birth_date_encrypted: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    gender: Mapped[str | None] = mapped_column(Text, nullable=True)
    contact_info_encrypted: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)

    user: Mapped[User] = relationship("User", back_populates="patients")
    health_records: Mapped[list[HealthRecord]] = relationship(
        "HealthRecord", back_populates="patient"
    )


from app.models.user import User  # noqa: E402
from app.models.record import HealthRecord  # noqa: E402
