from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import psycopg2
from psycopg2 import OperationalError
from db import db
from blueprints.auth import auth_bp
from blueprints.customers import customers_bp

load_dotenv()  # Loads .env file in current/parent directories

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000"]}})

# Database config environment variables - updated names to match Docker Compose standards
db_user = os.getenv('POSTGRES_USER') or os.getenv('DATABASE_USER') or 'postgres'
db_password = os.getenv('POSTGRES_PASSWORD') or os.getenv('DATABASE_PASSWORD') or ''
db_host = os.getenv('POSTGRES_HOST') or os.getenv('DATABASE_HOST') or 'localhost'  # 'db' matches service name in Docker Compose
db_port = os.getenv('POSTGRES_PORT') or os.getenv('DATABASE_PORT') or '5432'
db_name = os.getenv('POSTGRES_DB') or os.getenv('DATABASE_NAME') or 'customer_db'

# Verify all database environment variables are set
if not all([db_user, db_password, db_host, db_port, db_name]):
    raise ValueError("Missing database configuration environment variables")

# Build connection string for SQLAlchemy
app.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Secret key for Flask sessions and JWT
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key')

# Initialize database with Flask app
db.init_app(app)

# Create tables on startup
with app.app_context():
    db.create_all()
    print("Table 'customers' created successfully (or already exists).")
    
    # Ensure status column exists
    try:
        from sqlalchemy import text
        db.engine.execute(text("ALTER TABLE customers ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending'"))
        db.engine.execute(text("UPDATE customers SET status = 'pending' WHERE status IS NULL"))
        print("Status column ensured.")
    except Exception as e:
        print(f"Status column setup: {e}")

# Register Blueprints for API routes
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(customers_bp, url_prefix='/api')

# Health check endpoint to verify DB connectivity
@app.route('/health')
def health_check():
    try:
        conn = psycopg2.connect(
            dbname=db_name,
            user=db_user,
            password=db_password,
            host=db_host,
            port=db_port
        )
        conn.close()
        return jsonify({"status": "healthy", "database": "connected"}), 200
    except OperationalError:
        return jsonify({"status": "unhealthy", "database": "disconnected"}), 500

if __name__ == '__main__':
    # Run Flask app on container accessible address and port
    app.run(debug=True, port=8080, host='0.0.0.0')
