#!/usr/bin/env python3
"""
CyberDefender Academy Training System Test
Comprehensive testing of the training backend system
"""

import asyncio
import httpx
import json
from datetime import datetime
from typing import Dict, Any

class TrainingSystemTester:
    """Test the complete training system"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        """Initialize tester with API base URL"""
        self.base_url = base_url
        self.client = None
    
    async def __aenter__(self):
        """Async context manager entry"""
        self.client = httpx.AsyncClient(timeout=30.0)
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.client:
            await self.client.aclose()
    
    async def test_health_check(self) -> Dict[str, Any]:
        """Test training system health"""
        try:
            response = await self.client.get(f"{self.base_url}/api/training/health")
            result = {
                "endpoint": "/api/training/health",
                "status_code": response.status_code,
                "success": response.status_code == 200
            }
            
            if response.status_code == 200:
                data = response.json()
                result.update({
                    "service": data.get("service"),
                    "status": data.get("status"),
                    "version": data.get("version")
                })
                print("✅ Training health check passed")
            else:
                print(f"❌ Training health check failed: {response.status_code}")
                
            return result
            
        except Exception as e:
            print(f"❌ Training health check error: {e}")
            return {"endpoint": "/api/training/health", "success": False, "error": str(e)}
    
    async def test_modules_endpoint(self) -> Dict[str, Any]:
        """Test training modules API"""
        try:
            response = await self.client.get(f"{self.base_url}/api/training/modules")
            result = {
                "endpoint": "/api/training/modules",
                "status_code": response.status_code,
                "success": response.status_code == 200
            }
            
            if response.status_code == 200:
                modules = response.json()
                result.update({
                    "modules_count": len(modules),
                    "modules": [m["name"] for m in modules[:3]]  # First 3 module names
                })
                print(f"✅ Found {len(modules)} training modules")
                
                # Test module types
                module_types = set(m["module_type"] for m in modules)
                expected_types = {
                    "security_fundamentals", "threat_detection", "incident_response",
                    "vulnerability_management", "ethical_hacking", "advanced_operations"
                }
                
                if module_types >= expected_types:
                    print("✅ All required module types present")
                    result["all_module_types"] = True
                else:
                    print(f"⚠️ Missing module types: {expected_types - module_types}")
                    result["all_module_types"] = False
                    
            else:
                print(f"❌ Modules endpoint failed: {response.status_code}")
                
            return result
            
        except Exception as e:
            print(f"❌ Modules endpoint error: {e}")
            return {"endpoint": "/api/training/modules", "success": False, "error": str(e)}
    
    async def test_badges_endpoint(self) -> Dict[str, Any]:
        """Test badges API"""
        try:
            response = await self.client.get(f"{self.base_url}/api/training/badges")
            result = {
                "endpoint": "/api/training/badges",
                "status_code": response.status_code,
                "success": response.status_code == 200
            }
            
            if response.status_code == 200:
                badges = response.json()
                result.update({
                    "badges_count": len(badges),
                    "sample_badges": [b["name"] for b in badges[:3]]
                })
                print(f"✅ Found {len(badges)} achievement badges")
                
                # Check for key badges
                badge_names = [b["name"] for b in badges]
                key_badges = [
                    "Cyber Foundation Specialist", "Eagle Eye", "Threat Hunter",
                    "Digital Detective", "Vulnerability Specialist", "Ethical Hacker",
                    "Security Operations Expert", "Cyber Hero", "Hat Trick"
                ]
                
                found_key_badges = [name for name in key_badges if name in badge_names]
                result["key_badges_found"] = len(found_key_badges)
                
                if len(found_key_badges) >= 8:
                    print(f"✅ Found {len(found_key_badges)}/{len(key_badges)} key badges")
                else:
                    print(f"⚠️ Only found {len(found_key_badges)}/{len(key_badges)} key badges")
                    
            else:
                print(f"❌ Badges endpoint failed: {response.status_code}")
                
            return result
            
        except Exception as e:
            print(f"❌ Badges endpoint error: {e}")
            return {"endpoint": "/api/training/badges", "success": False, "error": str(e)}
    
    async def test_leaderboard_endpoint(self) -> Dict[str, Any]:
        """Test leaderboard API"""
        try:
            response = await self.client.get(f"{self.base_url}/api/training/leaderboard")
            result = {
                "endpoint": "/api/training/leaderboard",
                "status_code": response.status_code,
                "success": response.status_code == 200
            }
            
            if response.status_code == 200:
                leaderboard = response.json()
                result.update({
                    "leaderboard_entries": len(leaderboard),
                    "top_users": [entry["username"] for entry in leaderboard[:3]]
                })
                print(f"✅ Leaderboard loaded with {len(leaderboard)} entries")
            else:
                print(f"❌ Leaderboard endpoint failed: {response.status_code}")
                
            return result
            
        except Exception as e:
            print(f"❌ Leaderboard endpoint error: {e}")
            return {"endpoint": "/api/training/leaderboard", "success": False, "error": str(e)}
    
    async def test_courses_for_module(self, module_id: str) -> Dict[str, Any]:
        """Test courses endpoint for a specific module"""
        try:
            response = await self.client.get(f"{self.base_url}/api/training/modules/{module_id}/courses")
            result = {
                "endpoint": f"/api/training/modules/{module_id}/courses",
                "status_code": response.status_code,
                "success": response.status_code == 200
            }
            
            if response.status_code == 200:
                courses = response.json()
                result.update({
                    "courses_count": len(courses),
                    "course_names": [c["name"] for c in courses]
                })
                print(f"✅ Module {module_id} has {len(courses)} courses")
            else:
                print(f"❌ Courses endpoint failed for module {module_id}: {response.status_code}")
                
            return result
            
        except Exception as e:
            print(f"❌ Courses endpoint error for module {module_id}: {e}")
            return {"endpoint": f"/api/training/modules/{module_id}/courses", "success": False, "error": str(e)}
    
    async def test_user_progress(self, user_id: str) -> Dict[str, Any]:
        """Test user progress endpoint"""
        try:
            response = await self.client.get(f"{self.base_url}/api/training/users/{user_id}/progress")
            result = {
                "endpoint": f"/api/training/users/{user_id}/progress",
                "status_code": response.status_code,
                "success": response.status_code == 200
            }
            
            if response.status_code == 200:
                progress = response.json()
                result.update({
                    "progress_entries": len(progress),
                    "modules_in_progress": [p["module_name"] for p in progress if p["progress_percentage"] > 0]
                })
                print(f"✅ User {user_id} has progress in {len(progress)} modules")
            else:
                print(f"❌ User progress failed for {user_id}: {response.status_code}")
                
            return result
            
        except Exception as e:
            print(f"❌ User progress error for {user_id}: {e}")
            return {"endpoint": f"/api/training/users/{user_id}/progress", "success": False, "error": str(e)}
    
    async def test_user_badges(self, user_id: str) -> Dict[str, Any]:
        """Test user badges endpoint"""
        try:
            response = await self.client.get(f"{self.base_url}/api/training/users/{user_id}/badges")
            result = {
                "endpoint": f"/api/training/users/{user_id}/badges",
                "status_code": response.status_code,
                "success": response.status_code == 200
            }
            
            if response.status_code == 200:
                badges = response.json()
                result.update({
                    "badges_earned": len(badges),
                    "badge_names": [b["name"] for b in badges]
                })
                print(f"✅ User {user_id} has earned {len(badges)} badges")
            else:
                print(f"❌ User badges failed for {user_id}: {response.status_code}")
                
            return result
            
        except Exception as e:
            print(f"❌ User badges error for {user_id}: {e}")
            return {"endpoint": f"/api/training/users/{user_id}/badges", "success": False, "error": str(e)}
    
    async def run_comprehensive_test(self) -> Dict[str, Any]:
        """Run all training system tests"""
        print("🎯 Starting CyberDefender Academy Training System Tests")
        print("=" * 60)
        
        test_results = {
            "timestamp": datetime.utcnow().isoformat(),
            "tests": {},
            "summary": {}
        }
        
        # 1. Health Check
        print("\n1️⃣ Testing Health Check...")
        test_results["tests"]["health"] = await self.test_health_check()
        
        # 2. Modules
        print("\n2️⃣ Testing Training Modules...")
        modules_result = await self.test_modules_endpoint()
        test_results["tests"]["modules"] = modules_result
        
        # 3. Badges
        print("\n3️⃣ Testing Achievement Badges...")
        test_results["tests"]["badges"] = await self.test_badges_endpoint()
        
        # 4. Leaderboard
        print("\n4️⃣ Testing Leaderboard...")
        test_results["tests"]["leaderboard"] = await self.test_leaderboard_endpoint()
        
        # 5. Test courses for first module (if modules loaded)
        if modules_result.get("success") and "modules_count" in modules_result:
            print("\n5️⃣ Testing Module Courses...")
            # Get first module from modules endpoint
            modules_response = await self.client.get(f"{self.base_url}/api/training/modules")
            if modules_response.status_code == 200:
                modules = modules_response.json()
                if modules:
                    first_module_id = modules[0]["id"]
                    test_results["tests"]["courses"] = await self.test_courses_for_module(first_module_id)
        
        # Calculate summary
        successful_tests = sum(1 for test in test_results["tests"].values() if test.get("success", False))
        total_tests = len(test_results["tests"])
        
        test_results["summary"] = {
            "total_tests": total_tests,
            "successful_tests": successful_tests,
            "success_rate": round((successful_tests / total_tests) * 100, 1) if total_tests > 0 else 0,
            "overall_status": "PASS" if successful_tests == total_tests else "PARTIAL" if successful_tests > 0 else "FAIL"
        }
        
        # Print summary
        print("\n" + "=" * 60)
        print("🏆 TEST SUMMARY")
        print("=" * 60)
        print(f"✅ Successful Tests: {successful_tests}/{total_tests}")
        print(f"📊 Success Rate: {test_results['summary']['success_rate']}%")
        print(f"🎯 Overall Status: {test_results['summary']['overall_status']}")
        
        if test_results['summary']['overall_status'] == "PASS":
            print("\n🎉 CyberDefender Academy Training System is fully operational!")
        elif test_results['summary']['overall_status'] == "PARTIAL":
            print("\n⚠️ CyberDefender Academy Training System is partially operational")
        else:
            print("\n❌ CyberDefender Academy Training System has critical issues")
        
        return test_results


async def run_training_tests():
    """Main test runner function"""
    try:
        async with TrainingSystemTester() as tester:
            results = await tester.run_comprehensive_test()
            
            # Save results to file
            with open("training_test_results.json", "w") as f:
                json.dump(results, f, indent=2)
            
            print(f"\n📝 Test results saved to training_test_results.json")
            return results
            
    except Exception as e:
        print(f"❌ Training system testing failed: {e}")
        return {"error": str(e)}


if __name__ == "__main__":
    asyncio.run(run_training_tests())
