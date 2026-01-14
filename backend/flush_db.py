"""
Admo AI - Database Flush Script

This script removes ALL data from ALL tables in the PostgreSQL database.
The table structure (schema) is preserved, only the data is deleted.

WARNING: This is a destructive operation! All data will be permanently lost.

Usage:
    python flush_db.py          # Interactive mode with confirmation
    python flush_db.py --force  # Skip confirmation (use with caution!)
"""

import asyncio
import sys
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy import text
from sqlalchemy.orm import sessionmaker

from config import settings


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


async def flush_database(force: bool = False):
    """
    Flush all data from the database.
    
    This function:
    1. Disables foreign key constraints temporarily
    2. Truncates all tables (CASCADE)
    3. Re-enables foreign key constraints
    4. Resets all sequences (auto-increment counters)
    """
    print("=" * 60)
    print("🗑️  ADMO AI - DATABASE FLUSH SCRIPT")
    print("=" * 60)
    print(f"\n📍 Database: {settings.POSTGRES_DB}")
    print(f"📍 Host: {settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}")
    print(f"📍 User: {settings.POSTGRES_USER}")
    print()
    
    if not force:
        print("⚠️  WARNING: This will DELETE ALL DATA from the database!")
        print("   The table structure will be preserved, but ALL rows will be removed.")
        print("   This action CANNOT be undone!\n")
        
        confirmation = input("Type 'FLUSH' to confirm: ")
        if confirmation != "FLUSH":
            print("\n❌ Operation cancelled.")
            return
    
    print("\n🔄 Connecting to database...")
    
    # Create async engine
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=False,
        future=True
    )
    
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        try:
            # Get all table names
            tables = await get_all_table_names(session)
            
            if not tables:
                print("ℹ️  No tables found in the database.")
                return
            
            print(f"\n📋 Found {len(tables)} tables:")
            for table in tables:
                print(f"   - {table}")
            
            print("\n🗑️  Truncating all tables...")
            
            # Build TRUNCATE command for all tables at once
            # Using CASCADE to handle foreign key constraints
            # Using RESTART IDENTITY to reset auto-increment sequences
            table_list = ", ".join([f'"{table}"' for table in tables])
            truncate_sql = f"TRUNCATE {table_list} RESTART IDENTITY CASCADE"
            
            await session.execute(text(truncate_sql))
            await session.commit()
            
            print("\n✅ SUCCESS! All tables have been flushed.")
            print("\n📊 Tables cleared:")
            for table in tables:
                print(f"   ✓ {table}")
            
            print("\n🔢 All auto-increment sequences have been reset.")
            print("\n✨ Database is now empty and ready for fresh data!")
            
        except Exception as e:
            await session.rollback()
            print(f"\n❌ ERROR: Failed to flush database!")
            print(f"   {type(e).__name__}: {e}")
            raise
        finally:
            await engine.dispose()


async def show_table_counts():
    """Show the current row count for each table (for verification)."""
    print("\n📊 Verifying table counts...")
    
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=False,
        future=True
    )
    
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        tables = await get_all_table_names(session)
        
        print("\n   Table Name                | Row Count")
        print("   " + "-" * 42)
        
        for table in tables:
            result = await session.execute(
                text(f'SELECT COUNT(*) FROM "{table}"')
            )
            count = result.scalar()
            print(f"   {table:<27} | {count}")
    
    await engine.dispose()


def main():
    """Main entry point."""
    force = "--force" in sys.argv or "-f" in sys.argv
    verify = "--verify" in sys.argv or "-v" in sys.argv
    
    if verify:
        # Just show table counts without flushing
        asyncio.run(show_table_counts())
    else:
        asyncio.run(flush_database(force=force))
        # Show verification after flush
        asyncio.run(show_table_counts())


if __name__ == "__main__":
    main()
