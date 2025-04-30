from flask import Blueprint, request, jsonify
from jose import jwt
import os

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    # Dummy authentication (replace with secure authentication)
    if username == 'superadmin' and password == 'super123':
        token = jwt.encode({'role': 'superadmin'}, os.getenv('SECRET_KEY'), algorithm='HS256')
        return jsonify({'token': token, 'role': 'superadmin'})
    elif username == 'admin' and password == 'admin123':
        token = jwt.encode({'role': 'admin'}, os.getenv('SECRET_KEY'), algorithm='HS256')
        return jsonify({'token': token, 'role': 'admin'})
    return jsonify({'error': 'Invalid credentials'}), 401