#!/usr/bin/env python3
"""
Recon Vault Module - Bug Bounty Program Intelligence & Vulnerability Research Platform
Integrates with Immunefi API for comprehensive reconnaissance and reporting
"""

import asyncio
import json
import logging
import time
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple
import aiohttp
import hashlib
import uuid
from dataclasses import dataclass, asdict
from enum import Enum

logger = logging.getLogger(__name__)

class SeverityLevel(Enum):
    """Vulnerability severity levels matching Immunefi standards."""
    CRITICAL = "Critical"
    HIGH = "High" 
    MEDIUM = "Medium"
    LOW = "Low"
    INFO = "Informational"

class ProgramStatus(Enum):
    """Bug bounty program status."""
    ACTIVE = "active"
    PAUSED = "paused"
    ENDED = "ended"
    DRAFT = "draft"

@dataclass
class BugBountyProgram:
    """Bug bounty program data structure."""
    id: str
    name: str
    ecosystem: str
    max_bounty: float
    vault_tvl: float
    program_type: str
    status: str
    last_updated: str
    description: str
    project_website: str
    assets_in_scope: List[Dict[str, Any]]
    impacts: Dict[str, List[str]]
    documentation_links: List[str]
    submission_requirements: Dict[str, Any]

@dataclass
class VulnerabilityFinding:
    """Vulnerability finding structure."""
    id: str
    program_id: str
    title: str
    severity: str
    description: str
    impact_assessment: str
    proof_of_concept: str
    attack_vector: str
    remediation: str
    evidence_files: List[str]
    status: str
    created_at: str
    hunter_id: str

@dataclass
class HuntingSession:
    """Represents a bug hunting session/workspace"""
    id: str
    program_id: str
    title: str
    created_at: datetime
    updated_at: datetime
    status: str  # "active", "paused", "completed"
    findings: List[str]  # IDs of associated findings
    notes: List[Dict[str, Any]]
    evidence: List[Dict[str, Any]]
    time_spent: float  # hours
    target_scope: List[str]  # URLs, contracts, etc.
    methodology: str

@dataclass 
class ReportTemplate:
    """Bug bounty report template"""
    id: str
    name: str
    category: str  # "Executive", "Technical", "Bug Bounty"
    description: str
    template_content: str
    required_fields: List[str]
    severity_mapping: Dict[str, str]
    compliance_requirements: List[str]

