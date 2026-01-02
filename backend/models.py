from typing import List, Optional, Any
from datetime import datetime, date
from enum import Enum
from sqlmodel import SQLModel, Field, JSON, Column
from pydantic import EmailStr

# --- Enums ---
class UserRole(str, Enum):
    PRINCIPAL = "PRINCIPAL"
    TEACHER = "TEACHER"
    ADMIN = "ADMIN"

class FeeStatus(str, Enum):
    PAID = "Paid"
    PENDING = "Pending"
    OVERDUE = "Overdue"

class ExamStatus(str, Enum):
    DRAFT = "Draft"
    PUBLISHED = "Published"

class CommunicationType(str, Enum):
    WHATSAPP = "WhatsApp"
    SMS = "SMS"
    EMAIL = "Email"

class AIResourceType(str, Enum):
    HOMEWORK = "Homework"
    LESSON_PLAN = "LessonPlan"
    WORKSHEET = "Worksheet"

class QueryStatus(str, Enum):
    RESOLVED = "Resolved"
    ESCALATED = "Escalated"
    PENDING = "Pending"

class LeaveStatus(str, Enum):
    Pending = "Pending"
    Approved = "Approved"
    Rejected = "Rejected"
    Cancelled = "Cancelled"

class PeriodType(str, Enum):
    REGULAR = "regular"
    BREAK = "break"
    LUNCH = "lunch"
    ASSEMBLY = "assembly"

class Gender(str, Enum):
    MALE = "M"
    FEMALE = "F"
    OTHER = "Other"

class BloodGroup(str, Enum):
    A_POSITIVE = "A+"
    A_NEGATIVE = "A-"
    B_POSITIVE = "B+"
    B_NEGATIVE = "B-"
    O_POSITIVE = "O+"
    O_NEGATIVE = "O-"
    AB_POSITIVE = "AB+"
    AB_NEGATIVE = "AB-"

# --- Timetable Configuration Models (Pydantic only, stored in School.settings) ---
class TimeSlot(SQLModel):
    """Individual time slot configuration"""
    slot_number: int
    name: str  # e.g., "Period 1", "Break", "Lunch"
    start_time: str  # "09:00"
    end_time: str  # "09:45"
    period_type: PeriodType = PeriodType.REGULAR

class TimetableConfig(SQLModel):
    """Complete timetable configuration for a school"""
    working_days: List[str] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    time_slots: List[TimeSlot] = []

# Default timetable configuration
DEFAULT_TIMETABLE_CONFIG = {
    "working_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    "time_slots": [
        {"slot_number": 1, "name": "Period 1", "start_time": "09:00", "end_time": "09:45", "period_type": "regular"},
        {"slot_number": 2, "name": "Period 2", "start_time": "09:45", "end_time": "10:30", "period_type": "regular"},
        {"slot_number": 3, "name": "Period 3", "start_time": "10:30", "end_time": "11:15", "period_type": "regular"},
        {"slot_number": 4, "name": "Break", "start_time": "11:15", "end_time": "11:30", "period_type": "break"},
        {"slot_number": 5, "name": "Period 4", "start_time": "11:30", "end_time": "12:15", "period_type": "regular"},
        {"slot_number": 6, "name": "Period 5", "start_time": "12:15", "end_time": "13:00", "period_type": "regular"},
        {"slot_number": 7, "name": "Lunch", "start_time": "13:00", "end_time": "13:45", "period_type": "lunch"},
        {"slot_number": 8, "name": "Period 6", "start_time": "13:45", "end_time": "14:30", "period_type": "regular"},
        {"slot_number": 9, "name": "Period 7", "start_time": "14:30", "end_time": "15:15", "period_type": "regular"},
    ]
}

# --- Core Models ---

class SchoolCreate(SQLModel):
    name: str
    address: str
    contact_email: EmailStr
    contact_phone: str
    settings: Optional[dict] = Field(default_factory=dict, sa_column=Column(JSON))
    subscription_plan: str = "Free"

