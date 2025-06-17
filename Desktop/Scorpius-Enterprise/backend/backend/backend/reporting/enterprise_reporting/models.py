"""
Enterprise Reporting Models
===========================

SQLAlchemy models for the enterprise reporting system.
"""

import uuid
import hashlib
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional, Union
from enum import Enum
from sqlalchemy import Column, String, DateTime, Text, JSON, Integer, Float, Boolean, ForeignKey, LargeBinary
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from pydantic import BaseModel, Field, validator

Base = declarative_base()


class ReportStatus(str, Enum):
    """Report generation status enumeration"""
    DRAFT = "draft"
    IN_REVIEW = "in_review"
    APPROVED = "approved"
    PUBLISHED = "published"
    ARCHIVED = "archived"
    REVOKED = "revoked"


class ReportFormat(str, Enum):
    """Supported report formats"""
    PDF = "pdf"
    HTML = "html"
    MARKDOWN = "markdown"
    SARIF_V2 = "sarif_v2"
    CSV = "csv"
    JSON = "json"


class ReportTemplate(Base):
    """Report template configuration"""
    __tablename__ = "report_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text)
    version = Column(String(50), nullable=False, default="1.0.0")
    theme_pack = Column(String(100), nullable=False, default="dark_pro")
    template_content = Column(Text, nullable=False)
    schema_version = Column(String(20), nullable=False, default="1.0")
    supported_formats = Column(JSON, nullable=False, default=["pdf", "html"])
    default_config = Column(JSON, nullable=False, default={})
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_system_template = Column(Boolean, default=False)

    # Relationships
    jobs = relationship("ReportJob", back_populates="template")


class ReportJob(Base):
    """Report generation job tracking"""
    __tablename__ = "report_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_id = Column(UUID(as_uuid=True), ForeignKey("report_templates.id"), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    scan_ids = Column(JSON, nullable=False, default=[])  # List of scan IDs to include
    alert_ids = Column(JSON, nullable=False, default=[])  # List of alert IDs to include
    format = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False, default=ReportStatus.DRAFT)
    config = Column(JSON, nullable=False, default={})
    metadata = Column(JSON, nullable=False, default={})
    progress = Column(Float, default=0.0)
    error_message = Column(Text)
    file_path = Column(String(1000))
    file_size = Column(Integer)
    file_hash = Column(String(64))  # SHA-256 hash
    watermark_config = Column(JSON)
    signature_required = Column(Boolean, default=False)
    signature_data = Column(JSON)
    expires_at = Column(DateTime(timezone=True))
    download_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(255), nullable=False)
    reviewed_by = Column(String(255))
    approved_by = Column(String(255))
    published_at = Column(DateTime(timezone=True))

    # Relationships
    template = relationship("ReportTemplate", back_populates="jobs")
    audit_logs = relationship("ReportAuditLog", back_populates="job")
    access_logs = relationship("ReportAccessLog", back_populates="job")

    def generate_hash(self) -> str:
        """Generate SHA-256 hash of report content"""
        if not self.file_path:
            return ""
        
        try:
            with open(self.file_path, "rb") as f:
                return hashlib.sha256(f.read()).hexdigest()
        except FileNotFoundError:
            return ""


class ReportAuditLog(Base):
    """Audit log for report operations"""
    __tablename__ = "report_audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("report_jobs.id"), nullable=False)
    action = Column(String(100), nullable=False)  # created, reviewed, approved, published, etc.
    user_id = Column(String(255), nullable=False)
    user_role = Column(String(100))
    ip_address = Column(String(45))
    user_agent = Column(Text)
    details = Column(JSON)
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    job = relationship("ReportJob", back_populates="audit_logs")


class ReportAccessLog(Base):
    """Access log for report downloads/views"""
    __tablename__ = "report_access_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("report_jobs.id"), nullable=False)
    access_token = Column(String(255))  # For signed URL tracking
    recipient_email = Column(String(255))
    recipient_name = Column(String(255))
    ip_address = Column(String(45))
    user_agent = Column(Text)
    action = Column(String(50))  # view, download, embed
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    job = relationship("ReportJob", back_populates="access_logs")


class ReportDiff(Base):
    """Report comparison and diff tracking"""
    __tablename__ = "report_diffs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    base_job_id = Column(UUID(as_uuid=True), ForeignKey("report_jobs.id"), nullable=False)
    compare_job_id = Column(UUID(as_uuid=True), ForeignKey("report_jobs.id"), nullable=False)
    diff_summary = Column(JSON, nullable=False, default={})
    detailed_diff = Column(JSON, nullable=False, default={})
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    created_by = Column(String(255), nullable=False)


# Pydantic Models for API
class ReportTemplateCreate(BaseModel):
    """Request model for creating report templates"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    theme_pack: str = Field("dark_pro", regex="^(dark_pro|light_corporate|custom)$")
    template_content: str = Field(..., min_length=1)
    supported_formats: List[str] = Field(default=["pdf", "html"])
    default_config: Dict[str, Any] = Field(default_factory=dict)

    @validator("supported_formats")
    def validate_formats(cls, v):
        valid_formats = {f.value for f in ReportFormat}
        for fmt in v:
            if fmt not in valid_formats:
                raise ValueError(f"Invalid format: {fmt}")
        return v


class ReportJobCreate(BaseModel):
    """Request model for creating report jobs"""
    template_id: str
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    scan_ids: List[str] = Field(default_factory=list)
    alert_ids: List[str] = Field(default_factory=list)
    format: str = Field(..., regex="^(pdf|html|markdown|sarif_v2|csv|json)$")
    config: Dict[str, Any] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    watermark_config: Optional[Dict[str, Any]] = None
    signature_required: bool = False
    expires_at: Optional[datetime] = None


class ReportJobResponse(BaseModel):
    """Response model for report jobs"""
    id: str
    template_id: str
    title: str
    description: Optional[str]
    format: str
    status: str
    progress: float
    error_message: Optional[str]
    file_size: Optional[int]
    file_hash: Optional[str]
    download_count: int
    created_at: datetime
    updated_at: datetime
    created_by: str
    expires_at: Optional[datetime]

    class Config:
        from_attributes = True


class ReportDiffRequest(BaseModel):
    """Request model for report comparison"""
    base_job_id: str
    compare_job_id: str
    include_details: bool = Field(default=True)


class ReportDiffResponse(BaseModel):
    """Response model for report comparison"""
    id: str
    base_job_id: str
    compare_job_id: str
    diff_summary: Dict[str, Any]
    detailed_diff: Optional[Dict[str, Any]] = None
    created_at: datetime
    created_by: str

    class Config:
        from_attributes = True
