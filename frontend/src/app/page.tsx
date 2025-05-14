'use client';
import { useState, useEffect } from 'react';
import { Bot, Plus, AlertCircle, DollarSign, PieChart, Send, Wallet } from 'lucide-react';

export default function Home() {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [summary, setSummary] = useState('');
  const [question, setQuestion] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const addExpense = async () => {
    if (!amount || !category) return;
    
    setIsProcessing(true);
    try {
      await fetch('http://localhost:8000/expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, amount: parseFloat(amount), category, note })
      });
      setAmount('');
      setCategory('');
      setNote('');
      fetchSummary();
    } catch (error) {
      console.error("Error adding transaction:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchSummary = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:8000/summary');
      const data = await res.json();
      setSummary(JSON.stringify(data.summary, null, 2));
    } catch (error) {
      console.error("Error fetching summary:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const checkAlert = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('http://localhost:8000/alert');
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
      } else {
        alert(data.detail);
      }
    } catch (error) {
      console.error("Error checking alert:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const askQuestion = async (q:string) => {
    if (!q) return;
    setIsProcessing(true);
    try {
      const res = await fetch('http://localhost:8000/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: q }),
      });
      
      const data = await res.json();
      alert(data.answer);
      setQuestion('');
    } catch (error) {
      console.error("Error asking question:", error);
    } finally {
      setIsProcessing(false);
    }
  };
    
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto p-6 max-w-md">
        <div className="flex items-center justify-center mb-8">
          <div className="rounded-full bg-blue-600 p-3 mr-3">
            <Bot size={32} />
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
            Finance Assistant
          </h1>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Wallet className="mr-2 text-blue-400" size={24} />
            Add Transaction
          </h2>
          
          <div className="space-y-4">
            <div className="flex bg-gray-700 rounded-lg overflow-hidden">
              <div 
                className={`w-1/2 text-center py-2 cursor-pointer transition ${type === 'expense' ? 'bg-red-500 font-medium' : 'hover:bg-gray-600'}`}
                onClick={() => setType('expense')}
              >
                Expense
              </div>
              <div 
                className={`w-1/2 text-center py-2 cursor-pointer transition ${type === 'income' ? 'bg-green-500 font-medium' : 'hover:bg-gray-600'}`}
                onClick={() => setType('income')}
              >
                Income
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <DollarSign size={18} className="text-gray-400" />
              </div>
              <input
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 pl-10 pr-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            
            <input
              className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            
            <input
              className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            
            <button
              className={`w-full py-2 px-4 rounded-lg flex items-center justify-center transition ${isProcessing ? 'bg-blue-700' : 'bg-blue-600 hover:bg-blue-500'}`}
              onClick={addExpense}
              disabled={isProcessing || !amount || !category}
            >
              <Plus size={18} className="mr-2" />
              {isProcessing ? 'Processing...' : 'Add Transaction'}
            </button>
            
            <button
              className={`w-full py-2 px-4 rounded-lg flex items-center justify-center transition ${isProcessing ? 'bg-red-700' : 'bg-red-600 hover:bg-red-500'}`}
              onClick={checkAlert}
              disabled={isProcessing}
            >
              <AlertCircle size={18} className="mr-2" />
              {isProcessing ? 'Checking...' : 'Check Monthly Limit'}
            </button>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Bot className="mr-2 text-purple-400" size={24} />
            Ask FinBot
          </h2>
          
          <div className="space-y-4">
            <div className="relative">
              <textarea
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-24"
                placeholder="Ask me about your expenses..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
              
              <button
                className="absolute bottom-2 right-2 bg-purple-600 hover:bg-purple-500 rounded-full p-2 transition"
                onClick={() => askQuestion(question)}
                disabled={isProcessing || !question}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <PieChart className="mr-2 text-green-400" size={24} />
            Financial Summary
          </h2>
          
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-pulse text-gray-400">Loading summary data...</div>
            </div>
          ) : (
            <pre className="bg-gray-700 rounded-lg p-4 whitespace-pre-wrap font-mono text-sm overflow-auto max-h-64">
              {summary || "No data available"}
            </pre>
          )}
        </div>
        
    
        <div className="text-center mt-8 text-gray-400 text-sm">
          <p>FinBot v1.0 | Your Personal Finance Assistant</p>
        </div>
      </div>
    </div>
  );
}