#!/usr/bin/env python3
"""
Training Data Seeder - CyberDefender Academy
Seeds the database with comprehensive training modules, courses, badges, and sample data
"""

import asyncio
import json
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any

from core.db import get_db, engine
from models.training_models import (
    Base, TrainingModule, Course, Badge, Assessment, TrainingUser,
    UserProgress, UserCourseProgress, UserBadge, UserAssessmentAttempt,
    UserAchievement, Leaderboard, SimulationSession,
    ModuleType, DifficultyLevel, BadgeType, AssessmentType, ProgressStatus
)


class TrainingDataSeeder:
    """Seeds training system with comprehensive data"""
    
    def __init__(self):
        """Initialize the seeder"""
        pass
    
    async def seed_all_data(self, db: AsyncSession):
        """Seed all training data"""
        try:
            print("🌱 Starting CyberDefender Academy data seeding...")
            
            # Create tables
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            print("✅ Database tables created")
            
            # Seed core data
            badges = await self.seed_badges(db)
            modules = await self.seed_modules(db, badges)
            courses = await self.seed_courses(db, modules)
            assessments = await self.seed_assessments(db, courses)
            
            # Seed sample users and progress
            users = await self.seed_sample_users(db)
            await self.seed_sample_progress(db, users, modules, courses)
            
            print("🎉 CyberDefender Academy seeding completed successfully!")
            
        except Exception as e:
            print(f"❌ Seeding failed: {e}")
            raise
    
    async def seed_badges(self, db: AsyncSession) -> List[Badge]:
        """Seed achievement badges"""
        badges_data = [
            # Module completion badges
            {
                "name": "Cyber Foundation Specialist",
                "description": "Completed Security Fundamentals module with mastery of core cybersecurity principles",
                "badge_type": BadgeType.COMPLETION,
                "criteria": {"module_completion": "security_fundamentals", "min_score": 80},
                "points_awarded": 100,
                "rarity_level": "common",
                "icon_url": "/badges/foundation-specialist.svg"
            },
            {
                "name": "Eagle Eye",
                "description": "Reported 100+ simulated phishing emails with 95% accuracy",
                "badge_type": BadgeType.PERFORMANCE,
                "criteria": {"phishing_reports": 100, "accuracy": 95},
                "points_awarded": 150,
                "rarity_level": "rare",
                "icon_url": "/badges/eagle-eye.svg"
            },
            {
                "name": "Threat Hunter",
                "description": "Completed advanced threat detection scenarios with distinction",
                "badge_type": BadgeType.COMPLETION,
                "criteria": {"module_completion": "threat_detection", "min_score": 85},
                "points_awarded": 120,
                "rarity_level": "common",
                "icon_url": "/badges/threat-hunter.svg"
            },
            {
                "name": "Digital Detective",
                "description": "Mastered digital forensics investigation methodologies",
                "badge_type": BadgeType.COMPLETION,
                "criteria": {"module_completion": "incident_response", "forensics_cases": 5},
                "points_awarded": 130,
                "rarity_level": "rare",
                "icon_url": "/badges/digital-detective.svg"
            },
            {
                "name": "Vulnerability Specialist",
                "description": "Expert in vulnerability assessment and management practices",
                "badge_type": BadgeType.COMPLETION,
                "criteria": {"module_completion": "vulnerability_management", "scans_performed": 10},
                "points_awarded": 110,
                "rarity_level": "common",
                "icon_url": "/badges/vuln-specialist.svg"
            },
            {
                "name": "Ethical Hacker",
                "description": "Demonstrated ethical hacking skills with responsible disclosure",
                "badge_type": BadgeType.COMPLETION,
                "criteria": {"module_completion": "ethical_hacking", "penetration_tests": 3},
                "points_awarded": 140,
                "rarity_level": "rare",
                "icon_url": "/badges/ethical-hacker.svg"
            },
            {
                "name": "Security Operations Expert",
                "description": "Advanced security operations and incident response mastery",
                "badge_type": BadgeType.COMPLETION,
                "criteria": {"module_completion": "advanced_operations", "incidents_handled": 15},
                "points_awarded": 200,
                "rarity_level": "legendary",
                "icon_url": "/badges/sec-ops-expert.svg"
            },
            # Special achievement badges
            {
                "name": "Cyber Hero",
                "description": "Completed your first training assignment - welcome to the academy!",
                "badge_type": BadgeType.SPECIAL,
                "criteria": {"first_assignment": True},
                "points_awarded": 25,
                "rarity_level": "common",
                "icon_url": "/badges/cyber-hero.svg"
            },
            {
                "name": "Hat Trick",
                "description": "Completed three assignments within 24 hours",
                "badge_type": BadgeType.SPEED,
                "criteria": {"assignments_in_24h": 3},
                "points_awarded": 75,
                "rarity_level": "rare",
                "icon_url": "/badges/hat-trick.svg"
            },
            {
                "name": "Lightning Fast",
                "description": "First to complete a campaign assignment",
                "badge_type": BadgeType.SPEED,
                "criteria": {"first_completion": True},
                "points_awarded": 50,
                "rarity_level": "rare",
                "icon_url": "/badges/lightning-fast.svg"
            },
            {
                "name": "Night Owl",
                "description": "Completed training during night hours (10PM - 6AM)",
                "badge_type": BadgeType.SPECIAL,
                "criteria": {"night_training": True},
                "points_awarded": 30,
                "rarity_level": "common",
                "icon_url": "/badges/night-owl.svg"
            },
            {
                "name": "Early Bird",
                "description": "Completed training during early morning hours (5AM - 8AM)",
                "badge_type": BadgeType.SPECIAL,
                "criteria": {"early_training": True},
                "points_awarded": 30,
                "rarity_level": "common",
                "icon_url": "/badges/early-bird.svg"
            }
        ]
        
        badges = []
        for badge_data in badges_data:
            badge = Badge(**badge_data)
            db.add(badge)
            badges.append(badge)
        
        await db.commit()
        print(f"✅ Seeded {len(badges)} badges")
        return badges
    
    async def seed_modules(self, db: AsyncSession, badges: List[Badge]) -> List[TrainingModule]:
        """Seed training modules"""
        
        # Create badge lookup
        badge_lookup = {badge.name: badge for badge in badges}
        
        modules_data = [
            {
                "name": "Security Fundamentals",
                "description": "Master core cybersecurity principles, risk assessment, and foundational security concepts",
                "module_type": ModuleType.SECURITY_FUNDAMENTALS,
                "order_index": 1,
                "estimated_hours": 5.0,
                "difficulty_level": DifficultyLevel.BEGINNER,
                "prerequisites": [],
                "learning_objectives": [
                    "Understand the CIA Triad and security fundamentals",
                    "Apply McCumber Cube dimensions to cybersecurity scenarios",
                    "Perform quantitative and qualitative risk assessments",
                    "Implement security principles: least privilege, defense in depth, fail-safe defaults"
                ],
                "interactive_elements": [
                    "McCumber Cube simulation",
                    "CIA Triad assessment tools",
                    "Risk analysis calculators",
                    "Security principle workshops"
                ],
                "badge_id": badge_lookup["Cyber Foundation Specialist"].id
            },
            {
                "name": "Threat Detection & Analysis",
                "description": "Develop skills in threat hunting, phishing detection, and security analysis using SIEM tools",
                "module_type": ModuleType.THREAT_DETECTION,
                "order_index": 2,
                "estimated_hours": 6.0,
                "difficulty_level": DifficultyLevel.INTERMEDIATE,
                "prerequisites": ["security_fundamentals"],
                "learning_objectives": [
                    "Identify and analyze phishing attacks with high accuracy",
                    "Use SIEM tools for log analysis and threat correlation",
                    "Conduct threat intelligence gathering and analysis",
                    "Implement automated threat detection workflows"
                ],
                "interactive_elements": [
                    "Simulated phishing email analysis",
                    "Live SIEM data challenges",
                    "Threat intelligence correlation exercises",
                    "Automated detection lab"
                ],
                "badge_id": badge_lookup["Threat Hunter"].id
            },
            {
                "name": "Incident Response & Digital Forensics",
                "description": "Learn systematic incident response and digital forensics investigation methodologies",
                "module_type": ModuleType.INCIDENT_RESPONSE,
                "order_index": 3,
                "estimated_hours": 7.0,
                "difficulty_level": DifficultyLevel.INTERMEDIATE,
                "prerequisites": ["threat_detection"],
                "learning_objectives": [
                    "Execute structured incident response procedures",
                    "Conduct digital forensics investigations following proper chain of custody",
                    "Reconstruct attack timelines using forensic evidence",
                    "Coordinate team-based incident containment and recovery"
                ],
                "interactive_elements": [
                    "Cybersecurity escape rooms",
                    "Digital forensics investigation simulations",
                    "Incident timeline reconstruction challenges",
                    "Team coordination exercises"
                ],
                "badge_id": badge_lookup["Digital Detective"].id
            },
            {
                "name": "Vulnerability Management",
                "description": "Master vulnerability assessment, CVSS scoring, and systematic patch management",
                "module_type": ModuleType.VULNERABILITY_MANAGEMENT,
                "order_index": 4,
                "estimated_hours": 5.5,
                "difficulty_level": DifficultyLevel.INTERMEDIATE,
                "prerequisites": ["incident_response"],
                "learning_objectives": [
                    "Perform comprehensive vulnerability scans and assessments",
                    "Calculate accurate CVSS scores for discovered vulnerabilities",
                    "Develop and implement patch management strategies",
                    "Prioritize vulnerability remediation based on business risk"
                ],
                "interactive_elements": [
                    "Hands-on vulnerability scanning labs",
                    "CVSS scoring competitions",
                    "Patch management simulation games",
                    "Risk prioritization workshops"
                ],
                "badge_id": badge_lookup["Vulnerability Specialist"].id
            },
            {
                "name": "Ethical Hacking & Penetration Testing",
                "description": "Learn offensive security techniques for defensive purposes with ethical guidelines",
                "module_type": ModuleType.ETHICAL_HACKING,
                "order_index": 5,
                "estimated_hours": 8.0,
                "difficulty_level": DifficultyLevel.ADVANCED,
                "prerequisites": ["vulnerability_management"],
                "learning_objectives": [
                    "Conduct ethical penetration testing with proper authorization",
                    "Use offensive tools like L0phtCrack and SQL injection testers responsibly",
                    "Implement and test countermeasures against common attack vectors",
                    "Recognize and respond to social engineering attempts"
                ],
                "interactive_elements": [
                    "Hands-on penetration testing labs",
                    "Password cracking challenges",
                    "Social engineering awareness simulations",
                    "Countermeasure implementation workshops"
                ],
                "badge_id": badge_lookup["Ethical Hacker"].id
            },
            {
                "name": "Advanced Security Operations",
                "description": "Master advanced security operations, multi-vector attack defense, and security tool integration",
                "module_type": ModuleType.ADVANCED_OPERATIONS,
                "order_index": 6,
                "estimated_hours": 8.5,
                "difficulty_level": DifficultyLevel.EXPERT,
                "prerequisites": ["ethical_hacking"],
                "learning_objectives": [
                    "Defend against sophisticated multi-vector attacks (ransomware, DDoS, APTs)",
                    "Integrate and optimize security tools (Palo Alto, IBM QRadar, Wireshark)",
                    "Lead cross-functional incident response teams",
                    "Develop advanced threat hunting methodologies"
                ],
                "interactive_elements": [
                    "Multi-attack scenario simulations",
                    "Security tool integration challenges",
                    "Cross-functional incident response exercises",
                    "Advanced threat hunting labs"
                ],
                "badge_id": badge_lookup["Security Operations Expert"].id
            }
        ]
        
        modules = []
        for module_data in modules_data:
            module = TrainingModule(**module_data)
            db.add(module)
            modules.append(module)
        
        await db.commit()
        print(f"✅ Seeded {len(modules)} training modules")
        return modules
    
    async def seed_courses(self, db: AsyncSession, modules: List[TrainingModule]) -> List[Course]:
        """Seed courses within modules"""
        
        # Create module lookup
        module_lookup = {module.module_type.value: module for module in modules}
        
        courses_data = [
            # Security Fundamentals courses
            {
                "module_id": module_lookup["security_fundamentals"].id,
                "name": "Cybersecurity Principles",
                "description": "Core principles covering modularity, layering, least privilege, and fail-safe defaults",
                "provider": "CyberDefender Academy",
                "duration_hours": 2.5,
                "difficulty_level": DifficultyLevel.BEGINNER,
                "topics_covered": ["CIA Triad", "Security Principles", "Risk Management", "Compliance Frameworks"],
                "hands_on_labs": True,
                "certification_prep": "CompTIA Security+",
                "order_index": 1,
                "is_free": True
            },
            {
                "module_id": module_lookup["security_fundamentals"].id,
                "name": "Network Defense Essentials (N|DE)",
                "description": "EC-Council's free foundational course covering network security protocols and access management",
                "provider": "EC-Council",
                "course_url": "https://codered.eccouncil.org/course/network-defense-essentials",
                "duration_hours": 2.5,
                "difficulty_level": DifficultyLevel.BEGINNER,
                "topics_covered": ["Network Security", "Access Control", "Protocol Security", "Perimeter Defense"],
                "hands_on_labs": False,
                "certification_prep": "Network Defense Essentials",
                "order_index": 2,
                "is_free": True
            },
            
            # Threat Detection courses
            {
                "module_id": module_lookup["threat_detection"].id,
                "name": "Introduction to Threat Hunting",
                "description": "11 topics covering indicators, malware hunting, and course capstone",
                "provider": "Security Blue Team",
                "duration_hours": 3.0,
                "difficulty_level": DifficultyLevel.INTERMEDIATE,
                "topics_covered": ["Threat Indicators", "Malware Analysis", "Hunt Methodologies", "Tool Integration"],
                "hands_on_labs": True,
                "certification_prep": "GCTI",
                "order_index": 1,
                "is_free": True
            },
            {
                "module_id": module_lookup["threat_detection"].id,
                "name": "SOC Essentials (S|OCE)",
                "description": "SIEM architecture, incident detection, and analysis fundamentals",
                "provider": "EC-Council",
                "duration_hours": 3.0,
                "difficulty_level": DifficultyLevel.INTERMEDIATE,
                "topics_covered": ["SIEM Operations", "Incident Detection", "Log Analysis", "Correlation Rules"],
                "hands_on_labs": True,
                "certification_prep": "SOC Essentials",
                "order_index": 2,
                "is_free": False
            },
            
            # Incident Response courses
            {
                "module_id": module_lookup["incident_response"].id,
                "name": "Digital Forensics Essentials (D|FE)",
                "description": "Investigation steps, practices, and methodologies for digital evidence",
                "provider": "EC-Council",
                "duration_hours": 3.5,
                "difficulty_level": DifficultyLevel.INTERMEDIATE,
                "topics_covered": ["Evidence Collection", "Chain of Custody", "Forensic Tools", "Report Writing"],
                "hands_on_labs": True,
                "certification_prep": "Digital Forensics Essentials",
                "order_index": 1,
                "is_free": False
            },
            {
                "module_id": module_lookup["incident_response"].id,
                "name": "Introduction to Digital Forensics",
                "description": "Security Blue Team's comprehensive pathway to forensic investigation",
                "provider": "Security Blue Team",
                "duration_hours": 3.5,
                "difficulty_level": DifficultyLevel.INTERMEDIATE,
                "topics_covered": ["Forensic Process", "Evidence Analysis", "Timeline Construction", "Incident Response"],
                "hands_on_labs": True,
                "certification_prep": "GCIH",
                "order_index": 2,
                "is_free": True
            },
            
            # Vulnerability Management courses
            {
                "module_id": module_lookup["vulnerability_management"].id,
                "name": "Introduction to Vulnerability Management",
                "description": "Assessment and remediation strategies for enterprise environments",
                "provider": "CyberDefender Academy",
                "duration_hours": 2.5,
                "difficulty_level": DifficultyLevel.INTERMEDIATE,
                "topics_covered": ["Vulnerability Scanning", "CVSS Scoring", "Patch Management", "Risk Assessment"],
                "hands_on_labs": True,
                "certification_prep": "CompTIA Security+",
                "order_index": 1,
                "is_free": True
            },
            {
                "module_id": module_lookup["vulnerability_management"].id,
                "name": "Physical and Environmental Protection Controls",
                "description": "Interactive threat scenarios for physical security assessment",
                "provider": "NIST Cybersecurity Framework",
                "duration_hours": 3.0,
                "difficulty_level": DifficultyLevel.INTERMEDIATE,
                "topics_covered": ["Physical Security", "Environmental Controls", "Access Management", "Threat Modeling"],
                "hands_on_labs": True,
                "certification_prep": "CISSP",
                "order_index": 2,
                "is_free": True
            },
            
            # Ethical Hacking courses
            {
                "module_id": module_lookup["ethical_hacking"].id,
                "name": "Ethical Hacking Essentials (E|HE)",
                "description": "12 modules covering web application attacks, wireless attacks, and IoT security",
                "provider": "EC-Council",
                "duration_hours": 4.0,
                "difficulty_level": DifficultyLevel.ADVANCED,
                "topics_covered": ["Web App Security", "Wireless Security", "IoT Security", "Penetration Testing"],
                "hands_on_labs": True,
                "certification_prep": "Ethical Hacking Essentials",
                "order_index": 1,
                "is_free": False
            },
            {
                "module_id": module_lookup["ethical_hacking"].id,
                "name": "Certified Ethical Hacker (CEH)",
                "description": "Advanced offensive security skills for defensive purposes",
                "provider": "EC-Council",
                "duration_hours": 4.0,
                "difficulty_level": DifficultyLevel.ADVANCED,
                "topics_covered": ["Advanced Penetration Testing", "Exploit Development", "Social Engineering", "Mobile Security"],
                "hands_on_labs": True,
                "certification_prep": "Certified Ethical Hacker",
                "order_index": 2,
                "is_free": False
            },
            
            # Advanced Operations courses
            {
                "module_id": module_lookup["advanced_operations"].id,
                "name": "SANS SEC504: Hacking Techniques & Incident Response",
                "description": "Hands-on technical training for advanced threat response",
                "provider": "SANS Institute",
                "duration_hours": 4.5,
                "difficulty_level": DifficultyLevel.EXPERT,
                "topics_covered": ["Advanced Threats", "Incident Response", "Forensic Analysis", "Threat Hunting"],
                "hands_on_labs": True,
                "certification_prep": "GCIH",
                "order_index": 1,
                "is_free": False
            },
            {
                "module_id": module_lookup["advanced_operations"].id,
                "name": "Advanced Threat Hunting",
                "description": "Real-world attack scenarios and advanced hunting techniques",
                "provider": "CyberDefender Academy",
                "duration_hours": 4.0,
                "difficulty_level": DifficultyLevel.EXPERT,
                "topics_covered": ["APT Analysis", "Behavioral Analytics", "Custom Detection", "Threat Intelligence"],
                "hands_on_labs": True,
                "certification_prep": "GCTI",
                "order_index": 2,
                "is_free": True
            }
        ]
        
        courses = []
        for course_data in courses_data:
            course = Course(**course_data)
            db.add(course)
            courses.append(course)
        
        await db.commit()
        print(f"✅ Seeded {len(courses)} courses")
        return courses
    
    async def seed_assessments(self, db: AsyncSession, courses: List[Course]) -> List[Assessment]:
        """Seed sample assessments for courses"""
        assessments = []
        
        for course in courses[:5]:  # Add assessments to first 5 courses
            assessment = Assessment(
                course_id=course.id,
                name=f"{course.name} - Final Assessment",
                description=f"Comprehensive assessment covering all topics in {course.name}",
                assessment_type=AssessmentType.QUIZ,
                max_score=100.0,
                passing_score=70.0,
                time_limit_minutes=45,
                max_attempts=3,
                questions=[
                    {
                        "id": "q1",
                        "question": "What are the three pillars of the CIA Triad?",
                        "type": "multiple_choice",
                        "options": ["Confidentiality, Integrity, Availability", "Control, Identity, Access", "Cyber, Information, Analytics"],
                        "correct_answer": "Confidentiality, Integrity, Availability"
                    },
                    {
                        "id": "q2", 
                        "question": "Which principle ensures users have minimal access required for their role?",
                        "type": "multiple_choice",
                        "options": ["Least Privilege", "Defense in Depth", "Fail Safe"],
                        "correct_answer": "Least Privilege"
                    }
                ]
            )
            db.add(assessment)
            assessments.append(assessment)
        
        await db.commit()
        print(f"✅ Seeded {len(assessments)} assessments")
        return assessments
    
    async def seed_sample_users(self, db: AsyncSession) -> List[TrainingUser]:
        """Seed sample users for testing"""
        users_data = [
            {
                "username": "alice_analyst",
                "email": "alice@cyberdefender.academy",
                "full_name": "Alice Johnson",
                "job_title": "Junior Security Analyst",
                "organization": "TechCorp Security",
                "experience_level": DifficultyLevel.BEGINNER,
                "total_points": 245,
                "current_streak": 3,
                "longest_streak": 7
            },
            {
                "username": "bob_hunter",
                "email": "bob@cyberdefender.academy", 
                "full_name": "Bob Smith",
                "job_title": "Threat Hunter",
                "organization": "SecureNet Solutions",
                "experience_level": DifficultyLevel.INTERMEDIATE,
                "total_points": 578,
                "current_streak": 12,
                "longest_streak": 15
            },
            {
                "username": "carol_expert",
                "email": "carol@cyberdefender.academy",
                "full_name": "Carol Davis",
                "job_title": "Senior Security Engineer", 
                "organization": "CyberShield Inc",
                "experience_level": DifficultyLevel.ADVANCED,
                "total_points": 892,
                "current_streak": 8,
                "longest_streak": 22
            }
        ]
        
        users = []
        for user_data in users_data:
            user = TrainingUser(**user_data)
            db.add(user)
            users.append(user)
        
        await db.commit()
        print(f"✅ Seeded {len(users)} sample users")
        return users
    
    async def seed_sample_progress(self, db: AsyncSession, users: List[TrainingUser], modules: List[TrainingModule], courses: List[Course]):
        """Seed sample progress data"""
        progress_entries = []
        
        for i, user in enumerate(users):
            # Create varying progress for each user
            modules_to_progress = modules[:i+2]  # First user gets 2 modules, second gets 3, etc.
            
            for j, module in enumerate(modules_to_progress):
                progress_percentage = min(100, (j + 1) * 30 + (i * 10))
                status = ProgressStatus.COMPLETED if progress_percentage >= 100 else ProgressStatus.IN_PROGRESS
                
                progress = UserProgress(
                    user_id=user.id,
                    module_id=module.id,
                    status=status,
                    progress_percentage=progress_percentage,
                    time_spent_minutes=int(module.estimated_hours * 60 * (progress_percentage / 100)),
                    started_at=datetime.utcnow() - timedelta(days=j+1),
                    completed_at=datetime.utcnow() if status == ProgressStatus.COMPLETED else None,
                    last_accessed=datetime.utcnow()
                )
                db.add(progress)
                progress_entries.append(progress)
        
        await db.commit()
        print(f"✅ Seeded {len(progress_entries)} progress entries")


async def seed_training_database():
    """Main seeding function"""
    try:
        seeder = TrainingDataSeeder()
        
        async for db in get_db():
            await seeder.seed_all_data(db)
            break
            
    except Exception as e:
        print(f"❌ Training database seeding failed: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(seed_training_database())
