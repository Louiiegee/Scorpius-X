"""
Scheduler System Test Script
Comprehensive testing of the CyberDefender Scheduler backend API endpoints
"""

import asyncio
import aiohttp
import json
from datetime import datetime
from typing import Dict, Any, List


class SchedulerSystemTester:
    """Test runner for Scheduler system API endpoints"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.test_results = {
            "total_tests": 0,
            "passed_tests": 0,
            "failed_tests": 0,
            "test_details": []
        }
    
    async def run_test(self, test_name: str, test_func) -> bool:
        """Run individual test and track results"""
        self.test_results["total_tests"] += 1
        
        try:
            result = await test_func()
            if result:
                self.test_results["passed_tests"] += 1
                print(f"✅ {test_name}")
                self.test_results["test_details"].append({
                    "test": test_name,
                    "status": "PASS",
                    "timestamp": datetime.utcnow().isoformat()
                })
                return True
            else:
                self.test_results["failed_tests"] += 1
                print(f"❌ {test_name}")
                self.test_results["test_details"].append({
                    "test": test_name,
                    "status": "FAIL",
                    "timestamp": datetime.utcnow().isoformat()
                })
                return False
                
        except Exception as e:
            self.test_results["failed_tests"] += 1
            print(f"❌ {test_name} - Error: {e}")
            self.test_results["test_details"].append({
                "test": test_name,
                "status": "ERROR",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            })
            return False
    
    async def test_health_check(self) -> bool:
        """Test scheduler health endpoint"""
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{self.base_url}/api/scheduler/health") as response:
                if response.status == 200:
                    data = await response.json()
                    required_fields = ["service", "status", "uptime", "active_jobs", "clusters_online"]
                    return all(field in data for field in required_fields)
                return False
    
    async def test_get_scheduled_jobs(self) -> bool:
        """Test fetching scheduled jobs"""
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{self.base_url}/api/scheduler/jobs") as response:
                if response.status == 200:
                    jobs = await response.json()
                    return isinstance(jobs, list) and len(jobs) > 0
                return False
    
    async def test_get_job_executions(self) -> bool:
        """Test fetching job executions"""
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{self.base_url}/api/scheduler/executions") as response:
                if response.status == 200:
                    executions = await response.json()
                    return isinstance(executions, list) and len(executions) > 0
                return False
    
    async def test_get_system_metrics(self) -> bool:
        """Test fetching system metrics"""
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{self.base_url}/api/scheduler/metrics") as response:
                if response.status == 200:
                    metrics = await response.json()
                    required_fields = ["active_jobs", "success_rate", "avg_runtime", "cpu_usage"]
                    return all(field in metrics for field in required_fields)
                return False
    
    async def test_get_compute_clusters(self) -> bool:
        """Test fetching compute clusters"""
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{self.base_url}/api/scheduler/clusters") as response:
                if response.status == 200:
                    clusters = await response.json()
                    return isinstance(clusters, list) and len(clusters) > 0
                return False
    
    async def test_get_resource_usage(self) -> bool:
        """Test fetching resource usage data"""
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{self.base_url}/api/scheduler/resources") as response:
                if response.status == 200:
                    resources = await response.json()
                    return isinstance(resources, list) and len(resources) > 0
                return False
    
    async def test_create_job(self) -> bool:
        """Test creating a new scheduled job"""
        job_data = {
            "name": "Test Security Scan",
            "description": "Test job for API validation",
            "job_type": "scan",
            "category": "Testing",
            "schedule": "0 3 * * *",
            "priority": "normal",
            "resource": "cluster-scanner",
            "estimated_cost": 5.00,
            "timeout_minutes": 30,
            "targets": 50,
            "config": {
                "scan_types": ["basic", "advanced"],
                "depth": "normal"
            },
            "environment_vars": {
                "TEST_MODE": "true"
            }
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/api/scheduler/jobs",
                json=job_data
            ) as response:
                if response.status == 200:
                    job = await response.json()
                    return "id" in job and job["name"] == job_data["name"]
                return False
    
    async def test_job_filtering(self) -> bool:
        """Test job filtering functionality"""
        async with aiohttp.ClientSession() as session:
            # Test filter by status
            async with session.get(f"{self.base_url}/api/scheduler/jobs?status=active") as response:
                if response.status != 200:
                    return False
                jobs = await response.json()
                if not isinstance(jobs, list):
                    return False
                
                # Check that all returned jobs have active status
                return all(job.get("status") == "active" for job in jobs)
    
    async def test_trigger_job_execution(self) -> bool:
        """Test triggering manual job execution"""
        # First, get an active job
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{self.base_url}/api/scheduler/jobs?status=active&limit=1") as response:
                if response.status != 200:
                    return False
                jobs = await response.json()
                if not jobs:
                    return False
                
                job_id = jobs[0]["id"]
                
                # Trigger execution
                async with session.post(f"{self.base_url}/api/scheduler/jobs/{job_id}/trigger") as response:
                    if response.status == 200:
                        result = await response.json()
                        return "execution_id" in result
                    return False
    
    async def test_cluster_status_filtering(self) -> bool:
        """Test cluster status filtering"""
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{self.base_url}/api/scheduler/clusters?status=online") as response:
                if response.status == 200:
                    clusters = await response.json()
                    return isinstance(clusters, list) and all(
                        cluster.get("status") == "online" for cluster in clusters
                    )
                return False
    
    async def test_resource_usage_filtering(self) -> bool:
        """Test resource usage filtering"""
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{self.base_url}/api/scheduler/resources?resource_type=CPU") as response:
                if response.status == 200:
                    resources = await response.json()
                    return isinstance(resources, list) and all(
                        "CPU" in resource.get("resource_type", "") for resource in resources
                    )
                return False
    
    async def test_job_details(self) -> bool:
        """Test fetching individual job details"""
        # First get a job ID
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{self.base_url}/api/scheduler/jobs?limit=1") as response:
                if response.status != 200:
                    return False
                jobs = await response.json()
                if not jobs:
                    return False
                
                job_id = jobs[0]["id"]
                
                # Get job details
                async with session.get(f"{self.base_url}/api/scheduler/jobs/{job_id}") as response:
                    if response.status == 200:
                        job = await response.json()
                        required_fields = ["id", "name", "job_type", "status", "schedule"]
                        return all(field in job for field in required_fields)
                    return False
    
    async def test_execution_details(self) -> bool:
        """Test fetching individual execution details"""
        # First get an execution ID
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{self.base_url}/api/scheduler/executions?limit=1") as response:
                if response.status != 200:
                    return False
                executions = await response.json()
                if not executions:
                    return False
                
                execution_id = executions[0]["id"]
                
                # Get execution details
                async with session.get(f"{self.base_url}/api/scheduler/executions/{execution_id}") as response:
                    if response.status == 200:
                        execution = await response.json()
                        required_fields = ["id", "job_id", "status", "start_time"]
                        return all(field in execution for field in required_fields)
                    return False
    
    async def run_all_tests(self):
        """Run all scheduler system tests"""
        print("🎯 Starting CyberDefender Scheduler System Tests")
        print("=" * 60)
        
        # Core functionality tests
        await self.run_test("1️⃣ Testing Health Check", self.test_health_check)
        await self.run_test("2️⃣ Testing Scheduled Jobs", self.test_get_scheduled_jobs)
        await self.run_test("3️⃣ Testing Job Executions", self.test_get_job_executions)
        await self.run_test("4️⃣ Testing System Metrics", self.test_get_system_metrics)
        await self.run_test("5️⃣ Testing Compute Clusters", self.test_get_compute_clusters)
        await self.run_test("6️⃣ Testing Resource Usage", self.test_get_resource_usage)
        
        # CRUD operations tests
        await self.run_test("7️⃣ Testing Job Creation", self.test_create_job)
        await self.run_test("8️⃣ Testing Job Filtering", self.test_job_filtering)
        await self.run_test("9️⃣ Testing Job Execution Trigger", self.test_trigger_job_execution)
        
        # Advanced functionality tests
        await self.run_test("🔟 Testing Cluster Status Filtering", self.test_cluster_status_filtering)
        await self.run_test("1️⃣1️⃣ Testing Resource Usage Filtering", self.test_resource_usage_filtering)
        await self.run_test("1️⃣2️⃣ Testing Job Details", self.test_job_details)
        await self.run_test("1️⃣3️⃣ Testing Execution Details", self.test_execution_details)
        
        # Print summary
        print("\n" + "=" * 60)
        print("🏆 TEST SUMMARY")
        print("=" * 60)
        
        success_rate = (self.test_results["passed_tests"] / self.test_results["total_tests"]) * 100
        
        print(f"✅ Successful Tests: {self.test_results['passed_tests']}/{self.test_results['total_tests']}")
        print(f"📊 Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 100:
            print("🎯 Overall Status: PERFECT")
            print("\n🎉 CyberDefender Scheduler System is fully operational!")
        elif success_rate >= 85:
            print("🎯 Overall Status: EXCELLENT")
            print("\n🎉 CyberDefender Scheduler System is working great!")
        elif success_rate >= 70:
            print("🎯 Overall Status: GOOD")
            print("\n✅ CyberDefender Scheduler System is mostly functional.")
        else:
            print("🎯 Overall Status: NEEDS ATTENTION")
            print("\n⚠️ Some issues found in the Scheduler System.")
        
        # Save detailed results
        with open("scheduler_test_results.json", "w") as f:
            json.dump(self.test_results, f, indent=2)
        
        print(f"\n📝 Test results saved to scheduler_test_results.json")


async def main():
    """Main test runner"""
    tester = SchedulerSystemTester()
    await tester.run_all_tests()


if __name__ == "__main__":
    asyncio.run(main())
