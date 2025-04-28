# backend/main.py
from fastapi import FastAPI
from pydantic import BaseModel
import sqlite3
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException
import os 
from dotenv import load_dotenv
from langchain.llms import OpenAI
from langchain.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.schema import SystemMessage, HumanMessage
from fastapi import Body




app = FastAPI()

# Load Env 
load_dotenv()
openai_api_key = os.getenv("OPENAI_API_KEY")

# Integrate Chat Model
llm = ChatOpenAI(openai_api_key=openai_api_key)

# Create First API to ASk things

@app.post("/ask")
async def ask_question(data: dict = Body(...)):
    question = data.get('question')

    # You can also include dynamic transaction data later.
    prompt = f"""
    You are a personal finance assistant. 
    You help user based on their spending records. 
    Right now, user asked: {question}
    Based on available data or general finance rules, answer smartly.
    """

    response = llm.invoke([SystemMessage(content=prompt)])
    return {"answer": response.content}



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
