from fastapi import FastAPI, HTTPException, Depends
from contextlib import asynccontextmanager
from database import init_db, get_session
from models import (
    School, User, Student, Class, Attendance, Fee, Timetable, Exam, Mark, 
    Communication, AIResource, ParentQuery, UserCreate, UserLogin, Token, SchoolCreate,
    LeaveRequest, LeaveStatus, LeaveRequestRead
)
from auth_utils import get_password_hash, verify_password, create_access_token, get_current_user, require_role, TokenData
from typing import List, Optional
from datetime import datetime
from sqlmodel import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables
    await init_db()
    yield
    # Shutdown: (SQLAlchemy engine closes automatically usually, but we can add cleanup if needed)

from fastapi.middleware.cors import CORSMiddleware
from config import settings

app = FastAPI(
    title=settings.APP_NAME,
    description="School Management Platform API",
    version="1.0.0",
    lifespan=lifespan,
    debug=settings.DEBUG
)

# CORS Configuration from environment
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS_LIST,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def read_root():
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "status": "running",
        "environment": settings.APP_ENV
    }

# --- Authentication ---

@app.post("/auth/signup", response_model=User)
async def signup(user: UserCreate, session: AsyncSession = Depends(get_session)):
    # Check if user exists
    statement = select(User).where(User.email == user.email)
    result = await session.execute(statement)
    existing_user = result.scalars().first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = get_password_hash(user.password)
    
    # Create User object
    user_db = User(
        school_id=user.school_id,
        name=user.name,
        email=user.email,
        password_hash=hashed_password,
        role=user.role
    )
    
    session.add(user_db)
    await session.commit()
    await session.refresh(user_db)
    return user_db

