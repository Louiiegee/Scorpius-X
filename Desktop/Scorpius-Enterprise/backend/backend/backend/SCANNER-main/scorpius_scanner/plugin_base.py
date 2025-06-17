from __future__ import annotations

import abc
from typing import List
from .models import Finding, ScanContext

class ScannerPlugin(abc.ABC):
    """All detectors inherit this. Convention over configuration."""

    name: str = "unnamed-plugin"
    version: str = "0.0.1"
    requires_simulation: bool = False

    @abc.abstractmethod
    async def scan(self, target: str, ctx: ScanContext) -> List[Finding]:
        """Main entry point for plugin execution"""
        pass

    async def setup(self, ctx: ScanContext) -> None:
        """Optional setup phase"""
        pass

    async def teardown(self, ctx: ScanContext) -> None:
        """Optional cleanup phase"""
        pass
