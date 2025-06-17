#!/usr/bin/env python3
"""
Training System Models - CyberDefender Academy
Comprehensive data models for gamified cybersecurity training platform
"""

from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, JSON, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Any, List
import uuid

Base = declarative_base()


class ModuleType(str, Enum):
    """Training module categories"""
    SECURITY_FUNDAMENTALS = "security_fundamentals"
    THREAT_DETECTION = "threat_detection"
    INCIDENT_RESPONSE = "incident_response"
    VULNERABILITY_MANAGEMENT = "vulnerability_management"
    ETHICAL_HACKING = "ethical_hacking"
    ADVANCED_OPERATIONS = "advanced_operations"


class DifficultyLevel(str, Enum):
    """Course difficulty levels"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class BadgeType(str, Enum):
    """Achievement badge categories"""
    COMPLETION = "completion"
    PERFORMANCE = "performance"
    SPEED = "speed"
    COLLABORATION = "collaboration"
    SPECIAL = "special"


class AssessmentType(str, Enum):
    """Types of assessments"""
    QUIZ = "quiz"
    SIMULATION = "simulation"
    LAB = "lab"
    PROJECT = "project"
    PEER_REVIEW = "peer_review"


class ProgressStatus(str, Enum):
    """User progress status"""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    LOCKED = "locked"


class TrainingModule(Base):
    """Main training modules (6 core modules)"""
    __tablename__ = "training_modules"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text)
    module_type = Column(SQLEnum(ModuleType), nullable=False)
    order_index = Column(Integer, nullable=False)
    estimated_hours = Column(Float, default=5.0)
    difficulty_level = Column(SQLEnum(DifficultyLevel), default=DifficultyLevel.BEGINNER)
    prerequisites = Column(JSON)  # List of module IDs
    learning_objectives = Column(JSON)  # List of objectives
    interactive_elements = Column(JSON)  # List of interactive features
    badge_id = Column(String, ForeignKey("badges.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    courses = relationship("Course", back_populates="module")
    badge = relationship("Badge", back_populates="modules")
    user_progress = relationship("UserProgress", back_populates="module")


class Course(Base):
    """Individual courses within modules"""
    __tablename__ = "courses"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    module_id = Column(String, ForeignKey("training_modules.id"), nullable=False)
    name = Column(String(150), nullable=False)
    description = Column(Text)
    provider = Column(String(100))  # EC-Council, SANS, etc.
    course_url = Column(String(500))
    duration_hours = Column(Float, default=1.0)
    difficulty_level = Column(SQLEnum(DifficultyLevel), default=DifficultyLevel.BEGINNER)
    topics_covered = Column(JSON)  # List of topics
    hands_on_labs = Column(Boolean, default=False)
    certification_prep = Column(String(100))  # Related certification
    order_index = Column(Integer, default=0)
    is_free = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    module = relationship("TrainingModule", back_populates="courses")
    assessments = relationship("Assessment", back_populates="course")
    user_course_progress = relationship("UserCourseProgress", back_populates="course")


class Badge(Base):
    """Achievement badges and digital credentials"""
    __tablename__ = "badges"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text)
    badge_type = Column(SQLEnum(BadgeType), nullable=False)
    criteria = Column(JSON)  # Requirements to earn badge
    icon_url = Column(String(500))
    badge_image_url = Column(String(500))
    points_awarded = Column(Integer, default=10)
    rarity_level = Column(String(20), default="common")  # common, rare, legendary
    credly_badge_id = Column(String(100))  # Integration with Credly
    is_stackable = Column(Boolean, default=False)  # Can be earned multiple times
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    modules = relationship("TrainingModule", back_populates="badge")
    user_badges = relationship("UserBadge", back_populates="badge")


class Assessment(Base):
    """Assessments and interactive challenges"""
    __tablename__ = "assessments"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    course_id = Column(String, ForeignKey("courses.id"), nullable=False)
    name = Column(String(150), nullable=False)
    description = Column(Text)
    assessment_type = Column(SQLEnum(AssessmentType), nullable=False)
    max_score = Column(Float, default=100.0)
    passing_score = Column(Float, default=70.0)
    time_limit_minutes = Column(Integer)
    max_attempts = Column(Integer, default=3)
    questions = Column(JSON)  # Assessment questions/scenarios
    simulation_config = Column(JSON)  # For simulation assessments
    is_proctored = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    course = relationship("Course", back_populates="assessments")
    user_attempts = relationship("UserAssessmentAttempt", back_populates="assessment")


class TrainingUser(Base):
    """Extended user profile for training system"""
    __tablename__ = "training_users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(50), nullable=False, unique=True)
    email = Column(String(150), nullable=False, unique=True)
    full_name = Column(String(100))
    job_title = Column(String(100))
    organization = Column(String(150))
    experience_level = Column(SQLEnum(DifficultyLevel), default=DifficultyLevel.BEGINNER)
    preferred_learning_style = Column(String(50))  # visual, auditory, kinesthetic
    timezone = Column(String(50), default="UTC")
    total_points = Column(Integer, default=0)
    current_streak = Column(Integer, default=0)  # Days in a row
    longest_streak = Column(Integer, default=0)
    certifications = Column(JSON)  # List of held certifications
    career_goals = Column(JSON)  # List of target certifications/roles
    learning_preferences = Column(JSON)  # Adaptive learning settings
    last_activity = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    progress = relationship("UserProgress", back_populates="user")
    course_progress = relationship("UserCourseProgress", back_populates="user")
    badges = relationship("UserBadge", back_populates="user")
    assessment_attempts = relationship("UserAssessmentAttempt", back_populates="user")
    achievements = relationship("UserAchievement", back_populates="user")


class UserProgress(Base):
    """User progress through training modules"""
    __tablename__ = "user_progress"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("training_users.id"), nullable=False)
    module_id = Column(String, ForeignKey("training_modules.id"), nullable=False)
    status = Column(SQLEnum(ProgressStatus), default=ProgressStatus.NOT_STARTED)
    progress_percentage = Column(Float, default=0.0)
    time_spent_minutes = Column(Integer, default=0)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    last_accessed = Column(DateTime, default=datetime.utcnow)
    current_course_id = Column(String)
    notes = Column(Text)
    
    # Relationships
    user = relationship("TrainingUser", back_populates="progress")
    module = relationship("TrainingModule", back_populates="user_progress")


class UserCourseProgress(Base):
    """Detailed progress within individual courses"""
    __tablename__ = "user_course_progress"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("training_users.id"), nullable=False)
    course_id = Column(String, ForeignKey("courses.id"), nullable=False)
    status = Column(SQLEnum(ProgressStatus), default=ProgressStatus.NOT_STARTED)
    progress_percentage = Column(Float, default=0.0)
    time_spent_minutes = Column(Integer, default=0)
    final_score = Column(Float)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    last_accessed = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("TrainingUser", back_populates="course_progress")
    course = relationship("Course", back_populates="user_course_progress")


class UserBadge(Base):
    """Badges earned by users"""
    __tablename__ = "user_badges"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("training_users.id"), nullable=False)
    badge_id = Column(String, ForeignKey("badges.id"), nullable=False)
    earned_at = Column(DateTime, default=datetime.utcnow)
    points_earned = Column(Integer)
    evidence_data = Column(JSON)  # Data proving badge was earned
    credly_issued_id = Column(String(100))  # Credly credential ID
    is_displayed = Column(Boolean, default=True)
    
    # Relationships
    user = relationship("TrainingUser", back_populates="badges")
    badge = relationship("Badge", back_populates="user_badges")


class UserAssessmentAttempt(Base):
    """User attempts at assessments"""
    __tablename__ = "user_assessment_attempts"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("training_users.id"), nullable=False)
    assessment_id = Column(String, ForeignKey("assessments.id"), nullable=False)
    attempt_number = Column(Integer, default=1)
    score = Column(Float)
    max_possible_score = Column(Float)
    percentage_score = Column(Float)
    time_taken_minutes = Column(Integer)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    answers = Column(JSON)  # User responses
    detailed_feedback = Column(JSON)  # Question-by-question feedback
    passed = Column(Boolean)
    
    # Relationships
    user = relationship("TrainingUser", back_populates="assessment_attempts")
    assessment = relationship("Assessment", back_populates="user_attempts")


class UserAchievement(Base):
    """Special achievements and milestones"""
    __tablename__ = "user_achievements"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("training_users.id"), nullable=False)
    achievement_type = Column(String(50), nullable=False)  # "cyber_hero", "hat_trick", etc.
    achievement_name = Column(String(100), nullable=False)
    description = Column(Text)
    points_awarded = Column(Integer, default=0)
    achieved_at = Column(DateTime, default=datetime.utcnow)
    context_data = Column(JSON)  # Additional context about achievement
    
    # Relationships
    user = relationship("TrainingUser", back_populates="achievements")


class Leaderboard(Base):
    """Leaderboard entries for gamification"""
    __tablename__ = "leaderboard"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("training_users.id"), nullable=False)
    category = Column(String(50), nullable=False)  # "overall", "weekly", "module_specific"
    rank = Column(Integer, nullable=False)
    score = Column(Integer, nullable=False)
    period_start = Column(DateTime)
    period_end = Column(DateTime)
    last_updated = Column(DateTime, default=datetime.utcnow)


class SimulationSession(Base):
    """Interactive simulation sessions"""
    __tablename__ = "simulation_sessions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("training_users.id"), nullable=False)
    simulation_type = Column(String(50), nullable=False)  # "phishing_analysis", "escape_room", etc.
    scenario_id = Column(String(100))
    session_data = Column(JSON)  # Simulation state and progress
    score = Column(Float)
    completion_time_minutes = Column(Integer)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    is_completed = Column(Boolean, default=False)
