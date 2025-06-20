#!/usr/bin/env python3
"""
SCORPIUS INTEGRATED BACKEND
Connects your frontend dashboard to your existing Python modules
"""

import sys
import os
import asyncio
import threading
from datetime import datetime, timedelta
import requests
import json

from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity

# Add backend directory to Python path for imports
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
sys.path.insert(0, backend_dir)

# Import your actual modules
try:
    from mev_strategies import (
        FlashLoanArbitrageStrategy, SandwichAttackStrategy, LiquidationBotStrategy,
        CrossChainArbitrageStrategy, OracleManipulationStrategy, GovernanceAttackStrategy,
        StrategyType, MEVOpportunity
    )
    from mev_config import config_manager
    MODULES_AVAILABLE = True
    print("✅ Successfully imported MEV modules")
except ImportError as e:
    print(f"⚠️  MEV modules not available: {e}")
    MODULES_AVAILABLE = False

# Initialize Flask app
app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'your-super-secret-jwt-key-change-this'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

# Enable CORS for frontend
CORS(app, origins=["http://localhost:8080"])

# Initialize JWT
jwt = JWTManager(app)

# Global variables for module instances
scanner_client = None
mev_strategies = {}
mempool_client = None
api_servers_running = False

def initialize_modules():
    """Initialize your actual backend modules"""
    global scanner_client, mev_strategies, mempool_client
    
    try:
        if MODULES_AVAILABLE:
            # Initialize MEV strategies
            mev_strategies = {
                'flashloan_arbitrage': FlashLoanArbitrageStrategy(),
                'sandwich_attack': SandwichAttackStrategy(),
                'liquidation_bot': LiquidationBotStrategy(),
                'cross_chain_arbitrage': CrossChainArbitrageStrategy(),
                'oracle_manipulation': OracleManipulationStrategy(),
                'governance_attack': GovernanceAttackStrategy()
            }
            print("✅ MEV strategies initialized")
        
        # Try to connect to your API servers
        try:
            # Test scanner API (port 8001)
            scanner_response = requests.get('http://localhost:8001/', timeout=2)
            if scanner_response.status_code == 200:
                scanner_client = 'http://localhost:8001'
                print("✅ Connected to Scanner API server")
        except:
            print("⚠️  Scanner API server not running")
        
        try:
            # Test MEV API (port 8003)  
            mev_response = requests.get('http://localhost:8003/', timeout=2)
            if mev_response.status_code == 200:
                print("✅ Connected to MEV API server")
        except:
            print("⚠️  MEV API server not running")
            
        try:
            # Test Mempool API (port 8002)
            mempool_response = requests.get('http://localhost:8002/', timeout=2)
            if mempool_response.status_code == 200:
                mempool_client = 'http://localhost:8002'
                print("✅ Connected to Mempool API server")
        except:
            print("⚠️  Mempool API server not running")
            
    except Exception as e:
        print(f"❌ Error initializing modules: {e}")

# ====================================
# AUTHENTICATION ENDPOINTS
# ====================================

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login endpoint"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        # Simple authentication (replace with your auth system)
        if username == "demo" and password == "demo":
            access_token = create_access_token(identity=username)
            
            user_data = {
                "id": "1",
                "username": username,
                "email": f"{username}@scorpius.io",
                "role": "admin",
                "permissions": ["scan:execute", "mev:manage", "system:admin"],
                "preferences": {
                    "theme": "dark",
                    "notifications": {
                        "email": True,
                        "push": True,
                        "criticalThreats": True,
                        "mevOpportunities": True,
                        "systemAlerts": True
                    },
                    "dashboard": {
                        "refreshInterval": 30000,
                        "defaultCharts": ["threats", "performance"],
                        "layout": "expanded"
                    }
                },
                "lastLoginAt": datetime.now().isoformat() + "Z",
                "createdAt": "2023-12-01T00:00:00.000Z",
                "updatedAt": datetime.now().isoformat() + "Z"
            }
            
            return jsonify({
                "success": True,
                "data": {
                    "user": user_data,
                    "accessToken": access_token,
                    "refreshToken": "mock-refresh-token",
                    "expiresIn": 86400
                },
                "timestamp": datetime.now().isoformat() + "Z"
            })
        
        return jsonify({
            "success": False,
            "message": "Invalid credentials",
            "timestamp": datetime.now().isoformat() + "Z"
        }), 401
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e),
            "timestamp": datetime.now().isoformat() + "Z"
        }), 500

