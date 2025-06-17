"""
Enterprise Reporting Widget System
==================================

Extensible widget system for report components including heatmaps, call graphs,
opcode histograms, timelines, and custom visualizations.
"""

import json
import base64
from typing import Dict, List, Any, Optional, Callable, Union
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
import hashlib

# Visualization libraries
try:
    import plotly.graph_objects as go
    import plotly.express as px
    from plotly.utils import PlotlyJSONEncoder
    PLOTLY_AVAILABLE = True
except ImportError:
    PLOTLY_AVAILABLE = False

try:
    import networkx as nx
    NETWORKX_AVAILABLE = True
except ImportError:
    NETWORKX_AVAILABLE = False


@dataclass
class WidgetConfig:
    """Widget configuration"""
    widget_type: str
    title: str
    description: str
    data_requirements: List[str]
    config_schema: Dict[str, Any]
    default_config: Dict[str, Any]


class BaseWidget(ABC):
    """
    Base class for all report widgets.
    
    All widgets must implement the render method and provide configuration.
    """

    def __init__(self, widget_id: str, config: Dict[str, Any]):
        """
        Initialize widget.
        
        Args:
            widget_id: Unique widget identifier
            config: Widget configuration
        """
        self.widget_id = widget_id
        self.config = config

    @abstractmethod
    def render(self, data: Dict[str, Any], **kwargs) -> str:
        """
        Render widget to HTML.
        
        Args:
            data: Widget data
            **kwargs: Additional rendering options
            
        Returns:
            HTML representation of widget
        """
        pass

    @abstractmethod
    def get_config_schema(self) -> Dict[str, Any]:
        """
        Get widget configuration schema.
        
        Returns:
            JSON schema for widget configuration
        """
        pass

    def validate_data(self, data: Dict[str, Any]) -> bool:
        """
        Validate widget data.
        
        Args:
            data: Data to validate
            
        Returns:
            True if data is valid
        """
        return True

    def get_dependencies(self) -> List[str]:
        """
        Get required dependencies for this widget.
        
        Returns:
            List of dependency names
        """
        return []


class HeatmapWidget(BaseWidget):
    """
    Risk heatmap widget showing vulnerability distribution.
    """

    def render(self, data: Dict[str, Any], **kwargs) -> str:
        """Render risk heatmap"""
        if not PLOTLY_AVAILABLE:
            return self._render_fallback(data)

        # Extract heatmap data
        vulnerabilities = data.get('vulnerabilities', [])
        
        # Create severity vs function matrix
        functions = list(set(v.get('function_name', 'unknown') for v in vulnerabilities))
        severities = ['critical', 'high', 'medium', 'low']
        
        # Build matrix
        matrix = []
        labels = []
        
        for severity in severities:
            row = []
            row_labels = []
            for function in functions:
                count = len([v for v in vulnerabilities 
                           if v.get('severity', '').lower() == severity 
                           and v.get('function_name') == function])
                row.append(count)
                row_labels.append(f"{function}<br>{severity}: {count}")
            matrix.append(row)
            labels.append(row_labels)

        # Create heatmap
        fig = go.Figure(data=go.Heatmap(
            z=matrix,
            x=functions,
            y=severities,
            text=labels,
            texttemplate="%{text}",
            colorscale='Reds',
            showscale=True
        ))

        fig.update_layout(
            title=self.config.get('title', 'Vulnerability Risk Heatmap'),
            xaxis_title="Functions",
            yaxis_title="Severity",
            height=400,
            font=dict(size=12)
        )

        # Convert to HTML
        plot_html = fig.to_html(
            include_plotlyjs='cdn',
            div_id=f"heatmap_{self.widget_id}"
        )

        return f"""
        <div class="widget heatmap-widget" id="{self.widget_id}">
            <div class="widget-header">
                <h3>{self.config.get('title', 'Risk Heatmap')}</h3>
                <p class="widget-description">{self.config.get('description', '')}</p>
            </div>
            <div class="widget-content">
                {plot_html}
            </div>
        </div>
        """

    def _render_fallback(self, data: Dict[str, Any]) -> str:
        """Fallback rendering without Plotly"""
        vulnerabilities = data.get('vulnerabilities', [])
        severity_counts = {}
        
        for vuln in vulnerabilities:
            severity = vuln.get('severity', 'unknown').lower()
            severity_counts[severity] = severity_counts.get(severity, 0) + 1

        rows = []
        for severity, count in severity_counts.items():
            rows.append(f"<tr><td class='severity-{severity}'>{severity.title()}</td><td>{count}</td></tr>")

        return f"""
        <div class="widget heatmap-widget fallback" id="{self.widget_id}">
            <div class="widget-header">
                <h3>{self.config.get('title', 'Vulnerability Distribution')}</h3>
            </div>
            <div class="widget-content">
                <table class="severity-table">
                    <thead>
                        <tr><th>Severity</th><th>Count</th></tr>
                    </thead>
                    <tbody>
                        {''.join(rows)}
                    </tbody>
                </table>
            </div>
        </div>
        """

    def get_config_schema(self) -> Dict[str, Any]:
        """Get configuration schema"""
        return {
            "type": "object",
            "properties": {
                "title": {"type": "string", "default": "Vulnerability Risk Heatmap"},
                "description": {"type": "string", "default": ""},
                "colorscale": {"type": "string", "default": "Reds"},
                "height": {"type": "integer", "default": 400}
            }
        }


