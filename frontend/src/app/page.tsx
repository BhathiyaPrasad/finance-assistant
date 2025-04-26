'use client';
import { useState, useEffect } from 'react';

export default function Home() {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [summary, setSummary] = useState('');

  const addExpense = async () => {
    await fetch('http://localhost:8000/expense', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, amount: parseFloat(amount), category, note })
    });
    fetchSummary();
  };

  const fetchSummary = async () => {
    const res = await fetch('http://localhost:8000/summary');
    const data = await res.json();
    setSummary(JSON.stringify(data.summary));
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const checkAlert = async () => {
    const res = await fetch('http://localhost:8000/alert');
    if (res.ok) {
      const data = await res.json();
      alert(data.message);
    } else {
      const data = await res.json();
      alert(data.detail);
    }
  };




  return (
    <main className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Personal Finance Assistant</h1>

      <input
        className="border p-2 w-full mb-2"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <input
        className="border p-2 w-full mb-2"
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      />
      <input
        className="border p-2 w-full mb-2"
        placeholder="Note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <select
        className="border p-2 w-full mb-4"
        value={type}
        onChange={(e) => setType(e.target.value)}
      >
        <option value="expense">Expense</option>
        <option value="income">Income</option>
      </select>

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        onClick={addExpense}
      >
        Add
      </button>
      <button
        className="bg-red-600 text-white px-4 py-2 rounded w-full mt-2"
        onClick={checkAlert}
      >
        Check Monthly Limit
      </button>


      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Summary</h2>
        <p>{summary}</p>
      </div>
    </main>
  );
}
