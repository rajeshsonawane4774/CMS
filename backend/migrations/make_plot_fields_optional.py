from db import db

def upgrade():
    # Make gat_number, plot_number, and cts_number nullable but add a check constraint
    # to ensure at least one of them is filled
    with db.engine.connect() as connection:
        connection.execute("""
            ALTER TABLE customers 
            ALTER COLUMN gat_number DROP NOT NULL,
            ALTER COLUMN plot_number DROP NOT NULL,
            ALTER COLUMN cts_number DROP NOT NULL
        """)
        
        # Add check constraint to ensure at least one of the fields is not null and not empty
        connection.execute("""
            ALTER TABLE customers 
            ADD CONSTRAINT check_at_least_one_number 
            CHECK (
                NULLIF(TRIM(gat_number), '') IS NOT NULL OR 
                NULLIF(TRIM(plot_number), '') IS NOT NULL OR 
                NULLIF(TRIM(cts_number), '') IS NOT NULL
            )
        """)

def downgrade():
    with db.engine.connect() as connection:
        # Remove the check constraint
        connection.execute("""
            ALTER TABLE customers 
            DROP CONSTRAINT IF EXISTS check_at_least_one_number
        """)
        
        # Make the fields not nullable again
        connection.execute("""
            ALTER TABLE customers 
            ALTER COLUMN gat_number SET NOT NULL,
            ALTER COLUMN plot_number SET NOT NULL,
            ALTER COLUMN cts_number SET NOT NULL
        """)