class ImmunefiClient:
    """Immunefi API client for data retrieval."""
    
    def __init__(self, base_url: str = "https://immunefi.com"):
        """Initialize Immunefi API client."""
        self.base_url = base_url
        self.session = None
        self.rate_limit_delay = 1.0  # Rate limiting
        self.max_retries = 3
        
    async def __aenter__(self):
        """Async context manager entry."""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers={
                'User-Agent': 'ScorpiusReconVault/1.0',
                'Accept': 'application/json'
            }
        )
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if self.session:
            await self.session.close()
    
    async def _make_request(self, endpoint: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        """Make rate-limited API request."""
        url = f"{self.base_url}{endpoint}"
        
        for attempt in range(self.max_retries):
            try:
                await asyncio.sleep(self.rate_limit_delay)
                
                async with self.session.get(url, params=params) as response:
                    if response.status == 200:
                        return await response.json()
                    elif response.status == 429:  # Rate limited
                        await asyncio.sleep(2 ** attempt)
                        continue
                    else:
                        logger.warning(f"API request failed: {response.status} - {url}")
                        return {}
                        
            except Exception as e:
                logger.error(f"Request attempt {attempt + 1} failed: {e}")
                if attempt == self.max_retries - 1:
                    return {}
                await asyncio.sleep(2 ** attempt)
        
        return {}
    
    async def get_all_programs(self, filters: Optional[Dict] = None) -> List[Dict[str, Any]]:
        """Fetch all bug bounty programs."""
        try:
            # Note: This would use actual Immunefi API endpoints
            endpoint = "/api/bounty"
            
            result = await self._make_request(endpoint, params=filters)
            
            if isinstance(result, dict) and 'data' in result:
                return result['data']
            elif isinstance(result, list):
                return result
            else:
                return []
                
        except Exception as e:
            logger.error(f"Failed to fetch programs: {e}")
            return []
    
    async def get_program_details(self, program_id: str) -> Dict[str, Any]:
        """Get detailed program information."""
        try:
            endpoint = f"/api/bounty/{program_id}"
            return await self._make_request(endpoint)
        except Exception as e:
            logger.error(f"Failed to fetch program details for {program_id}: {e}")
            return {}

class WorkspaceManager:
    """Manages bug hunting workspaces and sessions"""
    
    def __init__(self):
        self.sessions: Dict[str, HuntingSession] = {}
        self.session_cache = {}
    
    async def create_session(
        self,
        program_id: str,
        title: str,
        target_scope: List[str],
        methodology: str = "standard"
    ) -> str:
        """Create a new hunting session"""
        session_id = f"hunt_{uuid.uuid4().hex[:8]}"
        session = HuntingSession(
            id=session_id,
            program_id=program_id,
            title=title,
            created_at=datetime.now(),
            updated_at=datetime.now(),
            status="active",
            findings=[],
            notes=[],
            evidence=[],
            time_spent=0.0,
            target_scope=target_scope,
            methodology=methodology
        )
        self.sessions[session_id] = session
        return session_id
    
    async def add_finding_to_session(
        self,
        session_id: str,
        finding: VulnerabilityFinding
    ) -> bool:
        """Add a finding to a hunting session"""
        if session_id not in self.sessions:
            return False
        
        self.sessions[session_id].findings.append(finding.id)
        self.sessions[session_id].updated_at = datetime.now()
        return True
    
    async def add_note(
        self,
        session_id: str,
        note_content: str,
        note_type: str = "general"
    ) -> bool:
        """Add a note to hunting session"""
        if session_id not in self.sessions:
            return False
        
        note = {
            "id": f"note_{uuid.uuid4().hex[:8]}",
            "content": note_content,
            "type": note_type,
            "timestamp": datetime.now().isoformat(),
            "tags": []
        }
        self.sessions[session_id].notes.append(note)
        self.sessions[session_id].updated_at = datetime.now()
        return True

class ReportGenerator:
    """Generates bug bounty and security reports"""
    
    def __init__(self):
        self.templates: Dict[str, ReportTemplate] = {}
        self._init_templates()
    
    def _init_templates(self):
        """Initialize default report templates"""
        self.templates = {
            "executive_security": ReportTemplate(
                id="RPT-001",
                name="Executive Security Summary",
                category="Executive",
                description="High-level security overview for leadership",
                template_content=self._get_executive_template(),
                required_fields=["total_scans", "critical_findings", "risk_score"],
                severity_mapping={"critical": "High Risk", "high": "Medium Risk", "medium": "Low Risk"},
                compliance_requirements=["ISO27001", "SOC2"]
            ),
            "technical_vuln": ReportTemplate(
                id="RPT-002", 
                name="Technical Vulnerability Assessment",
                category="Technical",
                description="Detailed technical analysis of security findings",
                template_content=self._get_technical_template(),
                required_fields=["vulnerabilities", "affected_contracts", "remediation"],
                severity_mapping={"critical": "Critical", "high": "High", "medium": "Medium"},
                compliance_requirements=["OWASP", "NIST"]
            ),
            "bug_bounty": ReportTemplate(
                id="RPT-004",
                name="Bug Bounty Program Analytics", 
                category="Bug Bounty",
                description="Bug bounty program performance and analytics",
                template_content=self._get_bounty_template(),
                required_fields=["programs_monitored", "submissions", "payouts"],
                severity_mapping={"critical": "$10000+", "high": "$5000+", "medium": "$1000+"},
                compliance_requirements=["Immunefi Standards"]
            )
        }
    
    def _get_executive_template(self) -> str:
        return """
# Executive Security Summary

## Overview
- **Total Programs Monitored**: {programs_count}
- **Active Hunting Sessions**: {active_sessions}
- **Critical Findings**: {critical_findings}
- **Overall Risk Score**: {risk_score}/10

## Key Metrics
- **Vulnerabilities Identified**: {total_vulnerabilities}
- **High Priority Issues**: {high_priority_count}
- **Average Resolution Time**: {avg_resolution_time} days

## Recommendations
{recommendations}
"""
    
    def _get_technical_template(self) -> str:
        return """
# Technical Vulnerability Assessment

## Vulnerability Summary
{vulnerability_summary}

## Detailed Findings
{detailed_findings}

## Risk Assessment
{risk_assessment}

## Remediation Plan
{remediation_plan}
"""
    
    def _get_bounty_template(self) -> str:
        return """
# Bug Bounty Program Analytics

## Program Performance
- **Programs Monitored**: {programs_count}
- **Total Submissions**: {total_submissions}
- **Successful Bounties**: {successful_bounties}
- **Total Payouts**: ${total_payouts}

## Top Performing Programs
{top_programs}

## Hunting Session Analytics
{session_analytics}
"""
    
    async def generate_report(
        self,
        template_id: str,
        data: Dict[str, Any],
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate a report from template and data"""
        if template_id not in self.templates:
            raise ValueError(f"Template {template_id} not found")
        
        template = self.templates[template_id]
        
        # Validate required fields
        missing_fields = [field for field in template.required_fields if field not in data]
        if missing_fields:
            raise ValueError(f"Missing required fields: {missing_fields}")
        
        # Generate report content
        report_content = template.template_content.format(**data)
        
        report = {
            "id": f"report_{uuid.uuid4().hex[:8]}",
            "template_id": template_id,
            "title": template.name,
            "category": template.category,
            "content": report_content,
            "generated_at": datetime.now().isoformat(),
            "session_id": session_id,
            "data": data,
            "metadata": {
                "compliance": template.compliance_requirements,
                "severity_mapping": template.severity_mapping
            }
        }
        
        return report

class ReconVault:
    """Main Recon Vault engine for bug bounty intelligence."""
    
    def __init__(self):
        """Initialize Recon Vault."""
        self.client = ImmunefiClient()
        self.workspace_manager = WorkspaceManager()
        self.report_generator = ReportGenerator()
        self.programs_cache = {}
        self.findings_cache = {}
        self.cache_ttl = 3600  # 1 hour
        self.last_sync = None
        
    async def sync_programs(self, force_refresh: bool = False) -> Dict[str, Any]:
        """Sync bug bounty programs from Immunefi API"""
        if not force_refresh and self.last_sync and (time.time() - self.last_sync) < self.cache_ttl:
            return {"status": "cached", "count": len(self.programs_cache)}
        
        try:
            programs = await self.client.get_all_programs()
            
            for program in programs:
                program_id = program.get("id")
                if program_id:
                    self.programs_cache[program_id] = BugBountyProgram(
                        id=program_id,
                        name=program.get("name", "Unknown"),
                        ecosystem=program.get("ecosystem", "unknown"),
                        bounty_amount=program.get("max_bounty", 0),
                        program_type=program.get("type", "unknown"),
                        status=program.get("status", "unknown"),
                        description=program.get("description", ""),
                        scope=program.get("scope", []),
                        requirements=program.get("requirements", []),
                        created_at=program.get("created_at", ""),
                        updated_at=program.get("updated_at", "")
                    )
            
            self.last_sync = time.time()
            logger.info(f"Synced {len(programs)} bug bounty programs")
            
            return {
                "status": "success",
                "count": len(programs),
                "synced_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to sync programs: {e}")
            return {"status": "error", "message": str(e)}
    
    async def search_programs(
        self,
        query: str = "",
        ecosystem: Optional[str] = None,
        min_bounty: Optional[int] = None,
        max_bounty: Optional[int] = None,
        program_type: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Search and filter bug bounty programs"""
        results = []
        
        for program in self.programs_cache.values():
            # Apply filters
            if ecosystem and program.ecosystem.lower() != ecosystem.lower():
                continue
            if min_bounty and program.bounty_amount < min_bounty:
                continue
            if max_bounty and program.bounty_amount > max_bounty:
                continue
            if program_type and program.program_type.lower() != program_type.lower():
                continue
            if status and program.status.lower() != status.lower():
                continue
            
            # Apply search query
            if query:
                query_lower = query.lower()
                if not any([
                    query_lower in program.name.lower(),
                    query_lower in program.description.lower(),
                    query_lower in program.ecosystem.lower()
                ]):
                    continue
            
            results.append({
                "id": program.id,
                "name": program.name,
                "ecosystem": program.ecosystem,
                "bounty_amount": program.bounty_amount,
                "program_type": program.program_type,
                "status": program.status,
                "description": program.description[:200] + "..." if len(program.description) > 200 else program.description
            })
            
            if len(results) >= limit:
                break
        
        return sorted(results, key=lambda x: x["bounty_amount"], reverse=True)
    
    async def get_program_details(self, program_id: str) -> Dict[str, Any]:
        """Get detailed information about a specific program"""
        if program_id not in self.programs_cache:
            await self.sync_programs()
        
        if program_id not in self.programs_cache:
            return {"error": "Program not found"}
        
        program = self.programs_cache[program_id]
        details = await self.client.get_program_details(program_id)
        
        return {
            "program": {
                "id": program.id,
                "name": program.name,
                "ecosystem": program.ecosystem,
                "bounty_amount": program.bounty_amount,
                "program_type": program.program_type,
                "status": program.status,
                "description": program.description,
                "scope": program.scope,
                "requirements": program.requirements,
                "created_at": program.created_at,
                "updated_at": program.updated_at
            },
            "details": details,
            "hunting_sessions": await self._get_program_sessions(program_id),
            "findings_count": await self._get_program_findings_count(program_id)
        }
    
    async def create_hunting_session(
        self,
        program_id: str,
        title: str,
        target_scope: List[str],
        methodology: str = "standard"
    ) -> Dict[str, Any]:
        """Create a new bug hunting session"""
        if program_id not in self.programs_cache:
            return {"error": "Program not found"}
        
        session_id = await self.workspace_manager.create_session(
            program_id=program_id,
            title=title,
            target_scope=target_scope,
            methodology=methodology
        )
        
        return {
            "session_id": session_id,
            "status": "created",
            "program_id": program_id,
            "title": title,
            "created_at": datetime.now().isoformat()
        }
    
    async def add_vulnerability_finding(
        self,
        session_id: str,
        title: str,
        description: str,
        severity: SeverityLevel,
        impact: str,
        proof_of_concept: str,
        affected_components: List[str]
    ) -> Dict[str, Any]:
        """Add a vulnerability finding to a hunting session"""
        finding_id = f"vuln_{uuid.uuid4().hex[:8]}"
        
        finding = VulnerabilityFinding(
            id=finding_id,
            program_id=self.workspace_manager.sessions[session_id].program_id,
            title=title,
            severity=severity.value,
            description=description,
            impact_assessment=impact,
            proof_of_concept=proof_of_concept,
            attack_vector="",
            remediation="",
            evidence_files=[],
            status="identified",
            created_at=datetime.now().isoformat(),
            hunter_id="current_user"  # TODO: Implement user management
        )
        
        self.findings_cache[finding_id] = finding
        
        # Add to session
        success = await self.workspace_manager.add_finding_to_session(session_id, finding)
        
        if success:
            return {
                "finding_id": finding_id,
                "status": "created",
                "session_id": session_id,
                "severity": severity.value,
                "created_at": finding.created_at
            }
        else:
            return {"error": "Failed to add finding to session"}
    
    async def generate_bug_bounty_report(
        self,
        template_id: str,
        session_id: Optional[str] = None,
        program_ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Generate bug bounty analytics report"""
        # Collect data for report
        data = await self._collect_report_data(session_id, program_ids)
        
        # Generate report
        report = await self.report_generator.generate_report(
            template_id=template_id,
            data=data,
            session_id=session_id
        )
        
        return report
    
    async def get_analytics_dashboard(self) -> Dict[str, Any]:
        """Get analytics data for dashboard"""
        total_programs = len(self.programs_cache)
        active_sessions = len([s for s in self.workspace_manager.sessions.values() if s.status == "active"])
        total_findings = len(self.findings_cache)
        critical_findings = len([f for f in self.findings_cache.values() if f.severity == SeverityLevel.CRITICAL.value])
        
        # Calculate program distribution by ecosystem
        ecosystem_stats = {}
        for program in self.programs_cache.values():
            ecosystem = program.ecosystem
            if ecosystem not in ecosystem_stats:
                ecosystem_stats[ecosystem] = {"count": 0, "total_bounty": 0}
            ecosystem_stats[ecosystem]["count"] += 1
            ecosystem_stats[ecosystem]["total_bounty"] += program.bounty_amount
        
        # Get top programs by bounty
        top_programs = sorted(
            [{"name": p.name, "bounty": p.bounty_amount, "ecosystem": p.ecosystem} 
             for p in self.programs_cache.values()],
            key=lambda x: x["bounty"],
            reverse=True
        )[:10]
        
        return {
            "summary": {
                "total_programs": total_programs,
                "active_sessions": active_sessions,
                "total_findings": total_findings,
                "critical_findings": critical_findings,
                "average_bounty": sum(p.bounty_amount for p in self.programs_cache.values()) / max(total_programs, 1)
            },
            "ecosystem_distribution": ecosystem_stats,
            "top_programs": top_programs,
            "recent_findings": await self._get_recent_findings(),
            "session_analytics": await self._get_session_analytics()
        }
    
    async def _get_program_sessions(self, program_id: str) -> List[Dict[str, Any]]:
        """Get hunting sessions for a program"""
        sessions = [
            {
                "id": session.id,
                "title": session.title,
                "status": session.status,
                "findings_count": len(session.findings),
                "time_spent": session.time_spent,
                "created_at": session.created_at.isoformat(),
                "updated_at": session.updated_at.isoformat()
            }
            for session in self.workspace_manager.sessions.values()
            if session.program_id == program_id
        ]
        return sessions
    
    async def _get_program_findings_count(self, program_id: str) -> int:
        """Get count of findings for a program"""
        count = 0
        for session in self.workspace_manager.sessions.values():
            if session.program_id == program_id:
                count += len(session.findings)
        return count
    
    async def _collect_report_data(
        self, 
        session_id: Optional[str] = None, 
        program_ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Collect data for report generation"""
        analytics = await self.get_analytics_dashboard()
        
        return {
            "programs_count": analytics["summary"]["total_programs"],
            "active_sessions": analytics["summary"]["active_sessions"],
            "critical_findings": analytics["summary"]["critical_findings"],
            "risk_score": min(analytics["summary"]["critical_findings"], 10),
            "total_vulnerabilities": analytics["summary"]["total_findings"],
            "high_priority_count": len([f for f in self.findings_cache.values() 
                                      if f.severity in [SeverityLevel.CRITICAL.value, SeverityLevel.HIGH.value]]),
            "avg_resolution_time": 5,  # TODO: Calculate from actual data
            "recommendations": "Implement automated scanning for high-value programs",
            "total_submissions": analytics["summary"]["total_findings"],
            "successful_bounties": analytics["summary"]["critical_findings"],
            "total_payouts": sum(p.bounty_amount for p in self.programs_cache.values() if p.status == "active"),
            "top_programs": analytics["top_programs"][:5],
            "session_analytics": analytics["session_analytics"]
        }
    
    async def _get_recent_findings(self) -> List[Dict[str, Any]]:
        """Get recent vulnerability findings"""
        recent = sorted(
            self.findings_cache.values(),
            key=lambda x: x.created_at,
            reverse=True
        )[:10]
        
        return [
            {
                "id": f.id,
                "title": f.title,
                "severity": f.severity,
                "status": f.status,
                "created_at": f.created_at
            }
            for f in recent
        ]
    
    async def _get_session_analytics(self) -> Dict[str, Any]:
        """Get hunting session analytics"""
        sessions = list(self.workspace_manager.sessions.values())
        
        return {
            "total_sessions": len(sessions),
            "active_sessions": len([s for s in sessions if s.status == "active"]),
            "average_time_spent": sum(s.time_spent for s in sessions) / max(len(sessions), 1),
            "sessions_by_methodology": {}  # TODO: Implement methodology tracking
        }

# Convenience function for quick program search
async def search_bug_bounty_programs(filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Quick search for bug bounty programs."""
    if filters is None:
        filters = {}
    
    vault = ReconVault()
    
    try:
        # Sync data first
        sync_result = await vault.sync_programs()
        
        # Search programs
        programs = await vault.search_programs(
            query=filters.get("search", ""),
            ecosystem=filters.get("ecosystem"),
            min_bounty=filters.get("min_bounty"),
            max_bounty=filters.get("max_bounty"),
            program_type=filters.get("program_type"),
            status=filters.get("status"),
            limit=filters.get("limit", 50)
        )
        
        return {
            "status": "success",
            "sync_info": sync_result,
            "programs": programs,
            "total_found": len(programs),
            "filters_applied": filters,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Program search failed: {e}")
        return {
            "status": "error",
            "error": str(e),
            "programs": [],
            "total_found": 0
        }
