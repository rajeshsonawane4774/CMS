from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os
import psycopg2
from psycopg2 import OperationalError
from db import db
from blueprints.auth import auth_bp
from blueprints.customers import customers_bp

load_dotenv()

app = Flask(__name__)
CORS(app)

# Database connection parameters
db_params = {
    'host': os.getenv('DATABASE_URL').split('@')[1].split('/')[0].split(':')[0],
    'port': os.getenv('DATABASE_URL').split('@')[1].split('/')[0].split(':')[1],
    'user': os.getenv('DATABASE_URL').split('://')[1].split(':')[0],
    'password': os.getenv('DATABASE_URL').split('://')[1].split(':')[1].split('@')[0]
}

# Initialize database
def init_database():
    try:
        # Connect to PostgreSQL server (default database 'postgres')
        conn = psycopg2.connect(
            dbname='postgres',
            user=db_params['user'],
            password=db_params['password'],
            host=db_params['host'],
            port=db_params['port']
        )
        conn.autocommit = True
        cursor = conn.cursor()

        # Check if database exists
        cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'customer_db'")
        exists = cursor.fetchone()
        
        if not exists:
            cursor.execute("CREATE DATABASE customer_db")
            print("Database 'customer_db' created successfully.")
        else:
            print("Database 'customer_db' already exists.")

        cursor.close()
        conn.close()

    except OperationalError as e:
        print(f"Error initializing database: {e}")
        raise

# Run database initialization
init_database()

# Configure SQLAlchemy
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')

# Initialize db with app
db.init_app(app)

# Create database tables
with app.app_context():
    db.create_all()
    print("Table 'customers' created successfully (or already exists).")

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(customers_bp, url_prefix='/api')

if __name__ == '__main__':
    app.run(debug=True, port=8080, host='0.0.0.0')