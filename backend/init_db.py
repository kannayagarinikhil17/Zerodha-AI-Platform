import sqlite3
import uuid

def initialize_database():
    # Connect to a local SQLite file (creates it if it doesn't exist)
    conn = sqlite3.connect("backend/dynamic_portfolios.db")
    cursor = conn.cursor()

    # 1. Create Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        risk_preference TEXT DEFAULT 'moderate',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 2. Create Portfolios Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS portfolios (
        portfolio_id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(user_id),
        portfolio_name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 3. Create Holdings Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS holdings (
        holding_id TEXT PRIMARY KEY,
        portfolio_id TEXT REFERENCES portfolios(portfolio_id),
        instrument_symbol TEXT NOT NULL,
        sector TEXT NOT NULL,
        quantity REAL NOT NULL,
        average_price REAL NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Insert a dummy user and portfolio so we have dynamic data to query
    test_user_id = str(uuid.uuid4())
    test_portfolio_id = str(uuid.uuid4())
    
    cursor.execute("INSERT INTO users (user_id, username) VALUES (?, ?)", (test_user_id, "test_investor"))
    cursor.execute("INSERT INTO portfolios (portfolio_id, user_id, portfolio_name) VALUES (?, ?, ?)", (test_portfolio_id, test_user_id, "Tech Growth"))
    cursor.execute("INSERT INTO holdings (holding_id, portfolio_id, instrument_symbol, sector, quantity, average_price) VALUES (?, ?, ?, ?, ?, ?)", 
                   (str(uuid.uuid4()), test_portfolio_id, "RELIANCE", "Energy", 50, 2450.00))
    cursor.execute("INSERT INTO holdings (holding_id, portfolio_id, instrument_symbol, sector, quantity, average_price) VALUES (?, ?, ?, ?, ?, ?)", 
                   (str(uuid.uuid4()), test_portfolio_id, "TCS", "Technology", 20, 3800.00))

    conn.commit()
    conn.close()
    print("Database initialized successfully with test data!")

if __name__ == "__main__":
    initialize_database()