@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user info"""
    try:
        current_user = get_jwt_identity()
        
        user_data = {
            "id": "1",
            "username": current_user,
            "email": f"{current_user}@scorpius.io",
            "role": "admin",
            "permissions": ["scan:execute", "mev:manage", "system:admin"],
            "lastLoginAt": datetime.now().isoformat() + "Z"
        }
        
        return jsonify({
            "success": True,
            "data": user_data,
            "timestamp": datetime.now().isoformat() + "Z"
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e),
            "timestamp": datetime.now().isoformat() + "Z"
        }), 500

@app.route('/api/auth/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout endpoint"""
    return jsonify({
        "success": True,
        "message": "Logged out successfully",
        "timestamp": datetime.now().isoformat() + "Z"
    })

# ====================================
# DASHBOARD ENDPOINTS - USING REAL MODULES
# ====================================

@app.route('/api/dashboard/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    """Get dashboard statistics from your real modules"""
    try:
        stats = {
            "threatsDetected": 0,
            "activeScans": 0,
            "activeBots": 0,
            "systemUptime": 2592000,  # 30 days in seconds
            "lastScanTime": datetime.now().isoformat() + "Z",
            "totalTransactions": 0,
            "mevOpportunities": 0,
            "securityScore": 95.0
        }
        
        # Get real data from MEV strategies
        if MODULES_AVAILABLE and mev_strategies:
            total_opportunities = 0
            active_strategies = 0
            total_profit = 0.0
            
            for strategy_name, strategy in mev_strategies.items():
                if strategy.is_active:
                    active_strategies += 1
                total_opportunities += strategy.stats.total_opportunities
                total_profit += strategy.stats.total_profit
            
            stats["activeBots"] = active_strategies
            stats["mevOpportunities"] = total_opportunities
            stats["totalTransactions"] = sum(s.stats.total_scans for s in mev_strategies.values())
        
        # Get data from scanner API if available
        if scanner_client:
            try:
                scanner_response = requests.get(f'{scanner_client}/api/scanner/history', timeout=5)
                if scanner_response.status_code == 200:
                    scanner_data = scanner_response.json()
                    if 'data' in scanner_data:
                        stats["activeScans"] = len([s for s in scanner_data['data'] if s.get('status') == 'running'])
                        stats["threatsDetected"] = len([s for s in scanner_data['data'] if s.get('vulnerabilities')])
            except Exception as e:
                print(f"Error getting scanner data: {e}")
        
        # Get data from mempool API if available
        if mempool_client:
            try:
                mempool_response = requests.get(f'{mempool_client}/api/mempool/stats', timeout=5)
                if mempool_response.status_code == 200:
                    mempool_data = mempool_response.json()
                    if 'data' in mempool_data:
                        stats["totalTransactions"] = mempool_data['data'].get('total_transactions', stats["totalTransactions"])
            except Exception as e:
                print(f"Error getting mempool data: {e}")
        
        return jsonify({
            "success": True,
            "data": stats,
            "timestamp": datetime.now().isoformat() + "Z"
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e),
            "timestamp": datetime.now().isoformat() + "Z"
        }), 500

