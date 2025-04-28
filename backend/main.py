# backend/main.py
from fastapi import FastAPI
from pydantic import BaseModel
import sqlite3
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException
import os 
from dotenv import load_dotenv

app = FastAPI()




# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can replace "*" with ["http://localhost:3000"] for security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Connect to SQLite
conn = sqlite3.connect("finance.db", check_same_thread=False)
cursor = conn.cursor()
cursor.execute('''
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    amount REAL,
    category TEXT,
    date TEXT,
    note TEXT
)
''')
conn.commit()

# Request model
class Transaction(BaseModel):
    type: str  # 'expense' or 'income'
    amount: float
    category: str
    note: str = ""

# API to add a transaction
@app.post("/expense")
async def add_expense(transaction: Transaction):
    cursor.execute(
        "INSERT INTO transactions (type, amount, category, date, note) VALUES (?, ?, ?, ?, ?)",
        (transaction.type, transaction.amount, transaction.category, datetime.now().isoformat(), transaction.note)
    )
    conn.commit()
    return {"message": "Transaction added successfully"}

# API to get a summary
@app.get("/summary")
async def get_summary():
    cursor.execute("SELECT type, SUM(amount) FROM transactions GROUP BY type")
    rows = cursor.fetchall()
    return {"summary": {row[0]: row[1] for row in rows}}



ALERT_LIMIT = 1000  # Dollars

# API to check if user exceeded the limit
@app.get("/alert")
async def check_alert():
    cursor.execute('''
        SELECT SUM(amount) FROM transactions 
        WHERE type = 'expense' 
        AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
    ''')
    total = cursor.fetchone()[0] or 0

    if total > ALERT_LIMIT:
        raise HTTPException(status_code=400, detail=f"⚠️ Alert! Expenses exceeded ${ALERT_LIMIT}. Current: ${total:.2f}")
    
    return {"message": f"✅ Safe! Total expenses this month: ${total:.2f}"}
