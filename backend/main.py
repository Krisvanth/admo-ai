from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.responses import StreamingResponse
from contextlib import asynccontextmanager
from database import init_db, get_session
from models import (
    School, User, Student, Class, Attendance, Fee, Timetable, Exam, Mark, 
    Communication, AIResource, ParentQuery, UserCreate, UserLogin, Token, SchoolCreate,
    LeaveRequest, LeaveStatus, LeaveRequestRead, ActivityLog,
    TimeSlot, TimetableConfig, PeriodType, DEFAULT_TIMETABLE_CONFIG,
    ClassCreate, ClassRead, Subject, SubjectCreate, SubjectRead,
    TimetableEntry, TimetableEntryCreate, TimetableEntryRead, TimetableBulkUpdate,
    StudentCreate, StudentUpdate, StudentRead, StudentBulkCreate, StudentPaginatedResponse, Gender, BloodGroup,
    ExamCreate, ExamUpdate, ExamRead, ExamTimetableEntry, ExamTimetableEntryCreate, 
    ExamTimetableEntryUpdate, ExamTimetableEntryRead, ExamStatus,
    MarkStatus, MarkCreate, MarkUpdate, MarkBulkEntry, MarkRead, 
    MarksEntryResponse, MarksPublishRequest, MarksSummary
)
from auth_utils import get_password_hash, verify_password, create_access_token, get_current_user, require_role, TokenData
from typing import List, Optional
from datetime import datetime, date
from sqlmodel import select, and_, or_, SQLModel
from sqlalchemy.ext.asyncio import AsyncSession
import csv
import io
import tempfile
import os

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
        role=user.role,
        date_of_birth=user.date_of_birth,
        assigned_classes=user.assigned_classes
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
        data={"sub": str(user.email), "role": user.role, "school_id": user.school_id, "user_id": user.id, "name": user.name}
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

# --- Users (Teachers/Principals) ---
@app.get("/users/", response_model=List[User])
async def list_users(session: AsyncSession = Depends(get_session)):
    statement = select(User)
    result = await session.execute(statement)
    return result.scalars().all()

# --- Students ---

