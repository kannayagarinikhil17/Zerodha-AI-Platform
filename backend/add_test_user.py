import sqlite3
import uuid
import os

def add_users_and_portfolios():
    db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "dynamic_portfolios.db"))
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Clear out old test holdings to prevent duplicates (optional)
    cursor.execute("DELETE FROM holdings")
    cursor.execute("DELETE FROM portfolios")
    cursor.execute("DELETE FROM users")

    # --- USER 1: Tech & Energy Heavy ---
    user1_pid = str(uuid.uuid4())
    cursor.execute("INSERT INTO users (user_id, username) VALUES ('user_1', 'Nikhil')")
    cursor.execute("INSERT INTO portfolios (portfolio_id, user_id, portfolio_name) VALUES (?, 'user_1', 'Main Growth')", (user1_pid,))
    
    cursor.execute("INSERT INTO holdings (holding_id, portfolio_id, instrument_symbol, sector, quantity, average_price) VALUES (?, ?, 'INFY', 'Technology', 100, 1500.00)", (str(uuid.uuid4()), user1_pid))
    cursor.execute("INSERT INTO holdings (holding_id, portfolio_id, instrument_symbol, sector, quantity, average_price) VALUES (?, ?, 'RELIANCE', 'Energy', 50, 2400.00)", (str(uuid.uuid4()), user1_pid))
    cursor.execute("INSERT INTO holdings (holding_id, portfolio_id, instrument_symbol, sector, quantity, average_price) VALUES (?, ?, 'TCS', 'Technology', 40, 3800.00)", (str(uuid.uuid4()), user1_pid))

    # --- TEST USER 1: Diversified (Banking & FMCG) ---
    test_user_pid = str(uuid.uuid4())
    cursor.execute("INSERT OR IGNORE INTO users (user_id, username) VALUES ('test_user_1', 'Tester')")
    cursor.execute("INSERT INTO portfolios (portfolio_id, user_id, portfolio_name) VALUES (?, 'test_user_1', 'Value Portfolio')", (test_user_pid,))
    
    cursor.execute("INSERT INTO holdings (holding_id, portfolio_id, instrument_symbol, sector, quantity, average_price) VALUES (?, ?, 'SBIN', 'Banking', 150, 600.00)", (str(uuid.uuid4()), test_user_pid))
    cursor.execute("INSERT INTO holdings (holding_id, portfolio_id, instrument_symbol, sector, quantity, average_price) VALUES (?, ?, 'ITC', 'FMCG', 200, 420.00)", (str(uuid.uuid4()), test_user_pid))

    conn.commit()
    conn.close()
    print("Successfully populated database with multi-stock Indian portfolios!")

if __name__ == "__main__":
    add_users_and_portfolios()