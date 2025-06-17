"""
Enterprise Reporting Theme Management
====================================

Theme packs and styling system for reports with support for Dark Pro, Light Corporate,
and Custom Brand themes.
"""

import os
import yaml
from typing import Dict, List, Any, Optional
from pathlib import Path
from dataclasses import dataclass, asdict
from enum import Enum


class ThemeType(str, Enum):
    """Available theme types"""
    DARK_PRO = "dark_pro"
    LIGHT_CORPORATE = "light_corporate"
    CUSTOM = "custom"


@dataclass
class ColorScheme:
    """Color scheme definition"""
    primary: str
    secondary: str
    accent: str
    background: str
    surface: str
    text_primary: str
    text_secondary: str
    success: str
    warning: str
    error: str
    info: str
    
    # Severity colors
    critical: str
    high: str
    medium: str
    low: str


@dataclass
class Typography:
    """Typography configuration"""
    font_family_primary: str
    font_family_secondary: str
    font_family_code: str
    font_size_base: str
    font_size_small: str
    font_size_large: str
    font_size_heading: str
    font_weight_normal: str
    font_weight_bold: str
    line_height_base: float
    line_height_heading: float


@dataclass
class Layout:
    """Layout configuration"""
    container_max_width: str
    margin_base: str
    margin_small: str
    margin_large: str
    padding_base: str
    padding_small: str
    padding_large: str
    border_radius_base: str
    border_radius_large: str
    border_width: str
    box_shadow_base: str
    box_shadow_large: str


@dataclass
class ComponentStyles:
    """Component-specific styling"""
    header_background: str
    header_text: str
    sidebar_background: str
    sidebar_text: str
    card_background: str
    card_border: str
    table_header_background: str
    table_row_alt_background: str
    button_primary_background: str
    button_primary_text: str
    button_secondary_background: str
    button_secondary_text: str


@dataclass
class ThemeConfig:
    """Complete theme configuration"""
    name: str
    description: str
    version: str
    colors: ColorScheme
    typography: Typography
    layout: Layout
    components: ComponentStyles
    custom_css: Optional[str] = None
    logo_path: Optional[str] = None
    watermark_config: Optional[Dict[str, Any]] = None