# Helper function to parse dates in multiple formats
def parse_date_flexible(date_str: str) -> date:
    """
    Parse a date string in various formats.
    Supports: YYYY-MM-DD, DD-MM-YYYY, MM/DD/YYYY, DD/MM/YYYY, etc.
    """
    if not date_str:
        return None
    
    date_str = date_str.strip()
    
    # List of common date formats to try
    formats = [
        '%Y-%m-%d',      # 2010-05-15
        '%d-%m-%Y',      # 15-05-2010
        '%m/%d/%Y',      # 05/15/2010 (US format)
        '%d/%m/%Y',      # 15/05/2010 (UK/Indian format)
        '%Y/%m/%d',      # 2010/05/15
        '%d.%m.%Y',      # 15.05.2010
        '%m-%d-%Y',      # 05-15-2010
        '%d %b %Y',      # 15 May 2010
        '%d %B %Y',      # 15 May 2010
        '%b %d, %Y',     # May 15, 2010
        '%B %d, %Y',     # May 15, 2010
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            continue
    
    # If no format matches, raise error with helpful message
    raise ValueError(f"Could not parse date '{date_str}'. Supported formats: YYYY-MM-DD, DD-MM-YYYY, MM/DD/YYYY, DD/MM/YYYY")

# Helper function to check if teacher has access to a class
async def check_teacher_class_access(user: TokenData, class_id: int, session: AsyncSession) -> bool:
    """Check if a teacher has access to a specific class"""
    if user.role == "PRINCIPAL":
        return True
    
    # Get teacher's assigned classes
    statement = select(User).where(User.id == user.user_id)
    result = await session.execute(statement)
    teacher = result.scalars().first()
    
    if not teacher or not teacher.assigned_classes:
        return False
    
    # assigned_classes contains class IDs as strings
    return str(class_id) in teacher.assigned_classes

# Helper to build StudentRead with class_name
async def build_student_read(student: Student, session: AsyncSession) -> StudentRead:
    """Convert Student to StudentRead with class_name populated"""
    # Get class info
    class_statement = select(Class).where(Class.id == student.class_id)
    class_result = await session.execute(class_statement)
    class_obj = class_result.scalars().first()
    class_name = f"{class_obj.grade}-{class_obj.section}" if class_obj else None
    
    return StudentRead(
        id=student.id,
        admission_number=student.admission_number,
        name=student.name,
        date_of_birth=student.date_of_birth,
        gender=student.gender,
        class_id=student.class_id,
        class_name=class_name,
        roll_no=student.roll_no,
        address=student.address,
        father_name=student.father_name,
        mother_name=student.mother_name,
        father_occupation=student.father_occupation,
        mother_occupation=student.mother_occupation,
        annual_income=student.annual_income,
        contact_number=student.contact_number,
        parent_email=student.parent_email,
        blood_group=student.blood_group,
        date_of_admission=student.date_of_admission,
        is_active=student.is_active,
        created_at=student.created_at
    )

@app.post("/students/", response_model=StudentRead)
async def create_student(
    student_data: StudentCreate,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """Create a new student. Principal can create for any class, Teacher only for assigned classes."""
    # Check class access for teachers
    if current_user.role == "TEACHER":
        has_access = await check_teacher_class_access(current_user, student_data.class_id, session)
        if not has_access:
            raise HTTPException(status_code=403, detail="You don't have access to this class")
    
    # Check if admission number already exists in this school
    statement = select(Student).where(
        and_(
            Student.school_id == current_user.school_id,
            Student.admission_number == student_data.admission_number
        )
    )
    result = await session.execute(statement)
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Admission number already exists in this school")
    
    # Check if roll number already exists in this class
    statement = select(Student).where(
        and_(
            Student.school_id == current_user.school_id,
            Student.class_id == student_data.class_id,
            Student.roll_no == student_data.roll_no
        )
    )
    result = await session.execute(statement)
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Roll number already exists in this class")
    
    # Create student
    student = Student(
        school_id=current_user.school_id,
        admission_number=student_data.admission_number,
        name=student_data.name,
        date_of_birth=student_data.date_of_birth,
        gender=student_data.gender,
        class_id=student_data.class_id,
        roll_no=student_data.roll_no,
        address=student_data.address,
        father_name=student_data.father_name,
        mother_name=student_data.mother_name,
        father_occupation=student_data.father_occupation,
        mother_occupation=student_data.mother_occupation,
        annual_income=student_data.annual_income,
        contact_number=student_data.contact_number,
        parent_email=student_data.parent_email,
        blood_group=student_data.blood_group,
        date_of_admission=student_data.date_of_admission or date.today()
    )
    
    session.add(student)
    await session.commit()
    await session.refresh(student)
    
    # Log activity
    activity = ActivityLog(
        school_id=current_user.school_id,
        user_id=current_user.user_id,
        action="student_added",
        description=f"Added new student: {student.name}",
        entity_type="student",
        entity_id=student.id
    )
    session.add(activity)
    await session.commit()
    
    return await build_student_read(student, session)

@app.get("/students/", response_model=StudentPaginatedResponse)
async def list_students(
    class_id: Optional[int] = None,
    is_active: bool = True,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """
    List students with pagination. 
    - Principal: Can see all students, optionally filtered by class
    - Teacher: Can see all students (read-only), but can only edit assigned classes
    """
    from sqlalchemy import func, or_
    
    # Build base query - both Principal and Teacher can view all students
    conditions = [Student.school_id == current_user.school_id, Student.is_active == is_active]
    
    # Filter by class if provided
    if class_id:
        conditions.append(Student.class_id == class_id)
    
    # Search filter
    if search:
        search_term = f"%{search}%"
        conditions.append(
            or_(
                Student.name.ilike(search_term),
                Student.admission_number.ilike(search_term),
                Student.roll_no.ilike(search_term),
                Student.father_name.ilike(search_term)
            )
        )
    
    # Get total count
    count_stmt = select(func.count(Student.id)).where(and_(*conditions))
    total_result = await session.execute(count_stmt)
    total = total_result.scalar() or 0
    
    # Calculate pagination
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    offset = (page - 1) * page_size
    
    # Get paginated results
    statement = select(Student).where(and_(*conditions)).order_by(Student.roll_no).offset(offset).limit(page_size)
    result = await session.execute(statement)
    students = result.scalars().all()
    
    # Build response with class names
    items = [await build_student_read(s, session) for s in students]
    
    return StudentPaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@app.get("/students/{student_id}", response_model=StudentRead)
async def get_student(
    student_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """Get a single student by ID - All users can view any student"""
    statement = select(Student).where(
        and_(Student.id == student_id, Student.school_id == current_user.school_id)
    )
    result = await session.execute(statement)
    student = result.scalars().first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Teachers can view any student (no access check for GET)
    return await build_student_read(student, session)

@app.put("/students/{student_id}", response_model=StudentRead)
async def update_student(
    student_id: int,
    student_data: StudentUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """Update a student. Principal can update any, Teacher only their assigned classes."""
    statement = select(Student).where(
        and_(Student.id == student_id, Student.school_id == current_user.school_id)
    )
    result = await session.execute(statement)
    student = result.scalars().first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Check teacher access
    if current_user.role == "TEACHER":
        has_access = await check_teacher_class_access(current_user, student.class_id, session)
        if not has_access:
            raise HTTPException(status_code=403, detail="You don't have access to this student")
        
        # If changing class, check access to new class too
        if student_data.class_id and student_data.class_id != student.class_id:
            has_new_access = await check_teacher_class_access(current_user, student_data.class_id, session)
            if not has_new_access:
                raise HTTPException(status_code=403, detail="You don't have access to the target class")
    
    # Check roll number uniqueness if changing
    if student_data.roll_no and student_data.roll_no != student.roll_no:
        target_class = student_data.class_id or student.class_id
        dup_statement = select(Student).where(
            and_(
                Student.school_id == current_user.school_id,
                Student.class_id == target_class,
                Student.roll_no == student_data.roll_no,
                Student.id != student_id
            )
        )
        dup_result = await session.execute(dup_statement)
        if dup_result.scalars().first():
            raise HTTPException(status_code=400, detail="Roll number already exists in this class")
    
    # Update fields
    update_data = student_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(student, key, value)
    
    student.updated_at = datetime.utcnow()
    
    session.add(student)
    await session.commit()
    await session.refresh(student)
    
    return await build_student_read(student, session)

@app.delete("/students/{student_id}")
async def delete_student(
    student_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(require_role(["PRINCIPAL"]))
):
    """Delete a student. Only Principal can delete."""
    statement = select(Student).where(
        and_(Student.id == student_id, Student.school_id == current_user.school_id)
    )
    result = await session.execute(statement)
    student = result.scalars().first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    await session.delete(student)
    await session.commit()
    
    return {"message": "Student deleted successfully"}

@app.get("/students/csv-template/")
async def get_csv_template():
    """Download CSV template for bulk student upload"""
    headers = [
        "admission_number", "name", "date_of_birth", "gender", "class_grade", "class_section",
        "roll_no", "address", "father_name", "mother_name", "father_occupation",
        "mother_occupation", "annual_income", "contact_number", "parent_email", "blood_group",
        "date_of_admission"
    ]
    
    # Create sample row
    sample = [
        "ADM001", "John Doe", "2010-05-15", "M", "10", "A", "1", "123 Main St",
        "Robert Doe", "Jane Doe", "Engineer", "Doctor", "500000", "9876543210",
        "parent@email.com", "O+", "2023-04-01"
    ]
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    writer.writerow(sample)
    
    from fastapi.responses import StreamingResponse
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=student_template.csv"}
    )

@app.get("/students/export/")
async def export_students(
    class_id: Optional[int] = None,
    is_active: bool = True,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """
    Export students to CSV file.
    Can export all students or filter by class.
    """
    # Build query
    conditions = [Student.school_id == current_user.school_id, Student.is_active == is_active]
    
    if class_id:
        conditions.append(Student.class_id == class_id)
    
    statement = select(Student).where(and_(*conditions)).order_by(Student.class_id, Student.roll_no)
    result = await session.execute(statement)
    students = result.scalars().all()
    
    # Get all classes for lookup
    class_stmt = select(Class).where(Class.school_id == current_user.school_id)
    class_result = await session.execute(class_stmt)
    classes = {c.id: f"{c.grade}-{c.section}" for c in class_result.scalars().all()}
    
    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    headers = [
        "Admission Number", "Name", "Date of Birth", "Gender", "Class", "Roll No",
        "Address", "Father Name", "Mother Name", "Father Occupation", "Mother Occupation",
        "Annual Income", "Contact Number", "Parent Email", "Blood Group", "Date of Admission", "Status"
    ]
    writer.writerow(headers)
    
    # Data rows
    for student in students:
        gender_display = {"M": "Male", "F": "Female", "Other": "Other"}.get(student.gender.value if student.gender else "", "")
        blood_group_display = student.blood_group.value if student.blood_group else ""
        class_name = classes.get(student.class_id, "")
        
        row = [
            student.admission_number,
            student.name,
            student.date_of_birth.strftime("%Y-%m-%d") if student.date_of_birth else "",
            gender_display,
            class_name,
            student.roll_no,
            student.address or "",
            student.father_name,
            student.mother_name or "",
            student.father_occupation or "",
            student.mother_occupation or "",
            str(student.annual_income) if student.annual_income else "",
            student.contact_number or "",
            student.parent_email or "",
            blood_group_display,
            student.date_of_admission.strftime("%Y-%m-%d") if student.date_of_admission else "",
            "Active" if student.is_active else "Inactive"
        ]
        writer.writerow(row)
    
    # Generate filename
    from datetime import datetime as dt
    timestamp = dt.now().strftime("%Y%m%d_%H%M%S")
    if class_id and class_id in classes:
        filename = f"students_{classes[class_id].replace('-', '_')}_{timestamp}.csv"
    else:
        filename = f"students_all_{timestamp}.csv"
    
    from fastapi.responses import StreamingResponse
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@app.post("/students/bulk-upload/")
async def bulk_upload_students(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """
    Bulk upload students from CSV file.
    Principal can upload to any class, Teacher only to assigned classes.
    File is processed in memory/temp and deleted after.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    # Get teacher's assigned classes if role is TEACHER
    assigned_class_ids = []
    if current_user.role == "TEACHER":
        user_statement = select(User).where(User.id == current_user.user_id)
        user_result = await session.execute(user_statement)
        teacher = user_result.scalars().first()
        if teacher and teacher.assigned_classes:
            assigned_class_ids = [int(c) for c in teacher.assigned_classes]
    
    # Read file into memory
    contents = await file.read()
    
    # Save to temp file, process, then delete
    temp_file = None
    try:
        # Create temp file
        temp_file = tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.csv', encoding='utf-8')
        temp_file.write(contents.decode('utf-8'))
        temp_file.close()
        
        # Read and parse CSV
        students_created = []
        errors = []
        
        with open(temp_file.name, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            for row_num, row in enumerate(reader, start=2):  # Start at 2 (1 is header)
                try:
                    # Find class_id from grade and section
                    class_statement = select(Class).where(
                        and_(
                            Class.school_id == current_user.school_id,
                            Class.grade == row.get('class_grade', '').strip(),
                            Class.section == row.get('class_section', '').strip()
                        )
                    )
                    class_result = await session.execute(class_statement)
                    class_obj = class_result.scalars().first()
                    
                    if not class_obj:
                        errors.append(f"Row {row_num}: Class {row.get('class_grade')}-{row.get('class_section')} not found")
                        continue
                    
                    # Check teacher access to this class
                    if current_user.role == "TEACHER" and class_obj.id not in assigned_class_ids:
                        errors.append(f"Row {row_num}: You don't have access to class {row.get('class_grade')}-{row.get('class_section')}")
                        continue
                    
                    # Check for duplicate admission number
                    adm_statement = select(Student).where(
                        and_(
                            Student.school_id == current_user.school_id,
                            Student.admission_number == row.get('admission_number', '').strip()
                        )
                    )
                    adm_result = await session.execute(adm_statement)
                    if adm_result.scalars().first():
                        errors.append(f"Row {row_num}: Admission number {row.get('admission_number')} already exists")
                        continue
                    
                    # Parse gender
                    gender_str = row.get('gender', '').strip().upper()
                    if gender_str in ['M', 'MALE']:
                        gender = Gender.MALE
                    elif gender_str in ['F', 'FEMALE']:
                        gender = Gender.FEMALE
                    else:
                        gender = Gender.OTHER
                    
                    # Parse blood group
                    blood_group = None
                    bg_str = row.get('blood_group', '').strip()
                    if bg_str:
                        try:
                            blood_group = BloodGroup(bg_str)
                        except ValueError:
                            pass  # Invalid blood group, skip
                    
                    # Parse dates using flexible parser
                    dob = parse_date_flexible(row.get('date_of_birth', ''))
                    if not dob:
                        errors.append(f"Row {row_num}: Date of birth is required")
                        continue
                    
                    doa_str = row.get('date_of_admission', '').strip()
                    doa = parse_date_flexible(doa_str) if doa_str else date.today()
                    
                    # Parse annual income
                    income_str = row.get('annual_income', '').strip()
                    annual_income = float(income_str) if income_str else None
                    
                    # Create student
                    student = Student(
                        school_id=current_user.school_id,
                        admission_number=row.get('admission_number', '').strip(),
                        name=row.get('name', '').strip(),
                        date_of_birth=dob,
                        gender=gender,
                        class_id=class_obj.id,
                        roll_no=row.get('roll_no', '').strip(),
                        address=row.get('address', '').strip() or None,
                        father_name=row.get('father_name', '').strip(),
                        mother_name=row.get('mother_name', '').strip() or None,
                        father_occupation=row.get('father_occupation', '').strip() or None,
                        mother_occupation=row.get('mother_occupation', '').strip() or None,
                        annual_income=annual_income,
                        contact_number=row.get('contact_number', '').strip(),
                        parent_email=row.get('parent_email', '').strip() or None,
                        blood_group=blood_group,
                        date_of_admission=doa
                    )
                    
                    session.add(student)
                    students_created.append(row.get('admission_number', ''))
                    
                except Exception as e:
                    errors.append(f"Row {row_num}: {str(e)}")
        
        # Commit all valid students
        if students_created:
            await session.commit()
        
        return {
            "message": f"Successfully created {len(students_created)} students",
            "created_count": len(students_created),
            "error_count": len(errors),
            "errors": errors[:20] if errors else []  # Return first 20 errors
        }
        
    finally:
        # Clean up temp file
        if temp_file and os.path.exists(temp_file.name):
            os.unlink(temp_file.name)

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
    """Get all classes for the school with student count.
    - Principal: Can see and edit all classes
    - Teacher: Can see all classes but only edit assigned ones
    """
    # Base query
    statement = select(Class).where(Class.school_id == current_user.school_id)
    
    # Teachers can view all classes (but can only add students to assigned classes)
    result = await session.execute(statement)
    classes = result.scalars().all()
    
    # Get teacher's assigned classes if role is TEACHER
    assigned_class_ids = []
    if current_user.role == "TEACHER":
        user_statement = select(User).where(User.id == current_user.user_id)
        user_result = await session.execute(user_statement)
        teacher = user_result.scalars().first()
        if teacher and teacher.assigned_classes:
            assigned_class_ids = [int(c) for c in teacher.assigned_classes]
    
    # Enrich with teacher names and student count
    class_reads = []
    for cls in classes:
        teacher_name = None
        if cls.class_teacher_id:
            teacher_stmt = select(User).where(User.id == cls.class_teacher_id)
            teacher_result = await session.execute(teacher_stmt)
            teacher = teacher_result.scalars().first()
            if teacher:
                teacher_name = teacher.name
        
        # Get student count for this class
        from sqlalchemy import func
        count_stmt = select(func.count(Student.id)).where(
            and_(
                Student.school_id == current_user.school_id,
                Student.class_id == cls.id,
                Student.is_active == True
            )
        )
        count_result = await session.execute(count_stmt)
        student_count = count_result.scalar() or 0
        
        # Determine if user can edit this class
        can_edit = current_user.role == "PRINCIPAL" or cls.id in assigned_class_ids
        
        class_reads.append(ClassRead(
            id=cls.id,
            grade=cls.grade,
            section=cls.section,
            class_teacher_id=cls.class_teacher_id,
            class_teacher_name=teacher_name,
            student_count=student_count,
            can_edit=can_edit,
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
    
    # Add class to teacher's assigned_classes if teacher is set
    teacher_name = None
    if new_class.class_teacher_id:
        teacher_stmt = select(User).where(User.id == new_class.class_teacher_id)
        teacher_result = await session.execute(teacher_stmt)
        teacher = teacher_result.scalars().first()
        if teacher:
            teacher_name = teacher.name
            # Add this class to teacher's assigned_classes
            class_id_str = str(new_class.id)
            if not teacher.assigned_classes:
                teacher.assigned_classes = [class_id_str]
            elif class_id_str not in teacher.assigned_classes:
                teacher.assigned_classes = teacher.assigned_classes + [class_id_str]
            await session.commit()
    
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
    
    old_teacher_id = cls.class_teacher_id
    new_teacher_id = class_data.class_teacher_id
    
    cls.grade = class_data.grade
    cls.section = class_data.section
    cls.class_teacher_id = new_teacher_id
    
    # Update teacher's assigned_classes when class teacher changes
    class_id_str = str(class_id)
    
    # Remove class from old teacher's assigned_classes
    if old_teacher_id and old_teacher_id != new_teacher_id:
        old_teacher_stmt = select(User).where(User.id == old_teacher_id)
        old_teacher_result = await session.execute(old_teacher_stmt)
        old_teacher = old_teacher_result.scalars().first()
        if old_teacher and old_teacher.assigned_classes:
            if class_id_str in old_teacher.assigned_classes:
                old_teacher.assigned_classes = [c for c in old_teacher.assigned_classes if c != class_id_str]
    
    # Add class to new teacher's assigned_classes
    if new_teacher_id:
        new_teacher_stmt = select(User).where(User.id == new_teacher_id)
        new_teacher_result = await session.execute(new_teacher_stmt)
        new_teacher = new_teacher_result.scalars().first()
        if new_teacher:
            if not new_teacher.assigned_classes:
                new_teacher.assigned_classes = [class_id_str]
            elif class_id_str not in new_teacher.assigned_classes:
                new_teacher.assigned_classes = new_teacher.assigned_classes + [class_id_str]
    
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

# --- Exams & Exam Timetable ---

# Helper function to check if user has access to a class (for exams)
async def check_class_access_for_exam(user: TokenData, class_id: int, session: AsyncSession) -> bool:
    """Check if teacher has access to create/edit exams for a specific class"""
    if user.role == "PRINCIPAL":
        return True
    
    # Get teacher's assigned classes
    statement = select(User).where(User.id == user.user_id)
    result = await session.execute(statement)
    teacher = result.scalars().first()
    
    if not teacher or not teacher.assigned_classes:
        return False
    
    return str(class_id) in teacher.assigned_classes

# Helper to build ExamRead with enriched data
async def build_exam_read(exam: Exam, session: AsyncSession) -> ExamRead:
    """Convert Exam to ExamRead with class name and creator name"""
    # Get class info
    class_statement = select(Class).where(Class.id == exam.class_id)
    class_result = await session.execute(class_statement)
    class_obj = class_result.scalars().first()
    class_name = f"{class_obj.grade}-{class_obj.section}" if class_obj else None
    
    # Get creator info
    user_statement = select(User).where(User.id == exam.created_by)
    user_result = await session.execute(user_statement)
    creator = user_result.scalars().first()
    created_by_name = creator.name if creator else None
    
    # Get subject count
    count_statement = select(ExamTimetableEntry).where(
        ExamTimetableEntry.exam_id == exam.id
    )
    count_result = await session.execute(count_statement)
    subject_count = len(count_result.scalars().all())
    
    return ExamRead(
        id=exam.id,
        name=exam.name,
        class_id=exam.class_id,
        class_name=class_name,
        start_date=exam.start_date,
        end_date=exam.end_date,
        pass_percentage=exam.pass_percentage,
        status=exam.status,
        created_by=exam.created_by,
        created_by_name=created_by_name,
        subject_count=subject_count,
        created_at=exam.created_at,
        updated_at=exam.updated_at
    )

@app.post("/exams/", response_model=ExamRead)
async def create_exam(
    exam_data: ExamCreate,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """
    Create a new exam with auto-generated schedule.
    User provides: name, class, date range, and subjects.
    Backend auto-generates the timetable distributing subjects across available dates.
    """
    from datetime import timedelta
    
    # Check class access
    has_access = await check_class_access_for_exam(current_user, exam_data.class_id, session)
    if not has_access:
        raise HTTPException(
            status_code=403, 
            detail="You don't have permission to create exams for this class"
        )
    
    # Validate dates
    if exam_data.end_date < exam_data.start_date:
        raise HTTPException(status_code=400, detail="End date cannot be before start date")
    
    today = date.today()
    if exam_data.start_date < today:
        raise HTTPException(status_code=400, detail="Start date cannot be in the past")
    
    # Validate subjects
    if not exam_data.subject_ids or len(exam_data.subject_ids) == 0:
        raise HTTPException(status_code=400, detail="At least one subject is required")
    
    # Verify class exists
    class_statement = select(Class).where(
        and_(Class.id == exam_data.class_id, Class.school_id == current_user.school_id)
    )
    class_result = await session.execute(class_statement)
    if not class_result.scalars().first():
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Verify all subjects exist
    subjects = []
    for subject_id in exam_data.subject_ids:
        subject = await session.get(Subject, subject_id)
        if not subject or subject.school_id != current_user.school_id:
            raise HTTPException(status_code=404, detail=f"Subject with ID {subject_id} not found")
        subjects.append(subject)
    
    # Calculate available exam days (excluding Sundays)
    available_dates = []
    current_date = exam_data.start_date
    while current_date <= exam_data.end_date:
        # Skip Sundays (weekday() == 6)
        if current_date.weekday() != 6:
            available_dates.append(current_date)
        current_date += timedelta(days=1)
    
    if len(available_dates) < len(subjects):
        raise HTTPException(
            status_code=400, 
            detail=f"Not enough exam days ({len(available_dates)}) for {len(subjects)} subjects. Extend the date range or reduce subjects."
        )
    
    # Create exam
    exam = Exam(
        school_id=current_user.school_id,
        name=exam_data.name,
        class_id=exam_data.class_id,
        start_date=exam_data.start_date,
        end_date=exam_data.end_date,
        pass_percentage=exam_data.pass_percentage,
        status=ExamStatus.DRAFT,
        created_by=current_user.user_id
    )
    
    session.add(exam)
    await session.commit()
    await session.refresh(exam)
    
    # Auto-generate exam timetable entries
    # Distribute subjects evenly across available dates
    import random
    random.shuffle(available_dates)  # Randomize to make each schedule unique
    
    # Calculate end time from start time and duration
    start_hour, start_min = map(int, exam_data.default_start_time.split(':'))
    duration_hours = exam_data.default_duration_minutes // 60
    duration_mins = exam_data.default_duration_minutes % 60
    end_hour = start_hour + duration_hours
    end_min = start_min + duration_mins
    if end_min >= 60:
        end_hour += 1
        end_min -= 60
    end_time = f"{end_hour:02d}:{end_min:02d}"
    
    for i, subject in enumerate(subjects):
        entry = ExamTimetableEntry(
            school_id=current_user.school_id,
            exam_id=exam.id,
            subject_id=subject.id,
            exam_date=available_dates[i],
            start_time=exam_data.default_start_time,
            end_time=end_time,
            max_marks=exam_data.default_max_marks
        )
        session.add(entry)
    
    await session.commit()
    
    # Log activity
    activity = ActivityLog(
        school_id=current_user.school_id,
        user_id=current_user.user_id,
        action="exam_created",
        description=f"Created exam: {exam.name} with {len(subjects)} subjects",
        entity_type="exam",
        entity_id=exam.id
    )
    session.add(activity)
    await session.commit()
    
    return await build_exam_read(exam, session)

@app.get("/exams/", response_model=List[ExamRead])
async def list_exams(
    class_id: Optional[int] = None,
    status: Optional[ExamStatus] = None,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """
    List exams filtered by class and status.
    Teachers see exams for their assigned classes only.
    Principals see all exams.
    """
    # Build base query
    conditions = [Exam.school_id == current_user.school_id]
    
    # Role-based filtering
    if current_user.role == "TEACHER":
        # Get teacher's assigned classes
        user_statement = select(User).where(User.id == current_user.user_id)
        user_result = await session.execute(user_statement)
        teacher = user_result.scalars().first()
        
        if teacher and teacher.assigned_classes:
            assigned_class_ids = [int(c) for c in teacher.assigned_classes]
            conditions.append(Exam.class_id.in_(assigned_class_ids))
        else:
            # Teacher has no assigned classes
            return []
    
    # Apply filters
    if class_id:
        conditions.append(Exam.class_id == class_id)
    
    if status:
        conditions.append(Exam.status == status)
    
    # Execute query
    statement = select(Exam).where(and_(*conditions)).order_by(Exam.start_date.desc())
    result = await session.execute(statement)
    exams = result.scalars().all()
    
    # Build response with enriched data
    return [await build_exam_read(exam, session) for exam in exams]

@app.get("/exams/{exam_id}", response_model=ExamRead)
async def get_exam(
    exam_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """Get a single exam by ID"""
    exam = await session.get(Exam, exam_id)
    
    if not exam or exam.school_id != current_user.school_id:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Check access for teachers
    if current_user.role == "TEACHER":
        has_access = await check_class_access_for_exam(current_user, exam.class_id, session)
        if not has_access:
            raise HTTPException(status_code=403, detail="Access denied")
    
    return await build_exam_read(exam, session)

@app.put("/exams/{exam_id}", response_model=ExamRead)
async def update_exam(
    exam_id: int,
    exam_data: ExamUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """
    Update exam details (name, dates).
    Only allowed if exam status is DRAFT.
    """
    exam = await session.get(Exam, exam_id)
    
    if not exam or exam.school_id != current_user.school_id:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Check access
    if current_user.role == "TEACHER":
        has_access = await check_class_access_for_exam(current_user, exam.class_id, session)
        if not has_access or exam.created_by != current_user.user_id:
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Only DRAFT exams can be edited
    if exam.status != ExamStatus.DRAFT:
        raise HTTPException(
            status_code=400, 
            detail="Cannot edit published exams. Unpublish first to make changes."
        )
    
    # Update fields
    if exam_data.name is not None:
        exam.name = exam_data.name
    
    if exam_data.start_date is not None:
        exam.start_date = exam_data.start_date
    
    if exam_data.end_date is not None:
        exam.end_date = exam_data.end_date
    
    # Validate dates
    if exam.end_date < exam.start_date:
        raise HTTPException(status_code=400, detail="End date cannot be before start date")
    
    exam.updated_at = datetime.utcnow()
    
    session.add(exam)
    await session.commit()
    await session.refresh(exam)
    
    return await build_exam_read(exam, session)

@app.delete("/exams/{exam_id}")
async def delete_exam(
    exam_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """
    Delete an exam. Only allowed if:
    - Exam is in DRAFT status
    - User is the creator (for teachers) or Principal
    """
    exam = await session.get(Exam, exam_id)
    
    if not exam or exam.school_id != current_user.school_id:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Check permissions
    if current_user.role == "TEACHER":
        if exam.created_by != current_user.user_id:
            raise HTTPException(status_code=403, detail="You can only delete exams you created")
    
    # Only DRAFT exams can be deleted
    if exam.status != ExamStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Cannot delete published exams")
    
    # Delete associated timetable entries first
    entries_statement = select(ExamTimetableEntry).where(ExamTimetableEntry.exam_id == exam_id)
    entries_result = await session.execute(entries_statement)
    entries = entries_result.scalars().all()
    
    for entry in entries:
        await session.delete(entry)
    
    # Delete exam
    await session.delete(exam)
    await session.commit()
    
    return {"message": "Exam deleted successfully"}

@app.put("/exams/{exam_id}/publish")
async def publish_exam(
    exam_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """
    Publish an exam (change status from DRAFT to PUBLISHED).
    Validates that at least one subject is scheduled.
    """
    exam = await session.get(Exam, exam_id)
    
    if not exam or exam.school_id != current_user.school_id:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Check access
    if current_user.role == "TEACHER":
        has_access = await check_class_access_for_exam(current_user, exam.class_id, session)
        if not has_access:
            raise HTTPException(status_code=403, detail="Access denied")
    
    if exam.status == ExamStatus.PUBLISHED:
        raise HTTPException(status_code=400, detail="Exam is already published")
    
    # Validate that exam has at least one subject
    entries_statement = select(ExamTimetableEntry).where(ExamTimetableEntry.exam_id == exam_id)
    entries_result = await session.execute(entries_statement)
    entries = entries_result.scalars().all()
    
    if not entries:
        raise HTTPException(
            status_code=400, 
            detail="Cannot publish exam without any subjects. Please add at least one subject."
        )
    
    # Publish exam
    exam.status = ExamStatus.PUBLISHED
    exam.updated_at = datetime.utcnow()
    
    session.add(exam)
    await session.commit()
    
    # Log activity
    activity = ActivityLog(
        school_id=current_user.school_id,
        user_id=current_user.user_id,
        action="exam_published",
        description=f"Published exam: {exam.name}",
        entity_type="exam",
        entity_id=exam.id
    )
    session.add(activity)
    await session.commit()
    
    return {"message": "Exam published successfully", "status": exam.status.value}

@app.put("/exams/{exam_id}/unpublish")
async def unpublish_exam(
    exam_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(require_role(["PRINCIPAL", "ADMIN"]))
):
    """
    Unpublish an exam (change status from PUBLISHED to DRAFT).
    Only principals can unpublish exams.
    """
    exam = await session.get(Exam, exam_id)
    
    if not exam or exam.school_id != current_user.school_id:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    if exam.status == ExamStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Exam is already in draft status")
    
    exam.status = ExamStatus.DRAFT
    exam.updated_at = datetime.utcnow()
    
    session.add(exam)
    await session.commit()
    
    return {"message": "Exam unpublished successfully", "status": exam.status.value}

# --- Exam Timetable Entries ---

@app.get("/exams/{exam_id}/timetable", response_model=List[ExamTimetableEntryRead])
async def get_exam_timetable(
    exam_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """Get all timetable entries (subjects) for an exam"""
    # Verify exam exists and user has access
    exam = await session.get(Exam, exam_id)
    
    if not exam or exam.school_id != current_user.school_id:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Check access for teachers
    if current_user.role == "TEACHER":
        has_access = await check_class_access_for_exam(current_user, exam.class_id, session)
        if not has_access:
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Get all timetable entries
    statement = select(ExamTimetableEntry).where(
        ExamTimetableEntry.exam_id == exam_id
    ).order_by(ExamTimetableEntry.exam_date, ExamTimetableEntry.start_time)
    
    result = await session.execute(statement)
    entries = result.scalars().all()
    
    # Build response with subject info
    response = []
    for entry in entries:
        subject = await session.get(Subject, entry.subject_id)
        
        response.append(ExamTimetableEntryRead(
            id=entry.id,
            exam_id=entry.exam_id,
            subject_id=entry.subject_id,
            subject_name=subject.name if subject else None,
            subject_code=subject.code if subject else None,
            exam_date=entry.exam_date,
            start_time=entry.start_time,
            end_time=entry.end_time,
            max_marks=entry.max_marks,
            created_at=entry.created_at
        ))
    
    return response

@app.post("/exams/{exam_id}/timetable", response_model=ExamTimetableEntryRead)
async def add_exam_timetable_entry(
    exam_id: int,
    entry_data: ExamTimetableEntryCreate,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """
    Add a subject to exam timetable.
    Validates that:
    - Exam is in DRAFT status
    - Date is within exam date range
    - Subject is not already in this exam
    - Start time < End time
    """
    # Verify exam exists and user has access
    exam = await session.get(Exam, exam_id)
    
    if not exam or exam.school_id != current_user.school_id:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Check access for teachers
    if current_user.role == "TEACHER":
        has_access = await check_class_access_for_exam(current_user, exam.class_id, session)
        if not has_access:
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Only DRAFT exams can be edited
    if exam.status != ExamStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Cannot modify published exam timetable")
    
    # Validate date is within exam range
    if entry_data.exam_date < exam.start_date or entry_data.exam_date > exam.end_date:
        raise HTTPException(
            status_code=400,
            detail=f"Exam date must be between {exam.start_date} and {exam.end_date}"
        )
    
    # Validate time
    if entry_data.start_time >= entry_data.end_time:
        raise HTTPException(status_code=400, detail="Start time must be before end time")
    
    # Validate max marks
    if entry_data.max_marks <= 0:
        raise HTTPException(status_code=400, detail="Max marks must be greater than 0")
    
    # Verify subject exists
    subject = await session.get(Subject, entry_data.subject_id)
    if not subject or subject.school_id != current_user.school_id:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    # Check if subject already exists in this exam
    existing_statement = select(ExamTimetableEntry).where(
        and_(
            ExamTimetableEntry.exam_id == exam_id,
            ExamTimetableEntry.subject_id == entry_data.subject_id
        )
    )
    existing_result = await session.execute(existing_statement)
    if existing_result.scalars().first():
        raise HTTPException(
            status_code=400,
            detail=f"Subject '{subject.name}' is already scheduled in this exam"
        )
    
    # Create entry
    entry = ExamTimetableEntry(
        school_id=current_user.school_id,
        exam_id=exam_id,
        subject_id=entry_data.subject_id,
        exam_date=entry_data.exam_date,
        start_time=entry_data.start_time,
        end_time=entry_data.end_time,
        max_marks=entry_data.max_marks
    )
    
    session.add(entry)
    await session.commit()
    await session.refresh(entry)
    
    return ExamTimetableEntryRead(
        id=entry.id,
        exam_id=entry.exam_id,
        subject_id=entry.subject_id,
        subject_name=subject.name,
        subject_code=subject.code,
        exam_date=entry.exam_date,
        start_time=entry.start_time,
        end_time=entry.end_time,
        max_marks=entry.max_marks,
        created_at=entry.created_at
    )

@app.put("/exams/{exam_id}/timetable/{entry_id}", response_model=ExamTimetableEntryRead)
async def update_exam_timetable_entry(
    exam_id: int,
    entry_id: int,
    entry_data: ExamTimetableEntryUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """Update an exam timetable entry (date, time, max marks)"""
    # Verify exam
    exam = await session.get(Exam, exam_id)
    
    if not exam or exam.school_id != current_user.school_id:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Check access
    if current_user.role == "TEACHER":
        has_access = await check_class_access_for_exam(current_user, exam.class_id, session)
        if not has_access:
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Only DRAFT exams can be edited
    if exam.status != ExamStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Cannot modify published exam timetable")
    
    # Get entry
    entry = await session.get(ExamTimetableEntry, entry_id)
    
    if not entry or entry.exam_id != exam_id:
        raise HTTPException(status_code=404, detail="Timetable entry not found")
    
    # Update fields
    if entry_data.exam_date is not None:
        if entry_data.exam_date < exam.start_date or entry_data.exam_date > exam.end_date:
            raise HTTPException(
                status_code=400,
                detail=f"Exam date must be between {exam.start_date} and {exam.end_date}"
            )
        entry.exam_date = entry_data.exam_date
    
    if entry_data.start_time is not None:
        entry.start_time = entry_data.start_time
    
    if entry_data.end_time is not None:
        entry.end_time = entry_data.end_time
    
    # Validate time
    if entry.start_time >= entry.end_time:
        raise HTTPException(status_code=400, detail="Start time must be before end time")
    
    if entry_data.max_marks is not None:
        if entry_data.max_marks <= 0:
            raise HTTPException(status_code=400, detail="Max marks must be greater than 0")
        entry.max_marks = entry_data.max_marks
    
    session.add(entry)
    await session.commit()
    await session.refresh(entry)
    
    # Get subject info
    subject = await session.get(Subject, entry.subject_id)
    
    return ExamTimetableEntryRead(
        id=entry.id,
        exam_id=entry.exam_id,
        subject_id=entry.subject_id,
        subject_name=subject.name if subject else None,
        subject_code=subject.code if subject else None,
        exam_date=entry.exam_date,
        start_time=entry.start_time,
        end_time=entry.end_time,
        max_marks=entry.max_marks,
        created_at=entry.created_at
    )

@app.delete("/exams/{exam_id}/timetable/{entry_id}")
async def delete_exam_timetable_entry(
    exam_id: int,
    entry_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """Remove a subject from exam timetable"""
    # Verify exam
    exam = await session.get(Exam, exam_id)
    
    if not exam or exam.school_id != current_user.school_id:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Check access
    if current_user.role == "TEACHER":
        has_access = await check_class_access_for_exam(current_user, exam.class_id, session)
        if not has_access:
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Only DRAFT exams can be edited
    if exam.status != ExamStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Cannot modify published exam timetable")
    
    # Get entry
    entry = await session.get(ExamTimetableEntry, entry_id)
    
    if not entry or entry.exam_id != exam_id:
        raise HTTPException(status_code=404, detail="Timetable entry not found")
    
    await session.delete(entry)
    await session.commit()
    
    return {"message": "Subject removed from exam timetable"}

# ===========================================
# MARKS ENTRY MODULE
# ===========================================

async def check_marks_access(current_user: TokenData, exam: Exam, subject_id: int, session: AsyncSession) -> bool:
    """Check if user has access to enter marks for this exam/subject combination"""
    if current_user.role in ["PRINCIPAL", "ADMIN"]:
        return True
    
    if current_user.role == "TEACHER":
        # Check if teacher teaches this subject in this class
        statement = select(TimetableEntry).where(
            and_(
                TimetableEntry.school_id == current_user.school_id,
                TimetableEntry.class_id == exam.class_id,
                TimetableEntry.subject_id == subject_id,
                TimetableEntry.teacher_id == current_user.user_id
            )
        )
        result = await session.execute(statement)
        return result.scalars().first() is not None
    
    return False

@app.get("/exams/{exam_id}/marks-summary", response_model=List[MarksSummary])
async def get_exam_marks_summary(
    exam_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """
    Get marks entry status summary for all subjects in an exam.
    Shows how many marks have been entered/published for each subject.
    """
    # Verify exam exists and user has access
    exam = await session.get(Exam, exam_id)
    
    if not exam or exam.school_id != current_user.school_id:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Only published exams can have marks entered
    if exam.status != ExamStatus.PUBLISHED:
        raise HTTPException(status_code=400, detail="Marks can only be entered for published exams")
    
    # Get class info
    class_obj = await session.get(Class, exam.class_id)
    
    # Get total students in class
    students_statement = select(Student).where(
        and_(
            Student.school_id == current_user.school_id,
            Student.class_id == exam.class_id,
            Student.is_active == True
        )
    )
    students_result = await session.execute(students_statement)
    total_students = len(students_result.scalars().all())
    
    # Get all timetable entries for this exam
    entries_statement = select(ExamTimetableEntry).where(
        ExamTimetableEntry.exam_id == exam_id
    ).order_by(ExamTimetableEntry.exam_date)
    
    entries_result = await session.execute(entries_statement)
    entries = entries_result.scalars().all()
    
    summaries = []
    for entry in entries:
        subject = await session.get(Subject, entry.subject_id)
        
        # Count marks for this entry
        marks_statement = select(Mark).where(
            Mark.exam_timetable_entry_id == entry.id
        )
        marks_result = await session.execute(marks_statement)
        marks = marks_result.scalars().all()
        
        marks_entered = len([m for m in marks if m.marks_obtained is not None or m.is_absent])
        marks_published = len([m for m in marks if m.status == MarkStatus.PUBLISHED])
        
        # Determine status
        if marks_published > 0:
            status = "Published"
        elif marks_entered == total_students:
            status = "Completed"
        elif marks_entered > 0:
            status = "In Progress"
        else:
            status = "Pending"
        
        # Check access for teacher
        can_access = await check_marks_access(current_user, exam, entry.subject_id, session)
        
        if can_access or current_user.role in ["PRINCIPAL", "ADMIN"]:
            summaries.append(MarksSummary(
                exam_id=exam_id,
                exam_name=exam.name,
                exam_timetable_entry_id=entry.id,
                subject_id=entry.subject_id,
                subject_name=subject.name if subject else "Unknown",
                max_marks=entry.max_marks,
                total_students=total_students,
                marks_entered=marks_entered,
                marks_published=marks_published,
                status=status
            ))
    
    return summaries

@app.get("/exams/{exam_id}/marks/{entry_id}", response_model=MarksEntryResponse)
async def get_marks_for_entry(
    exam_id: int,
    entry_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """
    Get all marks for a specific exam timetable entry (subject).
    Returns student list with their marks for marks entry page.
    """
    # Verify exam exists
    exam = await session.get(Exam, exam_id)
    
    if not exam or exam.school_id != current_user.school_id:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    if exam.status != ExamStatus.PUBLISHED:
        raise HTTPException(status_code=400, detail="Marks can only be entered for published exams")
    
    # Verify entry exists
    entry = await session.get(ExamTimetableEntry, entry_id)
    
    if not entry or entry.exam_id != exam_id:
        raise HTTPException(status_code=404, detail="Timetable entry not found")
    
    # Check access
    has_access = await check_marks_access(current_user, exam, entry.subject_id, session)
    if not has_access:
        raise HTTPException(status_code=403, detail="You don't have permission to access marks for this subject")
    
    # Get class and subject info
    class_obj = await session.get(Class, exam.class_id)
    subject = await session.get(Subject, entry.subject_id)
    
    # Get all students in the class
    students_statement = select(Student).where(
        and_(
            Student.school_id == current_user.school_id,
            Student.class_id == exam.class_id,
            Student.is_active == True
        )
    ).order_by(Student.name)
    
    students_result = await session.execute(students_statement)
    students = students_result.scalars().all()
    
    # Get existing marks for this entry
    marks_statement = select(Mark).where(
        Mark.exam_timetable_entry_id == entry_id
    )
    marks_result = await session.execute(marks_statement)
    existing_marks = {m.student_id: m for m in marks_result.scalars().all()}
    
    # Build response with marks for each student
    marks_list = []
    marks_entered_count = 0
    overall_status = "Pending"
    
    for student in students:
        if student.id in existing_marks:
            mark = existing_marks[student.id]
            entered_by_user = await session.get(User, mark.entered_by)
            
            marks_list.append(MarkRead(
                id=mark.id,
                exam_id=exam_id,
                exam_timetable_entry_id=entry_id,
                student_id=student.id,
                subject_id=entry.subject_id,
                student_name=student.name,
                student_admission_number=student.admission_number,
                marks_obtained=mark.marks_obtained,
                max_marks=entry.max_marks,
                is_absent=mark.is_absent,
                remarks=mark.remarks,
                status=mark.status,
                entered_by=mark.entered_by,
                entered_by_name=entered_by_user.name if entered_by_user else None,
                created_at=mark.created_at,
                updated_at=mark.updated_at
            ))
            
            if mark.marks_obtained is not None or mark.is_absent:
                marks_entered_count += 1
            if mark.status == MarkStatus.PUBLISHED:
                overall_status = "Published"
        else:
            # Create placeholder for students without marks
            marks_list.append(MarkRead(
                id=0,  # Placeholder
                exam_id=exam_id,
                exam_timetable_entry_id=entry_id,
                student_id=student.id,
                subject_id=entry.subject_id,
                student_name=student.name,
                student_admission_number=student.admission_number,
                marks_obtained=None,
                max_marks=entry.max_marks,
                is_absent=False,
                remarks=None,
                status=MarkStatus.DRAFT,
                entered_by=0,
                entered_by_name=None,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            ))
    
    # Determine overall status
    if overall_status != "Published":
        if marks_entered_count == len(students):
            overall_status = "Completed"
        elif marks_entered_count > 0:
            overall_status = "In Progress"
    
    return MarksEntryResponse(
        exam_id=exam_id,
        exam_name=exam.name,
        exam_timetable_entry_id=entry_id,
        subject_id=entry.subject_id,
        subject_name=subject.name if subject else "Unknown",
        max_marks=entry.max_marks,
        class_id=exam.class_id,
        class_name=f"{class_obj.grade}-{class_obj.section}" if class_obj else "Unknown",
        status=overall_status,
        total_students=len(students),
        marks_entered=marks_entered_count,
        marks=marks_list
    )

@app.post("/marks/bulk", response_model=dict)
async def bulk_save_marks(
    data: MarkBulkEntry,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """
    Bulk save marks for multiple students at once.
    Creates new marks or updates existing ones.
    Validates marks don't exceed max marks.
    """
    # Verify exam
    exam = await session.get(Exam, data.exam_id)
    
    if not exam or exam.school_id != current_user.school_id:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    if exam.status != ExamStatus.PUBLISHED:
        raise HTTPException(status_code=400, detail="Marks can only be entered for published exams")
    
    # Verify entry
    entry = await session.get(ExamTimetableEntry, data.exam_timetable_entry_id)
    
    if not entry or entry.exam_id != data.exam_id:
        raise HTTPException(status_code=404, detail="Timetable entry not found")
    
    # Check access
    has_access = await check_marks_access(current_user, exam, entry.subject_id, session)
    if not has_access:
        raise HTTPException(status_code=403, detail="You don't have permission to enter marks for this subject")
    
    # Process each mark
    created_count = 0
    updated_count = 0
    errors = []
    
    for mark_data in data.marks:
        # Validate student exists and belongs to the class
        student = await session.get(Student, mark_data.student_id)
        if not student or student.class_id != exam.class_id:
            errors.append(f"Student {mark_data.student_id} not found in this class")
            continue
        
        # Validate marks don't exceed max
        if mark_data.marks_obtained is not None:
            if mark_data.marks_obtained < 0:
                errors.append(f"Marks for {student.name} cannot be negative")
                continue
            if mark_data.marks_obtained > entry.max_marks:
                errors.append(f"Marks for {student.name} exceed maximum ({entry.max_marks})")
                continue
        
        # Check if mark already exists
        existing_statement = select(Mark).where(
            and_(
                Mark.exam_timetable_entry_id == entry.id,
                Mark.student_id == mark_data.student_id
            )
        )
        existing_result = await session.execute(existing_statement)
        existing_mark = existing_result.scalars().first()
        
        if existing_mark:
            # Update existing mark
            existing_mark.marks_obtained = mark_data.marks_obtained
            existing_mark.is_absent = mark_data.is_absent
            existing_mark.remarks = mark_data.remarks
            existing_mark.updated_at = datetime.utcnow()
            session.add(existing_mark)
            updated_count += 1
        else:
            # Create new mark
            new_mark = Mark(
                school_id=current_user.school_id,
                exam_id=data.exam_id,
                exam_timetable_entry_id=entry.id,
                student_id=mark_data.student_id,
                subject_id=entry.subject_id,
                marks_obtained=mark_data.marks_obtained,
                is_absent=mark_data.is_absent,
                remarks=mark_data.remarks,
                status=MarkStatus.DRAFT,
                entered_by=current_user.user_id
            )
            session.add(new_mark)
            created_count += 1
    
    await session.commit()
    
    # Log activity
    subject = await session.get(Subject, entry.subject_id)
    activity = ActivityLog(
        school_id=current_user.school_id,
        user_id=current_user.user_id,
        action="marks_entered",
        description=f"Entered marks for {subject.name if subject else 'Unknown'} in {exam.name}",
        entity_type="mark",
        entity_id=entry.id
    )
    session.add(activity)
    await session.commit()
    
    return {
        "message": "Marks saved successfully",
        "created": created_count,
        "updated": updated_count,
        "errors": errors if errors else None
    }

@app.patch("/marks/{mark_id}", response_model=MarkRead)
async def update_single_mark(
    mark_id: int,
    data: MarkUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """
    Update a single mark.
    Teachers can edit marks even after publishing.
    """
    # Get the mark
    mark = await session.get(Mark, mark_id)
    
    if not mark or mark.school_id != current_user.school_id:
        raise HTTPException(status_code=404, detail="Mark not found")
    
    # Get exam and entry for validation
    exam = await session.get(Exam, mark.exam_id)
    entry = await session.get(ExamTimetableEntry, mark.exam_timetable_entry_id)
    
    # Check access
    has_access = await check_marks_access(current_user, exam, mark.subject_id, session)
    if not has_access:
        raise HTTPException(status_code=403, detail="You don't have permission to edit this mark")
    
    # Validate marks
    if data.marks_obtained is not None:
        if data.marks_obtained < 0:
            raise HTTPException(status_code=400, detail="Marks cannot be negative")
        if data.marks_obtained > entry.max_marks:
            raise HTTPException(status_code=400, detail=f"Marks cannot exceed {entry.max_marks}")
        mark.marks_obtained = data.marks_obtained
    
    if data.is_absent is not None:
        mark.is_absent = data.is_absent
        if data.is_absent:
            mark.marks_obtained = None  # Clear marks if marked absent
    
    if data.remarks is not None:
        mark.remarks = data.remarks
    
    mark.updated_at = datetime.utcnow()
    
    session.add(mark)
    await session.commit()
    await session.refresh(mark)
    
    # Get related info for response
    student = await session.get(Student, mark.student_id)
    entered_by_user = await session.get(User, mark.entered_by)
    
    return MarkRead(
        id=mark.id,
        exam_id=mark.exam_id,
        exam_timetable_entry_id=mark.exam_timetable_entry_id,
        student_id=mark.student_id,
        subject_id=mark.subject_id,
        student_name=student.name if student else None,
        student_admission_number=student.admission_number if student else None,
        marks_obtained=mark.marks_obtained,
        max_marks=entry.max_marks,
        is_absent=mark.is_absent,
        remarks=mark.remarks,
        status=mark.status,
        entered_by=mark.entered_by,
        entered_by_name=entered_by_user.name if entered_by_user else None,
        created_at=mark.created_at,
        updated_at=mark.updated_at
    )

@app.post("/marks/publish", response_model=dict)
async def publish_marks(
    data: MarksPublishRequest,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """
    Publish all marks for a specific exam subject.
    Changes status from DRAFT to PUBLISHED.
    Makes marks visible to students/parents.
    """
    # Verify exam
    exam = await session.get(Exam, data.exam_id)
    
    if not exam or exam.school_id != current_user.school_id:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Verify entry
    entry = await session.get(ExamTimetableEntry, data.exam_timetable_entry_id)
    
    if not entry or entry.exam_id != data.exam_id:
        raise HTTPException(status_code=404, detail="Timetable entry not found")
    
    # Check access
    has_access = await check_marks_access(current_user, exam, entry.subject_id, session)
    if not has_access:
        raise HTTPException(status_code=403, detail="You don't have permission to publish marks for this subject")
    
    # Get all marks for this entry
    marks_statement = select(Mark).where(
        and_(
            Mark.exam_timetable_entry_id == entry.id,
            Mark.status == MarkStatus.DRAFT
        )
    )
    marks_result = await session.execute(marks_statement)
    marks = marks_result.scalars().all()
    
    if not marks:
        raise HTTPException(status_code=400, detail="No draft marks to publish")
    
    # Update all marks to published
    published_count = 0
    for mark in marks:
        mark.status = MarkStatus.PUBLISHED
        mark.updated_at = datetime.utcnow()
        session.add(mark)
        published_count += 1
    
    await session.commit()
    
    # Log activity
    subject = await session.get(Subject, entry.subject_id)
    activity = ActivityLog(
        school_id=current_user.school_id,
        user_id=current_user.user_id,
        action="marks_published",
        description=f"Published marks for {subject.name if subject else 'Unknown'} in {exam.name}",
        entity_type="mark",
        entity_id=entry.id
    )
    session.add(activity)
    await session.commit()
    
    return {
        "message": "Marks published successfully",
        "published_count": published_count
    }

@app.post("/marks/unpublish", response_model=dict)
async def unpublish_marks(
    data: MarksPublishRequest,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(require_role(["PRINCIPAL", "ADMIN"]))
):
    """
    Unpublish marks (revert to draft). Only principals can do this.
    Allows teachers to make corrections after publish.
    """
    # Verify exam
    exam = await session.get(Exam, data.exam_id)
    
    if not exam or exam.school_id != current_user.school_id:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Verify entry
    entry = await session.get(ExamTimetableEntry, data.exam_timetable_entry_id)
    
    if not entry or entry.exam_id != data.exam_id:
        raise HTTPException(status_code=404, detail="Timetable entry not found")
    
    # Get all published marks for this entry
    marks_statement = select(Mark).where(
        and_(
            Mark.exam_timetable_entry_id == entry.id,
            Mark.status == MarkStatus.PUBLISHED
        )
    )
    marks_result = await session.execute(marks_statement)
    marks = marks_result.scalars().all()
    
    if not marks:
        raise HTTPException(status_code=400, detail="No published marks to unpublish")
    
    # Revert all marks to draft
    unpublished_count = 0
    for mark in marks:
        mark.status = MarkStatus.DRAFT
        mark.updated_at = datetime.utcnow()
        session.add(mark)
        unpublished_count += 1
    
    await session.commit()
    
    return {
        "message": "Marks unpublished successfully",
        "unpublished_count": unpublished_count
    }

@app.delete("/marks/{mark_id}", response_model=dict)
async def delete_mark(
    mark_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """Delete a single mark entry"""
    mark = await session.get(Mark, mark_id)
    
    if not mark or mark.school_id != current_user.school_id:
        raise HTTPException(status_code=404, detail="Mark not found")
    
    # Get exam for access check
    exam = await session.get(Exam, mark.exam_id)
    
    # Check access
    has_access = await check_marks_access(current_user, exam, mark.subject_id, session)
    if not has_access:
        raise HTTPException(status_code=403, detail="You don't have permission to delete this mark")
    
    await session.delete(mark)
    await session.commit()
    
    return {"message": "Mark deleted successfully"}

@app.get("/exams/{exam_id}/analytics", response_model=dict)
async def get_exam_analytics(
    exam_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """
    Get analytics for an exam - class average, subject-wise performance, pass percentage.
    Phase 3 enhancement.
    """
    # Verify exam
    exam = await session.get(Exam, exam_id)
    
    if not exam or exam.school_id != current_user.school_id:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Get all timetable entries
    entries_statement = select(ExamTimetableEntry).where(
        ExamTimetableEntry.exam_id == exam_id
    )
    entries_result = await session.execute(entries_statement)
    entries = entries_result.scalars().all()
    
    # Calculate analytics for each subject
    subject_analytics = []
    total_marks_all = 0
    total_max_all = 0
    all_students_set = set()
    
    for entry in entries:
        subject = await session.get(Subject, entry.subject_id)
        
        # Get marks for this entry
        marks_statement = select(Mark).where(
            and_(
                Mark.exam_timetable_entry_id == entry.id,
                Mark.is_absent == False,
                Mark.marks_obtained.isnot(None)
            )
        )
        marks_result = await session.execute(marks_statement)
        marks = marks_result.scalars().all()
        
        if marks:
            total_obtained = sum(m.marks_obtained for m in marks)
            total_max = entry.max_marks * len(marks)
            average = total_obtained / len(marks)
            highest = max(m.marks_obtained for m in marks)
            lowest = min(m.marks_obtained for m in marks)
            pass_count = sum(1 for m in marks if m.marks_obtained >= (entry.max_marks * exam.pass_percentage / 100))  # Dynamic pass %
            pass_percentage = (pass_count / len(marks)) * 100
            
            total_marks_all += total_obtained
            total_max_all += total_max
            
            for m in marks:
                all_students_set.add(m.student_id)
            
            subject_analytics.append({
                "subject_id": entry.subject_id,
                "subject_name": subject.name if subject else "Unknown",
                "max_marks": entry.max_marks,
                "students_appeared": len(marks),
                "average": round(average, 2),
                "highest": highest,
                "lowest": lowest,
                "pass_percentage": round(pass_percentage, 2)
            })
    
    # Overall class analytics
    overall_average = (total_marks_all / total_max_all * 100) if total_max_all > 0 else 0
    
    return {
        "exam_id": exam_id,
        "exam_name": exam.name,
        "total_subjects": len(entries),
        "total_students_appeared": len(all_students_set),
        "overall_average_percentage": round(overall_average, 2),
        "subject_wise": subject_analytics
    }




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
    
    # Log activity
    teacher_stmt = select(User).where(User.id == leave.teacher_id)
    teacher_result = await session.execute(teacher_stmt)
    teacher = teacher_result.scalars().first()
    teacher_name = teacher.name if teacher else "Unknown"
    
    action_text = {
        LeaveStatus.Approved: "approved",
        LeaveStatus.Rejected: "rejected",
        LeaveStatus.Cancelled: "cancelled"
    }.get(status, "updated")
    
    activity = ActivityLog(
        school_id=current_user.school_id,
        user_id=current_user.user_id,
        action=f"leave_{action_text}",
        description=f"{action_text.capitalize()} leave request for {teacher_name}",
        entity_type="leave",
        entity_id=leave.id
    )
    session.add(activity)
    await session.commit()
    
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


# --- Dashboard Stats ---

@app.get("/dashboard/stats")
async def get_dashboard_stats(
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """Get dashboard statistics based on user role."""
    school_id = current_user.school_id
    user_role = current_user.role
    user_id = current_user.user_id
    today = date.today()
    
    stats = {}
    
    # --- Common Stats ---
    
    # Total students count
    student_count_stmt = select(Student).where(
        and_(Student.school_id == school_id, Student.is_active == True)
    )
    student_result = await session.execute(student_count_stmt)
    all_students = student_result.scalars().all()
    stats["total_students"] = len(all_students)
    
    # Get all classes
    classes_stmt = select(Class).where(Class.school_id == school_id)
    classes_result = await session.execute(classes_stmt)
    all_classes = classes_result.scalars().all()
    stats["total_classes"] = len(all_classes)
    
    # Class-wise student distribution
    class_distribution = []
    for cls in all_classes:
        count = len([s for s in all_students if s.class_id == cls.id])
        class_distribution.append({
            "class_id": cls.id,
            "class_name": f"{cls.grade}-{cls.section}",
            "student_count": count
        })
    stats["class_distribution"] = sorted(class_distribution, key=lambda x: x["class_name"])
    
    # Get all teachers
    teachers_stmt = select(User).where(
        and_(User.school_id == school_id, User.role == "TEACHER")
    )
    teachers_result = await session.execute(teachers_stmt)
    all_teachers = teachers_result.scalars().all()
    stats["total_teachers"] = len(all_teachers)
    
    if user_role == "PRINCIPAL":
        # --- Principal-specific stats ---
        
        # Pending leave requests
        pending_leaves_stmt = select(LeaveRequest).where(
            and_(
                LeaveRequest.school_id == school_id,
                LeaveRequest.status == LeaveStatus.Pending
            )
        )
        pending_result = await session.execute(pending_leaves_stmt)
        pending_leaves = pending_result.scalars().all()
        stats["pending_leaves"] = len(pending_leaves)
        
        # Get recent pending leave requests with teacher info
        recent_leaves = []
        for leave in pending_leaves[:5]:  # Get latest 5
            teacher_stmt = select(User).where(User.id == leave.teacher_id)
            teacher_result = await session.execute(teacher_stmt)
            teacher = teacher_result.scalars().first()
            recent_leaves.append({
                "id": leave.id,
                "teacher_name": teacher.name if teacher else "Unknown",
                "start_date": leave.start_date.isoformat(),
                "end_date": leave.end_date.isoformat(),
                "reason": leave.reason,
                "status": leave.status.value
            })
        stats["recent_leave_requests"] = recent_leaves
        
        # Fee stats (placeholder - using hardcoded for now since fee module not fully implemented)
        stats["fee_stats"] = {
            "total_collected": 850000,
            "pending": 150000,
            "overdue": 45000,
            "collection_rate": 85
        }
        
        # Today's attendance (placeholder - attendance module not fully implemented)
        stats["attendance_today"] = {
            "present_percentage": 94,
            "total_present": int(stats["total_students"] * 0.94),
            "total_absent": int(stats["total_students"] * 0.06)
        }
        
    elif user_role == "TEACHER":
        # --- Teacher-specific stats ---
        
        # Get teacher's info including assigned classes
        teacher_stmt = select(User).where(User.id == user_id)
        teacher_result = await session.execute(teacher_stmt)
        teacher = teacher_result.scalars().first()
        
        assigned_class_ids = teacher.assigned_classes if teacher and teacher.assigned_classes else []
        
        # My students count (from assigned classes)
        my_students = [s for s in all_students if str(s.class_id) in assigned_class_ids]
        stats["my_students"] = len(my_students)
        
        # My classes with student count
        my_classes = []
        for cls in all_classes:
            if str(cls.id) in assigned_class_ids:
                count = len([s for s in all_students if s.class_id == cls.id])
                my_classes.append({
                    "class_id": cls.id,
                    "class_name": f"{cls.grade}-{cls.section}",
                    "student_count": count
                })
        stats["my_classes"] = my_classes
        
        # Today's schedule from timetable entries
        current_day = today.strftime("%A")  # Monday, Tuesday, etc.
        schedule_stmt = select(TimetableEntry).where(
            and_(
                TimetableEntry.school_id == school_id,
                TimetableEntry.teacher_id == user_id,
                TimetableEntry.day == current_day
            )
        )
        schedule_result = await session.execute(schedule_stmt)
        schedule_entries = schedule_result.scalars().all()
        
        # Build schedule with class and subject names
        today_schedule = []
        for entry in schedule_entries:
            # Get class name
            cls = next((c for c in all_classes if c.id == entry.class_id), None)
            class_name = f"{cls.grade}-{cls.section}" if cls else "Unknown"
            
            # Get subject name
            subject_stmt = select(Subject).where(Subject.id == entry.subject_id)
            subject_result = await session.execute(subject_stmt)
            subject = subject_result.scalars().first()
            subject_name = subject.name if subject else "Free Period"
            
            today_schedule.append({
                "slot_number": entry.slot_number,
                "class_name": class_name,
                "class_id": entry.class_id,
                "subject_name": subject_name
            })
        
        stats["today_schedule"] = sorted(today_schedule, key=lambda x: x["slot_number"])
        stats["classes_today"] = len(today_schedule)
        
        # My leave requests status
        my_leaves_stmt = select(LeaveRequest).where(
            and_(
                LeaveRequest.school_id == school_id,
                LeaveRequest.teacher_id == user_id
            )
        ).order_by(LeaveRequest.id.desc())
        my_leaves_result = await session.execute(my_leaves_stmt)
        my_leaves = my_leaves_result.scalars().all()
        
        pending_count = len([l for l in my_leaves if l.status == LeaveStatus.Pending])
        approved_count = len([l for l in my_leaves if l.status == LeaveStatus.Approved])
        
        stats["my_leave_status"] = {
            "pending": pending_count,
            "approved": approved_count,
            "total_this_year": len(my_leaves)
        }
    
    return stats


@app.get("/dashboard/timetable-config")
async def get_dashboard_timetable_config(
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """Get timetable config for dashboard schedule display."""
    school_id = current_user.school_id
    
    # Get school settings
    school = await session.get(School, school_id)
    if not school:
        return DEFAULT_TIMETABLE_CONFIG
    
    settings = school.settings or {}
    timetable_config = settings.get("timetable_config", DEFAULT_TIMETABLE_CONFIG)
    
    return timetable_config


# --- Birthday & Activity Endpoints ---

@app.get("/dashboard/birthdays")
async def get_birthdays(
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """Get students and teachers with birthdays this week."""
    school_id = current_user.school_id
    today = date.today()
    
    # Get dates for the next 7 days
    upcoming_birthdays = {
        "today": [],
        "this_week": []
    }
    
    # Get all active students
    students_stmt = select(Student).where(
        and_(Student.school_id == school_id, Student.is_active == True)
    )
    students_result = await session.execute(students_stmt)
    students = students_result.scalars().all()
    
    # Get all teachers
    teachers_stmt = select(User).where(
        and_(User.school_id == school_id, User.role == "TEACHER")
    )
    teachers_result = await session.execute(teachers_stmt)
    teachers = teachers_result.scalars().all()
    
    # Check students birthdays
    for student in students:
        if student.date_of_birth:
            # Check if birthday is today (month and day match)
            if student.date_of_birth.month == today.month and student.date_of_birth.day == today.day:
                # Get class info
                class_stmt = select(Class).where(Class.id == student.class_id)
                class_result = await session.execute(class_stmt)
                class_obj = class_result.scalars().first()
                class_name = f"{class_obj.grade}-{class_obj.section}" if class_obj else ""
                
                upcoming_birthdays["today"].append({
                    "type": "student",
                    "name": student.name,
                    "class": class_name,
                    "date": student.date_of_birth.isoformat(),
                    "age": today.year - student.date_of_birth.year
                })
            else:
                # Check if birthday is within next 7 days
                # Create a birthday date for this year
                try:
                    birthday_this_year = date(today.year, student.date_of_birth.month, student.date_of_birth.day)
                    days_until = (birthday_this_year - today).days
                    
                    if 0 < days_until <= 7:
                        # Get class info
                        class_stmt = select(Class).where(Class.id == student.class_id)
                        class_result = await session.execute(class_stmt)
                        class_obj = class_result.scalars().first()
                        class_name = f"{class_obj.grade}-{class_obj.section}" if class_obj else ""
                        
                        upcoming_birthdays["this_week"].append({
                            "type": "student",
                            "name": student.name,
                            "class": class_name,
                            "date": student.date_of_birth.isoformat(),
                            "days_until": days_until,
                            "age": today.year - student.date_of_birth.year
                        })
                except ValueError:
                    # Handle Feb 29 on non-leap years
                    pass
    
    # Check teachers birthdays (only those assigned to classes)
    for teacher in teachers:
        # Only include teachers who are assigned to at least one class
        if teacher.date_of_birth and teacher.assigned_classes and len(teacher.assigned_classes) > 0:
            # Check if birthday is today (month and day match)
            if teacher.date_of_birth.month == today.month and teacher.date_of_birth.day == today.day:
                # Get their assigned classes
                assigned_class_names = []
                for class_id_str in teacher.assigned_classes[:2]:  # Show first 2 classes
                    class_stmt = select(Class).where(Class.id == int(class_id_str))
                    class_result = await session.execute(class_stmt)
                    class_obj = class_result.scalars().first()
                    if class_obj:
                        assigned_class_names.append(f"{class_obj.grade}-{class_obj.section}")
                
                class_info = ", ".join(assigned_class_names) if assigned_class_names else "Class Teacher"
                
                upcoming_birthdays["today"].append({
                    "type": "teacher",
                    "name": teacher.name,
                    "class": class_info,
                    "date": teacher.date_of_birth.isoformat(),
                    "age": today.year - teacher.date_of_birth.year
                })
            else:
                # Check if birthday is within next 7 days
                try:
                    birthday_this_year = date(today.year, teacher.date_of_birth.month, teacher.date_of_birth.day)
                    days_until = (birthday_this_year - today).days
                    
                    if 0 < days_until <= 7:
                        # Get their assigned classes
                        assigned_class_names = []
                        for class_id_str in teacher.assigned_classes[:2]:  # Show first 2 classes
                            class_stmt = select(Class).where(Class.id == int(class_id_str))
                            class_result = await session.execute(class_stmt)
                            class_obj = class_result.scalars().first()
                            if class_obj:
                                assigned_class_names.append(f"{class_obj.grade}-{class_obj.section}")
                        
                        class_info = ", ".join(assigned_class_names) if assigned_class_names else "Class Teacher"
                        
                        upcoming_birthdays["this_week"].append({
                            "type": "teacher",
                            "name": teacher.name,
                            "class": class_info,
                            "date": teacher.date_of_birth.isoformat(),
                            "days_until": days_until,
                            "age": today.year - teacher.date_of_birth.year
                        })
                except ValueError:
                    # Handle Feb 29 on non-leap years
                    pass
    
    return {
        "today_count": len(upcoming_birthdays["today"]),
        "week_count": len(upcoming_birthdays["this_week"]),
        "today": upcoming_birthdays["today"],
        "this_week": sorted(upcoming_birthdays["this_week"], key=lambda x: x["days_until"])
    }


@app.get("/dashboard/recent-activity")
async def get_recent_activity(
    limit: int = 10,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """Get recent activity logs for the school."""
    school_id = current_user.school_id
    
    # Get recent activities
    stmt = select(ActivityLog).where(
        ActivityLog.school_id == school_id
    ).order_by(ActivityLog.created_at.desc()).limit(limit)
    
    result = await session.execute(stmt)
    activities = result.scalars().all()
    
    # Build response with user names
    activity_list = []
    for activity in activities:
        # Get user info
        user_stmt = select(User).where(User.id == activity.user_id)
        user_result = await session.execute(user_stmt)
        user = user_result.scalars().first()
        
        activity_list.append({
            "id": activity.id,
            "action": activity.action,
            "description": activity.description,
            "user_name": user.name if user else "Unknown",
            "entity_type": activity.entity_type,
            "entity_id": activity.entity_id,
            "created_at": activity.created_at.isoformat(),
            "time_ago": get_time_ago(activity.created_at)
        })
    
    return activity_list


def get_time_ago(dt: datetime) -> str:
    """Convert datetime to human-readable 'time ago' string."""
    now = datetime.utcnow()
    diff = now - dt
    
    seconds = diff.total_seconds()
    
    if seconds < 60:
        return "just now"
    elif seconds < 3600:
        minutes = int(seconds / 60)
        return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
    elif seconds < 86400:
        hours = int(seconds / 3600)
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    elif seconds < 604800:
        days = int(seconds / 86400)
        return f"{days} day{'s' if days != 1 else ''} ago"
    else:
        weeks = int(seconds / 604800)
        return f"{weeks} week{'s' if weeks != 1 else ''} ago"


@app.post("/activity-log/")
async def create_activity_log(
    action: str,
    description: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """Create an activity log entry."""
    activity = ActivityLog(
        school_id=current_user.school_id,
        user_id=current_user.user_id,
        action=action,
        description=description,
        entity_type=entity_type,
        entity_id=entity_id
    )
    
    session.add(activity)
    await session.commit()
    await session.refresh(activity)
    
    return {"message": "Activity logged successfully", "id": activity.id}

