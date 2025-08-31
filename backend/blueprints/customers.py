from flask import Blueprint, request, jsonify
from jose import jwt, JWTError
from datetime import datetime, timedelta
from models.customer import Customer
from db import db
import os
from sqlalchemy import func, extract

customers_bp = Blueprint('customers', __name__)

def verify_token(token):
    try:
        payload = jwt.decode(token, os.getenv('SECRET_KEY'), algorithms=['HS256'])
        return payload
    except JWTError as e:
        return None  # Specific error handling can be logged if needed

def customer_to_dict(customer):
    return {
        'id': customer.id,
        'name': customer.name,
        'name_mr': customer.name_mr,
        'phone': customer.phone,
        'village': customer.village,
        'village_mr': customer.village_mr,
        'cts_number': customer.cts_number,
        'plot_number': customer.plot_number,
        'gat_number': customer.gat_number,
        'document_number': customer.document_number,
        'submitted_by': customer.submitted_by,
        'estimated_cost': float(customer.estimated_cost) if customer.estimated_cost is not None else None,
        'advance_paid': float(customer.advance_paid) if customer.advance_paid is not None else None,
        'amount_remaining': float(customer.amount_remaining) if customer.amount_remaining is not None else None,
        'work_reason': customer.work_reason,
        'work_reason_mr': customer.work_reason_mr,
        'payment_method': customer.payment_method,
        'unique_id': customer.unique_id,
        'created_at': customer.created_at.isoformat() if customer.created_at else None,
        'modified_at': customer.modified_at.isoformat() if customer.modified_at else None,
        'mark': customer.mark
    }

@customers_bp.route('/customers', methods=['GET'])
def get_customers():
    token = request.headers.get('Authorization')
    if not token or len(token.split()) != 2:
        return jsonify({'error': 'Authorization header missing or invalid'}), 401
    token = token.split()[1]
    payload = verify_token(token)
    if not payload:
        return jsonify({'error': 'Invalid or expired token'}), 401

    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    all_entries = request.args.get('all_entries', 'false').lower() == 'true'
    search_phone = request.args.get('phone')
    search_village = request.args.get('village')

    if all_entries:
        query = Customer.query  # No mark filter
    else:
        query = Customer.query.filter_by(mark='active')

    # Apply date range filter only if both start_date and end_date are provided
    if start_date and end_date and start_date.strip() and end_date.strip():
        try:
            start_date = datetime.strptime(start_date, '%Y-%m-%d')
            # Extend end_date to the end of the day (23:59:59)
            end_date = datetime.strptime(end_date, '%Y-%m-%d').replace(hour=23, minute=59, second=59)
            query = query.filter(Customer.created_at.between(start_date, end_date))
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD.'}), 400

    # Apply search filters for phone and village
    if search_phone and search_phone.strip():
        query = query.filter(Customer.phone.ilike(f'%{search_phone}%'))
    if search_village and search_village.strip():
        query = query.filter(Customer.village.ilike(f'%{search_village}%'))

    customers = query.all()
    return jsonify([customer_to_dict(c) for c in customers])

@customers_bp.route('/customers', methods=['POST'])
def add_customer():
    token = request.headers.get('Authorization')
    if not token or len(token.split()) != 2:
        return jsonify({'error': 'Authorization header missing or invalid'}), 401
    token = token.split()[1]
    payload = verify_token(token)
    if not payload:
        return jsonify({'error': 'Invalid or expired token'}), 401

    data = request.get_json()
    unique_id = f"{data['name']}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    customer = Customer(
        name=data['name'],
        name_mr=data.get('name_mr', ''),
        phone=data['phone'],
        village=data['village'],
        village_mr=data.get('village_mr', ''),
        cts_number=data.get('cts_number', ''),
        plot_number=data.get('plot_number', ''),
        gat_number=data.get('gat_number', ''),
        document_number=data.get('document_number', ''),
        submitted_by=data.get('submitted_by', ''),
        estimated_cost=data.get('estimated_cost'),
        advance_paid=data.get('advance_paid'),
        amount_remaining=data.get('amount_remaining'),
        work_reason=data.get('work_reason', ''),
        work_reason_mr=data.get('work_reason_mr', ''),
        payment_method=data.get('payment_method', ''),
        unique_id=unique_id,
        created_at=datetime.utcnow(),
        modified_at=datetime.utcnow()
    )
    
    db.session.add(customer)
    db.session.commit()
    
    return jsonify(customer_to_dict(customer)), 201

