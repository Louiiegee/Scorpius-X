#!/usr/bin/env python3
"""
Training API Routes - CyberDefender Academy
Comprehensive API for gamified cybersecurity training platform
"""

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, and_, or_
from sqlalchemy.orm import selectinload
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
import json

from core.db import get_db
from models.training_models import (
    TrainingModule, Course, Badge, Assessment, TrainingUser,
    UserProgress, UserCourseProgress, UserBadge, UserAssessmentAttempt,
    UserAchievement, Leaderboard, SimulationSession,
    ModuleType, DifficultyLevel, BadgeType, AssessmentType, ProgressStatus
)

router = APIRouter(prefix="/api/training", tags=["training"])


# Pydantic Models for API
class ModuleResponse(BaseModel):
    """Training module response"""
    id: str
    name: str
    description: str
    module_type: str
    order_index: int
    estimated_hours: float
    difficulty_level: str
    interactive_elements: List[str]
    badge_name: Optional[str] = None
    courses_count: int = 0
    completion_rate: float = 0.0


class CourseResponse(BaseModel):
    """Course response"""
    id: str
    name: str
    description: str
    provider: Optional[str]
    duration_hours: float
    difficulty_level: str
    topics_covered: List[str]
    hands_on_labs: bool
    certification_prep: Optional[str]
    is_free: bool


class BadgeResponse(BaseModel):
    """Badge response"""
    id: str
    name: str
    description: str
    badge_type: str
    points_awarded: int
    rarity_level: str
    icon_url: Optional[str]
    criteria: Dict[str, Any]


class UserProgressResponse(BaseModel):
    """User progress response"""
    module_id: str
    module_name: str
    status: str
    progress_percentage: float
    time_spent_minutes: int
    estimated_hours: float


class LeaderboardEntry(BaseModel):
    """Leaderboard entry"""
    rank: int
    username: str
    full_name: Optional[str]
    total_points: int
    badges_count: int
    modules_completed: int


class AssessmentAttempt(BaseModel):
    """Assessment attempt submission"""
    assessment_id: str
    answers: Dict[str, Any]
    time_taken_minutes: int


class SimulationStart(BaseModel):
    """Start simulation request"""
    simulation_type: str
    scenario_id: Optional[str] = None
    difficulty: str = "beginner"


