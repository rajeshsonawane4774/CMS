from flask import Blueprint, request, jsonify
from jose import jwt
from datetime import datetime, timedelta
from models.customer import Customer
from db import db
import os

customers_bp = Blueprint('customers', __name__)

def verify_token(token):
    try:
        payload = jwt.decode(token, os.getenv('SECRET_KEY'), algorithms=['HS256'])
        return payload
    except:
        return None

@customers_bp.route('/customers', methods=['GET'])
def get_customers():
    token = request.headers.get('Authorization').split()[1]
    payload = verify_token(token)
    if not payload:
        return jsonify({'error': 'Unauthorized'}), 401

    filter_type = request.args.get('filter', 'all')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    query = Customer.query.filter_by(mark='active')

    if filter_type != 'all' and not (start_date and end_date):
        if filter_type == 'day':
            query = query.filter(Customer.created_at >= datetime.now().date())
        elif filter_type == 'week':
            query = query.filter(Customer.created_at >= datetime.now() - timedelta(days=7))
        elif filter_type == 'month':
            query = query.filter(Customer.created_at >= datetime.now() - timedelta(days=30))
        elif filter_type == 'year':
            query = query.filter(Customer.created_at >= datetime.now() - timedelta(days=365))
    elif start_date and end_date:
        query = query.filter(Customer.created_at.between(start_date, end_date))

    customers = query.all()
    return jsonify([{
        'id': c.id, 'name': c.name, 'phone': c.phone, 'address': c.address,
        'estimated_cost': float(c.estimated_cost), 'advance_paid': float(c.advance_paid),
        'amount_remaining': float(c.amount_remaining), 'work_reason': c.work_reason,
        'payment_method': c.payment_method, 'unique_id': c.unique_id,
        'created_at': c.created_at.isoformat(), 'mark': c.mark
    } for c in customers])

@customers_bp.route('/customers', methods=['POST'])
def add_customer():
    token = request.headers.get('Authorization').split()[1]
    payload = verify_token(token)
    if not payload:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()
    unique_id = f"{data['name']}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    customer = Customer(
        name=data['name'], phone=data['phone'], address=data['address'],
        estimated_cost=data['estimated_cost'], advance_paid=data['advance_paid'],
        amount_remaining=data['amount_remaining'], work_reason=data['work_reason'],
        payment_method=data['payment_method'], unique_id=unique_id,
        created_at=datetime.now(), mark='active'
    )
    db.session.add(customer)
    db.session.commit()
    
    return jsonify({'message': 'Customer added'})

@customers_bp.route('/customers/<int:id>', methods=['PUT'])
def update_customer(id):
    token = request.headers.get('Authorization').split()[1]
    payload = verify_token(token)
    if not payload:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()
    customer = Customer.query.get_or_404(id)
    
    # Mark old record as inactive
    customer.mark = 'inactive'
    
    # Create new record
    unique_id = f"{data['name']}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    new_customer = Customer(
        name=data['name'], phone=data['phone'], address=data['address'],
        estimated_cost=data['estimated_cost'], advance_paid=data['advance_paid'],
        amount_remaining=data['amount_remaining'], work_reason=data['work_reason'],
        payment_method=data['payment_method'], unique_id=unique_id,
        created_at=datetime.now(), mark='active'
    )
    db.session.add(new_customer)
    db.session.commit()
    
    return jsonify({'message': 'Customer updated'})

@customers_bp.route('/customers/<int:id>', methods=['DELETE'])
def delete_customer(id):
    token = request.headers.get('Authorization').split()[1]
    payload = verify_token(token)
    if payload['role'] != 'superadmin':
        return jsonify({'error': 'Only superadmin can delete'}), 403

    customer = Customer.query.get_or_404(id)
    db.session.delete(customer)
    db.session.commit()
    
    return jsonify({'message': 'Customer deleted'})