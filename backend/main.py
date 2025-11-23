from fastapi import FastAPI, HTTPException
from contextlib import asynccontextmanager
from database import db
from models import (
    School, User, Student, Class, Attendance, Fee, Timetable, Exam, Mark, 
    Communication, AIResource, ParentQuery, UserCreate, UserLogin, Token
)
from auth_utils import get_password_hash, verify_password, create_access_token
from typing import List
from datetime import timedelta

# ... (lifespan and app init) ...

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB
    db.connect()
    yield
    # Shutdown: Close connection
    db.close()

from fastapi.middleware.cors import CORSMiddleware

# ... (lifespan definition) ...

app = FastAPI(title="Admo AI API", lifespan=lifespan)

# CORS Configuration
origins = [
    "http://localhost:5173",  # Vite default port
    "http://localhost:3000",  # React default port (just in case)
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
    return {"message": "Welcome to Admo AI API", "status": "running"}

# --- Authentication ---

@app.post("/auth/signup", response_model=User)
async def signup(user: UserCreate):
    database = db.get_db()
    
    # Check if user exists
    existing_user = await database["users"].find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = get_password_hash(user.password)
    
    # Create User document
    user_doc = User(
        school_id=user.school_id,
        name=user.name,
        email=user.email,
        password_hash=hashed_password,
        role=user.role
    )
    
    await database["users"].insert_one(user_doc.model_dump())
    return user_doc

@app.post("/auth/login", response_model=Token)
async def login(user_credentials: UserLogin):
    database = db.get_db()
    
    # Find user
    user = await database["users"].find_one({"email": user_credentials.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    if not verify_password(user_credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Generate Token
    access_token = create_access_token(
        data={"sub": user["email"], "role": user["role"], "school_id": user["school_id"]}
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

# --- Users (Teachers/Principals) ---
@app.get("/users/", response_model=List[User])
async def list_users():
    database = db.get_db()
    users = []
    async for doc in database["users"].find():
        users.append(User(**doc))
    return users

# --- Classes ---
@app.post("/classes/", response_model=Class)
async def create_class(class_obj: Class):
    database = db.get_db()
    class_dict = class_obj.model_dump()
    await database["classes"].insert_one(class_dict)
    return class_obj

@app.get("/classes/", response_model=List[Class])
async def list_classes():
    database = db.get_db()
    classes = []
    async for doc in database["classes"].find():
        classes.append(Class(**doc))
    return classes

# --- Students ---
@app.post("/students/", response_model=Student)
async def create_student(student: Student):
    database = db.get_db()
    student_dict = student.model_dump()
    await database["students"].insert_one(student_dict)
    return student

@app.get("/students/", response_model=List[Student])
async def list_students():
    database = db.get_db()
    students = []
    async for doc in database["students"].find():
        students.append(Student(**doc))
    return students

# --- Attendance ---
@app.post("/attendance/", response_model=Attendance)
async def mark_attendance(attendance: Attendance):
    database = db.get_db()
    attendance_dict = attendance.model_dump()
    await database["attendance"].insert_one(attendance_dict)
    return attendance

@app.get("/attendance/", response_model=List[Attendance])
async def get_attendance():
    database = db.get_db()
    records = []
    async for doc in database["attendance"].find():
        records.append(Attendance(**doc))
    return records

# --- Fees ---
@app.post("/fees/", response_model=Fee)
async def create_fee(fee: Fee):
    database = db.get_db()
    await database["fees"].insert_one(fee.model_dump())
    return fee

@app.get("/fees/", response_model=List[Fee])
async def list_fees():
    database = db.get_db()
    fees = []
    async for doc in database["fees"].find():
        fees.append(Fee(**doc))
    return fees

# --- Timetables ---
@app.post("/timetables/", response_model=Timetable)
async def create_timetable(timetable: Timetable):
    database = db.get_db()
    await database["timetables"].insert_one(timetable.model_dump())
    return timetable

@app.get("/timetables/", response_model=List[Timetable])
async def list_timetables():
    database = db.get_db()
    timetables = []
    async for doc in database["timetables"].find():
        timetables.append(Timetable(**doc))
    return timetables

# --- Exams & Marks ---
@app.post("/exams/", response_model=Exam)
async def create_exam(exam: Exam):
    database = db.get_db()
    await database["exams"].insert_one(exam.model_dump())
    return exam

@app.get("/exams/", response_model=List[Exam])
async def list_exams():
    database = db.get_db()
    exams = []
    async for doc in database["exams"].find():
        exams.append(Exam(**doc))
    return exams

@app.post("/marks/", response_model=Mark)
async def submit_mark(mark: Mark):
    database = db.get_db()
    await database["marks"].insert_one(mark.model_dump())
    return mark

@app.get("/marks/", response_model=List[Mark])
async def list_marks():
    database = db.get_db()
    marks = []
    async for doc in database["marks"].find():
        marks.append(Mark(**doc))
    return marks

# --- Communications & AI ---
@app.post("/communications/", response_model=Communication)
async def send_communication(comm: Communication):
    database = db.get_db()
    await database["communications"].insert_one(comm.model_dump())
    return comm

@app.get("/communications/", response_model=List[Communication])
async def list_communications():
    database = db.get_db()
    comms = []
    async for doc in database["communications"].find():
        comms.append(Communication(**doc))
    return comms

@app.post("/ai-resources/", response_model=AIResource)
async def create_ai_resource(resource: AIResource):
    database = db.get_db()
    await database["ai_resources"].insert_one(resource.model_dump())
    return resource

@app.get("/ai-resources/", response_model=List[AIResource])
async def list_ai_resources():
    database = db.get_db()
    resources = []
    async for doc in database["ai_resources"].find():
        resources.append(AIResource(**doc))
    return resources

@app.post("/parent-queries/", response_model=ParentQuery)
async def create_query(query: ParentQuery):
    database = db.get_db()
    await database["parent_queries"].insert_one(query.model_dump())
    return query

@app.get("/parent-queries/", response_model=List[ParentQuery])
async def list_queries():
    database = db.get_db()
    queries = []
    async for doc in database["parent_queries"].find():
        queries.append(ParentQuery(**doc))
    return queries

# --- Schools ---
@app.post("/schools/", response_model=School)
async def create_school(school: School):
    """
    Create a new school.
    This is a test endpoint to verify DB connection and Schema validation.
    """
    database = db.get_db()
    if database is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    # Convert Pydantic model to dict
    school_dict = school.model_dump()
    
    # Insert into MongoDB
    # Note: In a real app, handle duplicates and errors
    result = await database["schools"].insert_one(school_dict)
    
    return school

@app.get("/schools/", response_model=List[School])
async def list_schools():
    """
    List all schools.
    """
    database = db.get_db()
    schools = []
    if database is not None:
        cursor = database["schools"].find()
        async for document in cursor:
            # MongoDB returns _id, but our model doesn't have it explicitly defined yet
            # For simplicity in this MVP step, we ignore _id or let Pydantic handle it if configured
            schools.append(School(**document))
    return schools