# Health Check
@router.get("/health")
async def health_check():
    """Training system health check"""
    return {
        "status": "healthy",
        "service": "CyberDefender Academy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }


# Module Management
@router.get("/modules", response_model=List[ModuleResponse])
async def get_training_modules(
    user_id: Optional[str] = Query(None),
    difficulty: Optional[DifficultyLevel] = Query(None),
    module_type: Optional[ModuleType] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """Get all training modules with progress if user_id provided"""
    try:
        query = select(TrainingModule).options(
            selectinload(TrainingModule.courses),
            selectinload(TrainingModule.badge)
        ).filter(TrainingModule.is_active == True).order_by(TrainingModule.order_index)
        
        if difficulty:
            query = query.filter(TrainingModule.difficulty_level == difficulty)
        if module_type:
            query = query.filter(TrainingModule.module_type == module_type)
        
        result = await db.execute(query)
        modules = result.scalars().all()
        
        response_modules = []
        for module in modules:
            # Get user progress if user_id provided
            progress_percentage = 0.0
            if user_id:
                progress_result = await db.execute(
                    select(UserProgress).filter(
                        and_(UserProgress.user_id == user_id, UserProgress.module_id == module.id)
                    )
                )
                progress = progress_result.scalar_one_or_none()
                if progress:
                    progress_percentage = progress.progress_percentage
            
            # Calculate completion rate across all users
            completion_result = await db.execute(
                select(func.avg(UserProgress.progress_percentage)).filter(
                    UserProgress.module_id == module.id
                )
            )
            avg_completion = completion_result.scalar() or 0.0
            
            response_modules.append(ModuleResponse(
                id=module.id,
                name=module.name,
                description=module.description,
                module_type=module.module_type.value,
                order_index=module.order_index,
                estimated_hours=module.estimated_hours,
                difficulty_level=module.difficulty_level.value,
                interactive_elements=module.interactive_elements or [],
                badge_name=module.badge.name if module.badge else None,
                courses_count=len(module.courses),
                completion_rate=round(avg_completion, 1)
            ))
        
        return response_modules
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch modules: {str(e)}")


@router.get("/modules/{module_id}/courses", response_model=List[CourseResponse])
async def get_module_courses(
    module_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get all courses for a specific module"""
    try:
        result = await db.execute(
            select(Course).filter(
                and_(Course.module_id == module_id, Course.is_active == True)
            ).order_by(Course.order_index)
        )
        courses = result.scalars().all()
        
        return [
            CourseResponse(
                id=course.id,
                name=course.name,
                description=course.description,
                provider=course.provider,
                duration_hours=course.duration_hours,
                difficulty_level=course.difficulty_level.value,
                topics_covered=course.topics_covered or [],
                hands_on_labs=course.hands_on_labs,
                certification_prep=course.certification_prep,
                is_free=course.is_free
            ) for course in courses
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch courses: {str(e)}")


# User Progress Management
@router.get("/users/{user_id}/progress", response_model=List[UserProgressResponse])
async def get_user_progress(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get user's progress across all modules"""
    try:
        result = await db.execute(
            select(UserProgress, TrainingModule).join(
                TrainingModule, UserProgress.module_id == TrainingModule.id
            ).filter(UserProgress.user_id == user_id)
            .order_by(TrainingModule.order_index)
        )
        progress_data = result.all()
        
        return [
            UserProgressResponse(
                module_id=progress.module_id,
                module_name=module.name,
                status=progress.status.value,
                progress_percentage=progress.progress_percentage,
                time_spent_minutes=progress.time_spent_minutes,
                estimated_hours=module.estimated_hours
            ) for progress, module in progress_data
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch user progress: {str(e)}")


@router.post("/users/{user_id}/progress/{module_id}")
async def update_user_progress(
    user_id: str,
    module_id: str,
    progress_percentage: float = 0.0,
    time_spent_minutes: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """Update user's progress in a module"""
    try:
        # Get or create progress record
        result = await db.execute(
            select(UserProgress).filter(
                and_(UserProgress.user_id == user_id, UserProgress.module_id == module_id)
            )
        )
        progress = result.scalar_one_or_none()
        
        if not progress:
            # Create new progress record
            progress = UserProgress(
                user_id=user_id,
                module_id=module_id,
                status=ProgressStatus.IN_PROGRESS,
                started_at=datetime.utcnow()
            )
            db.add(progress)
        
        # Update progress
        progress.progress_percentage = max(progress.progress_percentage, progress_percentage)
        progress.time_spent_minutes += time_spent_minutes
        progress.last_accessed = datetime.utcnow()
        
        # Update status based on progress
        if progress.progress_percentage >= 100.0:
            progress.status = ProgressStatus.COMPLETED
            progress.completed_at = datetime.utcnow()
        elif progress.progress_percentage > 0:
            progress.status = ProgressStatus.IN_PROGRESS
        
        await db.commit()
        
        # Check for badge awards
        await check_and_award_badges(user_id, module_id, db)
        
        return {"message": "Progress updated successfully", "progress_percentage": progress.progress_percentage}
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update progress: {str(e)}")


# Badge Management
@router.get("/badges", response_model=List[BadgeResponse])
async def get_all_badges(
    badge_type: Optional[BadgeType] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """Get all available badges"""
    try:
        query = select(Badge).filter(Badge.is_active == True)
        
        if badge_type:
            query = query.filter(Badge.badge_type == badge_type)
        
        result = await db.execute(query.order_by(Badge.name))
        badges = result.scalars().all()
        
        return [
            BadgeResponse(
                id=badge.id,
                name=badge.name,
                description=badge.description,
                badge_type=badge.badge_type.value,
                points_awarded=badge.points_awarded,
                rarity_level=badge.rarity_level,
                icon_url=badge.icon_url,
                criteria=badge.criteria or {}
            ) for badge in badges
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch badges: {str(e)}")


@router.get("/users/{user_id}/badges")
async def get_user_badges(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get badges earned by user"""
    try:
        result = await db.execute(
            select(UserBadge, Badge).join(
                Badge, UserBadge.badge_id == Badge.id
            ).filter(UserBadge.user_id == user_id)
            .order_by(desc(UserBadge.earned_at))
        )
        user_badges = result.all()
        
        return [
            {
                "badge_id": badge.id,
                "name": badge.name,
                "description": badge.description,
                "badge_type": badge.badge_type.value,
                "points_earned": user_badge.points_earned,
                "earned_at": user_badge.earned_at.isoformat(),
                "icon_url": badge.icon_url,
                "rarity_level": badge.rarity_level
            } for user_badge, badge in user_badges
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch user badges: {str(e)}")


# Assessment Management
@router.post("/assessments/{assessment_id}/attempt")
async def submit_assessment_attempt(
    assessment_id: str,
    user_id: str,
    attempt_data: AssessmentAttempt,
    db: AsyncSession = Depends(get_db)
):
    """Submit an assessment attempt"""
    try:
        # Get assessment details
        result = await db.execute(select(Assessment).filter(Assessment.id == assessment_id))
        assessment = result.scalar_one_or_none()
        
        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found")
        
        # Check attempt limits
        attempts_result = await db.execute(
            select(func.count(UserAssessmentAttempt.id)).filter(
                and_(
                    UserAssessmentAttempt.user_id == user_id,
                    UserAssessmentAttempt.assessment_id == assessment_id
                )
            )
        )
        attempt_count = attempts_result.scalar() or 0
        
        if attempt_count >= assessment.max_attempts:
            raise HTTPException(status_code=400, detail="Maximum attempts exceeded")
        
        # Score the assessment (simplified)
        score = calculate_assessment_score(attempt_data.answers, assessment.questions)
        percentage_score = (score / assessment.max_score) * 100
        passed = percentage_score >= assessment.passing_score
        
        # Create attempt record
        attempt = UserAssessmentAttempt(
            user_id=user_id,
            assessment_id=assessment_id,
            attempt_number=attempt_count + 1,
            score=score,
            max_possible_score=assessment.max_score,
            percentage_score=percentage_score,
            time_taken_minutes=attempt_data.time_taken_minutes,
            completed_at=datetime.utcnow(),
            answers=attempt_data.answers,
            passed=passed
        )
        
        db.add(attempt)
        await db.commit()
        
        # Award points if passed
        if passed:
            await award_points(user_id, int(score), "assessment_completion", db)
        
        return {
            "attempt_id": attempt.id,
            "score": score,
            "percentage": percentage_score,
            "passed": passed,
            "max_score": assessment.max_score
        }
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to submit attempt: {str(e)}")


# Simulation Management
@router.post("/simulations/start")
async def start_simulation(
    user_id: str,
    simulation_data: SimulationStart,
    db: AsyncSession = Depends(get_db)
):
    """Start an interactive simulation session"""
    try:
        # Create simulation session
        session = SimulationSession(
            user_id=user_id,
            simulation_type=simulation_data.simulation_type,
            scenario_id=simulation_data.scenario_id,
            session_data={
                "difficulty": simulation_data.difficulty,
                "started_at": datetime.utcnow().isoformat(),
                "progress": 0
            }
        )
        
        db.add(session)
        await db.commit()
        
        return {
            "session_id": session.id,
            "simulation_type": session.simulation_type,
            "scenario_id": session.scenario_id,
            "message": "Simulation started successfully"
        }
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to start simulation: {str(e)}")


# Leaderboard
@router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(
    category: str = Query("overall"),
    limit: int = Query(10, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Get leaderboard rankings"""
    try:
        if category == "overall":
            # Overall points leaderboard
            result = await db.execute(
                select(
                    TrainingUser.username,
                    TrainingUser.full_name,
                    TrainingUser.total_points,
                    func.count(UserBadge.id).label("badges_count"),
                    func.count(UserProgress.id).filter(
                        UserProgress.status == ProgressStatus.COMPLETED
                    ).label("modules_completed")
                ).outerjoin(UserBadge, TrainingUser.id == UserBadge.user_id)
                .outerjoin(UserProgress, TrainingUser.id == UserProgress.user_id)
                .group_by(TrainingUser.id)
                .order_by(desc(TrainingUser.total_points))
                .limit(limit)
            )
        else:
            # Weekly leaderboard
            week_ago = datetime.utcnow() - timedelta(days=7)
            result = await db.execute(
                select(
                    TrainingUser.username,
                    TrainingUser.full_name,
                    func.coalesce(func.sum(UserBadge.points_earned), 0).label("weekly_points")
                ).outerjoin(
                    UserBadge, 
                    and_(
                        TrainingUser.id == UserBadge.user_id,
                        UserBadge.earned_at >= week_ago
                    )
                ).group_by(TrainingUser.id)
                .order_by(desc("weekly_points"))
                .limit(limit)
            )
        
        rankings = result.all()
        
        return [
            LeaderboardEntry(
                rank=idx + 1,
                username=ranking.username,
                full_name=ranking.full_name,
                total_points=getattr(ranking, 'total_points', getattr(ranking, 'weekly_points', 0)),
                badges_count=getattr(ranking, 'badges_count', 0),
                modules_completed=getattr(ranking, 'modules_completed', 0)
            ) for idx, ranking in enumerate(rankings)
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch leaderboard: {str(e)}")


# Analytics
@router.get("/analytics/{user_id}")
async def get_user_analytics(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get comprehensive user analytics"""
    try:
        # Get user stats
        user_result = await db.execute(select(TrainingUser).filter(TrainingUser.id == user_id))
        user = user_result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get progress stats
        progress_result = await db.execute(
            select(
                func.count(UserProgress.id).label("modules_started"),
                func.count(UserProgress.id).filter(
                    UserProgress.status == ProgressStatus.COMPLETED
                ).label("modules_completed"),
                func.avg(UserProgress.progress_percentage).label("avg_progress"),
                func.sum(UserProgress.time_spent_minutes).label("total_time")
            ).filter(UserProgress.user_id == user_id)
        )
        progress_stats = progress_result.first()
        
        # Get badge stats
        badge_result = await db.execute(
            select(
                func.count(UserBadge.id).label("total_badges"),
                func.sum(UserBadge.points_earned).label("total_badge_points")
            ).filter(UserBadge.user_id == user_id)
        )
        badge_stats = badge_result.first()
        
        return {
            "user_profile": {
                "username": user.username,
                "full_name": user.full_name,
                "experience_level": user.experience_level.value,
                "total_points": user.total_points,
                "current_streak": user.current_streak,
                "longest_streak": user.longest_streak
            },
            "progress_stats": {
                "modules_started": progress_stats.modules_started or 0,
                "modules_completed": progress_stats.modules_completed or 0,
                "average_progress": round(progress_stats.avg_progress or 0, 1),
                "total_time_hours": round((progress_stats.total_time or 0) / 60, 1)
            },
            "achievement_stats": {
                "total_badges": badge_stats.total_badges or 0,
                "badge_points": badge_stats.total_badge_points or 0,
                "completion_rate": round(
                    ((progress_stats.modules_completed or 0) / max(progress_stats.modules_started or 1, 1)) * 100, 1
                )
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch analytics: {str(e)}")


# Helper Functions
async def check_and_award_badges(user_id: str, module_id: str, db: AsyncSession):
    """Check if user qualifies for any badges and award them"""
    try:
        # Get module completion badge
        result = await db.execute(
            select(TrainingModule).options(selectinload(TrainingModule.badge))
            .filter(TrainingModule.id == module_id)
        )
        module = result.scalar_one_or_none()
        
        if module and module.badge:
            # Check if user already has this badge
            existing_badge = await db.execute(
                select(UserBadge).filter(
                    and_(UserBadge.user_id == user_id, UserBadge.badge_id == module.badge.id)
                )
            )
            
            if not existing_badge.scalar_one_or_none():
                # Award badge
                user_badge = UserBadge(
                    user_id=user_id,
                    badge_id=module.badge.id,
                    points_earned=module.badge.points_awarded,
                    evidence_data={"module_completed": module_id}
                )
                db.add(user_badge)
                
                # Update user points
                await award_points(user_id, module.badge.points_awarded, "badge_earned", db)
                
    except Exception as e:
        print(f"Badge award error: {e}")


async def award_points(user_id: str, points: int, reason: str, db: AsyncSession):
    """Award points to user"""
    try:
        result = await db.execute(select(TrainingUser).filter(TrainingUser.id == user_id))
        user = result.scalar_one_or_none()
        
        if user:
            user.total_points += points
            await db.commit()
            
    except Exception as e:
        print(f"Points award error: {e}")


def calculate_assessment_score(answers: Dict[str, Any], questions: List[Dict]) -> float:
    """Calculate assessment score based on answers"""
    # Simplified scoring - in real implementation this would be more sophisticated
    if not questions:
        return 0.0
    
    correct_answers = 0
    total_questions = len(questions)
    
    for i, question in enumerate(questions):
        question_id = str(i)
        if question_id in answers:
            # Simple correct answer checking
            if answers[question_id] == question.get("correct_answer"):
                correct_answers += 1
    
    return (correct_answers / total_questions) * 100 if total_questions > 0 else 0.0
