"""
Seed script to populate database with South Indian school dummy data.
This will create:
- A school
- Principal and teachers
- Classes
- Students
- Timetable entries
- Leave requests
- Activity logs
Principal: principal@school78.edu.in / principal123
Teachers: [firstname.lastname]@school78.edu.in / teacher123
"""

import asyncio
import sys
from pathlib import Path
from datetime import datetime, date, timedelta
import random

# Add parent directory to path to import modules
sys.path.append(str(Path(__file__).parent))

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from database import engine
from sqlmodel import select
from models import (
    School, User, Student, Class, Subject, TimetableEntry, 
    LeaveRequest, ActivityLog, UserRole, Gender, LeaveStatus
)
from auth_utils import get_password_hash

# South Indian names
MALE_FIRST_NAMES = [
    "Arun", "Karthik", "Rajesh", "Venkat", "Suresh", "Ramesh", "Kumar", "Vijay",
    "Arjun", "Krishna", "Prakash", "Ganesh", "Mahesh", "Dinesh", "Naveen", "Praveen",
    "Sanjay", "Ravi", "Anand", "Ashok", "Mohan", "Gopal", "Raju", "Babu"
]

FEMALE_FIRST_NAMES = [
    "Lakshmi", "Priya", "Divya", "Kavya", "Ananya", "Shreya", "Pooja", "Anjali",
    "Deepika", "Meera", "Radha", "Sita", "Geetha", "Sangeetha", "Revathi", "Nandini",
    "Vasantha", "Kamala", "Padma", "Uma", "Shakti", "Durga", "Saraswati", "Parvathi"
]

LAST_NAMES = [
    "Kumar", "Reddy", "Rao", "Naidu", "Iyer", "Iyengar", "Sharma", "Nair",
    "Menon", "Pillai", "Krishnan", "Raman", "Swamy", "Murthy", "Sastry", "Acharya",
    "Bhat", "Shetty", "Gowda", "Hegde", "Pai", "Kamath", "Prabhu", "Amin"
]

SUBJECTS = [
    "English", "Tamil", "Mathematics", "Science", "Social Science",
    "Computer Science", "Physical Education", "Art", "Music"
]

GRADES = ["6", "7", "8", "9", "10"]
SECTIONS = ["A", "B", "C"]

ROOMS = [
    "101", "102", "103", "104", "105", "106", "107", "108", "109", "110",
    "201", "202", "203", "204", "205", "206", "207", "208", "209", "210",
    "Lab-1", "Lab-2", "Playground", "Music Room", "Art Room"
]

# Time slots for timetable
TIME_SLOTS = [
    {"slot": 1, "start": "08:30", "end": "09:20", "name": "Period 1"},
    {"slot": 2, "start": "09:20", "end": "10:10", "name": "Period 2"},
    {"slot": 3, "start": "10:10", "end": "10:30", "name": "Break", "is_break": True},
    {"slot": 4, "start": "10:30", "end": "11:20", "name": "Period 3"},
    {"slot": 5, "start": "11:20", "end": "12:10", "name": "Period 4"},
    {"slot": 6, "start": "12:10", "end": "13:00", "name": "Lunch", "is_break": True},
    {"slot": 7, "start": "13:00", "end": "13:50", "name": "Period 5"},
    {"slot": 8, "start": "13:50", "end": "14:40", "name": "Period 6"},
]

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]


def generate_name(gender: str) -> str:
    """Generate a random South Indian name."""
    first_names = MALE_FIRST_NAMES if gender == "M" else FEMALE_FIRST_NAMES
    first = random.choice(first_names)
    last = random.choice(LAST_NAMES)
    return f"{first} {last}"


def generate_phone() -> str:
    """Generate a random phone number."""
    return f"+91 {random.randint(7000000000, 9999999999)}"


def generate_email(name: str) -> str:
    """Generate email from name."""
    clean_name = name.lower().replace(" ", ".")
    return f"{clean_name}@school.edu.in"


