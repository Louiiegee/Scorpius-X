import asyncio
import uuid
import json
import time
from typing import List, Optional, Dict, Any, Callable
from pathlib import Path
from datetime import datetime

from .plugin_registry import registry
from .config import settings
from .logging import get_logger
from .database import AsyncSessionLocal, ScanResult
from ..plugin_base import ScanContext, Finding
from ..analysis.ai_analyzer import AIAnalyzer
from ..analysis.report_generator import ReportGenerator

logger = get_logger(__name__)

class ScanOrchestrator:
    """Main orchestrator that manages plugin execution, AI analysis, and results."""
    
    def __init__(self):
        self.plugin_manager = registry
        self.ai_analyzer = AIAnalyzer(api_key=settings.ai.anthropic_api_key)
        self.report_generator = ReportGenerator()

    async def execute_scan(
        self,
        scan_id: str,
        target: str,
        options: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a complete scan with selected plugins and AI analysis."""
        
        start_time = time.time()
        logger.info(f"Orchestrator executing scan {scan_id} for target {target}")
        
        workdir = Path(settings.workdir) / scan_id
        workdir.mkdir(parents=True, exist_ok=True)
        
        progress_callback = options.get("progress_callback")

        ctx = ScanContext(
            scan_id=scan_id,
            target=target,
            chain_rpc=options.get("rpc_url", settings.default_rpc),
            workdir=str(workdir),
            block_number=options.get("block_number"),
            source_code=options.get("source_code"),
        )
        
        try:
            # Step 1: Run scanner plugins
            plugin_findings = await self._run_plugins(ctx, options, progress_callback)

            # Step 2: AI Analysis
            ai_analysis_result = {}
            all_findings = plugin_findings
            if options.get("enable_ai", True) and self.ai_analyzer.is_available():
                if progress_callback: await progress_callback(scan_id, "Running AI Analysis", 70)
                ai_findings, ai_summary = await self.ai_analyzer.analyze_contract(ctx, plugin_findings)
                all_findings.extend(ai_findings)
                ai_analysis_result = ai_summary.to_dict()

            # Step 3: Calculate final risk score
            risk_score = self._calculate_risk_score(all_findings)

            # Step 4: Generate reports
            if progress_callback: await progress_callback(scan_id, "Generating Reports", 90)
            report_paths = await self.report_generator.generate(
                scan_id=scan_id, target=target, findings=all_findings,
                ai_analysis=ai_analysis_result, risk_score=risk_score
            )
            
            # Step 5: Finalize and store results
            scan_duration = time.time() - start_time
            final_result = {
                "scan_id": scan_id, "target": target, "status": "completed",
                "risk_score": risk_score,
                "findings": [f.to_dict() for f in all_findings],
                "ai_analysis": ai_analysis_result,
                "reports": report_paths, "duration": scan_duration,
            }
            await self._store_results(scan_id, final_result)
            
            logger.info(f"Scan {scan_id} completed. Findings: {len(all_findings)}. Risk Score: {risk_score:.2f}")
            if progress_callback: await progress_callback(scan_id, "Scan Completed", 100)

            return final_result
            
        except Exception as e:
            logger.error(f"Scan {scan_id} failed: {e}", exc_info=True)
            await self._store_results(scan_id, {"status": "failed", "error": str(e)})
            if progress_callback: await progress_callback(scan_id, f"Scan Failed: {e}", -1)
            raise

    async def _run_plugins(self, ctx: ScanContext, options: Dict, progress_cb: Optional[Callable]) -> List[Finding]:
        if not registry._loaded:
            await registry.discover_and_load()
        
        selected = options.get("selected_plugins")
        enable_sim = options.get("enable_simulation", True)
        
        pool = {n: p for n, p in registry.plugins.items() if (not selected or n in selected) and (enable_sim or not p.requires_simulation)}
        logger.info(f"Running {len(pool)} plugins: {list(pool.keys())}")
        
        all_findings = []
        total_plugins = len(pool)
        completed_count = 0

        async def run_plugin(name, plugin):
            nonlocal completed_count
            try:
                if progress_cb: await progress_cb(ctx.scan_id, f"Running {name}", int((completed_count / total_plugins) * 60))
                findings = await plugin.scan(ctx)
                all_findings.extend(findings)
                logger.info(f"Plugin '{name}' completed, found {len(findings)} issues.")
            except Exception as e:
                logger.error(f"Plugin '{name}' failed: {e}", exc_info=True)
            finally:
                completed_count += 1
                if progress_cb: await progress_cb(ctx.scan_id, f"Completed {name}", int((completed_count / total_plugins) * 60))

        if total_plugins > 0:
            tasks = [run_plugin(name, plugin) for name, plugin in pool.items()]
            await asyncio.gather(*tasks)
        return all_findings

    def _calculate_risk_score(self, findings: List[Finding]) -> float:
        if not findings: return 0.0
        weights = {"critical": 10.0, "high": 7.0, "medium": 4.0, "low": 1.0, "info": 0.1}
        
        score = sum(weights.get(f.severity, 0.0) * f.confidence for f in findings)
        max_possible_score = sum(weights.get(f.severity, 0.0) for f in findings)
        
        if max_possible_score == 0: return 0.0
        
        normalized_score = (score / max_possible_score) * 100
        return min(100.0, round(normalized_score, 2))

    async def _store_results(self, scan_id: str, result_data: Dict[str, Any]):
        async with AsyncSessionLocal() as session:
            result = await session.get(ScanResult, scan_id)
            if not result:
                logger.warning(f"ScanResult for {scan_id} not found in DB. This should not happen.")
                return

            result.status = result_data.get("status")
            result.findings = {"findings": result_data.get("findings", [])}
            result.metadata = {
                "risk_score": result_data.get("risk_score"),
                "duration": result_data.get("duration"),
                "reports": result_data.get("reports"),
                "ai_analysis": result_data.get("ai_analysis"),
                "error": result_data.get("error")
            }
            if result.status in ["completed", "failed"]:
                result.completed_at = datetime.utcnow()
            
            session.add(result)
            await session.commit()
            logger.info(f"Updated final results for scan {scan_id} in database.")

# This function is the entry point for the RQ worker.
def execute_scan_job(scan_id: str, target: str, options: Dict[str, Any]):
    """Job function wrapper for RQ worker."""
    orchestrator = ScanOrchestrator()
    try:
        return asyncio.run(orchestrator.execute_scan(scan_id, target, options))
    except Exception as e:
        logger.error(f"Unhandled exception in execute_scan_job for {scan_id}: {e}", exc_info=True)
        # We re-raise to let RQ know the job failed.
        raise