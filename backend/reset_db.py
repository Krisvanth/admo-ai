"""
Admo AI - Database Reset Script

This script DROPS all tables and RECREATES them from the current models.
Use this when your database schema is out of sync with your models.

WARNING: This will DELETE ALL DATA and RESET the schema!

Usage:
    python reset_db.py          # Interactive mode with confirmation
    python reset_db.py --force  # Skip confirmation (use with caution!)
"""

import asyncio
import sys
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from sqlmodel import SQLModel

from config import settings

# Import all models to ensure they're registered with SQLModel
from models import (
    School, User, Student, Class, Subject, Attendance, Fee,
    Timetable, TimetableEntry, Exam, Mark, Communication,
    AIResource, ParentQuery, LeaveRequest, ActivityLog
)


async def get_all_table_names(session: AsyncSession) -> list[str]:
    """Get all table names in the public schema."""
    result = await session.execute(
        text("""
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public'
        """)
    )
    return [row[0] for row in result.fetchall()]


async def reset_database(force: bool = False):
    """
    Drop all tables and recreate them from models.
    """
    print("=" * 60)
    print("[RESET] ADMO AI - DATABASE RESET SCRIPT")
    print("=" * 60)
    print(f"\n[*] Database: {settings.POSTGRES_DB}")
    print(f"[*] Host: {settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}")
    print(f"[*] User: {settings.POSTGRES_USER}")
    print()
    
    if not force:
        print("[WARNING] This will DROP ALL TABLES and RECREATE them!")
        print("          All data will be PERMANENTLY DELETED!")
        print("          This action CANNOT be undone!\n")
        
        confirmation = input("Type 'RESET' to confirm: ")
        if confirmation != "RESET":
            print("\n[X] Operation cancelled.")
            return
    
    print("\n[*] Connecting to database...")
    
    # Create async engine
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=False,
        future=True
    )
    
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    try:
        # First, drop ALL tables using raw SQL with CASCADE
        async with async_session() as session:
            tables = await get_all_table_names(session)
            
            if tables:
                print(f"\n[*] Found {len(tables)} existing tables to drop:")
                for table in tables:
                    print(f"    - {table}")
                
                print("\n[*] Dropping all tables with CASCADE...")
                
                # Drop all tables at once using CASCADE
                for table in tables:
                    try:
                        await session.execute(text(f'DROP TABLE IF EXISTS "{table}" CASCADE'))
                        print(f"    [OK] Dropped: {table}")
                    except Exception as e:
                        print(f"    [!] Error dropping {table}: {e}")
                
                await session.commit()
                print("[OK] All tables dropped.")
            else:
                print("\n[*] No existing tables found.")
        
        # Now create fresh tables from models
        print("\n[*] Creating tables from models...")
        async with engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)
        print("[OK] All tables created.")
        
        print("\n" + "=" * 60)
        print("[SUCCESS] DATABASE RESET COMPLETE!")
        print("=" * 60)
        print("\n[*] Tables created:")
        for table in SQLModel.metadata.tables.keys():
            print(f"    - {table}")
        
        print("\n[*] Database is now empty with fresh schema!")
        print("    You can now run: python seed_data.py")
        
    except Exception as e:
        print(f"\n[ERROR] Failed to reset database!")
        print(f"        {type(e).__name__}: {e}")
        raise
    finally:
        await engine.dispose()


def main():
    """Main entry point."""
    force = "--force" in sys.argv or "-f" in sys.argv
    asyncio.run(reset_database(force=force))


if __name__ == "__main__":
    main()
