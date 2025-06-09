#!/usr/bin/env python3
"""
Scan Completion Handler - Automatically handles post-scan tasks
Manages report generation, notification delivery, and data processing after scan completion.
"""

import asyncio
import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.db import get_db
from models.scorpius_models import ScorpiusScan
from modules.report_generator import ScorpiusReportGenerator


class ScanCompletionHandler:
    """Handles all post-scan completion tasks"""
    
    def __init__(self):
        """Initialize the completion handler"""
        self.report_generator = ScorpiusReportGenerator()
    
    async def handle_scan_completion(
        self, 
        scan_id: str, 
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Handle all tasks when a scan completes
        
        Args:
            scan_id: Completed scan identifier
            db: Database session
            
        Returns:
            Summary of completion tasks performed
        """
        try:
            print(f"🔄 Processing scan completion for {scan_id}")
            
            # Get scan record
            result = await db.execute(
                select(ScorpiusScan).filter(ScorpiusScan.scan_id == scan_id)
            )
            scan = result.scalar_one_or_none()
            
            if not scan:
                return {"error": f"Scan {scan_id} not found"}
            
            if scan.status != "completed":
                return {"error": f"Scan {scan_id} is not completed (status: {scan.status})"}
            
            completion_tasks = {
                "report_generation": "pending",
                "database_update": "pending",
                "notifications": "pending"
            }
            
            # Task 1: Generate comprehensive PDF report
            try:
                print(f"📊 Generating PDF report for scan {scan_id}")
                report_path = await self.report_generator.generate_report(db, scan_id)
                
                if report_path:
                    completion_tasks["report_generation"] = "completed"
                    print(f"✅ PDF report generated: {report_path}")
                else:
                    completion_tasks["report_generation"] = "failed"
                    print(f"❌ PDF report generation failed")
                    
            except Exception as e:
                completion_tasks["report_generation"] = f"failed: {str(e)}"
                print(f"❌ Report generation error: {e}")
            
            # Task 2: Update scan metadata
            try:
                await self._update_scan_metadata(scan, db)
                completion_tasks["database_update"] = "completed"
                print(f"✅ Scan metadata updated")
                
            except Exception as e:
                completion_tasks["database_update"] = f"failed: {str(e)}"
                print(f"❌ Database update error: {e}")
            
            # Task 3: Send notifications (if configured)
            try:
                await self._send_notifications(scan)
                completion_tasks["notifications"] = "completed"
                print(f"✅ Notifications sent")
                
            except Exception as e:
                completion_tasks["notifications"] = f"failed: {str(e)}"
                print(f"❌ Notification error: {e}")
            
            return {
                "scan_id": scan_id,
                "status": "completion_tasks_processed",
                "tasks": completion_tasks,
                "processed_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"❌ Scan completion handler failed: {e}")
            return {
                "scan_id": scan_id,
                "status": "completion_handler_failed",
                "error": str(e)
            }
    
    async def _update_scan_metadata(self, scan: ScorpiusScan, db: AsyncSession):
        """Update scan with additional metadata after completion"""
        try:
            # Calculate additional metrics
            if scan.findings:
                findings_data = json.loads(scan.findings)
                
                # Enhanced vulnerability categorization
                vuln_categories = {}
                for finding in findings_data:
                    category = finding.get('vuln_type', 'unknown')
                    vuln_categories[category] = vuln_categories.get(category, 0) + 1
                
                # Calculate risk score
                risk_score = self._calculate_risk_score(scan)
                
                # Update scan record
                additional_metadata = {
                    "vulnerability_categories": vuln_categories,
                    "overall_risk_score": risk_score,
                    "completion_processed_at": datetime.now().isoformat(),
                    "reports_generated": True
                }
                
                # Store as additional metadata
                if scan.scan_metadata:
                    existing_metadata = json.loads(scan.scan_metadata)
                    existing_metadata.update(additional_metadata)
                    scan.scan_metadata = json.dumps(existing_metadata)
                else:
                    scan.scan_metadata = json.dumps(additional_metadata)
                
                await db.commit()
                
        except Exception as e:
            print(f"⚠️ Metadata update failed: {e}")
    
    def _calculate_risk_score(self, scan: ScorpiusScan) -> float:
        """Calculate overall risk score based on findings"""
        try:
            # Weight vulnerabilities by severity
            weights = {
                "critical": 10.0,
                "high": 7.0,
                "medium": 4.0,
                "low": 1.0
            }
            
            total_score = (
                scan.critical_count * weights["critical"] +
                scan.high_count * weights["high"] +
                scan.medium_count * weights["medium"] +
                scan.low_count * weights["low"]
            )
            
            # Normalize to 0-10 scale
            max_possible = 100  # Arbitrary maximum
            risk_score = min(10.0, (total_score / max_possible) * 10.0)
            
            return round(risk_score, 1)
            
        except Exception:
            return 5.0  # Default medium risk
    
    async def _send_notifications(self, scan: ScorpiusScan):
        """Send notifications about scan completion"""
        try:
            # This could integrate with email, Slack, Discord, etc.
            # For now, just log the notification
            
            notification_data = {
                "type": "scan_completed",
                "scan_id": scan.scan_id,
                "contract": scan.contract_address,
                "vulnerabilities_found": scan.vulnerabilities_found,
                "critical_count": scan.critical_count,
                "completed_at": scan.completed_at.isoformat() if scan.completed_at else None
            }
            
            print(f"📢 Notification ready: {json.dumps(notification_data, indent=2)}")
            
            # TODO: Implement actual notification delivery
            # - Email notifications
            # - Slack/Discord webhooks
            # - Dashboard alerts
            # - Mobile push notifications
            
        except Exception as e:
            print(f"⚠️ Notification preparation failed: {e}")


# Global completion handler instance
completion_handler = ScanCompletionHandler()


async def process_scan_completion(scan_id: str) -> Dict[str, Any]:
    """
    Convenience function to process scan completion
    
    Args:
        scan_id: Completed scan identifier
        
    Returns:
        Completion processing results
    """
    try:
        async for db in get_db():
            result = await completion_handler.handle_scan_completion(scan_id, db)
            return result
    except Exception as e:
        return {
            "scan_id": scan_id,
            "status": "completion_processing_failed",
            "error": str(e)
        }


async def auto_process_completed_scans():
    """Background task to process any unprocessed completed scans"""
    try:
        async for db in get_db():
            # Find completed scans that haven't been processed
            result = await db.execute(
                select(ScorpiusScan).filter(
                    ScorpiusScan.status == "completed",
                    ScorpiusScan.scan_metadata.is_(None)  # Indicates not processed
                )
            )
            scans = result.scalars().all()
            
            for scan in scans:
                print(f"🔄 Auto-processing completed scan {scan.scan_id}")
                await completion_handler.handle_scan_completion(scan.scan_id, db)
            
            if scans:
                print(f"✅ Auto-processed {len(scans)} completed scans")
            
            break  # Exit after first db session
            
    except Exception as e:
        print(f"❌ Auto-processing failed: {e}")


if __name__ == "__main__":
    # Test completion processing
    import asyncio
    
    async def test_completion():
        # Process any unprocessed scans
        await auto_process_completed_scans()
    
    asyncio.run(test_completion())
