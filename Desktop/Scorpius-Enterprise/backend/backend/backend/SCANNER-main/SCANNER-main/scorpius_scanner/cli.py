import asyncio
import json
import typer
from typing import Optional, List
from rich.console import Console
from rich.table import Table
from rich import print as rprint

from .core.orchestrator import ScanOrchestrator
from .core.config import settings
from .core.logging import get_logger

console = Console()
app = typer.Typer(add_completion=False, help="🦂 Scorpius Scanner CLI")
logger = get_logger("cli")

@app.command()
def scan(
    target: str = typer.Argument(..., help="Contract address/path/bytecode"),
    rpc: str = typer.Option(settings.default_rpc, "--rpc", help="Chain RPC URL"),
    plugins: List[str] = typer.Option(None, "--plugin", "-p", help="Specific plugins to run"),
    sandbox: str = typer.Option("auto", "--sandbox", help="Sandbox mode: none, wasm, vm, auto"),
    block: Optional[int] = typer.Option(None, "--block", help="Fork block number"),
    no_sim: bool = typer.Option(False, "--no-sim", help="Disable simulation plugins"),
    json_out: bool = typer.Option(False, "--json", help="JSON output"),
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Verbose output"),
):
    """Run a vulnerability scan with sandbox control"""
    if verbose:
        settings.log_level = "DEBUG"
    
    # Set sandbox preference
    if sandbox != "auto":
        settings.preferred_sandbox = sandbox
    
    async def _run():
        orchestrator = ScanOrchestrator()
        
        # Progress callback for verbose mode
        def progress(msg: str):
            if verbose and not json_out:
                console.print(f"[dim]{msg}[/dim]")
        
        try:
            findings = await orchestrator.execute_scan(
                target=target,
                rpc_url=rpc,
                block_number=block,
                selected_plugins=plugins,
                enable_simulation=not no_sim,
                progress_callback=progress if verbose else None
            )
            
            if json_out:
                output = {
                    "target": target,
                    "sandbox_mode": sandbox,
                    "findings_count": len(findings),
                    "findings": [f.to_dict() for f in findings]
                }
                print(json.dumps(output, indent=2))
            else:
                _display_results(target, findings)
                
        except Exception as e:
            if json_out:
                print(json.dumps({"error": str(e)}, indent=2))
            else:
                rprint(f"[red]Error: {e}[/red]")
            raise typer.Exit(1)
    
    asyncio.run(_run())

@app.command()
def plugins():
    """List available plugins"""
    async def _run():
        from .core.plugin_registry import registry
        await registry.discover_and_load()
        
        table = Table(title="Available Plugins")
        table.add_column("Name", style="cyan")
        table.add_column("Version", style="magenta")
        table.add_column("Simulation", style="yellow")
        table.add_column("Description", style="green")
        
        for name, metadata in registry.list_plugins().items():
            sim_required = "Yes" if metadata.get("requires_simulation") else "No"
            table.add_row(
                name,
                metadata.get("version", "Unknown"),
                sim_required,
                getattr(registry.plugins[name], "__doc__", "No description") or "No description"
            )
        
        console.print(table)
    
    asyncio.run(_run())

@app.command()
def worker():
    """Start a scan worker"""
    rprint("[cyan]Starting Scorpius scan worker...[/cyan]")
    from .core.stream_queue import queue
    
    async def _worker():
        async for message_id, payload in queue.consume():
            try:
                orchestrator = ScanOrchestrator()
                await orchestrator.execute_scan(**payload)
                rprint(f"[green]Completed scan {payload.get('scan_id')}[/green]")
            except Exception as e:
                rprint(f"[red]Failed to process scan: {e}[/red]")
    
    asyncio.run(_worker())

def _display_results(target: str, findings: List):
    """Display scan results in a nice format"""
    console.print(f"\n[bold blue]Scan Results for {target}[/bold blue]")
    console.print(f"Found {len(findings)} issues\n")
    
    if not findings:
        console.print("[green]No vulnerabilities found! ✅[/green]")
        return
    
    # Group by severity
    by_severity = {}
    for finding in findings:
        severity = finding.severity
        if severity not in by_severity:
            by_severity[severity] = []
        by_severity[severity].append(finding)
    
    # Display by severity
    severity_colors = {
        "critical": "red",
        "high": "orange1", 
        "medium": "yellow",
        "low": "blue",
        "info": "dim"
    }
    
    for severity in ["critical", "high", "medium", "low", "info"]:
        if severity in by_severity:
            color = severity_colors.get(severity, "white")
            console.print(f"\n[{color}]{severity.upper()} ({len(by_severity[severity])})[/{color}]")
            
            for finding in by_severity[severity]:
                console.print(f"  • {finding.title} ({finding.id})")
                if finding.description:
                    console.print(f"    {finding.description}")

if __name__ == "__main__":
    app()