class CallGraphWidget(BaseWidget):
    """
    Function call graph visualization widget.
    """

    def render(self, data: Dict[str, Any], **kwargs) -> str:
        """Render call graph"""
        if not NETWORKX_AVAILABLE:
            return self._render_fallback(data)

        call_data = data.get('call_graph', {})
        nodes = call_data.get('nodes', [])
        edges = call_data.get('edges', [])

        # Create networkx graph
        G = nx.DiGraph()
        
        # Add nodes with attributes
        for node in nodes:
            G.add_node(
                node['id'], 
                label=node.get('name', node['id']),
                risk_level=node.get('risk_level', 'low'),
                vulnerability_count=node.get('vulnerability_count', 0)
            )

        # Add edges
        for edge in edges:
            G.add_edge(edge['source'], edge['target'])

        # Generate vis-network format
        vis_nodes = []
        for node_id, attrs in G.nodes(data=True):
            color = self._get_risk_color(attrs.get('risk_level', 'low'))
            vis_nodes.append({
                'id': node_id,
                'label': attrs.get('label', node_id),
                'color': color,
                'title': f"Vulnerabilities: {attrs.get('vulnerability_count', 0)}"
            })

        vis_edges = []
        for source, target in G.edges():
            vis_edges.append({
                'from': source,
                'to': target,
                'arrows': 'to'
            })

        # Generate JavaScript for vis-network
        graph_data = {
            'nodes': vis_nodes,
            'edges': vis_edges
        }

        js_code = f"""
        var nodes = new vis.DataSet({json.dumps(vis_nodes)});
        var edges = new vis.DataSet({json.dumps(vis_edges)});
        var data = {{ nodes: nodes, edges: edges }};
        var options = {{
            layout: {{ randomSeed: 2 }},
            physics: {{ enabled: true }},
            nodes: {{
                shape: 'dot',
                size: 16,
                font: {{ size: 12 }},
                borderWidth: 2
            }},
            edges: {{
                width: 2,
                color: {{ color: '#848484' }}
            }}
        }};
        var network = new vis.Network(document.getElementById('callgraph_{self.widget_id}'), data, options);
        """

        return f"""
        <div class="widget callgraph-widget" id="{self.widget_id}">
            <div class="widget-header">
                <h3>{self.config.get('title', 'Function Call Graph')}</h3>
                <p class="widget-description">{self.config.get('description', '')}</p>
            </div>
            <div class="widget-content">
                <div id="callgraph_{self.widget_id}" style="height: {self.config.get('height', 400)}px;"></div>
                <script src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
                <script>{js_code}</script>
            </div>
        </div>
        """

    def _render_fallback(self, data: Dict[str, Any]) -> str:
        """Fallback rendering without NetworkX"""
        call_data = data.get('call_graph', {})
        nodes = call_data.get('nodes', [])
        
        node_list = []
        for node in nodes:
            risk_class = f"risk-{node.get('risk_level', 'low')}"
            node_list.append(
                f"<li class='{risk_class}'>"
                f"{node.get('name', node['id'])} "
                f"({node.get('vulnerability_count', 0)} vulnerabilities)"
                f"</li>"
            )

        return f"""
        <div class="widget callgraph-widget fallback" id="{self.widget_id}">
            <div class="widget-header">
                <h3>{self.config.get('title', 'Function List')}</h3>
            </div>
            <div class="widget-content">
                <ul class="function-list">
                    {''.join(node_list)}
                </ul>
            </div>
        </div>
        """

    def _get_risk_color(self, risk_level: str) -> str:
        """Get color for risk level"""
        colors = {
            'critical': '#dc2626',
            'high': '#ea580c',
            'medium': '#d97706',
            'low': '#65a30d'
        }
        return colors.get(risk_level.lower(), '#6b7280')

    def get_config_schema(self) -> Dict[str, Any]:
        """Get configuration schema"""
        return {
            "type": "object",
            "properties": {
                "title": {"type": "string", "default": "Function Call Graph"},
                "description": {"type": "string", "default": ""},
                "height": {"type": "integer", "default": 400},
                "physics": {"type": "boolean", "default": True}
            }
        }


