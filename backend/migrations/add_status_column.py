from sqlalchemy import create_engine, text
import os

def add_status_column():
    # Get database connection details
    db_user = os.getenv('POSTGRES_USER', 'postgres')
    db_password = os.getenv('POSTGRES_PASSWORD', 'admin')
    db_host = os.getenv('POSTGRES_HOST', 'localhost')
    db_port = os.getenv('POSTGRES_PORT', '5432')
    db_name = os.getenv('POSTGRES_DB', 'customer_db')
    
    database_url = f'postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}'
    
    engine = create_engine(database_url)
    
    try:
        with engine.connect() as conn:
            # Add status column with default value
            conn.execute(text("ALTER TABLE customers ADD COLUMN status VARCHAR(20) DEFAULT 'pending'"))
            
            # Update existing records to have 'pending' status
            conn.execute(text("UPDATE customers SET status = 'pending' WHERE status IS NULL"))
            
            conn.commit()
            print("Successfully added status column to customers table")
            
    except Exception as e:
        print(f"Error adding status column: {e}")
        if "already exists" in str(e).lower():
            print("Status column already exists, skipping...")

if __name__ == "__main__":
    add_status_column()