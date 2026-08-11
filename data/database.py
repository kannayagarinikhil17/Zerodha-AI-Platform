import sqlite3
import json
from datetime import datetime
import os

# Create the database file in the same directory as this script
DB_PATH = os.path.join(os.path.dirname(__file__), "audit_logs.db")

def init_db():
    """Initializes the SQLite database for compliance and audit logging."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS insight_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            timestamp TEXT,
            governed_payload TEXT,
            llm_response TEXT
        )
    ''')
    conn.commit()
    conn.close()
    print("[DB] Audit log database initialized successfully.")

def log_insight(user_id: str, payload: dict, response: dict):
    """Saves the MCP payload and LLM output to the Data Store."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO insight_logs (user_id, timestamp, governed_payload, llm_response)
            VALUES (?, ?, ?, ?)
        ''', (
            user_id, 
            datetime.now().isoformat(), 
            json.dumps(payload), 
            json.dumps(response)
        ))
        conn.commit()
        conn.close()
        print(f"[DB] Successfully logged insight generation for user: {user_id}")
    except Exception as e:
        print(f"[DB ERROR] Failed to log insight: {e}")