class ThemeManager:
    """
    Manages theme packs and provides theme-related utilities.
    
    Features:
    - Built-in theme packs (Dark Pro, Light Corporate)
    - Custom theme loading from YAML
    - Theme validation and compilation
    - CSS generation from theme configs
    """

    def __init__(self, themes_dir: Optional[str] = None):
        """
        Initialize theme manager.
        
        Args:
            themes_dir: Directory containing custom theme files
        """
        self.themes_dir = Path(themes_dir or "themes")
        self.themes_dir.mkdir(exist_ok=True)
        
        # Built-in themes
        self._builtin_themes = {}
        self._load_builtin_themes()
        
        # Custom themes
        self._custom_themes = {}
        self._load_custom_themes()

    def _load_builtin_themes(self) -> None:
        """Load built-in theme configurations"""
        
        # Dark Pro Theme
        dark_pro = ThemeConfig(
            name="Dark Pro",
            description="Professional dark theme optimized for security reports",
            version="1.0.0",
            colors=ColorScheme(
                primary="#3b82f6",
                secondary="#6366f1", 
                accent="#8b5cf6",
                background="#0a0a0a",
                surface="#1a1a1a",
                text_primary="#ffffff",
                text_secondary="#a1a1aa",
                success="#10b981",
                warning="#f59e0b",
                error="#ef4444",
                info="#06b6d4",
                critical="#dc2626",
                high="#ea580c",
                medium="#d97706",
                low="#65a30d"
            ),
            typography=Typography(
                font_family_primary="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                font_family_secondary="'Inter', sans-serif",
                font_family_code="'JetBrains Mono', 'Fira Code', monospace",
                font_size_base="14px",
                font_size_small="12px",
                font_size_large="16px",
                font_size_heading="24px",
                font_weight_normal="400",
                font_weight_bold="600",
                line_height_base=1.6,
                line_height_heading=1.2
            ),
            layout=Layout(
                container_max_width="1200px",
                margin_base="16px",
                margin_small="8px",
                margin_large="32px",
                padding_base="16px",
                padding_small="8px",
                padding_large="24px",
                border_radius_base="8px",
                border_radius_large="12px",
                border_width="1px",
                box_shadow_base="0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                box_shadow_large="0 20px 25px -5px rgba(0, 0, 0, 0.1)"
            ),
            components=ComponentStyles(
                header_background="linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)",
                header_text="#ffffff",
                sidebar_background="#111111",
                sidebar_text="#a1a1aa",
                card_background="#1a1a1a",
                card_border="#333333",
                table_header_background="#2a2a2a",
                table_row_alt_background="#1f1f1f",
                button_primary_background="#3b82f6",
                button_primary_text="#ffffff",
                button_secondary_background="#374151",
                button_secondary_text="#d1d5db"
            ),
            custom_css="""
                .risk-critical { color: #dc2626; font-weight: 600; }
                .risk-high { color: #ea580c; font-weight: 600; }
                .risk-medium { color: #d97706; font-weight: 500; }
                .risk-low { color: #65a30d; font-weight: 500; }
                
                .vulnerability-card {
                    background: linear-gradient(135deg, #1f1f1f 0%, #2a2a2a 100%);
                    border: 1px solid #404040;
                    border-left: 4px solid var(--severity-color);
                }
                
                .code-block {
                    background: #0f0f0f;
                    border: 1px solid #333;
                    border-radius: 6px;
                    padding: 16px;
                    font-family: var(--font-family-code);
                    overflow-x: auto;
                }
                
                .metric-card {
                    background: radial-gradient(circle at top right, #1f2937 0%, #111827 100%);
                    border: 1px solid #374151;
                }
                
                @media print {
                    body { background: white !important; color: black !important; }
                    .container { box-shadow: none !important; }
                }
            """
        )
        
        # Light Corporate Theme
        light_corporate = ThemeConfig(
            name="Light Corporate",
            description="Clean light theme suitable for corporate environments",
            version="1.0.0",
            colors=ColorScheme(
                primary="#2563eb",
                secondary="#7c3aed",
                accent="#0891b2",
                background="#ffffff",
                surface="#f8fafc",
                text_primary="#1f2937",
                text_secondary="#6b7280",
                success="#059669",
                warning="#d97706",
                error="#dc2626",
                info="#0891b2",
                critical="#dc2626",
                high="#ea580c",
                medium="#d97706",
                low="#059669"
            ),
            typography=Typography(
                font_family_primary="'Inter', system-ui, sans-serif",
                font_family_secondary="'Roboto', sans-serif",
                font_family_code="'Source Code Pro', monospace",
                font_size_base="14px",
                font_size_small="12px",
                font_size_large="16px",
                font_size_heading="28px",
                font_weight_normal="400",
                font_weight_bold="600",
                line_height_base=1.7,
                line_height_heading=1.3
            ),
            layout=Layout(
                container_max_width="1200px",
                margin_base="20px",
                margin_small="10px",
                margin_large="40px",
                padding_base="20px",
                padding_small="10px",
                padding_large="30px",
                border_radius_base="6px",
                border_radius_large="10px",
                border_width="1px",
                box_shadow_base="0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                box_shadow_large="0 10px 15px -3px rgba(0, 0, 0, 0.1)"
            ),
            components=ComponentStyles(
                header_background="linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
                header_text="#1f2937",
                sidebar_background="#f1f5f9",
                sidebar_text="#475569",
                card_background="#ffffff",
                card_border="#e5e7eb",
                table_header_background="#f9fafb",
                table_row_alt_background="#f8fafc",
                button_primary_background="#2563eb",
                button_primary_text="#ffffff",
                button_secondary_background="#f3f4f6",
                button_secondary_text="#374151"
            ),
            custom_css="""
                .risk-critical { color: #dc2626; font-weight: 700; }
                .risk-high { color: #ea580c; font-weight: 600; }
                .risk-medium { color: #d97706; font-weight: 500; }
                .risk-low { color: #059669; font-weight: 500; }
                
                .vulnerability-card {
                    background: #ffffff;
                    border: 1px solid #e5e7eb;
                    border-left: 4px solid var(--severity-color);
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                }
                
                .code-block {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    padding: 20px;
                    font-family: var(--font-family-code);
                    overflow-x: auto;
                }
                
                .metric-card {
                    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
                    border: 1px solid #e5e7eb;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
                
                .executive-summary {
                    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
                    border: 1px solid #bfdbfe;
                    border-radius: 8px;
                    padding: 24px;
                }
            """
        )
        
        self._builtin_themes[ThemeType.DARK_PRO] = dark_pro
        self._builtin_themes[ThemeType.LIGHT_CORPORATE] = light_corporate

    def _load_custom_themes(self) -> None:
        """Load custom themes from theme directory"""
        for theme_file in self.themes_dir.glob("*.yaml"):
            try:
                with open(theme_file, 'r', encoding='utf-8') as f:
                    theme_data = yaml.safe_load(f)
                
                theme_config = self._parse_theme_config(theme_data)
                theme_name = theme_file.stem
                self._custom_themes[theme_name] = theme_config
                
            except Exception as e:
                print(f"Warning: Failed to load theme {theme_file}: {e}")

    def _parse_theme_config(self, theme_data: Dict[str, Any]) -> ThemeConfig:
        """Parse theme configuration from YAML data"""
        return ThemeConfig(
            name=theme_data.get('name', 'Custom Theme'),
            description=theme_data.get('description', ''),
            version=theme_data.get('version', '1.0.0'),
            colors=ColorScheme(**theme_data.get('colors', {})),
            typography=Typography(**theme_data.get('typography', {})),
            layout=Layout(**theme_data.get('layout', {})),
            components=ComponentStyles(**theme_data.get('components', {})),
            custom_css=theme_data.get('custom_css'),
            logo_path=theme_data.get('logo_path'),
            watermark_config=theme_data.get('watermark_config')
        )

    def get_theme_config(self, theme_name: str) -> ThemeConfig:
        """
        Get theme configuration by name.
        
        Args:
            theme_name: Theme name or type
            
        Returns:
            ThemeConfig object
        """
        # Check built-in themes first
        if theme_name in self._builtin_themes:
            return self._builtin_themes[theme_name]
        
        # Check custom themes
        if theme_name in self._custom_themes:
            return self._custom_themes[theme_name]
        
        # Default to dark pro if not found
        return self._builtin_themes[ThemeType.DARK_PRO]

    def get_available_themes(self) -> List[Dict[str, str]]:
        """
        Get list of available themes.
        
        Returns:
            List of theme info dictionaries
        """
        themes = []
        
        # Add built-in themes
        for theme_type, theme_config in self._builtin_themes.items():
            themes.append({
                'id': theme_type.value,
                'name': theme_config.name,
                'description': theme_config.description,
                'type': 'builtin',
                'version': theme_config.version
            })
        
        # Add custom themes
        for theme_name, theme_config in self._custom_themes.items():
            themes.append({
                'id': theme_name,
                'name': theme_config.name,
                'description': theme_config.description,
                'type': 'custom',
                'version': theme_config.version
            })
        
        return themes

    def generate_css(self, theme_config: ThemeConfig) -> str:
        """
        Generate CSS from theme configuration.
        
        Args:
            theme_config: Theme configuration
            
        Returns:
            Complete CSS stylesheet
        """
        css_vars = self._generate_css_variables(theme_config)
        base_styles = self._generate_base_styles(theme_config)
        component_styles = self._generate_component_styles(theme_config)
        custom_css = theme_config.custom_css or ""
        
        return f"""
/* Theme: {theme_config.name} v{theme_config.version} */
{css_vars}

{base_styles}

{component_styles}

{custom_css}
        """.strip()

    def _generate_css_variables(self, theme: ThemeConfig) -> str:
        """Generate CSS custom properties from theme config"""
        vars_list = []
        
        # Color variables
        for key, value in asdict(theme.colors).items():
            vars_list.append(f"  --color-{key.replace('_', '-')}: {value};")
        
        # Typography variables
        for key, value in asdict(theme.typography).items():
            vars_list.append(f"  --{key.replace('_', '-')}: {value};")
        
        # Layout variables
        for key, value in asdict(theme.layout).items():
            vars_list.append(f"  --{key.replace('_', '-')}: {value};")
        
        # Component variables
        for key, value in asdict(theme.components).items():
            vars_list.append(f"  --component-{key.replace('_', '-')}: {value};")
        
        return ":root {\n" + "\n".join(vars_list) + "\n}"

    def _generate_base_styles(self, theme: ThemeConfig) -> str:
        """Generate base styling rules"""
        return f"""
* {{
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}}

body {{
    font-family: var(--font-family-primary);
    font-size: var(--font-size-base);
    line-height: var(--line-height-base);
    color: var(--color-text-primary);
    background-color: var(--color-background);
}}

.container {{
    max-width: var(--container-max-width);
    margin: 0 auto;
    padding: var(--padding-base);
    background-color: var(--color-surface);
    border-radius: var(--border-radius-large);
    box-shadow: var(--box-shadow-large);
}}

h1, h2, h3, h4, h5, h6 {{
    font-family: var(--font-family-secondary);
    font-weight: var(--font-weight-bold);
    line-height: var(--line-height-heading);
    color: var(--color-text-primary);
    margin-bottom: var(--margin-base);
}}

h1 {{ font-size: var(--font-size-heading); }}
h2 {{ font-size: calc(var(--font-size-heading) * 0.8); }}
h3 {{ font-size: calc(var(--font-size-heading) * 0.6); }}

p {{
    margin-bottom: var(--margin-base);
    color: var(--color-text-secondary);
}}

code {{
    font-family: var(--font-family-code);
    background-color: var(--color-surface);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: calc(var(--font-size-base) * 0.9);
}}

table {{
    width: 100%;
    border-collapse: collapse;
    margin-bottom: var(--margin-base);
    background-color: var(--color-surface);
    border-radius: var(--border-radius-base);
    overflow: hidden;
}}

th, td {{
    padding: var(--padding-small);
    text-align: left;
    border-bottom: var(--border-width) solid var(--component-card-border);
}}

th {{
    background-color: var(--component-table-header-background);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
}}

tr:nth-child(even) {{
    background-color: var(--component-table-row-alt-background);
}}
        """

    def _generate_component_styles(self, theme: ThemeConfig) -> str:
        """Generate component-specific styling rules"""
        return f"""
.header {{
    background: var(--component-header-background);
    color: var(--component-header-text);
    padding: var(--padding-large);
    border-radius: var(--border-radius-base);
    margin-bottom: var(--margin-large);
    text-align: center;
}}

.sidebar {{
    background-color: var(--component-sidebar-background);
    color: var(--component-sidebar-text);
    padding: var(--padding-base);
    border-radius: var(--border-radius-base);
}}

.card {{
    background-color: var(--component-card-background);
    border: var(--border-width) solid var(--component-card-border);
    border-radius: var(--border-radius-base);
    padding: var(--padding-base);
    margin-bottom: var(--margin-base);
    box-shadow: var(--box-shadow-base);
}}

.btn {{
    padding: var(--padding-small) var(--padding-base);
    border: none;
    border-radius: var(--border-radius-base);
    font-family: var(--font-family-primary);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-bold);
    cursor: pointer;
    transition: all 0.2s ease;
}}

.btn-primary {{
    background-color: var(--component-button-primary-background);
    color: var(--component-button-primary-text);
}}

.btn-secondary {{
    background-color: var(--component-button-secondary-background);
    color: var(--component-button-secondary-text);
}}

.metric-grid {{
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--margin-base);
    margin-bottom: var(--margin-large);
}}

.severity-critical {{ color: var(--color-critical); }}
.severity-high {{ color: var(--color-high); }}
.severity-medium {{ color: var(--color-medium); }}
.severity-low {{ color: var(--color-low); }}

.status-success {{ color: var(--color-success); }}
.status-warning {{ color: var(--color-warning); }}
.status-error {{ color: var(--color-error); }}
.status-info {{ color: var(--color-info); }}
        """

    def create_custom_theme(
        self,
        theme_name: str,
        theme_config: Dict[str, Any],
        save_to_disk: bool = True
    ) -> ThemeConfig:
        """
        Create a new custom theme.
        
        Args:
            theme_name: Name for the new theme
            theme_config: Theme configuration dictionary
            save_to_disk: Whether to save theme to disk
            
        Returns:
            Created ThemeConfig object
        """
        theme = self._parse_theme_config(theme_config)
        self._custom_themes[theme_name] = theme
        
        if save_to_disk:
            theme_file = self.themes_dir / f"{theme_name}.yaml"
            with open(theme_file, 'w', encoding='utf-8') as f:
                yaml.dump(theme_config, f, default_flow_style=False)
        
        return theme

    def validate_theme(self, theme_config: Dict[str, Any]) -> List[str]:
        """
        Validate theme configuration.
        
        Args:
            theme_config: Theme configuration to validate
            
        Returns:
            List of validation errors (empty if valid)
        """
        errors = []
        
        required_sections = ['colors', 'typography', 'layout', 'components']
        for section in required_sections:
            if section not in theme_config:
                errors.append(f"Missing required section: {section}")
        
        # Validate color format (basic hex validation)
        if 'colors' in theme_config:
            for color_name, color_value in theme_config['colors'].items():
                if isinstance(color_value, str) and color_value.startswith('#'):
                    if len(color_value) not in [4, 7]:  # #RGB or #RRGGBB
                        errors.append(f"Invalid color format for {color_name}: {color_value}")
        
        return errors

    def export_theme(self, theme_name: str) -> Optional[Dict[str, Any]]:
        """
        Export theme configuration as dictionary.
        
        Args:
            theme_name: Name of theme to export
            
        Returns:
            Theme configuration dictionary or None if not found
        """
        theme_config = self.get_theme_config(theme_name)
        if not theme_config:
            return None
        
        return {
            'name': theme_config.name,
            'description': theme_config.description,
            'version': theme_config.version,
            'colors': asdict(theme_config.colors),
            'typography': asdict(theme_config.typography),
            'layout': asdict(theme_config.layout),
            'components': asdict(theme_config.components),
            'custom_css': theme_config.custom_css,
            'logo_path': theme_config.logo_path,
            'watermark_config': theme_config.watermark_config
        }