@customers_bp.route('/customers/<int:id>', methods=['PUT'])
def update_customer(id):
    token = request.headers.get('Authorization')
    if not token or len(token.split()) != 2:
        return jsonify({'error': 'Authorization header missing or invalid'}), 401
    token = token.split()[1]
    payload = verify_token(token)
    if not payload:
        return jsonify({'error': 'Invalid or expired token'}), 401

    old_customer = Customer.query.get_or_404(id)
    data = request.get_json()
    current_time = datetime.utcnow()

    # Handle empty advance_paid value
    advance_paid = data.get('advance_paid')
    if advance_paid == '' or advance_paid is None:
        advance_paid = 0

    # Calculate remaining amount
    estimated_cost = data.get('estimated_cost', old_customer.estimated_cost)
    amount_remaining = float(estimated_cost) - float(advance_paid)

    unique_id = f"{data.get('name', old_customer.name).strip()}_{current_time.strftime('%Y%m%d%H%M%S')}"

    # Create new customer with reference to parent
    new_customer = Customer(
        name=data.get('name', old_customer.name),
        name_mr=data.get('name_mr', old_customer.name_mr),
        phone=data.get('phone', old_customer.phone),
        village=data.get('village', old_customer.village),
        village_mr=data.get('village_mr', old_customer.village_mr),
        cts_number=data.get('cts_number', old_customer.cts_number),
        plot_number=data.get('plot_number', old_customer.plot_number),
        gat_number=data.get('gat_number', old_customer.gat_number),
        document_number=data.get('document_number', old_customer.document_number),
        submitted_by=data.get('submitted_by', old_customer.submitted_by),
        estimated_cost=estimated_cost,
        advance_paid=advance_paid,
        amount_remaining=amount_remaining,
        work_reason=data.get('work_reason', old_customer.work_reason),
        work_reason_mr=data.get('work_reason_mr', old_customer.work_reason_mr),
        payment_method=data.get('payment_method', old_customer.payment_method),
        unique_id=unique_id,  # Set the unique_id here
        parent_id=old_customer.id,
        created_at=current_time,
        modified_at=current_time,
        mark='active'
    )

    try:
        # Mark old record as inactive
        old_customer.mark = 'inactive'
        
        # Add and commit both changes
        db.session.add(new_customer)
        db.session.commit()
        
        return jsonify(customer_to_dict(new_customer))
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@customers_bp.route('/customers/<int:id>', methods=['DELETE'])
def delete_customer(id):
    token = request.headers.get('Authorization')
    if not token or len(token.split()) != 2:
        return jsonify({'error': 'Authorization header missing or invalid'}), 401
    token = token.split()[1]
    payload = verify_token(token)
    if not payload:
        return jsonify({'error': 'Invalid or expired token'}), 401

    customer = Customer.query.get_or_404(id)
    customer.mark = 'deleted'
    db.session.commit()
    return jsonify({'message': 'Customer marked as deleted'})

@customers_bp.route('/customers/monthly-stats', methods=['GET'])
def get_monthly_stats():
    token = request.headers.get('Authorization')
    if not token or len(token.split()) != 2:
        return jsonify({'error': 'Authorization header missing or invalid'}), 401
    token = token.split()[1]
    payload = verify_token(token)
    if not payload:
        return jsonify({'error': 'Invalid or expired token'}), 401

    # Get data for the last 12 months
    twelve_months_ago = datetime.utcnow() - timedelta(days=365)
    
    # Query to get count of customers by month
    monthly_data = db.session.query(
        func.date_trunc('month', Customer.created_at).label('month'),
        func.count(Customer.id).label('count')
    ).filter(
        Customer.created_at >= twelve_months_ago,
        Customer.mark == 'active'
    ).group_by(
        func.date_trunc('month', Customer.created_at)
    ).order_by(
        func.date_trunc('month', Customer.created_at)
    ).all()

    # Format the data for the frontend
    result = [{
        'month': data.month.strftime('%B %Y'),
        'count': data.count
    } for data in monthly_data]

    return jsonify(result)

@customers_bp.route('/customers/outstanding-names', methods=['GET'])
def get_outstanding_names():
    token = request.headers.get('Authorization')
    if not token or len(token.split()) != 2:
        return jsonify({'error': 'Authorization header missing or invalid'}), 401
    token = token.split()[1]
    payload = verify_token(token)
    if not payload:
        return jsonify({'error': 'Invalid or expired token'}), 401

    # Get customers with outstanding amounts
    customers = Customer.query.filter(
        Customer.amount_remaining > 0,
        Customer.mark == 'active'
    ).all()

    # Format the data for the pie chart with all necessary fields
    result = [{
        'name': customer.name,
        'work_reason': customer.work_reason,
        'amount_remaining': float(customer.amount_remaining),
        'created_at': customer.created_at.isoformat(),
        'modified_at': customer.modified_at.isoformat() if customer.modified_at else None,
        'mark': customer.mark,
        'phone': customer.phone,
        'estimated_cost': float(customer.estimated_cost) if customer.estimated_cost is not None else 0
    } for customer in customers]

    return jsonify(result)

@customers_bp.route('/customers/payment-stats', methods=['GET'])
def get_payment_stats():
    print("Payment stats endpoint called")  # Debug log
    token = request.headers.get('Authorization')
    if not token or len(token.split()) != 2:
        print("Invalid token format")  # Debug log
        return jsonify({'error': 'Authorization header missing or invalid'}), 401
    token = token.split()[1]
    payload = verify_token(token)
    if not payload:
        print("Invalid token")  # Debug log
        return jsonify({'error': 'Invalid or expired token'}), 401

    try:
        # Get data for the last 12 months
        twelve_months_ago = datetime.utcnow() - timedelta(days=365)
        print(f"Fetching data from {twelve_months_ago}")  # Debug log
        
        # Query to get payment method counts by month
        payment_stats = db.session.query(
            func.date_trunc('month', Customer.created_at).label('month'),
            Customer.payment_method,
            func.count(Customer.id).label('count')
        ).filter(
            Customer.created_at >= twelve_months_ago,
            Customer.mark == 'active'
        ).group_by(
            func.date_trunc('month', Customer.created_at),
            Customer.payment_method
        ).order_by(
            func.date_trunc('month', Customer.created_at)
        ).all()

        print(f"Found {len(payment_stats)} payment stats records")  # Debug log

        # Format the data for the frontend
        formatted_data = []
        for stat in payment_stats:
            formatted_data.append({
                'month': stat.month.strftime('%b %Y'),
                'payment_method': stat.payment_method or 'Not Specified',
                'count': stat.count
            })

        print(f"Formatted data: {formatted_data}")  # Debug log

        # If no data is found, return empty array instead of error
        if not formatted_data:
            print("No data found, returning empty array")  # Debug log
            return jsonify([])

        return jsonify(formatted_data)
    except Exception as e:
        print(f"Error in get_payment_stats: {str(e)}")  # Debug log
        return jsonify({'error': str(e)}), 500