async def seed_database():
    """Seed the database with South Indian school data."""
    
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        print("[*] Starting database seeding...")
        
        # Check if data already exists
        result = await session.execute(select(School).limit(1))
        existing_school = result.scalars().first()
        
        if existing_school:
            print(f"\n[!] Data already exists in database!")
            print(f"   Found school: {existing_school.name}")
            print(f"\n[?] Do you want to:")
            print(f"   1. Skip seeding (existing data will be kept)")
            print(f"   2. Add new school (will create additional school)")
            print(f"   3. Exit")
            choice = input("\nEnter choice (1/2/3): ").strip()
            
            if choice == "3":
                print("[X] Seeding cancelled")
                return
            elif choice == "2":
                # Continue with new school
                school_name = f"Sri Venkateswara High School {random.randint(2, 99)}"
                email_suffix = f"school{random.randint(2, 99)}.edu.in"
            else:
                print("[OK] Using existing data")
                return
        else:
            school_name = "Sri Venkateswara High School"
            email_suffix = "srivenkateshwara.edu.in"
        
        # 1. Create School
        print("\n[*] Creating school...")
        school = School(
            name=school_name,
            address="123, Anna Salai, T. Nagar, Chennai, Tamil Nadu 600017",
            contact_phone="+91 44 2434 5678",
            contact_email=f"admin@{email_suffix}",
            settings={
                "academic_year": "2025-2026",
                "school_timings": "08:30 AM - 03:00 PM",
                "timetable_config": {
                    "time_slots": TIME_SLOTS,
                    "days": DAYS
                }
            }
        )
        session.add(school)
        await session.commit()
        await session.refresh(school)
        school_id = school.id
        print(f"[OK] Created school: {school.name} (ID: {school_id})")
        
        # 2. Create Principal
        print("\n[*] Creating principal...")
        principal_email = f"principal@{email_suffix}"
        principal = User(
            school_id=school_id,
            name="Dr. Rajendran Kumar",
            email=principal_email,
            password_hash=get_password_hash("principal123"),
            role=UserRole.PRINCIPAL,
            date_of_birth=date(1975, 8, 15)
        )
        session.add(principal)
        await session.commit()
        print(f"[OK] Created principal: {principal.name}")
        print(f"    Email: {principal.email} | Password: principal123")
        
        # 3. Create Classes
        print("\n[*] Creating classes...")
        classes_created = []
        for grade in GRADES:
            for section in SECTIONS:
                class_obj = Class(
                    school_id=school_id,
                    grade=grade,
                    section=section
                )
                session.add(class_obj)
                classes_created.append(class_obj)
        
        await session.commit()
        for cls in classes_created:
            await session.refresh(cls)
        print(f"[OK] Created {len(classes_created)} classes (Grades 6-10, Sections A-C)")
        
        # 4. Create Teachers
        print("\n[*] Creating teachers...")
        teachers = []
        teacher_count = 12
        
        for i in range(teacher_count):
            gender = random.choice(["M", "F"])
            name = generate_name(gender)
            
            # Assign 2-3 random classes to each teacher
            assigned_class_ids = random.sample(
                [str(cls.id) for cls in classes_created], 
                k=random.randint(2, 3)
            )
            
            teacher_email = generate_email(name).replace("@school.edu.in", f"@{email_suffix}")
            
            teacher = User(
                school_id=school_id,
                name=name,
                email=teacher_email,
                password_hash=get_password_hash("teacher123"),
                role=UserRole.TEACHER,
                date_of_birth=date(
                    random.randint(1980, 1995),
                    random.randint(1, 12),
                    random.randint(1, 28)
                ),
                assigned_classes=assigned_class_ids
            )
            session.add(teacher)
            teachers.append(teacher)
        
        await session.commit()
        for teacher in teachers:
            await session.refresh(teacher)
        
        print(f"[OK] Created {len(teachers)} teachers")
        print(f"    All teacher emails follow pattern: firstname.lastname@{email_suffix}")
        print(f"    All teacher passwords: teacher123")
        
        # Assign class teachers
        print("\n[*] Assigning class teachers...")
        for cls in classes_created:
            cls.class_teacher_id = random.choice(teachers).id
        await session.commit()
        print(f"[OK] Assigned class teachers to all classes")
        
        # 5. Create Subjects
        print("\n[*] Creating subjects...")
        subjects_created = []
        for subject_name in SUBJECTS:
            subject = Subject(
                school_id=school_id,
                name=subject_name,
                code=subject_name[:3].upper()
            )
            session.add(subject)
            subjects_created.append(subject)
        
        await session.commit()
        for subj in subjects_created:
            await session.refresh(subj)
        print(f"[OK] Created {len(subjects_created)} subjects")
        
        # 6. Create Students
        print("\n[*] Creating students...")
        students_created = []
        
        for cls in classes_created:
            # 35-45 students per class
            num_students = random.randint(35, 45)
            
            for roll_no in range(1, num_students + 1):
                gender = random.choice(["M", "F"])
                name = generate_name(gender)
                father_name = generate_name("M")
                mother_name = generate_name("F")
                
                # Some students have birthdays this month
                if random.random() < 0.15:  # 15% chance
                    dob = date(
                        random.randint(2010, 2014),
                        1,  # January
                        random.randint(1, 28)
                    )
                else:
                    dob = date(
                        random.randint(2010, 2014),
                        random.randint(1, 12),
                        random.randint(1, 28)
                    )
                
                student = Student(
                    school_id=school_id,
                    admission_number=f"SV{cls.grade}{cls.section}{roll_no:03d}",
                    name=name,
                    date_of_birth=dob,
                    gender=Gender.MALE if gender == "M" else Gender.FEMALE,
                    class_id=cls.id,
                    roll_no=str(roll_no),
                    address=f"{random.randint(1, 999)}, {random.choice(['Anna Nagar', 'Adyar', 'Velachery', 'Tambaram', 'Chromepet'])}, Chennai",
                    father_name=father_name,
                    mother_name=mother_name,
                    father_occupation=random.choice(["Engineer", "Doctor", "Teacher", "Business", "Bank Employee", "Government Employee"]),
                    mother_occupation=random.choice(["Teacher", "Homemaker", "Doctor", "Nurse", "Bank Employee", "Software Engineer"]),
                    annual_income=random.choice([500000, 750000, 1000000, 1500000, 2000000]),
                    contact_number=generate_phone(),
                    parent_email=generate_email(father_name),
                    blood_group=random.choice(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]),
                    date_of_admission=date(2025, 6, 1),
                    is_active=True
                )
                session.add(student)
                students_created.append(student)
        
        await session.commit()
        print(f"[OK] Created {len(students_created)} students across all classes")
        
        # 7. Create Timetable Entries
        print("\n[*] Creating timetable entries...")
        timetable_count = 0
        
        for cls in classes_created:
            for day in DAYS:
                # Get regular periods (slots 1-8, excluding breaks)
                regular_slots = [1, 2, 3, 5, 6, 8]  # Periods (slot 4 is break, 7 is lunch)
                
                # Assign subjects to periods
                day_subjects = random.sample(subjects_created, min(len(regular_slots), len(subjects_created)))
                
                for i, slot_num in enumerate(regular_slots):
                    if i < len(day_subjects):
                        subject = day_subjects[i]
                        teacher = random.choice(teachers)
                        
                        entry = TimetableEntry(
                            school_id=school_id,
                            class_id=cls.id,
                            subject_id=subject.id,
                            teacher_id=teacher.id,
                            day=day,
                            slot_number=slot_num
                        )
                        session.add(entry)
                        timetable_count += 1
        
        await session.commit()
        print(f"[OK] Created {timetable_count} timetable entries")
        
        # 8. Create Leave Requests
        print("\n[*] Creating leave requests...")
        leave_requests = []
        
        # Teacher leaves (only teachers as per current model)
        for _ in range(40):
            teacher = random.choice(teachers)
            start_date = date.today() + timedelta(days=random.randint(-30, 30))
            days = random.randint(1, 3)
            
            leave = LeaveRequest(
                school_id=school_id,
                teacher_id=teacher.id,
                start_date=start_date,
                end_date=start_date + timedelta(days=days),
                reason=random.choice([
                    "Personal work",
                    "Medical appointment",
                    "Family function",
                    "Sick leave",
                    "Out of station"
                ]),
                status=random.choice([LeaveStatus.Pending, LeaveStatus.Approved, LeaveStatus.Rejected])
            )
            session.add(leave)
            leave_requests.append(leave)
        
        await session.commit()
        print(f"[OK] Created {len(leave_requests)} leave requests")
        
        # 9. Create Activity Logs
        print("\n[*] Creating activity logs...")
        activities = []
        
        for i in range(30):
            activity = ActivityLog(
                school_id=school_id,
                user_id=random.choice([principal.id] + [t.id for t in teachers]),
                action=random.choice([
                    "Student Added",
                    "Leave Approved",
                    "Leave Rejected",
                    "Class Created",
                    "Timetable Updated"
                ]),
                description=random.choice([
                    "New student admission processed",
                    "Leave request approved for teacher",
                    "Student leave request rejected",
                    "New class section added",
                    "Timetable modified for next week"
                ]),
                entity_type=random.choice(["student", "leave", "class", "timetable"]),
                entity_id=random.randint(1, 100),
                created_at=datetime.now() - timedelta(days=random.randint(0, 30))
            )
            session.add(activity)
            activities.append(activity)
        
        await session.commit()
        print(f"[OK] Created {len(activities)} activity logs")
        
        print("\n" + "="*60)
        print("[SUCCESS] Database seeding completed successfully!")
        print("="*60)
        print("\n[*] Summary:")
        print(f"  • School: {school.name}")
        print(f"  • Principal: 1")
        print(f"  • Teachers: {len(teachers)}")
        print(f"  • Classes: {len(classes_created)}")
        print(f"  • Subjects: {len(subjects_created)}")
        print(f"  • Students: {len(students_created)}")
        print(f"  • Timetable Entries: {timetable_count}")
        print(f"  • Leave Requests: {len(leave_requests)}")
        print(f"  • Activity Logs: {len(activities)}")
        
        print("\n[*] Login Credentials:")
        print(f"  Principal: {principal_email} / principal123")
        print(f"  Teachers: [firstname.lastname]@{email_suffix} / teacher123")
        print(f"  Example: {teachers[0].email} / teacher123")
        
        print("\n[*] Note:")
        print("  - Some students have birthdays in January (current month)")
        print("  - Some teachers have birthdays configured")
        print("  - Leave requests span past, present, and future dates")
        print("  - All data uses South Indian names and locations")


if __name__ == "__main__":
    print("[START] South Indian School Data Seeder")
    print("="*60)
    asyncio.run(seed_database())
