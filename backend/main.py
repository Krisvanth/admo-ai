from fastapi import FastAPI, HTTPException, Depends
from contextlib import asynccontextmanager
from database import init_db, get_session
from models import (
    School, User, Student, Class, Attendance, Fee, Timetable, Exam, Mark, 
    Communication, AIResource, ParentQuery, UserCreate, UserLogin, Token, SchoolCreate,
    LeaveRequest, LeaveStatus, LeaveRequestRead,
    TimeSlot, TimetableConfig, PeriodType, DEFAULT_TIMETABLE_CONFIG,
    ClassCreate, ClassRead, Subject, SubjectCreate, SubjectRead,
    TimetableEntry, TimetableEntryCreate, TimetableEntryRead, TimetableBulkUpdate
)
from auth_utils import get_password_hash, verify_password, create_access_token, get_current_user, require_role, TokenData
from typing import List, Optional
from datetime import datetime
from sqlmodel import select, and_, or_, SQLModel
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

# --- Timetable Configuration ---

class TimetableConfigUpdate(SQLModel):
    """Request model for updating timetable configuration"""
    working_days: Optional[List[str]] = None
    time_slots: Optional[List[dict]] = None

@app.get("/timetable-config/")
async def get_timetable_config(
    current_user: TokenData = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Get the timetable configuration for the current user's school"""
    statement = select(School).where(School.id == current_user.school_id)
    result = await session.execute(statement)
    school = result.scalars().first()
    
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    # Return timetable_config from settings, or default if not configured
    settings = school.settings or {}
    timetable_config = settings.get("timetable_config", DEFAULT_TIMETABLE_CONFIG)
    
    return timetable_config

@app.put("/timetable-config/")
async def update_timetable_config(
    config: TimetableConfigUpdate,
    current_user: TokenData = Depends(require_role(["PRINCIPAL", "ADMIN"])),
    session: AsyncSession = Depends(get_session)
):
    """Update the timetable configuration (Principal/Admin only)"""
    statement = select(School).where(School.id == current_user.school_id)
    result = await session.execute(statement)
    school = result.scalars().first()
    
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    # Initialize settings if None
    if school.settings is None:
        school.settings = {}
    
    # Get existing config or default
    import copy
    current_config = school.settings.get("timetable_config", copy.deepcopy(DEFAULT_TIMETABLE_CONFIG))
    
    # Validate and update working_days
    if config.working_days is not None:
        valid_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        for day in config.working_days:
            if day not in valid_days:
                raise HTTPException(status_code=400, detail=f"Invalid day: {day}")
        current_config["working_days"] = config.working_days
    
    # Validate and update time_slots
    if config.time_slots is not None:
        valid_period_types = ["regular", "break", "lunch", "assembly"]
        for slot in config.time_slots:
            if "slot_number" not in slot or "name" not in slot:
                raise HTTPException(status_code=400, detail="Each slot must have slot_number and name")
            if "start_time" not in slot or "end_time" not in slot:
                raise HTTPException(status_code=400, detail="Each slot must have start_time and end_time")
            if slot.get("period_type", "regular") not in valid_period_types:
                raise HTTPException(status_code=400, detail=f"Invalid period_type. Must be one of: {valid_period_types}")
        
        # Sort by slot_number
        config.time_slots.sort(key=lambda x: x["slot_number"])
        current_config["time_slots"] = config.time_slots
    
    # Update school settings
    school.settings["timetable_config"] = current_config
    
    # Force SQLAlchemy to detect the change in JSON field
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(school, "settings")
    
    await session.commit()
    await session.refresh(school)
    
    return school.settings["timetable_config"]

@app.post("/timetable-config/add-slot/")
async def add_time_slot(
    slot: dict,
    current_user: TokenData = Depends(require_role(["PRINCIPAL", "ADMIN"])),
    session: AsyncSession = Depends(get_session)
):
    """Add a new time slot to the timetable configuration"""
    statement = select(School).where(School.id == current_user.school_id)
    result = await session.execute(statement)
    school = result.scalars().first()
    
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    if school.settings is None:
        school.settings = {}
    
    import copy
    current_config = school.settings.get("timetable_config", copy.deepcopy(DEFAULT_TIMETABLE_CONFIG))
    
    # Validate slot
    required_fields = ["slot_number", "name", "start_time", "end_time"]
    for field in required_fields:
        if field not in slot:
            raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
    
    # Check for duplicate slot_number
    existing_numbers = [s["slot_number"] for s in current_config["time_slots"]]
    if slot["slot_number"] in existing_numbers:
        raise HTTPException(status_code=400, detail=f"Slot number {slot['slot_number']} already exists")
    
    # Add default period_type if not provided
    if "period_type" not in slot:
        slot["period_type"] = "regular"
    
    current_config["time_slots"].append(slot)
    current_config["time_slots"].sort(key=lambda x: x["slot_number"])
    
    school.settings["timetable_config"] = current_config
    
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(school, "settings")
    
    await session.commit()
    await session.refresh(school)
    
    return school.settings["timetable_config"]

@app.delete("/timetable-config/slot/{slot_number}")
async def delete_time_slot(
    slot_number: int,
    current_user: TokenData = Depends(require_role(["PRINCIPAL", "ADMIN"])),
    session: AsyncSession = Depends(get_session)
):
    """Delete a time slot from the timetable configuration"""
    statement = select(School).where(School.id == current_user.school_id)
    result = await session.execute(statement)
    school = result.scalars().first()
    
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    # Initialize settings if None
    if school.settings is None:
        school.settings = {}
    
    # Get existing config or initialize from default
    import copy
    current_config = school.settings.get("timetable_config", copy.deepcopy(DEFAULT_TIMETABLE_CONFIG))
    original_length = len(current_config["time_slots"])
    
    current_config["time_slots"] = [s for s in current_config["time_slots"] if s["slot_number"] != slot_number]
    
    if len(current_config["time_slots"]) == original_length:
        raise HTTPException(status_code=404, detail=f"Slot number {slot_number} not found")
    
    school.settings["timetable_config"] = current_config
    
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(school, "settings")
    
    await session.commit()
    await session.refresh(school)
    
    return school.settings["timetable_config"]

@app.put("/timetable-config/slot/{slot_number}")
async def update_time_slot(
    slot_number: int,
    slot_update: dict,
    current_user: TokenData = Depends(require_role(["PRINCIPAL", "ADMIN"])),
    session: AsyncSession = Depends(get_session)
):
    """Update a specific time slot"""
    statement = select(School).where(School.id == current_user.school_id)
    result = await session.execute(statement)
    school = result.scalars().first()
    
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    # Initialize settings if None
    if school.settings is None:
        school.settings = {}
    
    # Get existing config or initialize from default
    import copy
    current_config = school.settings.get("timetable_config", copy.deepcopy(DEFAULT_TIMETABLE_CONFIG))
    
    # Find and update the slot
    slot_found = False
    for i, slot in enumerate(current_config["time_slots"]):
        if slot["slot_number"] == slot_number:
            # Update only provided fields
            for key, value in slot_update.items():
                if key != "slot_number":  # Don't allow changing slot_number
                    current_config["time_slots"][i][key] = value
            slot_found = True
            break
    
    if not slot_found:
        raise HTTPException(status_code=404, detail=f"Slot number {slot_number} not found")
    
    school.settings["timetable_config"] = current_config
    
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(school, "settings")
    
    await session.commit()
    await session.refresh(school)
    
    return school.settings["timetable_config"]

@app.post("/timetable-config/reset/")
async def reset_timetable_config(
    current_user: TokenData = Depends(require_role(["PRINCIPAL", "ADMIN"])),
    session: AsyncSession = Depends(get_session)
):
    """Reset timetable configuration to defaults"""
    statement = select(School).where(School.id == current_user.school_id)
    result = await session.execute(statement)
    school = result.scalars().first()
    
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    if school.settings is None:
        school.settings = {}
    
    school.settings["timetable_config"] = DEFAULT_TIMETABLE_CONFIG.copy()
    
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(school, "settings")
    
    await session.commit()
    await session.refresh(school)
    
    return school.settings["timetable_config"]

# --- Classes Management ---
@app.get("/classes/", response_model=List[ClassRead])
async def list_classes(
    current_user: TokenData = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Get all classes for the school"""
    statement = select(Class).where(Class.school_id == current_user.school_id)
    result = await session.execute(statement)
    classes = result.scalars().all()
    
    # Enrich with teacher names
    class_reads = []
    for cls in classes:
        teacher_name = None
        if cls.class_teacher_id:
            teacher_stmt = select(User).where(User.id == cls.class_teacher_id)
            teacher_result = await session.execute(teacher_stmt)
            teacher = teacher_result.scalars().first()
            if teacher:
                teacher_name = teacher.name
        
        class_reads.append(ClassRead(
            id=cls.id,
            grade=cls.grade,
            section=cls.section,
            class_teacher_id=cls.class_teacher_id,
            class_teacher_name=teacher_name,
            created_at=cls.created_at
        ))
    
    return class_reads

@app.post("/classes/", response_model=ClassRead)
async def create_class(
    class_data: ClassCreate,
    current_user: TokenData = Depends(require_role(["PRINCIPAL", "ADMIN"])),
    session: AsyncSession = Depends(get_session)
):
    """Create a new class"""
    # Check if class already exists
    existing = await session.execute(
        select(Class).where(
            and_(
                Class.school_id == current_user.school_id,
                Class.grade == class_data.grade,
                Class.section == class_data.section
            )
        )
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail=f"Class {class_data.grade}-{class_data.section} already exists")
    
    new_class = Class(
        school_id=current_user.school_id,
        grade=class_data.grade,
        section=class_data.section,
        class_teacher_id=class_data.class_teacher_id
    )
    session.add(new_class)
    await session.commit()
    await session.refresh(new_class)
    
    # Get teacher name if assigned
    teacher_name = None
    if new_class.class_teacher_id:
        teacher_stmt = select(User).where(User.id == new_class.class_teacher_id)
        teacher_result = await session.execute(teacher_stmt)
        teacher = teacher_result.scalars().first()
        if teacher:
            teacher_name = teacher.name
    
    return ClassRead(
        id=new_class.id,
        grade=new_class.grade,
        section=new_class.section,
        class_teacher_id=new_class.class_teacher_id,
        class_teacher_name=teacher_name,
        created_at=new_class.created_at
    )

@app.put("/classes/{class_id}", response_model=ClassRead)
async def update_class(
    class_id: int,
    class_data: ClassCreate,
    current_user: TokenData = Depends(require_role(["PRINCIPAL", "ADMIN"])),
    session: AsyncSession = Depends(get_session)
):
    """Update a class (including assigning class teacher)"""
    statement = select(Class).where(
        and_(Class.id == class_id, Class.school_id == current_user.school_id)
    )
    result = await session.execute(statement)
    cls = result.scalars().first()
    
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    cls.grade = class_data.grade
    cls.section = class_data.section
    cls.class_teacher_id = class_data.class_teacher_id
    
    await session.commit()
    await session.refresh(cls)
    
    # Get teacher name if assigned
    teacher_name = None
    if cls.class_teacher_id:
        teacher_stmt = select(User).where(User.id == cls.class_teacher_id)
        teacher_result = await session.execute(teacher_stmt)
        teacher = teacher_result.scalars().first()
        if teacher:
            teacher_name = teacher.name
    
    return ClassRead(
        id=cls.id,
        grade=cls.grade,
        section=cls.section,
        class_teacher_id=cls.class_teacher_id,
        class_teacher_name=teacher_name,
        created_at=cls.created_at
    )

@app.delete("/classes/{class_id}")
async def delete_class(
    class_id: int,
    current_user: TokenData = Depends(require_role(["PRINCIPAL", "ADMIN"])),
    session: AsyncSession = Depends(get_session)
):
    """Delete a class"""
    statement = select(Class).where(
        and_(Class.id == class_id, Class.school_id == current_user.school_id)
    )
    result = await session.execute(statement)
    cls = result.scalars().first()
    
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    await session.delete(cls)
    await session.commit()
    
    return {"message": "Class deleted successfully"}

# --- Subjects Management ---
@app.get("/subjects/", response_model=List[SubjectRead])
async def list_subjects(
    current_user: TokenData = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Get all subjects for the school"""
    statement = select(Subject).where(Subject.school_id == current_user.school_id)
    result = await session.execute(statement)
    subjects = result.scalars().all()
    return [SubjectRead(
        id=s.id,
        name=s.name,
        code=s.code,
        created_at=s.created_at
    ) for s in subjects]

@app.post("/subjects/", response_model=SubjectRead)
async def create_subject(
    subject_data: SubjectCreate,
    current_user: TokenData = Depends(require_role(["PRINCIPAL", "ADMIN"])),
    session: AsyncSession = Depends(get_session)
):
    """Create a new subject"""
    # Check if subject with same name exists
    existing = await session.execute(
        select(Subject).where(
            and_(
                Subject.school_id == current_user.school_id,
                Subject.name == subject_data.name
            )
        )
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail=f"Subject '{subject_data.name}' already exists")
    
    new_subject = Subject(
        school_id=current_user.school_id,
        name=subject_data.name,
        code=subject_data.code
    )
    session.add(new_subject)
    await session.commit()
    await session.refresh(new_subject)
    
    return SubjectRead(
        id=new_subject.id,
        name=new_subject.name,
        code=new_subject.code,
        created_at=new_subject.created_at
    )

@app.put("/subjects/{subject_id}", response_model=SubjectRead)
async def update_subject(
    subject_id: int,
    subject_data: SubjectCreate,
    current_user: TokenData = Depends(require_role(["PRINCIPAL", "ADMIN"])),
    session: AsyncSession = Depends(get_session)
):
    """Update a subject"""
    statement = select(Subject).where(
        and_(Subject.id == subject_id, Subject.school_id == current_user.school_id)
    )
    result = await session.execute(statement)
    subject = result.scalars().first()
    
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    subject.name = subject_data.name
    subject.code = subject_data.code
    
    await session.commit()
    await session.refresh(subject)
    
    return SubjectRead(
        id=subject.id,
        name=subject.name,
        code=subject.code,
        created_at=subject.created_at
    )

@app.delete("/subjects/{subject_id}")
async def delete_subject(
    subject_id: int,
    current_user: TokenData = Depends(require_role(["PRINCIPAL", "ADMIN"])),
    session: AsyncSession = Depends(get_session)
):
    """Delete a subject"""
    statement = select(Subject).where(
        and_(Subject.id == subject_id, Subject.school_id == current_user.school_id)
    )
    result = await session.execute(statement)
    subject = result.scalars().first()
    
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    await session.delete(subject)
    await session.commit()
    
    return {"message": "Subject deleted successfully"}

# --- Teachers List (for assigning class teachers) ---
@app.get("/teachers/")
async def list_teachers(
    current_user: TokenData = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Get all teachers for the school"""
    from models import UserRole
    statement = select(User).where(
        and_(
            User.school_id == current_user.school_id,
            User.role == UserRole.TEACHER
        )
    )
    result = await session.execute(statement)
    teachers = result.scalars().all()
    return [{"id": t.id, "name": t.name, "email": t.email} for t in teachers]

# --- Timetable Entries (Class-wise period assignments) ---
@app.get("/timetable-entries/")
async def get_timetable_entries(
    class_id: int,
    current_user: TokenData = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Get all timetable entries for a specific class"""
    # Verify the class belongs to the user's school
    class_statement = select(Class).where(
        and_(Class.id == class_id, Class.school_id == current_user.school_id)
    )
    class_result = await session.execute(class_statement)
    cls = class_result.scalars().first()
    
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    class_name = f"{cls.grade}-{cls.section}"
    
    # Get all entries for this class
    statement = select(TimetableEntry).where(
        and_(
            TimetableEntry.class_id == class_id,
            TimetableEntry.school_id == current_user.school_id
        )
    )
    result = await session.execute(statement)
    entries = result.scalars().all()
    
    # Fetch subjects and teachers to populate names
    subject_ids = [e.subject_id for e in entries if e.subject_id]
    teacher_ids = [e.teacher_id for e in entries if e.teacher_id]
    
    subjects_map = {}
    teachers_map = {}
    
    if subject_ids:
        subj_statement = select(Subject).where(Subject.id.in_(subject_ids))
        subj_result = await session.execute(subj_statement)
        subjects_map = {s.id: s.name for s in subj_result.scalars().all()}
    
    if teacher_ids:
        teacher_statement = select(User).where(User.id.in_(teacher_ids))
        teacher_result = await session.execute(teacher_statement)
        teachers_map = {t.id: t.name for t in teacher_result.scalars().all()}
    
    return [
        TimetableEntryRead(
            id=e.id,
            class_id=e.class_id,
            class_name=class_name,
            day=e.day,
            slot_number=e.slot_number,
            subject_id=e.subject_id,
            subject_name=subjects_map.get(e.subject_id) if e.subject_id else None,
            teacher_id=e.teacher_id,
            teacher_name=teachers_map.get(e.teacher_id) if e.teacher_id else None
        )
        for e in entries
    ]

# Get timetable entries for a specific teacher (for My View)
@app.get("/timetable-entries/teacher/")
async def get_teacher_timetable_entries(
    teacher_id: Optional[int] = None,
    current_user: TokenData = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Get all timetable entries for a specific teacher.
    If teacher_id is not provided, returns entries for the current user.
    """
    from models import UserRole
    
    # Determine which teacher to fetch entries for
    target_teacher_id = teacher_id if teacher_id else current_user.user_id
    
    # Only principals can view other teachers' schedules
    if teacher_id and teacher_id != current_user.user_id:
        if current_user.role not in [UserRole.PRINCIPAL.value, UserRole.ADMIN.value]:
            raise HTTPException(status_code=403, detail="Access denied. You can only view your own schedule.")
    
    # Get all entries for this teacher
    statement = select(TimetableEntry).where(
        and_(
            TimetableEntry.teacher_id == target_teacher_id,
            TimetableEntry.school_id == current_user.school_id
        )
    )
    result = await session.execute(statement)
    entries = result.scalars().all()
    
    # Fetch class, subject info
    class_ids = list(set([e.class_id for e in entries]))
    subject_ids = [e.subject_id for e in entries if e.subject_id]
    
    classes_map = {}
    subjects_map = {}
    
    if class_ids:
        class_statement = select(Class).where(Class.id.in_(class_ids))
        class_result = await session.execute(class_statement)
        classes_map = {c.id: f"{c.grade}-{c.section}" for c in class_result.scalars().all()}
    
    if subject_ids:
        subj_statement = select(Subject).where(Subject.id.in_(subject_ids))
        subj_result = await session.execute(subj_statement)
        subjects_map = {s.id: s.name for s in subj_result.scalars().all()}
    
    # Get teacher name
    teacher = await session.get(User, target_teacher_id)
    teacher_name = teacher.name if teacher else None
    
    return [
        TimetableEntryRead(
            id=e.id,
            class_id=e.class_id,
            class_name=classes_map.get(e.class_id),
            day=e.day,
            slot_number=e.slot_number,
            subject_id=e.subject_id,
            subject_name=subjects_map.get(e.subject_id) if e.subject_id else None,
            teacher_id=e.teacher_id,
            teacher_name=teacher_name
        )
        for e in entries
    ]

@app.post("/timetable-entries/")
async def create_or_update_timetable_entry(
    entry_data: TimetableEntryCreate,
    current_user: TokenData = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Create or update a single timetable entry.
    Principal/Admin can edit any class. Teachers can only edit their assigned class.
    """
    from models import UserRole
    
    # Check if user has permission to edit this class
    if current_user.role == UserRole.TEACHER.value:
        # Teacher can only edit if they are the class teacher
        class_statement = select(Class).where(
            and_(
                Class.id == entry_data.class_id,
                Class.school_id == current_user.school_id,
                Class.class_teacher_id == current_user.user_id
            )
        )
        class_result = await session.execute(class_statement)
        cls = class_result.scalars().first()
        
        if not cls:
            raise HTTPException(
                status_code=403, 
                detail="Access denied. You can only edit timetable for your assigned class."
            )
    elif current_user.role not in [UserRole.PRINCIPAL.value, UserRole.ADMIN.value]:
        raise HTTPException(status_code=403, detail="Access denied.")
    # Check if entry already exists for this class/day/slot
    statement = select(TimetableEntry).where(
        and_(
            TimetableEntry.school_id == current_user.school_id,
            TimetableEntry.class_id == entry_data.class_id,
            TimetableEntry.day == entry_data.day,
            TimetableEntry.slot_number == entry_data.slot_number
        )
    )
    result = await session.execute(statement)
    existing_entry = result.scalars().first()
    
    if existing_entry:
        # Update existing entry
        existing_entry.subject_id = entry_data.subject_id
        existing_entry.teacher_id = entry_data.teacher_id
        existing_entry.updated_at = datetime.utcnow()
        await session.commit()
        await session.refresh(existing_entry)
        entry = existing_entry
    else:
        # Create new entry
        entry = TimetableEntry(
            school_id=current_user.school_id,
            class_id=entry_data.class_id,
            day=entry_data.day,
            slot_number=entry_data.slot_number,
            subject_id=entry_data.subject_id,
            teacher_id=entry_data.teacher_id
        )
        session.add(entry)
        await session.commit()
        await session.refresh(entry)
    
    # Get subject and teacher names
    subject_name = None
    teacher_name = None
    
    if entry.subject_id:
        subj = await session.get(Subject, entry.subject_id)
        subject_name = subj.name if subj else None
    
    if entry.teacher_id:
        teacher = await session.get(User, entry.teacher_id)
        teacher_name = teacher.name if teacher else None
    
    return TimetableEntryRead(
        id=entry.id,
        class_id=entry.class_id,
        day=entry.day,
        slot_number=entry.slot_number,
        subject_id=entry.subject_id,
        subject_name=subject_name,
        teacher_id=entry.teacher_id,
        teacher_name=teacher_name
    )

@app.put("/timetable-entries/bulk")
async def bulk_update_timetable_entries(
    bulk_data: TimetableBulkUpdate,
    current_user: TokenData = Depends(require_role(["PRINCIPAL", "ADMIN"])),
    session: AsyncSession = Depends(get_session)
):
    """Bulk update timetable entries for a class"""
    if not bulk_data.entries:
        return {"message": "No entries to update"}
    
    results = []
    
    for entry_data in bulk_data.entries:
        # Check if entry already exists
        statement = select(TimetableEntry).where(
            and_(
                TimetableEntry.school_id == current_user.school_id,
                TimetableEntry.class_id == entry_data.class_id,
                TimetableEntry.day == entry_data.day,
                TimetableEntry.slot_number == entry_data.slot_number
            )
        )
        result = await session.execute(statement)
        existing_entry = result.scalars().first()
        
        if existing_entry:
            existing_entry.subject_id = entry_data.subject_id
            existing_entry.teacher_id = entry_data.teacher_id
            existing_entry.updated_at = datetime.utcnow()
        else:
            new_entry = TimetableEntry(
                school_id=current_user.school_id,
                class_id=entry_data.class_id,
                day=entry_data.day,
                slot_number=entry_data.slot_number,
                subject_id=entry_data.subject_id,
                teacher_id=entry_data.teacher_id
            )
            session.add(new_entry)
    
    await session.commit()
    return {"message": f"Updated {len(bulk_data.entries)} timetable entries"}

@app.delete("/timetable-entries/{entry_id}")
async def delete_timetable_entry(
    entry_id: int,
    current_user: TokenData = Depends(require_role(["PRINCIPAL", "ADMIN"])),
    session: AsyncSession = Depends(get_session)
):
    """Delete a timetable entry"""
    statement = select(TimetableEntry).where(
        and_(
            TimetableEntry.id == entry_id,
            TimetableEntry.school_id == current_user.school_id
        )
    )
    result = await session.execute(statement)
    entry = result.scalars().first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Timetable entry not found")
    
    await session.delete(entry)
    await session.commit()
    
    return {"message": "Timetable entry deleted successfully"}

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
    current_user: TokenData = Depends(require_role("PRINCIPAL", "ADMIN"))  # Only principal/admin
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

