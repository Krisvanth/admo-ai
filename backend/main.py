from fastapi import FastAPI, HTTPException, Depends
from contextlib import asynccontextmanager
from database import init_db, get_session
from models import (
    School, User, Student, Class, Attendance, Fee, Timetable, Exam, Mark, 
    Communication, AIResource, ParentQuery, UserCreate, UserLogin, Token, SchoolCreate,
    LeaveRequest, LeaveStatus, LeaveRequestRead
)
from auth_utils import get_password_hash, verify_password, create_access_token
from typing import List
from datetime import datetime
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables
    await init_db()
    yield
    # Shutdown: (SQLAlchemy engine closes automatically usually, but we can add cleanup if needed)

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Admo AI API", lifespan=lifespan)

# CORS Configuration
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def read_root():
    return {"message": "Welcome to Admo AI API (PostgreSQL)", "status": "running"}

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
@app.post("/leaves/", response_model=LeaveRequest)
async def create_leave_request(leave: LeaveRequest, session: AsyncSession = Depends(get_session)):
    # Manual conversion of date fields if they are strings (fix for asyncpg error)
    if isinstance(leave.start_date, str):
        leave.start_date = datetime.strptime(leave.start_date, "%Y-%m-%d").date()
    if isinstance(leave.end_date, str):
        leave.end_date = datetime.strptime(leave.end_date, "%Y-%m-%d").date()
        
    session.add(leave)
    await session.commit()
    await session.refresh(leave)
    return leave

@app.get("/leaves/", response_model=List[LeaveRequestRead])
async def list_leaves(
    school_id: int, 
    teacher_id: int = None, 
    session: AsyncSession = Depends(get_session)
):
    # Join with User to get teacher name
    statement = select(LeaveRequest, User.name).join(User, LeaveRequest.teacher_id == User.id).where(LeaveRequest.school_id == school_id)
    
    if teacher_id:
        statement = statement.where(LeaveRequest.teacher_id == teacher_id)
    
    # Order by created_at desc
    statement = statement.order_by(LeaveRequest.created_at.desc())
    
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
    comment: str = None, 
    session: AsyncSession = Depends(get_session)
):
    leave = await session.get(LeaveRequest, leave_id)
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    leave.status = status
    if comment:
        leave.admin_comment = comment
        
    session.add(leave)
    await session.commit()
    await session.refresh(leave)
    return leave