class TimelineWidget(BaseWidget):
    """
    Transaction timeline widget showing events over time.
    """

    def render(self, data: Dict[str, Any], **kwargs) -> str:
        """Render timeline"""
        if not PLOTLY_AVAILABLE:
            return self._render_fallback(data)

        events = data.get('timeline_events', [])
        
        if not events:
            return self._render_empty()

        # Sort events by timestamp
        sorted_events = sorted(events, key=lambda x: x.get('timestamp', ''))

        # Create timeline plot
        fig = go.Figure()

        # Group events by type
        event_types = {}
        for event in sorted_events:
            event_type = event.get('type', 'unknown')
            if event_type not in event_types:
                event_types[event_type] = []
            event_types[event_type].append(event)

        # Add traces for each event type
        colors = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6']
        for i, (event_type, type_events) in enumerate(event_types.items()):
            timestamps = [e.get('timestamp', '') for e in type_events]
            values = [i] * len(type_events)  # Y position for this event type
            
            fig.add_trace(go.Scatter(
                x=timestamps,
                y=values,
                mode='markers+text',
                name=event_type.title(),
                text=[e.get('description', '') for e in type_events],
                textposition='top center',
                marker=dict(size=10, color=colors[i % len(colors)])
            ))

        fig.update_layout(
            title=self.config.get('title', 'Transaction Timeline'),
            xaxis_title="Time",
            yaxis_title="Event Type",
            height=300,
            showlegend=True,
            yaxis=dict(
                tickmode='array',
                tickvals=list(range(len(event_types))),
                ticktext=list(event_types.keys())
            )
        )

        plot_html = fig.to_html(
            include_plotlyjs='cdn',
            div_id=f"timeline_{self.widget_id}"
        )

        return f"""
        <div class="widget timeline-widget" id="{self.widget_id}">
            <div class="widget-header">
                <h3>{self.config.get('title', 'Transaction Timeline')}</h3>
                <p class="widget-description">{self.config.get('description', '')}</p>
            </div>
            <div class="widget-content">
                {plot_html}
            </div>
        </div>
        """

    def _render_fallback(self, data: Dict[str, Any]) -> str:
        """Fallback rendering without Plotly"""
        events = data.get('timeline_events', [])
        
        if not events:
            return self._render_empty()

        sorted_events = sorted(events, key=lambda x: x.get('timestamp', ''))
        
        event_items = []
        for event in sorted_events:
            timestamp = event.get('timestamp', 'Unknown')
            event_type = event.get('type', 'unknown')
            description = event.get('description', '')
            
            event_items.append(f"""
                <div class="timeline-event event-{event_type}">
                    <div class="event-time">{timestamp}</div>
                    <div class="event-type">{event_type.title()}</div>
                    <div class="event-description">{description}</div>
                </div>
            """)

        return f"""
        <div class="widget timeline-widget fallback" id="{self.widget_id}">
            <div class="widget-header">
                <h3>{self.config.get('title', 'Transaction Timeline')}</h3>
            </div>
            <div class="widget-content">
                <div class="timeline-container">
                    {''.join(event_items)}
                </div>
            </div>
        </div>
        """

    def _render_empty(self) -> str:
        """Render empty state"""
        return f"""
        <div class="widget timeline-widget empty" id="{self.widget_id}">
            <div class="widget-header">
                <h3>{self.config.get('title', 'Transaction Timeline')}</h3>
            </div>
            <div class="widget-content">
                <div class="empty-state">
                    <p>No timeline events available</p>
                </div>
            </div>
        </div>
        """

    def get_config_schema(self) -> Dict[str, Any]:
        """Get configuration schema"""
        return {
            "type": "object",
            "properties": {
                "title": {"type": "string", "default": "Transaction Timeline"},
                "description": {"type": "string", "default": ""},
                "height": {"type": "integer", "default": 300}
            }
        }


