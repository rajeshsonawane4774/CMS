from db import db
from datetime import datetime

class Customer(db.Model):
    __tablename__ = 'customers'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    name_mr = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    village = db.Column(db.Text)
    village_mr = db.Column(db.Text)
    cts_number = db.Column(db.String(50))
    plot_number = db.Column(db.String(50))
    gat_number = db.Column(db.String(50))
    document_number = db.Column(db.String(50))
    submitted_by = db.Column(db.String(100))
    estimated_cost = db.Column(db.Numeric(10, 2))
    advance_paid = db.Column(db.Numeric(10, 2))
    amount_remaining = db.Column(db.Numeric(10, 2))
    work_reason = db.Column(db.Text)
    work_reason_mr = db.Column(db.Text)
    payment_method = db.Column(db.String(50))
    unique_id = db.Column(db.String(100), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False)
    mark = db.Column(db.String(20), default='active')