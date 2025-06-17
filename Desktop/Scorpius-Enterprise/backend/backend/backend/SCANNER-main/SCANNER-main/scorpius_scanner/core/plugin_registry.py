import importlib
import pkgutil
from typing import Dict, Type

from .. import plugins as plugins_package
from ..plugin_base import ScannerPlugin
from .logging import get_logger

logger = get_logger(__name__)

class PluginRegistry:
    """Manages the discovery and registration of scanner plugins."""

    def __init__(self):
        self.plugins: Dict[str, ScannerPlugin] = {}
        self._loaded = False

    async def discover_and_load(self):
        """Discover and load all plugins from the plugins directory."""
        if self._loaded:
            return

        logger.info(f"Discovering plugins in: {plugins_package.__name__}")
        
        for _, name, _ in pkgutil.iter_modules(plugins_package.__path__):
            try:
                module = importlib.import_module(f"{plugins_package.__name__}.{name}")
                for item_name in dir(module):
                    item = getattr(module, item_name)
                    if (
                        isinstance(item, type)
                        and issubclass(item, ScannerPlugin)
                        and item is not ScannerPlugin
                    ):
                        instance = item()
                        if instance.name in self.plugins:
                            logger.warning(f"Duplicate plugin name '{instance.name}' found. Overwriting.")
                        self.plugins[instance.name] = instance
                        logger.info(f"Loaded plugin: '{instance.name}' version {instance.version}")
            except Exception as e:
                logger.error(f"Failed to load plugin from module '{name}': {e}", exc_info=True)
        
        self._loaded = True

    def list_plugins(self) -> Dict[str, Dict]:
        """Return a dictionary of loaded plugins and their metadata."""
        return {
            name: {
                "version": plugin.version,
                "requires_simulation": plugin.requires_simulation,
                "description": plugin.__doc__.strip() if plugin.__doc__ else "No description available.",
            }
            for name, plugin in self.plugins.items()
        }

# Global registry instance
registry = PluginRegistry()