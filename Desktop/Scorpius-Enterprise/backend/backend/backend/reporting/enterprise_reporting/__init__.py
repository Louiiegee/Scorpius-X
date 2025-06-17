"""
Scorpius Enterprise Reporting Module
====================================

A comprehensive, plug-and-play reporting system that transforms raw scan and mempool data
into auditor-grade deliverables with full white-label capabilities.

Features:
- Multi-format output (PDF, HTML, Markdown, SARIF-v2, CSV)
- Jinja2 templating with theme packs
- Live data binding with WebSocket updates
- Role-based publishing workflow
- Client-facing portals with signed URLs
- Smart diffing and change tracking
- Embeddable widgets
- Digital signatures and watermarks
"""

from .core import ReportEngine, ReportBuilder, ReportExporter
from .models import ReportTemplate, ReportJob, ReportAuditLog
from .api import create_reporting_router
from .themes import ThemeManager
from .widgets import WidgetRegistry
from .diff import ReportDiffEngine

__version__ = "1.0.0"
__author__ = "Scorpius Security"

__all__ = [
    "ReportEngine",
    "ReportBuilder", 
    "ReportExporter",
    "ReportTemplate",
    "ReportJob",
    "ReportAuditLog",
    "create_reporting_router",
    "ThemeManager",
    "WidgetRegistry",
    "ReportDiffEngine",
]
