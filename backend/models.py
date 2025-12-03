from typing import List, Optional, Any
from datetime import datetime, date
from enum import Enum
from sqlmodel import SQLModel, Field, JSON, Column
from pydantic import EmailStr

# --- Enums ---
class UserRole(str, Enum):
    PRINCIPAL = "principal"
    TEACHER = "teacher"
    ADMIN = "admin"

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
    name: str
    roll_no: str
    class_name: str = Field(..., alias="class_") # 'class' is reserved
    section: str
    parent_name: str
    parent_phone: str
    parent_email: Optional[EmailStr] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Class(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    school_id: int = Field(foreign_key="school.id")
    grade: str
    section: str
    class_teacher_id: Optional[int] = Field(default=None, foreign_key="user.id")
    
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