@app.post("/auth/login", response_model=Token)
async def login(user_credentials: UserLogin, session: AsyncSession = Depends(get_session)):
    # Find user
    statement = select(User).where(User.email == user_credentials.email)
    result = await session.execute(statement)
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    if not verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Generate Token
    access_token = create_access_token(
        data={"sub": str(user.email), "role": user.role, "school_id": user.school_id, "user_id": user.id}
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

# --- Users (Teachers/Principals) ---
@app.get("/users/", response_model=List[User])
async def list_users(session: AsyncSession = Depends(get_session)):
    statement = select(User)
    result = await session.execute(statement)
    return result.scalars().all()

# --- Classes ---
@app.post("/classes/", response_model=Class)
async def create_class(class_obj: Class, session: AsyncSession = Depends(get_session)):
    session.add(class_obj)
    await session.commit()
    await session.refresh(class_obj)
    return class_obj

@app.get("/classes/", response_model=List[Class])
async def list_classes(session: AsyncSession = Depends(get_session)):
    statement = select(Class)
    result = await session.execute(statement)
    return result.scalars().all()

# --- Students ---
@app.post("/students/", response_model=Student)
async def create_student(student: Student, session: AsyncSession = Depends(get_session)):
    session.add(student)
    await session.commit()
    await session.refresh(student)
    return student

@app.get("/students/", response_model=List[Student])
async def list_students(session: AsyncSession = Depends(get_session)):
    statement = select(Student)
    result = await session.execute(statement)
    return result.scalars().all()

# --- Attendance ---
@app.post("/attendance/", response_model=Attendance)
async def mark_attendance(attendance: Attendance, session: AsyncSession = Depends(get_session)):
    session.add(attendance)
    await session.commit()
    await session.refresh(attendance)
    return attendance

@app.get("/attendance/", response_model=List[Attendance])
async def get_attendance(session: AsyncSession = Depends(get_session)):
    statement = select(Attendance)
    result = await session.execute(statement)
    return result.scalars().all()

# --- Fees ---
@app.post("/fees/", response_model=Fee)
async def create_fee(fee: Fee, session: AsyncSession = Depends(get_session)):
    session.add(fee)
    await session.commit()
    await session.refresh(fee)
    return fee

@app.get("/fees/", response_model=List[Fee])
async def list_fees(session: AsyncSession = Depends(get_session)):
    statement = select(Fee)
    result = await session.execute(statement)
    return result.scalars().all()

# --- Timetables ---
@app.post("/timetables/", response_model=Timetable)
async def create_timetable(timetable: Timetable, session: AsyncSession = Depends(get_session)):
    session.add(timetable)
    await session.commit()
    await session.refresh(timetable)
    return timetable

@app.get("/timetables/", response_model=List[Timetable])
async def list_timetables(session: AsyncSession = Depends(get_session)):
    statement = select(Timetable)
    result = await session.execute(statement)
    return result.scalars().all()

# --- Exams & Marks ---
@app.post("/exams/", response_model=Exam)
async def create_exam(exam: Exam, session: AsyncSession = Depends(get_session)):
    session.add(exam)
    await session.commit()
    await session.refresh(exam)
    return exam

@app.get("/exams/", response_model=List[Exam])
async def list_exams(session: AsyncSession = Depends(get_session)):
    statement = select(Exam)
    result = await session.execute(statement)
    return result.scalars().all()

@app.post("/marks/", response_model=Mark)
async def submit_mark(mark: Mark, session: AsyncSession = Depends(get_session)):
    session.add(mark)
    await session.commit()
    await session.refresh(mark)
    return mark

@app.get("/marks/", response_model=List[Mark])
async def list_marks(session: AsyncSession = Depends(get_session)):
    statement = select(Mark)
    result = await session.execute(statement)
    return result.scalars().all()

# --- Communications & AI ---
@app.post("/communications/", response_model=Communication)
async def send_communication(comm: Communication, session: AsyncSession = Depends(get_session)):
    session.add(comm)
    await session.commit()
    await session.refresh(comm)
    return comm

@app.get("/communications/", response_model=List[Communication])
async def list_communications(session: AsyncSession = Depends(get_session)):
    statement = select(Communication)
    result = await session.execute(statement)
    return result.scalars().all()

@app.post("/ai-resources/", response_model=AIResource)
async def create_ai_resource(resource: AIResource, session: AsyncSession = Depends(get_session)):
    session.add(resource)
    await session.commit()
    await session.refresh(resource)
    return resource

@app.get("/ai-resources/", response_model=List[AIResource])
async def list_ai_resources(session: AsyncSession = Depends(get_session)):
    statement = select(AIResource)
    result = await session.execute(statement)
    return result.scalars().all()

@app.post("/parent-queries/", response_model=ParentQuery)
async def create_query(query: ParentQuery, session: AsyncSession = Depends(get_session)):
    session.add(query)
    await session.commit()
    await session.refresh(query)
    return query

@app.get("/parent-queries/", response_model=List[ParentQuery])
async def list_queries(session: AsyncSession = Depends(get_session)):
    statement = select(ParentQuery)
    result = await session.execute(statement)
    return result.scalars().all()

# --- Schools ---
@app.post("/schools/", response_model=School)
async def create_school(school_in: SchoolCreate, session: AsyncSession = Depends(get_session)):
    school = School.model_validate(school_in)
    session.add(school)
    await session.commit()
    await session.refresh(school)
    return school

@app.get("/schools/", response_model=List[School])
async def list_schools(session: AsyncSession = Depends(get_session)):
    statement = select(School)
    result = await session.execute(statement)
    return result.scalars().all()

# --- Leave Requests ---

# Pydantic model for creating leave (separate from DB model)
from pydantic import BaseModel, Field as PydanticField

class LeaveCreate(BaseModel):
    start_date: str  # Accept as string, convert in endpoint
    end_date: str
    reason: str
    hours: Optional[int] = PydanticField(default=None, ge=1, le=24)  # Validate 1-24
    teacher_comment: Optional[str] = None

@app.post("/leaves/", response_model=LeaveRequest)
async def create_leave_request(
    leave_data: LeaveCreate, 
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)  # Require authentication
):
    """Create a new leave request. Teachers can only create requests for themselves."""
    
    # Convert date strings to date objects
    try:
        start_date = datetime.strptime(leave_data.start_date, "%Y-%m-%d").date()
        end_date = datetime.strptime(leave_data.end_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Validate dates
    today = datetime.now().date()
    if start_date < today:
        raise HTTPException(status_code=400, detail="Start date cannot be in the past")
    if end_date < start_date:
        raise HTTPException(status_code=400, detail="End date cannot be before start date")
    
    # Check for overlapping leave requests for the same teacher
    overlap_statement = select(LeaveRequest).where(
        and_(
            LeaveRequest.teacher_id == current_user.user_id,
            LeaveRequest.status.in_([LeaveStatus.Pending, LeaveStatus.Approved]),
            or_(
                # New leave starts during existing leave
                and_(LeaveRequest.start_date <= start_date, LeaveRequest.end_date >= start_date),
                # New leave ends during existing leave
                and_(LeaveRequest.start_date <= end_date, LeaveRequest.end_date >= end_date),
                # New leave completely contains existing leave
                and_(start_date <= LeaveRequest.start_date, end_date >= LeaveRequest.end_date)
            )
        )
    )
    result = await session.execute(overlap_statement)
    overlapping = result.scalars().first()
    
    if overlapping:
        raise HTTPException(
            status_code=400, 
            detail=f"Overlapping leave request exists from {overlapping.start_date} to {overlapping.end_date}"
        )
    
    # Create leave with authenticated user's info (can only create for self)
    leave = LeaveRequest(
        school_id=current_user.school_id,
        teacher_id=current_user.user_id,  # Always use current user's ID
        start_date=start_date,
        end_date=end_date,
        reason=leave_data.reason,
        hours=leave_data.hours,
        teacher_comment=leave_data.teacher_comment,
        status=LeaveStatus.Pending
    )
    
    session.add(leave)
    await session.commit()
    await session.refresh(leave)
    return leave

@app.get("/leaves/", response_model=List[LeaveRequestRead])
async def list_leaves(
    teacher_id: Optional[int] = None, 
    status_filter: Optional[LeaveStatus] = None,
    limit: int = 50,  # Pagination
    offset: int = 0,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)  # Require authentication
):
    """
    List leave requests. 
    - Principals see all leaves for their school
    - Teachers see only their own leaves
    """
    # Build base query with school_id from current user
    statement = select(LeaveRequest, User.name).join(
        User, LeaveRequest.teacher_id == User.id
    ).where(LeaveRequest.school_id == current_user.school_id)
    
    # Role-based filtering
    if current_user.role == "teacher":
        # Teachers can only see their own leaves
        statement = statement.where(LeaveRequest.teacher_id == current_user.user_id)
    elif teacher_id:
        # Principals can filter by specific teacher
        statement = statement.where(LeaveRequest.teacher_id == teacher_id)
    
    # Optional status filter
    if status_filter:
        statement = statement.where(LeaveRequest.status == status_filter)
    
    # Order by created_at desc and apply pagination
    statement = statement.order_by(LeaveRequest.created_at.desc()).offset(offset).limit(limit)
    
    result = await session.execute(statement)
    rows = result.all()
    
    # Construct response with teacher_name
    leaves = []
    for leave, teacher_name in rows:
        leave_dict = leave.model_dump()
        leave_dict["teacher_name"] = teacher_name
        leave_read = LeaveRequestRead.model_validate(leave_dict)
        leaves.append(leave_read)
        
    return leaves