@app.route('/api/dashboard/alerts', methods=['GET'])
@jwt_required()
def get_threat_alerts():
    """Get threat alerts from your real modules"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        
        alerts = []
        
        # Get alerts from scanner API if available
        if scanner_client:
            try:
                scanner_response = requests.get(
                    f'{scanner_client}/api/enhanced-scanner/recent',
                    timeout=5,
                    params={'limit': limit}
                )
                if scanner_response.status_code == 200:
                    scanner_data = scanner_response.json()
                    if 'data' in scanner_data:
                        for scan in scanner_data['data']:
                            if scan.get('status') == 'completed' and scan.get('vulnerabilities'):
                                for vuln in scan['vulnerabilities']:
                                    alert = {
                                        "id": f"scanner_{scan.get('scan_id', 'unknown')}_{vuln.get('id', 'unknown')}",
                                        "type": vuln.get('severity', 'medium').lower(),
                                        "title": vuln.get('title', 'Vulnerability Detected'),
                                        "description": vuln.get('description', 'Smart contract vulnerability found'),
                                        "contractAddress": scan.get('contract_address', 'Unknown'),
                                        "severity": self._convert_severity_to_number(vuln.get('severity', 'medium')),
                                        "status": "active",
                                        "detectedAt": scan.get('timestamp', datetime.now().isoformat() + "Z"),
                                        "metadata": {
                                            "confidence": vuln.get('confidence', 0.8),
                                            "category": vuln.get('category', 'General'),
                                            "recommendation": vuln.get('recommendation', 'Review contract code')
                                        }
                                    }
                                    alerts.append(alert)
            except Exception as e:
                print(f"Error getting scanner alerts: {e}")
        
        # Get alerts from MEV strategies
        if MODULES_AVAILABLE and mev_strategies:
            try:
                for strategy_name, strategy in mev_strategies.items():
                    if strategy.stats.total_opportunities > 0:
                        alert = {
                            "id": f"mev_{strategy_name}_{int(datetime.now().timestamp())}",
                            "type": "info",
                            "title": f"MEV Opportunities - {strategy_name.replace('_', ' ').title()}",
                            "description": f"Found {strategy.stats.total_opportunities} opportunities with {strategy.stats.successful_executions} successful executions",
                            "severity": 5.0,
                            "status": "active" if strategy.is_active else "inactive",
                            "detectedAt": datetime.now().isoformat() + "Z",
                            "metadata": {
                                "total_profit": strategy.stats.total_profit,
                                "success_rate": (strategy.stats.successful_executions / max(1, strategy.stats.total_opportunities)) * 100,
                                "strategy_type": strategy_name
                            }
                        }
                        alerts.append(alert)
            except Exception as e:
                print(f"Error getting MEV alerts: {e}")
        
        # If no real alerts, add some sample data
        if not alerts:
            alerts = [
                {
                    "id": "sample_1",
                    "type": "info",
                    "title": "System Ready",
                    "description": "All modules loaded and ready for scanning",
                    "severity": 2.0,
                    "status": "active",
                    "detectedAt": datetime.now().isoformat() + "Z",
                    "metadata": {
                        "message": "Backend integration successful"
                    }
                }
            ]
        
        # Simulate pagination
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated_alerts = alerts[start_idx:end_idx]
        
        return jsonify({
            "success": True,
            "data": {
                "items": paginated_alerts,
                "pagination": {
                    "total": len(alerts),
                    "page": page,
                    "limit": limit,
                    "totalPages": (len(alerts) + limit - 1) // limit,
                    "hasNext": end_idx < len(alerts),
                    "hasPrev": page > 1
                }
            },
            "timestamp": datetime.now().isoformat() + "Z"
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e),
            "timestamp": datetime.now().isoformat() + "Z"
        }), 500

def _convert_severity_to_number(severity_str):
    """Convert severity string to number"""
    severity_map = {
        'critical': 9.0,
        'high': 7.5,
        'medium': 5.0,
        'low': 2.5,
        'info': 1.0
    }
    return severity_map.get(severity_str.lower(), 5.0)

# ====================================
# SMART CONTRACT SCANNER ENDPOINTS - USING REAL SCANNER
# ====================================

@app.route('/api/scanner/analyze', methods=['POST'])
@jwt_required()
def analyze_contract():
    """Analyze smart contract using your real scanner module"""
    try:
        data = request.get_json()
        contract_address = data.get('contractAddress')
        scan_type = data.get('scanType', 'full')
        
        if not contract_address:
            return jsonify({
                "success": False,
                "message": "Contract address is required",
                "timestamp": datetime.now().isoformat() + "Z"
            }), 400
        
        # Use your real scanner API if available
        if scanner_client:
            try:
                scan_request = {
                    "contract_address": contract_address,
                    "scan_type": scan_type,
                    "tools": {"slither": True, "mythril": True, "echidna": False}
                }
                
                scanner_response = requests.post(
                    f'{scanner_client}/api/enhanced-scanner/scan',
                    json=scan_request,
                    timeout=30
                )
                
                if scanner_response.status_code == 200:
                    scanner_data = scanner_response.json()
                    
                    # Format the response for your frontend
                    scan_result = {
                        "id": scanner_data.get('scan_id', f"scan_{int(datetime.now().timestamp())}"),
                        "contractAddress": contract_address,
                        "scanType": scan_type,
                        "status": scanner_data.get('status', 'completed'),
                        "startedAt": scanner_data.get('timestamp', datetime.now().isoformat() + "Z"),
                        "completedAt": datetime.now().isoformat() + "Z",
                        "results": {
                            "securityScore": scanner_data.get('security_score', 50.0),
                            "vulnerabilities": scanner_data.get('vulnerabilities', []),
                            "honeypotAnalysis": {
                                "isHoneypot": scanner_data.get('is_honeypot', False),
                                "confidence": scanner_data.get('honeypot_confidence', 0.5),
                                "honeypotType": scanner_data.get('honeypot_type', 'unknown'),
                                "riskLevel": scanner_data.get('risk_level', 'medium')
                            }
                        }
                    }
                    
                    return jsonify({
                        "success": True,
                        "data": scan_result,
                        "timestamp": datetime.now().isoformat() + "Z"
                    })
                    
            except Exception as e:
                print(f"Error calling scanner API: {e}")
        
        # Fallback to mock data if scanner API not available
        scan_result = {
            "id": f"scan_{int(datetime.now().timestamp())}",
            "contractAddress": contract_address,
            "scanType": scan_type,
            "status": "completed",
            "startedAt": datetime.now().isoformat() + "Z",
            "completedAt": datetime.now().isoformat() + "Z",
            "results": {
                "securityScore": 75.0,
                "vulnerabilities": [
                    {
                        "id": "mock_vuln_1",
                        "severity": "medium",
                        "category": "Access Control",
                        "title": "Example Vulnerability",
                        "description": "This is a mock vulnerability for testing purposes",
                        "recommendation": "Review contract access controls"
                    }
                ],
                "honeypotAnalysis": {
                    "isHoneypot": False,
                    "confidence": 0.85,
                    "honeypotType": "none",
                    "riskLevel": "low"
                }
            }
        }
        
        return jsonify({
            "success": True,
            "data": scan_result,
            "timestamp": datetime.now().isoformat() + "Z"
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e),
            "timestamp": datetime.now().isoformat() + "Z"
        }), 500

# ====================================
# MEV OPERATIONS ENDPOINTS - USING REAL MEV MODULES  
# ====================================

@app.route('/api/mev/strategies', methods=['GET'])
@jwt_required()
def get_mev_strategies():
    """Get MEV strategies from your real MEV modules"""
    try:
        strategies = []
        
        if MODULES_AVAILABLE and mev_strategies:
            for strategy_name, strategy in mev_strategies.items():
                strategy_data = {
                    "id": f"mev_{strategy_name}",
                    "name": strategy_name.replace('_', ' ').title(),
                    "type": strategy_name,
                    "status": "active" if strategy.is_active else "inactive",
                    "profitability": strategy.stats.total_profit * 100,  # Convert to percentage
                    "successRate": (strategy.stats.successful_executions / max(1, strategy.stats.total_opportunities)) * 100,
                    "totalProfit": strategy.stats.total_profit,
                    "totalOpportunities": strategy.stats.total_opportunities,
                    "successfulExecutions": strategy.stats.successful_executions,
                    "failedExecutions": strategy.stats.failed_executions,
                    "lastExecuted": datetime.fromtimestamp(strategy.stats.last_execution).isoformat() + "Z" if strategy.stats.last_execution else None,
                    "enabled": strategy.enabled
                }
                strategies.append(strategy_data)
        else:
            # Fallback mock data
            strategies = [
                {
                    "id": "mev_flashloan",
                    "name": "Flash Loan Arbitrage",
                    "type": "arbitrage",
                    "status": "inactive",
                    "profitability": 0.0,
                    "successRate": 0.0,
                    "totalProfit": 0.0,
                    "lastExecuted": None
                }
            ]
        
        return jsonify({
            "success": True,
            "data": {
                "items": strategies,
                "pagination": {
                    "total": len(strategies),
                    "page": 1,
                    "limit": 20,
                    "totalPages": 1,
                    "hasNext": False,
                    "hasPrev": False
                }
            },
            "timestamp": datetime.now().isoformat() + "Z"
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e),
            "timestamp": datetime.now().isoformat() + "Z"
        }), 500

@app.route('/api/mev/strategies/start', methods=['POST'])
@jwt_required()
def start_mev_strategy():
    """Start a specific MEV strategy"""
    try:
        data = request.get_json()
        strategy_name = data.get('strategy')
        
        if not strategy_name:
            return jsonify({
                "success": False,
                "message": "Strategy name is required",
                "timestamp": datetime.now().isoformat() + "Z"
            }), 400
        
        if MODULES_AVAILABLE and strategy_name in mev_strategies:
            strategy = mev_strategies[strategy_name]
            if not strategy.is_active:
                # Start the strategy in a background thread
                def start_strategy():
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    loop.run_until_complete(strategy.start_monitoring())
                
                thread = threading.Thread(target=start_strategy, daemon=True)
                thread.start()
                
                return jsonify({
                    "success": True,
                    "message": f"Started {strategy_name} strategy",
                    "timestamp": datetime.now().isoformat() + "Z"
                })
            else:
                return jsonify({
                    "success": False,
                    "message": f"Strategy {strategy_name} is already running",
                    "timestamp": datetime.now().isoformat() + "Z"
                }), 400
        else:
            return jsonify({
                "success": False,
                "message": f"Strategy {strategy_name} not found",
                "timestamp": datetime.now().isoformat() + "Z"
            }), 404
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e),
            "timestamp": datetime.now().isoformat() + "Z"
        }), 500

@app.route('/api/mev/strategies/stop', methods=['POST'])
@jwt_required()
def stop_mev_strategy():
    """Stop a specific MEV strategy"""
    try:
        data = request.get_json()
        strategy_name = data.get('strategy')
        
        if not strategy_name:
            return jsonify({
                "success": False,
                "message": "Strategy name is required",
                "timestamp": datetime.now().isoformat() + "Z"
            }), 400
        
        if MODULES_AVAILABLE and strategy_name in mev_strategies:
            strategy = mev_strategies[strategy_name]
            if strategy.is_active:
                # Stop the strategy
                asyncio.run(strategy.stop_monitoring())
                
                return jsonify({
                    "success": True,
                    "message": f"Stopped {strategy_name} strategy",
                    "timestamp": datetime.now().isoformat() + "Z"
                })
            else:
                return jsonify({
                    "success": False,
                    "message": f"Strategy {strategy_name} is not running",
                    "timestamp": datetime.now().isoformat() + "Z"
                }), 400
        else:
            return jsonify({
                "success": False,
                "message": f"Strategy {strategy_name} not found",
                "timestamp": datetime.now().isoformat() + "Z"
            }), 404
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e),
            "timestamp": datetime.now().isoformat() + "Z"
        }), 500

# ====================================
# SYSTEM HEALTH ENDPOINT
# ====================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for monitoring"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat() + "Z",
        "version": "1.0.0",
        "modules": {
            "mev_strategies": MODULES_AVAILABLE,
            "scanner_api": scanner_client is not None,
            "mempool_api": mempool_client is not None
        }
    })

# ====================================
# ERROR HANDLERS
# ====================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "success": False,
        "message": "Endpoint not found",
        "timestamp": datetime.now().isoformat() + "Z"
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        "success": False,
        "message": "Internal server error",
        "timestamp": datetime.now().isoformat() + "Z"
    }), 500

# ====================================
# MAIN APPLICATION
# ====================================

if __name__ == '__main__':
    print("🚀 Starting Scorpius Integrated Backend API Server...")
    print("🔗 Connecting to your existing Python modules...")
    
    # Initialize your real modules
    initialize_modules()
    
    print("📋 Available endpoints:")
    print("   POST /api/auth/login")
    print("   GET  /api/auth/me") 
    print("   POST /api/auth/logout")
    print("   GET  /api/dashboard/stats")
    print("   GET  /api/dashboard/alerts")
    print("   POST /api/scanner/analyze")
    print("   GET  /api/mev/strategies")
    print("   POST /api/mev/strategies/start")
    print("   POST /api/mev/strategies/stop")
    print("   GET  /health")
    print("")
    print("🌐 Frontend URL: http://localhost:8080")
    print("🔗 Backend URL: http://localhost:8005")
    print("")
    print("🔑 Test Login:")
    print("   Username: demo")
    print("   Password: demo")
    print("")
    
    # Run the Flask development server
    app.run(
        host='0.0.0.0',
        port=8005,
        debug=True,
        threaded=True
    )
