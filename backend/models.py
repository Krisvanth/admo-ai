from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Any
from datetime import datetime, date
from enum import Enum

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

class School(BaseModel):
    name: str
    address: str
    contact_email: EmailStr
    contact_phone: str
    settings: Optional[dict] = Field(default_factory=dict, description="Theme, logo, etc.")
    subscription_plan: str = "Free"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class User(BaseModel):
    school_id: str
    name: str
    email: EmailStr
    password_hash: str
    role: UserRole
    assigned_classes: Optional[List[str]] = Field(default=None, description="List of Class IDs for teachers")
    created_at: datetime = Field(default_factory=datetime.utcnow)

# --- Auth Request Models ---
class UserCreate(BaseModel):
    school_id: str
    name: str
    email: EmailStr
    password: str
    role: UserRole

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str


class Student(BaseModel):
    school_id: str
    name: str
    roll_no: str
    class_name: str = Field(..., alias="class") # 'class' is a reserved keyword
    section: str
    parent_name: str
    parent_phone: str
    parent_email: Optional[EmailStr] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Class(BaseModel):
    school_id: str
    grade: str
    section: str
    class_teacher_id: Optional[str] = None
    
class Attendance(BaseModel):
    school_id: str
    date: date
    class_name: str = Field(..., alias="class")
    section: str
    absent_student_ids: List[str]
    marked_by: str # User ID
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Fee(BaseModel):
    school_id: str
    student_id: str
    amount_due: float
    due_date: date
    status: FeeStatus
    reminders_sent_count: int = 0
    last_reminder_sent: Optional[datetime] = None

class TimetablePeriod(BaseModel):
    time_slot: str
    subject: str
    teacher_id: Optional[str] = None

class Timetable(BaseModel):
    school_id: str
    class_name: str = Field(..., alias="class")
    section: str
    day: str # Monday, Tuesday, etc.
    periods: List[TimetablePeriod]

class Exam(BaseModel):
    school_id: str
    name: str
    start_date: date
    end_date: date
    classes_involved: List[str]
    status: ExamStatus
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Mark(BaseModel):
    school_id: str
    exam_id: str
    student_id: str
    subject: str
    score: float
    max_marks: float
    graded_by: Optional[str] = None # Teacher ID

class Communication(BaseModel):
    school_id: str
    type: CommunicationType
    recipient_count: int
    content: str
    status: str # Sent, Failed
    sent_at: datetime = Field(default_factory=datetime.utcnow)
    sent_by: str # User ID

class AIResource(BaseModel):
    school_id: str
    type: AIResourceType
    title: str
    content: Any # Can be JSON, text, or structure for the resource
    generated_by: str # User ID
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ParentQuery(BaseModel):
    school_id: str
    parent_id: Optional[str] = None # Link to student/parent if possible
    student_id: Optional[str] = None
    query_text: str
    ai_response: Optional[str] = None
    status: QueryStatus
    timestamp: datetime = Field(default_factory=datetime.utcnow)