@app.put("/leaves/{leave_id}", response_model=LeaveRequest)
async def update_leave_status(
    leave_id: int, 
    status: LeaveStatus, 
    comment: Optional[str] = None, 
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)  # Require authentication
):
    """
    Update leave status.
    - Principals can approve/reject any leave in their school
    - Teachers can only cancel their own pending/approved leaves
    """
    leave = await session.get(LeaveRequest, leave_id)
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    # Verify same school
    if leave.school_id != current_user.school_id:
        raise HTTPException(status_code=403, detail="Access denied. Leave belongs to different school")
    
    # Authorization logic
    if current_user.role == "teacher":
        # Teachers can only cancel their own leaves
        if leave.teacher_id != current_user.user_id:
            raise HTTPException(status_code=403, detail="Access denied. You can only modify your own leaves")
        
        if status != LeaveStatus.Cancelled:
            raise HTTPException(status_code=403, detail="Teachers can only cancel leaves, not approve/reject")
        
        if leave.status not in [LeaveStatus.Pending, LeaveStatus.Approved]:
            raise HTTPException(status_code=400, detail="Can only cancel pending or approved leaves")
    
    elif current_user.role == "principal":
        # Principals can approve/reject/cancel
        # Validate status transitions
        if leave.status == LeaveStatus.Cancelled:
            raise HTTPException(status_code=400, detail="Cannot modify a cancelled leave")
        
        if leave.status == LeaveStatus.Rejected and status == LeaveStatus.Approved:
            # Allow re-approval of rejected leaves (principal might reconsider)
            pass
    else:
        # Admin or other roles - allow all for now
        pass
    
    # Update status
    leave.status = status
    if comment:
        leave.admin_comment = comment
        
    session.add(leave)
    await session.commit()
    await session.refresh(leave)
    return leave

@app.delete("/leaves/{leave_id}")
async def delete_leave_request(
    leave_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(require_role("principal", "admin"))  # Only principal/admin
):
    """Delete a leave request. Only principals and admins can delete."""
    leave = await session.get(LeaveRequest, leave_id)
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    # Verify same school
    if leave.school_id != current_user.school_id:
        raise HTTPException(status_code=403, detail="Access denied. Leave belongs to different school")
    
    await session.delete(leave)
    await session.commit()
    return {"message": "Leave request deleted successfully"}