class OpcodeHistogramWidget(BaseWidget):
    """
    Opcode usage histogram widget.
    """

    def render(self, data: Dict[str, Any], **kwargs) -> str:
        """Render opcode histogram"""
        if not PLOTLY_AVAILABLE:
            return self._render_fallback(data)

        opcode_data = data.get('opcodes', {})
        
        if not opcode_data:
            return self._render_empty()

        # Sort opcodes by frequency
        sorted_opcodes = sorted(opcode_data.items(), key=lambda x: x[1], reverse=True)
        opcodes = [item[0] for item in sorted_opcodes]
        counts = [item[1] for item in sorted_opcodes]

        # Take top N opcodes
        max_opcodes = self.config.get('max_opcodes', 20)
        opcodes = opcodes[:max_opcodes]
        counts = counts[:max_opcodes]

        fig = go.Figure(data=[
            go.Bar(x=opcodes, y=counts, marker_color='#3b82f6')
        ])

        fig.update_layout(
            title=self.config.get('title', 'Opcode Usage Histogram'),
            xaxis_title="Opcode",
            yaxis_title="Frequency",
            height=400,
            xaxis=dict(tickangle=45)
        )

        plot_html = fig.to_html(
            include_plotlyjs='cdn',
            div_id=f"histogram_{self.widget_id}"
        )

        return f"""
        <div class="widget histogram-widget" id="{self.widget_id}">
            <div class="widget-header">
                <h3>{self.config.get('title', 'Opcode Usage Histogram')}</h3>
                <p class="widget-description">{self.config.get('description', '')}</p>
            </div>
            <div class="widget-content">
                {plot_html}
            </div>
        </div>
        """

    def _render_fallback(self, data: Dict[str, Any]) -> str:
        """Fallback rendering without Plotly"""
        opcode_data = data.get('opcodes', {})
        
        if not opcode_data:
            return self._render_empty()

        sorted_opcodes = sorted(opcode_data.items(), key=lambda x: x[1], reverse=True)
        max_opcodes = self.config.get('max_opcodes', 20)
        
        rows = []
        for opcode, count in sorted_opcodes[:max_opcodes]:
            rows.append(f"<tr><td>{opcode}</td><td>{count}</td></tr>")

        return f"""
        <div class="widget histogram-widget fallback" id="{self.widget_id}">
            <div class="widget-header">
                <h3>{self.config.get('title', 'Opcode Usage')}</h3>
            </div>
            <div class="widget-content">
                <table class="opcode-table">
                    <thead>
                        <tr><th>Opcode</th><th>Count</th></tr>
                    </thead>
                    <tbody>
                        {''.join(rows)}
                    </tbody>
                </table>
            </div>
        </div>
        """

    def _render_empty(self) -> str:
        """Render empty state"""
        return f"""
        <div class="widget histogram-widget empty" id="{self.widget_id}">
            <div class="widget-header">
                <h3>{self.config.get('title', 'Opcode Usage Histogram')}</h3>
            </div>
            <div class="widget-content">
                <div class="empty-state">
                    <p>No opcode data available</p>
                </div>
            </div>
        </div>
        """

    def get_config_schema(self) -> Dict[str, Any]:
        """Get configuration schema"""
        return {
            "type": "object",
            "properties": {
                "title": {"type": "string", "default": "Opcode Usage Histogram"},
                "description": {"type": "string", "default": ""},
                "max_opcodes": {"type": "integer", "default": 20}
            }
        }


class MetricsCardWidget(BaseWidget):
    """
    Key metrics display card widget.
    """

    def render(self, data: Dict[str, Any], **kwargs) -> str:
        """Render metrics card"""
        metrics = data.get('metrics', {})
        
        metric_items = []
        for metric_name, metric_value in metrics.items():
            formatted_value = self._format_metric_value(metric_value)
            metric_class = self._get_metric_class(metric_name, metric_value)
            
            metric_items.append(f"""
                <div class="metric-item {metric_class}">
                    <div class="metric-label">{metric_name.replace('_', ' ').title()}</div>
                    <div class="metric-value">{formatted_value}</div>
                </div>
            """)

        return f"""
        <div class="widget metrics-widget" id="{self.widget_id}">
            <div class="widget-header">
                <h3>{self.config.get('title', 'Key Metrics')}</h3>
                <p class="widget-description">{self.config.get('description', '')}</p>
            </div>
            <div class="widget-content">
                <div class="metrics-grid">
                    {''.join(metric_items)}
                </div>
            </div>
        </div>
        """

    def _format_metric_value(self, value: Any) -> str:
        """Format metric value for display"""
        if isinstance(value, float):
            return f"{value:.2f}"
        elif isinstance(value, int):
            return f"{value:,}"
        else:
            return str(value)

    def _get_metric_class(self, name: str, value: Any) -> str:
        """Get CSS class for metric based on value"""
        if 'critical' in name.lower() and isinstance(value, (int, float)) and value > 0:
            return 'metric-critical'
        elif 'high' in name.lower() and isinstance(value, (int, float)) and value > 0:
            return 'metric-high'
        elif 'error' in name.lower() or 'fail' in name.lower():
            return 'metric-error'
        else:
            return 'metric-normal'

    def get_config_schema(self) -> Dict[str, Any]:
        """Get configuration schema"""
        return {
            "type": "object",
            "properties": {
                "title": {"type": "string", "default": "Key Metrics"},
                "description": {"type": "string", "default": ""}
            }
        }


