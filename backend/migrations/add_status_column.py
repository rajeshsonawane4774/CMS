from sqlalchemy import create_engine, text
import os

def add_status_column():
    # Get database URL from environment or use default
    database_url = os.getenv('DATABASE_URL', 'sqlite:///csm.db')
    
    # Create engine
    engine = create_engine(database_url)
    
    try:
        with engine.connect() as conn:
            # Add status column with default value
            conn.execute(text("""
                ALTER TABLE customers 
                ADD COLUMN status VARCHAR(20) DEFAULT 'in progress'
            """))
            
            # Update existing records to have 'in progress' status
            conn.execute(text("""
                UPDATE customers 
                SET status = 'in progress' 
                WHERE status IS NULL
            """))
            
            conn.commit()
            print("Successfully added status column to customers table")
            
    except Exception as e:
        print(f"Error adding status column: {e}")
        # For SQLite, if column already exists, this will fail but that's okay
        if "duplicate column name" in str(e).lower():
            print("Status column already exists, skipping...")

if __name__ == "__main__":
    add_status_column() 