class School(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    address: str
    contact_email: EmailStr
    contact_phone: str
    settings: Optional[dict] = Field(default_factory=dict, sa_column=Column(JSON))
    subscription_plan: str = "Free"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    school_id: int = Field(foreign_key="school.id")
    name: str
    email: EmailStr = Field(unique=True, index=True)
    password_hash: str
    role: UserRole
    assigned_classes: Optional[List[str]] = Field(default=None, sa_column=Column(JSON)) # List of Class IDs
    created_at: datetime = Field(default_factory=datetime.utcnow)

# --- Auth Request Models (Pydantic only, not DB tables) ---
class UserCreate(SQLModel):
    school_id: int
    name: str
    email: EmailStr
    password: str
    role: UserRole

class UserLogin(SQLModel):
    email: EmailStr
    password: str

class Token(SQLModel):
    access_token: str
    token_type: str


class Student(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    school_id: int = Field(foreign_key="school.id")
    admission_number: str = Field(index=True)  # Unique per school
    name: str
    date_of_birth: date
    gender: Gender
    class_id: int = Field(foreign_key="class.id")  # FK to Class table
    roll_no: str
    address: Optional[str] = None
    father_name: str
    mother_name: Optional[str] = None
    father_occupation: Optional[str] = None
    mother_occupation: Optional[str] = None
    annual_income: Optional[float] = None
    contact_number: str
    parent_email: Optional[EmailStr] = None
    blood_group: Optional[BloodGroup] = None
    date_of_admission: date = Field(default_factory=date.today)
    is_active: bool = Field(default=True)  # For students who leave mid-year
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# --- Student Request/Response Models ---
class StudentCreate(SQLModel):
    admission_number: str
    name: str
    date_of_birth: date
    gender: Gender
    class_id: int
    roll_no: str
    address: Optional[str] = None
    father_name: str
    mother_name: Optional[str] = None
    father_occupation: Optional[str] = None
    mother_occupation: Optional[str] = None
    annual_income: Optional[float] = None
    contact_number: str
    parent_email: Optional[EmailStr] = None
    blood_group: Optional[BloodGroup] = None
    date_of_admission: Optional[date] = None  # Will default to today if not provided

class StudentUpdate(SQLModel):
    name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[Gender] = None
    class_id: Optional[int] = None
    roll_no: Optional[str] = None
    address: Optional[str] = None
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    father_occupation: Optional[str] = None
    mother_occupation: Optional[str] = None
    annual_income: Optional[float] = None
    contact_number: Optional[str] = None
    parent_email: Optional[EmailStr] = None
    blood_group: Optional[BloodGroup] = None
    is_active: Optional[bool] = None

class StudentRead(SQLModel):
    id: int
    admission_number: str
    name: str
    date_of_birth: date
    gender: Gender
    class_id: int
    class_name: Optional[str] = None  # Will be populated: "10-A"
    roll_no: str
    address: Optional[str]
    father_name: str
    mother_name: Optional[str]
    father_occupation: Optional[str]
    mother_occupation: Optional[str]
    annual_income: Optional[float]
    contact_number: str
    parent_email: Optional[EmailStr]
    blood_group: Optional[BloodGroup]
    date_of_admission: date
    is_active: bool
    created_at: datetime

class StudentBulkCreate(SQLModel):
    students: List[StudentCreate]

# Paginated response for students
class StudentPaginatedResponse(SQLModel):
    items: List[StudentRead]
    total: int
    page: int
    page_size: int
    total_pages: int

class Class(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    school_id: int = Field(foreign_key="school.id")
    grade: str
    section: str
    class_teacher_id: Optional[int] = Field(default=None, foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ClassCreate(SQLModel):
    grade: str
    section: str
    class_teacher_id: Optional[int] = None

class ClassRead(SQLModel):
    id: int
    grade: str
    section: str
    class_teacher_id: Optional[int]
    class_teacher_name: Optional[str] = None
    student_count: int = 0  # Number of students in this class
    can_edit: bool = True  # Whether current user can add/edit students in this class
    created_at: datetime

class Subject(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    school_id: int = Field(foreign_key="school.id")
    name: str
    code: Optional[str] = None  # e.g., "MATH101"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SubjectCreate(SQLModel):
    name: str
    code: Optional[str] = None

class SubjectRead(SQLModel):
    id: int
    name: str
    code: Optional[str]
    created_at: datetime
    
class Attendance(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    school_id: int = Field(foreign_key="school.id")
    date: date
    class_name: str
    section: str
    absent_student_ids: List[str] = Field(sa_column=Column(JSON))
    marked_by: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Fee(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    school_id: int = Field(foreign_key="school.id")
    student_id: int = Field(foreign_key="student.id")
    amount_due: float
    due_date: date
    status: FeeStatus
    reminders_sent_count: int = 0
    last_reminder_sent: Optional[datetime] = None

# Helper model for JSON field in Timetable
class TimetablePeriod(SQLModel):
    time_slot: str
    subject: str
    teacher_id: Optional[int] = None

class Timetable(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    school_id: int = Field(foreign_key="school.id")
    class_name: str
    section: str
    day: str # Monday, Tuesday, etc.
    periods: List[dict] = Field(sa_column=Column(JSON)) # Storing list of TimetablePeriod as JSON

# Timetable Entry - individual period assignment
class TimetableEntry(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    school_id: int = Field(foreign_key="school.id")
    class_id: int = Field(foreign_key="class.id")
    day: str  # Monday, Tuesday, etc.
    slot_number: int  # Period number (matches TimeSlot.slot_number)
    subject_id: Optional[int] = Field(default=None, foreign_key="subject.id")
    teacher_id: Optional[int] = Field(default=None, foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class TimetableEntryCreate(SQLModel):
    class_id: int
    day: str
    slot_number: int
    subject_id: Optional[int] = None
    teacher_id: Optional[int] = None

class TimetableEntryRead(SQLModel):
    id: int
    class_id: int
    class_name: Optional[str] = None  # For teacher view
    day: str
    slot_number: int
    subject_id: Optional[int]
    subject_name: Optional[str] = None
    teacher_id: Optional[int]
    teacher_name: Optional[str] = None

class TimetableBulkUpdate(SQLModel):
    """For updating multiple entries at once"""
    entries: List[TimetableEntryCreate]

class Exam(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    school_id: int = Field(foreign_key="school.id")
    name: str
    start_date: date
    end_date: date
    classes_involved: List[str] = Field(sa_column=Column(JSON))
    status: ExamStatus
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Mark(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    school_id: int = Field(foreign_key="school.id")
    exam_id: int = Field(foreign_key="exam.id")
    student_id: int = Field(foreign_key="student.id")
    subject: str
    score: float
    max_marks: float
    graded_by: Optional[int] = Field(default=None, foreign_key="user.id")

class Communication(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    school_id: int = Field(foreign_key="school.id")
    type: CommunicationType
    recipient_count: int
    content: str
    status: str # Sent, Failed
    sent_at: datetime = Field(default_factory=datetime.utcnow)
    sent_by: int = Field(foreign_key="user.id")

class AIResource(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    school_id: int = Field(foreign_key="school.id")
    type: AIResourceType
    title: str
    content: dict = Field(default_factory=dict, sa_column=Column(JSON))
    generated_by: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ParentQuery(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    school_id: int = Field(foreign_key="school.id")
    parent_id: Optional[int] = None # Link to student/parent if possible
    student_id: Optional[int] = Field(default=None, foreign_key="student.id")
    query_text: str
    ai_response: Optional[str] = None
    status: QueryStatus
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class LeaveRequest(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    school_id: int = Field(foreign_key="school.id")
    teacher_id: int = Field(foreign_key="user.id")
    start_date: date
    end_date: date
    reason: str
    hours: Optional[int] = None  # Optional hours for partial day leave
    status: LeaveStatus = Field(default=LeaveStatus.Pending)
    admin_comment: Optional[str] = None
    teacher_comment: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class LeaveRequestRead(LeaveRequest):
    teacher_name: str
