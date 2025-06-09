#!/usr/bin/env python3
"""
Scorpius Honeypot Detection Engine

Advanced honeypot detection system that identifies various types of honeypots
including SSH, Web, FTP, SMB, and comprehensive honeypot frameworks.
"""

import asyncio
import json
import logging
import hashlib
import re
import socket
import ssl
import struct
import time
from typing import Dict, List, Optional, Tuple, Any, Union
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
import ipaddress

# Configure logging
logger = logging.getLogger(__name__)

@dataclass
class HoneypotSignature:
    """Honeypot signature data structure."""
    name: str
    type: str  # ssh, web, ftp, smb, multi
    indicators: List[str]
    confidence_weight: float
    severity: str  # Low, Medium, High, Critical
    description: str

@dataclass
class NetworkService:
    """Network service information."""
    host: str
    port: int
    protocol: str
    banner: Optional[str] = None
    ssl_info: Optional[Dict[str, Any]] = None
    response_time: Optional[float] = None
    fingerprint: Optional[str] = None

@dataclass
class HoneypotDetection:
    """Honeypot detection result."""
    honeypot_type: str
    confidence: float
    indicators: List[str]
    severity: str
    description: str
    evidence: Dict[str, Any]
    timestamp: str

class HoneypotDetector:
    """
    Advanced honeypot detection engine that identifies various honeypot implementations
    through behavioral analysis, banner fingerprinting, and network characteristics.
    """
    
    def __init__(self):
        """Initialize the honeypot detector with signature database."""
        self.signatures = self._load_honeypot_signatures()
        self.scan_timeout = 5.0
        self.max_concurrent_scans = 50
        
        logger.info(f"HoneypotDetector initialized with {len(self.signatures)} signatures")
    
    def _load_honeypot_signatures(self) -> List[HoneypotSignature]:
        """Load honeypot signatures database."""
        signatures = [
            # Cowrie SSH/Telnet Honeypot
            HoneypotSignature(
                name="Cowrie",
                type="ssh",
                indicators=[
                    "SSH-2.0-OpenSSH_6.0p1 Debian-4+deb7u2",
                    "SSH-2.0-OpenSSH_6.9p1",
                    "Protocol mismatch",
                    "cowrie",
                    "var/log/cowrie"
                ],
                confidence_weight=0.9,
                severity="High",
                description="Cowrie SSH/Telnet honeypot detected"
            ),
            
            # Dionaea Multi-Protocol Honeypot
            HoneypotSignature(
                name="Dionaea", 
                type="multi",
                indicators=[
                    "dionaea",
                    "Microsoft-IIS/6.0",
                    "220 Welcome to the ftp service",
                    "MySQL Community Server",
                    "MSSQL",
                    "opt/dionaea"
                ],
                confidence_weight=0.85,
                severity="High",
                description="Dionaea multi-protocol honeypot detected"
            ),
            
            # Glastopf Web Honeypot
            HoneypotSignature(
                name="Glastopf",
                type="web",
                indicators=[
                    "glastopf",
                    "Apache/2.2.22",
                    "X-Powered-By: PHP/5.3.10-1ubuntu3.21",
                    "opt/glastopf",
                    "vulnerable.php"
                ],
                confidence_weight=0.9,
                severity="Medium",
                description="Glastopf web application honeypot detected"
            ),
            
            # HFish Comprehensive Honeypot
            HoneypotSignature(
                name="HFish",
                type="multi",
                indicators=[
                    "hfish",
                    "HFish2021",
                    "threatbook",
                    "opt/hfish",
                    "X-HFish-ID"
                ],
                confidence_weight=0.95,
                severity="High",
                description="HFish comprehensive honeypot platform detected"
            ),
            
            # Kippo SSH Honeypot
            HoneypotSignature(
                name="Kippo",
                type="ssh",
                indicators=[
                    "SSH-2.0-OpenSSH_5.1p1 Debian-5",
                    "kippo",
                    "var/log/kippo",
                    "Bad packet length"
                ],
                confidence_weight=0.85,
                severity="Medium",
                description="Kippo SSH honeypot detected"
            ),
            
            # Conpot Industrial Honeypot
            HoneypotSignature(
                name="Conpot",
                type="industrial",
                indicators=[
                    "conpot",
                    "Siemens, SIMATIC",
                    "S7-300",
                    "Modbus",
                    "502"
                ],
                confidence_weight=0.9,
                severity="High",
                description="Conpot industrial control system honeypot detected"
            ),
            
            # Thug Web Honeypot
            HoneypotSignature(
                name="Thug",
                type="web",
                indicators=[
                    "thug",
                    "PhoneyC",
                    "X-Thug-ID",
                    "malware-analysis"
                ],
                confidence_weight=0.8,
                severity="Medium",
                description="Thug web honeypot detected"
            ),
            
            # Elastic Honey
            HoneypotSignature(
                name="ElasticHoney",
                type="web",
                indicators=[
                    "elastichoney",
                    "elastic.co",
                    "X-elastic-product: Elasticsearch",
                    "9200"
                ],
                confidence_weight=0.85,
                severity="Medium", 
                description="ElasticHoney Elasticsearch honeypot detected"
            )
        ]
        
        return signatures
    
    async def analyze_target(
        self,
        target: str,
        ports: Optional[List[int]] = None,
        include_service_detection: bool = True,
        include_behavioral_analysis: bool = True,
        include_timing_analysis: bool = True
    ) -> Dict[str, Any]:
        """
        Perform comprehensive honeypot analysis on a target.
        
        Args:
            target: Target IP address or hostname
            ports: List of ports to scan (default: common honeypot ports)
            include_service_detection: Enable service fingerprinting
            include_behavioral_analysis: Enable behavioral analysis
            include_timing_analysis: Enable timing-based detection
            
        Returns:
            Dict containing analysis results
        """
        start_time = time.time()
        
        if ports is None:
            ports = [21, 22, 23, 80, 135, 443, 445, 1433, 2222, 3306, 3389, 4433, 5060, 8080, 9200]
        
        results = {
            "target": target,
            "scan_timestamp": datetime.now(timezone.utc).isoformat(),
            "ports_scanned": ports,
            "services_detected": [],
            "honeypot_detections": [],
            "risk_score": 0.0,
            "confidence": 0.0,
            "analysis_time": 0.0
        }
        
        try:
            # Validate target
            try:
                ipaddress.ip_address(target)
                is_ip = True
            except ValueError:
                is_ip = False
            
            if not is_ip:
                try:
                    target = socket.gethostbyname(target)
                except socket.gaierror as e:
                    results["error"] = f"Failed to resolve hostname: {e}"
                    return results
            
            # Service discovery and fingerprinting
            if include_service_detection:
                services = await self._discover_services(target, ports)
                results["services_detected"] = [asdict(service) for service in services]
                
                # Analyze each service for honeypot indicators
                for service in services:
                    detections = await self._analyze_service(service)
                    results["honeypot_detections"].extend([asdict(detection) for detection in detections])
            
            # Behavioral analysis
            if include_behavioral_analysis:
                behavioral_detections = await self._perform_behavioral_analysis(target, ports)
                results["honeypot_detections"].extend([asdict(detection) for detection in behavioral_detections])
            
            # Timing analysis
            if include_timing_analysis:
                timing_detections = await self._perform_timing_analysis(target, ports)
                results["honeypot_detections"].extend([asdict(detection) for detection in timing_detections])
            
            # Calculate overall risk score and confidence
            results["risk_score"], results["confidence"] = self._calculate_risk_score(results["honeypot_detections"])
            
            # Remove duplicates
            results["honeypot_detections"] = self._deduplicate_detections(results["honeypot_detections"])
            
        except Exception as e:
            logger.error(f"Error analyzing target {target}: {e}", exc_info=True)
            results["error"] = str(e)
        
        results["analysis_time"] = time.time() - start_time
        return results
    
    async def _discover_services(self, target: str, ports: List[int]) -> List[NetworkService]:
        """Discover and fingerprint network services."""
        services = []
        semaphore = asyncio.Semaphore(self.max_concurrent_scans)
        
        async def scan_port(port: int) -> Optional[NetworkService]:
            async with semaphore:
                return await self._scan_single_port(target, port)
        
        # Scan all ports concurrently
        tasks = [scan_port(port) for port in ports]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for result in results:
            if isinstance(result, NetworkService):
                services.append(result)
            elif isinstance(result, Exception):
                logger.debug(f"Port scan exception: {result}")
        
        return services
    
    async def _scan_single_port(self, target: str, port: int) -> Optional[NetworkService]:
        """Scan a single port and gather service information."""
        try:
            start_time = time.time()
            
            # TCP connection
            reader, writer = await asyncio.wait_for(
                asyncio.open_connection(target, port),
                timeout=self.scan_timeout
            )
            
            response_time = time.time() - start_time
            
            service = NetworkService(
                host=target,
                port=port,
                protocol="tcp",
                response_time=response_time
            )
            
            # Try to get banner
            try:
                # Send probe based on port
                probe = self._get_service_probe(port)
                if probe:
                    writer.write(probe)
                    await writer.drain()
                
                # Read response
                banner_data = await asyncio.wait_for(reader.read(1024), timeout=2.0)
                service.banner = banner_data.decode('utf-8', errors='ignore').strip()
                
            except Exception:
                pass
            
            # SSL/TLS analysis for secure ports
            if port in [443, 4433, 993, 995, 465]:
                service.ssl_info = await self._analyze_ssl(target, port)
            
            # Generate service fingerprint
            service.fingerprint = self._generate_service_fingerprint(service)
            
            writer.close()
            await writer.wait_closed()
            
            return service
            
        except Exception:
            return None
    
    def _get_service_probe(self, port: int) -> Optional[bytes]:
        """Get appropriate service probe for port."""
        probes = {
            21: b"",  # FTP
            22: b"",  # SSH
            23: b"",  # Telnet
            25: b"EHLO test\r\n",  # SMTP
            80: b"GET / HTTP/1.1\r\nHost: test\r\nUser-Agent: Mozilla/5.0\r\n\r\n",  # HTTP
            110: b"",  # POP3
            143: b"",  # IMAP
            443: b"",  # HTTPS
            993: b"",  # IMAPS
            995: b"",  # POP3S
            1433: b"",  # MSSQL
            3306: b"",  # MySQL
            3389: b"",  # RDP
            5060: b"",  # SIP
        }
        return probes.get(port)
    
    async def _analyze_ssl(self, target: str, port: int) -> Optional[Dict[str, Any]]:
        """Analyze SSL/TLS configuration."""
        try:
            context = ssl.create_default_context()
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE
            
            reader, writer = await asyncio.wait_for(
                asyncio.open_connection(target, port, ssl=context),
                timeout=self.scan_timeout
            )
            
            ssl_info = {
                "version": writer.get_extra_info('ssl_object').version(),
                "cipher": writer.get_extra_info('ssl_object').cipher(),
                "certificate": {}
            }
            
            # Get certificate info
            cert = writer.get_extra_info('ssl_object').getpeercert()
            if cert:
                ssl_info["certificate"] = {
                    "subject": dict(cert.get("subject", [])),
                    "issuer": dict(cert.get("issuer", [])),
                    "version": cert.get("version"),
                    "serial_number": cert.get("serialNumber"),
                    "not_before": cert.get("notBefore"),
                    "not_after": cert.get("notAfter")
                }
            
            writer.close()
            await writer.wait_closed()
            
            return ssl_info
            
        except Exception:
            return None
    
    def _generate_service_fingerprint(self, service: NetworkService) -> str:
        """Generate unique fingerprint for service."""
        fingerprint_data = f"{service.port}:{service.banner or ''}:{service.response_time or 0}"
        if service.ssl_info:
            fingerprint_data += f":{json.dumps(service.ssl_info, sort_keys=True)}"
        
        return hashlib.sha256(fingerprint_data.encode()).hexdigest()[:16]
    
    async def _analyze_service(self, service: NetworkService) -> List[HoneypotDetection]:
        """Analyze a service for honeypot indicators."""
        detections = []
        
        for signature in self.signatures:
            indicators_found = []
            
            # Check banner indicators
            if service.banner:
                for indicator in signature.indicators:
                    if indicator.lower() in service.banner.lower():
                        indicators_found.append(f"Banner contains: {indicator}")
            
            # Check SSL certificate indicators
            if service.ssl_info and service.ssl_info.get("certificate"):
                cert = service.ssl_info["certificate"]
                cert_text = json.dumps(cert).lower()
                for indicator in signature.indicators:
                    if indicator.lower() in cert_text:
                        indicators_found.append(f"SSL certificate contains: {indicator}")
            
            # Check port-specific indicators
            if signature.type == "ssh" and service.port in [22, 2222]:
                # SSH-specific checks
                if service.banner and "ssh" in service.banner.lower():
                    for indicator in signature.indicators:
                        if indicator.lower() in service.banner.lower():
                            indicators_found.append(f"SSH banner match: {indicator}")
            
            elif signature.type == "web" and service.port in [80, 443, 8080]:
                # Web-specific checks
                if service.banner and ("http" in service.banner.lower() or "server:" in service.banner.lower()):
                    for indicator in signature.indicators:
                        if indicator.lower() in service.banner.lower():
                            indicators_found.append(f"HTTP header match: {indicator}")
            
            # Create detection if indicators found
            if indicators_found:
                confidence = len(indicators_found) * signature.confidence_weight / len(signature.indicators)
                confidence = min(confidence, 1.0)  # Cap at 1.0
                
                detection = HoneypotDetection(
                    honeypot_type=signature.name,
                    confidence=confidence,
                    indicators=indicators_found,
                    severity=signature.severity,
                    description=signature.description,
                    evidence={
                        "service_port": service.port,
                        "service_banner": service.banner,
                        "service_fingerprint": service.fingerprint,
                        "response_time": service.response_time
                    },
                    timestamp=datetime.now(timezone.utc).isoformat()
                )
                detections.append(detection)
        
        return detections
    
    async def _perform_behavioral_analysis(self, target: str, ports: List[int]) -> List[HoneypotDetection]:
        """Perform behavioral analysis to detect honeypot patterns."""
        detections = []
        
        try:
            # Check for too many open ports (honeypot farm indicator)
            open_ports = []
            for port in ports:
                try:
                    reader, writer = await asyncio.wait_for(
                        asyncio.open_connection(target, port),
                        timeout=1.0
                    )
                    open_ports.append(port)
                    writer.close()
                    await writer.wait_closed()
                except Exception:
                    pass
            
            # Suspicious if too many ports are open
            if len(open_ports) > 8:
                detection = HoneypotDetection(
                    honeypot_type="Honeypot Farm",
                    confidence=0.8,
                    indicators=[f"Unusually high number of open ports: {len(open_ports)}"],
                    severity="High",
                    description="Multiple services running on single host indicates honeypot farm",
                    evidence={
                        "open_ports": open_ports,
                        "total_open": len(open_ports)
                    },
                    timestamp=datetime.now(timezone.utc).isoformat()
                )
                detections.append(detection)
            
            # Check for common honeypot port combinations
            honeypot_combinations = [
                [22, 2222],  # SSH honeypot with redirect
                [21, 80, 443, 445, 1433, 3306],  # Dionaea-like multi-service
                [80, 8080],  # Web honeypot variants
                [4433, 22, 3389, 1080]  # HFish-like combination
            ]
            
            for combination in honeypot_combinations:
                if all(port in open_ports for port in combination):
                    detection = HoneypotDetection(
                        honeypot_type="Suspicious Port Pattern",
                        confidence=0.7,
                        indicators=[f"Common honeypot port combination detected: {combination}"],
                        severity="Medium",
                        description="Port combination commonly used by honeypot deployments",
                        evidence={
                            "port_combination": combination,
                            "detection_pattern": "known_honeypot_ports"
                        },
                        timestamp=datetime.now(timezone.utc).isoformat()
                    )
                    detections.append(detection)
                    break
        
        except Exception as e:
            logger.error(f"Behavioral analysis error: {e}")
        
        return detections
    
    async def _perform_timing_analysis(self, target: str, ports: List[int]) -> List[HoneypotDetection]:
        """Perform timing-based analysis for honeypot detection."""
        detections = []
        
        try:
            # Measure response times for multiple connections
            response_times = []
            
            for _ in range(5):  # Test 5 connections
                start_time = time.time()
                try:
                    reader, writer = await asyncio.wait_for(
                        asyncio.open_connection(target, 22),  # Test SSH port
                        timeout=2.0
                    )
                    response_time = time.time() - start_time
                    response_times.append(response_time)
                    writer.close()
                    await writer.wait_closed()
                except Exception:
                    pass
                
                await asyncio.sleep(0.1)  # Small delay between tests
            
            if response_times:
                avg_time = sum(response_times) / len(response_times)
                time_variance = sum((t - avg_time) ** 2 for t in response_times) / len(response_times)
                
                # Honeypots often have very consistent timing (low variance)
                # or unusually fast response times
                if time_variance < 0.001 and len(response_times) >= 3:
                    detection = HoneypotDetection(
                        honeypot_type="Timing Anomaly",
                        confidence=0.6,
                        indicators=["Suspiciously consistent response times"],
                        severity="Low",
                        description="Response time pattern suggests automated/honeypot service",
                        evidence={
                            "response_times": response_times,
                            "average_time": avg_time,
                            "variance": time_variance
                        },
                        timestamp=datetime.now(timezone.utc).isoformat()
                    )
                    detections.append(detection)
        
        except Exception as e:
            logger.error(f"Timing analysis error: {e}")
        
        return detections
    
    def _calculate_risk_score(self, detections: List[Dict[str, Any]]) -> Tuple[float, float]:
        """Calculate overall risk score and confidence."""
        if not detections:
            return 0.0, 0.0
        
        # Weight by severity
        severity_weights = {"Low": 1, "Medium": 2, "High": 3, "Critical": 4}
        
        total_score = 0.0
        total_confidence = 0.0
        
        for detection in detections:
            severity_weight = severity_weights.get(detection["severity"], 1)
            detection_score = detection["confidence"] * severity_weight
            total_score += detection_score
            total_confidence += detection["confidence"]
        
        # Normalize scores
        avg_confidence = total_confidence / len(detections)
        risk_score = min(total_score / len(detections) * 2.5, 10.0)  # Scale to 0-10
        
        return round(risk_score, 2), round(avg_confidence, 3)
    
    def _deduplicate_detections(self, detections: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove duplicate detections."""
        seen = set()
        unique_detections = []
        
        for detection in detections:
            key = f"{detection['honeypot_type']}:{detection['evidence'].get('service_port', 0)}"
            if key not in seen:
                seen.add(key)
                unique_detections.append(detection)
        
        return unique_detections

# Convenience function for quick analysis
async def analyze_honeypot_target(
    target: str,
    ports: Optional[List[int]] = None,
    **kwargs
) -> Dict[str, Any]:
    """
    Convenience function for quick honeypot analysis.
    
    Args:
        target: Target IP address or hostname
        ports: List of ports to scan
        **kwargs: Additional analysis options
        
    Returns:
        Dict containing analysis results
    """
    detector = HoneypotDetector()
    return await detector.analyze_target(target, ports, **kwargs)

if __name__ == "__main__":
    # Test the honeypot detector
    async def test_detector():
        detector = HoneypotDetector()
        print(f"Loaded {len(detector.signatures)} honeypot signatures")
        
        # Test on localhost (replace with actual target)
        results = await detector.analyze_target("127.0.0.1", [22, 80, 443])
        print(json.dumps(results, indent=2))
    
    asyncio.run(test_detector())
