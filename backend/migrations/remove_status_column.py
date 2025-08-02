from sqlalchemy import create_engine, text
import os

def remove_status_column():
    # Get database URL from environment or use default
    database_url = os.getenv('DATABASE_URL', 'sqlite:///csm.db')
    
    # Create engine
    engine = create_engine(database_url)
    
    try:
        with engine.connect() as conn:
            # Remove status column
            conn.execute(text("ALTER TABLE customers DROP COLUMN status"))
            conn.commit()
            print("Successfully removed status column from customers table")
            
    except Exception as e:
        print(f"Error removing status column: {e}")
        # For SQLite, if column doesn't exist, this will fail but that's okay
        if "no such column" in str(e).lower():
            print("Status column doesn't exist, skipping...")

if __name__ == "__main__":
    remove_status_column() 