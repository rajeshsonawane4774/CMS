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

    customers = query.all()
    return jsonify([{
        'id': c.id,
        'name': c.name,
        'name_mr': c.name_mr,
        'phone': c.phone,
        'village': c.village,
        'village_mr': c.village_mr,
        'cts_number': c.cts_number,
        'plot_number': c.plot_number,
        'gat_number': c.gat_number,
        'document_number': c.document_number,
        'submitted_by': c.submitted_by,
        'estimated_cost': float(c.estimated_cost),
        'advance_paid': float(c.advance_paid),
        'amount_remaining': float(c.amount_remaining),
        'work_reason': c.work_reason,
        'work_reason_mr': c.work_reason_mr,
        'payment_method': c.payment_method,
        'unique_id': c.unique_id,
        'created_at': c.created_at.isoformat(),
        'mark': c.mark
    } for c in customers])

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
        estimated_cost=data['estimated_cost'],
        advance_paid=data['advance_paid'],
        amount_remaining=data['amount_remaining'],
        work_reason=data['work_reason'],
        work_reason_mr=data.get('work_reason_mr', ''),
        payment_method=data['payment_method'],
        unique_id=unique_id,
        created_at=datetime.now(),
        mark='active'
    )
    db.session.add(customer)
    db.session.commit()
    
    return jsonify({'message': 'Customer added'})

@customers_bp.route('/customers/<int:id>', methods=['PUT'])
def update_customer(id):
    token = request.headers.get('Authorization')
    if not token or len(token.split()) != 2:
        return jsonify({'error': 'Authorization header missing or invalid'}), 401
    token = token.split()[1]
    payload = verify_token(token)
    if not payload:
        return jsonify({'error': 'Invalid or expired token'}), 401

    data = request.get_json()
    customer = Customer.query.get_or_404(id)
    original_created_at = customer.created_at
    customer.mark = 'inactive'
    unique_id = f"{data['name']}_{datetime.now().strftime('%Y%m%d%H%M%S')}"

    # Only superadmin can change amount fields
    if payload['role'] != 'superadmin':
        data['estimated_cost'] = customer.estimated_cost
        data['advance_paid'] = customer.advance_paid
        data['amount_remaining'] = customer.amount_remaining

    new_customer = Customer(
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
        estimated_cost=data['estimated_cost'],
        advance_paid=data['advance_paid'],
        amount_remaining=data['amount_remaining'],
        work_reason=data['work_reason'],
        work_reason_mr=data.get('work_reason_mr', ''),
        payment_method=data['payment_method'],
        unique_id=unique_id,
        created_at=original_created_at,  # Use original created_at
        mark='active'
    )
    db.session.add(new_customer)
    db.session.commit()
    return jsonify({'message': 'Customer updated'})

@customers_bp.route('/customers/<int:id>', methods=['DELETE'])
def delete_customer(id):
    token = request.headers.get('Authorization')
    if not token or len(token.split()) != 2:
        return jsonify({'error': 'Authorization header missing or invalid'}), 401
    token = token.split()[1]
    payload = verify_token(token)
    if not payload:
        return jsonify({'error': 'Invalid or expired token'}), 401

    if payload['role'] != 'superadmin':
        return jsonify({'error': 'Only superadmin can delete'}), 403

    customer = Customer.query.get_or_404(id)
    customer.mark = 'inactive'  # Soft delete by marking as inactive
    db.session.commit()
    
    return jsonify({'message': 'Customer marked as inactive'})

@customers_bp.route('/customers/monthly-outstanding', methods=['GET'])
def get_monthly_outstanding():
    token = request.headers.get('Authorization')
    if not token or len(token.split()) != 2:
        return jsonify({'error': 'Authorization header missing or invalid'}), 401
    token = token.split()[1]
    payload = verify_token(token)
    if not payload:
        return jsonify({'error': 'Invalid or expired token'}), 401

    # Get the last 12 months of data
    from sqlalchemy import func, extract
    from datetime import datetime, timedelta

    # Get current date and calculate date 12 months ago
    end_date = datetime.now()
    start_date = end_date - timedelta(days=365)

    # Query to get monthly outstanding amounts
    monthly_data = db.session.query(
        func.date_trunc('month', Customer.created_at).label('month'),
        func.sum(Customer.amount_remaining).label('total_outstanding')
    ).filter(
        Customer.created_at >= start_date,
        Customer.created_at <= end_date,
        Customer.mark == 'active'
    ).group_by(
        func.date_trunc('month', Customer.created_at)
    ).order_by(
        func.date_trunc('month', Customer.created_at)
    ).all()

    # Format the data for the frontend
    result = [{
        'month': data.month.strftime('%B %Y'),
        'total_outstanding': float(data.total_outstanding)
    } for data in monthly_data]

    return jsonify(result)

@customers_bp.route('/customers/certificate-stats', methods=['GET'])
def get_certificate_stats():
    token = request.headers.get('Authorization')
    if not token or len(token.split()) != 2:
        return jsonify({'error': 'Authorization header missing or invalid'}), 401
    token = token.split()[1]
    payload = verify_token(token)
    if not payload:
        return jsonify({'error': 'Invalid or expired token'}), 401

    # Get the last 12 months of data
    from sqlalchemy import func
    from datetime import datetime, timedelta

    # Get current date and calculate date 12 months ago
    end_date = datetime.now()
    start_date = end_date - timedelta(days=365)

    # Query to get monthly certificate counts
    monthly_data = db.session.query(
        func.date_trunc('month', Customer.created_at).label('month'),
        func.count(Customer.id).label('count')
    ).filter(
        Customer.created_at >= start_date,
        Customer.created_at <= end_date,
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
        'mark': customer.mark,
        'phone': customer.phone,  # Add phone field
        'estimated_cost': float(customer.estimated_cost) if customer.estimated_cost is not None else 0  # Add estimated_cost
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