class WidgetRegistry:
    """
    Registry for managing available widgets in the reporting system.
    
    Features:
    - Built-in widget registration
    - Custom widget registration
    - Widget rendering
    - Configuration management
    """

    def __init__(self):
        """Initialize widget registry"""
        self._widgets = {}
        self._widget_classes = {}
        
        # Register built-in widgets
        self._register_builtin_widgets()

    def _register_builtin_widgets(self) -> None:
        """Register built-in widget types"""
        self.register_widget('heatmap', HeatmapWidget)
        self.register_widget('call_graph', CallGraphWidget)
        self.register_widget('timeline', TimelineWidget)
        self.register_widget('opcode_histogram', OpcodeHistogramWidget)
        self.register_widget('metrics_card', MetricsCardWidget)

    def register_widget(self, widget_type: str, widget_class: type) -> None:
        """
        Register a widget class.
        
        Args:
            widget_type: Widget type identifier
            widget_class: Widget class (must inherit from BaseWidget)
        """
        if not issubclass(widget_class, BaseWidget):
            raise ValueError("Widget class must inherit from BaseWidget")
        
        self._widget_classes[widget_type] = widget_class

    def create_widget(self, widget_type: str, widget_id: str, config: Dict[str, Any]) -> BaseWidget:
        """
        Create widget instance.
        
        Args:
            widget_type: Type of widget to create
            widget_id: Unique widget identifier
            config: Widget configuration
            
        Returns:
            Widget instance
        """
        if widget_type not in self._widget_classes:
            raise ValueError(f"Unknown widget type: {widget_type}")
        
        widget_class = self._widget_classes[widget_type]
        return widget_class(widget_id, config)

    def render_widget(self, widget_type: str, data: Dict[str, Any], **kwargs) -> str:
        """
        Render widget with provided data.
        
        Args:
            widget_type: Type of widget to render
            data: Widget data
            **kwargs: Additional rendering options
            
        Returns:
            HTML representation
        """
        widget_id = kwargs.get('widget_id', f"{widget_type}_{hash(str(data))}")
        config = kwargs.get('config', {})
        
        widget = self.create_widget(widget_type, widget_id, config)
        return widget.render(data, **kwargs)

    def get_available_widgets(self) -> List[Dict[str, Any]]:
        """
        Get list of available widget types.
        
        Returns:
            List of widget information
        """
        widgets = []
        
        for widget_type, widget_class in self._widget_classes.items():
            # Create temporary instance to get schema
            temp_widget = widget_class("temp", {})
            schema = temp_widget.get_config_schema()
            
            widgets.append({
                'type': widget_type,
                'name': widget_type.replace('_', ' ').title(),
                'description': widget_class.__doc__ or "",
                'config_schema': schema,
                'dependencies': temp_widget.get_dependencies()
            })
        
        return widgets

    def validate_widget_config(self, widget_type: str, config: Dict[str, Any]) -> List[str]:
        """
        Validate widget configuration.
        
        Args:
            widget_type: Widget type
            config: Configuration to validate
            
        Returns:
            List of validation errors
        """
        if widget_type not in self._widget_classes:
            return [f"Unknown widget type: {widget_type}"]
        
        # Basic validation - could be enhanced with jsonschema
        errors = []
        widget_class = self._widget_classes[widget_type]
        temp_widget = widget_class("temp", {})
        schema = temp_widget.get_config_schema()
        
        # Check required properties
        required = schema.get('required', [])
        for prop in required:
            if prop not in config:
                errors.append(f"Missing required property: {prop}")
        
        return errors
