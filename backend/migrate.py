"""
Combined migration script for all schema updates.
Run this ONCE after pulling new code changes.

Usage: python migrate.py
"""
import asyncio
from sqlalchemy import text
from database import engine, init_db

async def migrate():
    print("🚀 Starting database migration...")
    
    async with engine.begin() as conn:
        # 1. Add pass_percentage to exam table
        try:
            await conn.execute(text('''
                ALTER TABLE exam 
                ADD COLUMN IF NOT EXISTS pass_percentage FLOAT DEFAULT 35.0
            '''))
            print('✓ exam.pass_percentage column ready')
        except Exception as e:
            if 'already exists' not in str(e).lower():
                print(f'  Note: {e}')
        
        # 2. Mark table - recreate if structure changed
        # Check if exam_timetable_entry_id exists
        try:
            result = await conn.execute(text('''
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'mark' AND column_name = 'exam_timetable_entry_id'
            '''))
            if not result.fetchone():
                # Mark table needs recreation
                await conn.execute(text('DROP TABLE IF EXISTS mark CASCADE'))
                print('✓ Dropped old mark table (will be recreated)')
        except Exception as e:
            print(f'  Note: {e}')
    
    # Recreate any missing tables
    await init_db()
    print('✓ All tables verified')
    
    print('\n✅ Migration complete!')

if __name__ == "__main__":
    asyncio.run(migrate())
