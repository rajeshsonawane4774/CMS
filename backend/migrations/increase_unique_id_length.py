from sqlalchemy import create_engine, text
import os

def increase_unique_id_length():
    # Get database connection details
    db_user = os.getenv('POSTGRES_USER', 'postgres')
    db_password = os.getenv('POSTGRES_PASSWORD', '')
    db_host = os.getenv('POSTGRES_HOST', 'localhost')
    db_port = os.getenv('POSTGRES_PORT', '5432')
    db_name = os.getenv('POSTGRES_DB', 'customer_db')
    
    database_url = f'postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}'
    
    engine = create_engine(database_url)
    
    try:
        with engine.connect() as conn:
            # Increase unique_id column length
            conn.execute(text("ALTER TABLE customers ALTER COLUMN unique_id TYPE VARCHAR(200)"))
            conn.commit()
            print("Successfully increased unique_id column length to 200 characters")
            
    except Exception as e:
        print(f"Error increasing unique_id column length: {e}")

if __name__ == "__main__":
    increase_unique_id_length()