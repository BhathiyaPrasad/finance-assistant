'use client';
import { useState, useEffect } from 'react';
import { DollarSign, PlusCircle, AlertCircle, MessageCircle, TrendingUp, Wallet, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Home() {
  // State declarations
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [summary, setSummary] = useState(null);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [questionAnswer, setQuestionAnswer] = useState('');

  // API functions
  const addExpense = async () => {
    if (!amount || !category) {
      setAlertMessage('Please fill in amount and category');
      return;
    }
    
    setIsLoading(true);
    try {
      await fetch('http://localhost:8000/expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          amount: parseFloat(amount),
          category,
          note
        })
      });
      
      // Clear form
      setAmount('');
      setCategory('');
      setNote('');
      setAlertMessage('Transaction added successfully!');
      
      fetchSummary();
    } catch (error) {
      setAlertMessage('Error adding transaction');
    }
    setIsLoading(false);
  };

  const fetchSummary = async () => {
    try {
      const res = await fetch('http://localhost:8000/summary');
      const data = await res.json();
      setSummary(data.summary); // Store the parsed object instead of stringified JSON
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const checkAlert = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:8000/alert');
      const data = await res.json();
      if (res.ok) {
        setAlertMessage(data.message);
      } else {
        setAlertMessage(data.detail);
      }
    } catch (error) {
      setAlertMessage('Error checking monthly limit');
      console.log(error)
    }
    setIsLoading(false);
  };

  const askQuestion = async (q) => {
    if (!q.trim()) {
      setAlertMessage('Please enter a question');
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:8000/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: q }),
      });
      
      const data = await res.json();
      setQuestionAnswer(data.answer);
      setQuestion('');
    } catch (error) {
      setAlertMessage('Error getting answer');
      console.log(error)
    }
    setIsLoading(false);
  };

  // Load summary on component mount
  useEffect(() => {
    fetchSummary();
  }, []);

  // Calculate financial metrics
  const netIncome = summary ? summary.income - summary.expense : 0;
  const savingsRate = summary && summary.income > 0 ? ((summary.income - summary.expense) / summary.income * 100) : 0;
  
  // Prepare chart data
  const pieData = summary ? [
    { name: 'Available', value: summary.income - summary.expense, color: '#10B981' },
    { name: 'Expenses', value: summary.expense, color: '#EF4444' }
  ] : [];

  const barData = summary ? [
    { name: 'Income', amount: summary.income, color: '#10B981' },
    { name: 'Expenses', amount: summary.expense, color: '#EF4444' }
  ] : [];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => setAlertMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [alertMessage]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Wallet className="w-10 h-10 text-indigo-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">Personal Finance Assistant</h1>
          </div>
          <p className="text-gray-600">Track your expenses, monitor budgets, and get insights</p>
        </div>

        {/* Alert Message */}
        {alertMessage && (
          <div className="mb-6 p-4 bg-blue-100 border border-blue-300 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 text-blue-600 mr-2" />
            <span className="text-blue-800">{alertMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Transaction Form */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center mb-6">
              <PlusCircle className="w-6 h-6 text-indigo-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-800">Add Transaction</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="expense">💸 Expense</option>
                  <option value="income">💰 Income</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="e.g., Food, Transport, Entertainment"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                  placeholder="Additional details..."
                  rows="3"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <button
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={addExpense}
                disabled={isLoading}
              >
                {isLoading ? 'Adding...' : 'Add Transaction'}
              </button>

              <button
                className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-red-600 hover:to-pink-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={checkAlert}
                disabled={isLoading}
              >
                {isLoading ? 'Checking...' : 'Check Monthly Limit'}
              </button>
            </div>
          </div>

          {/* Q&A Section */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center mb-6">
              <MessageCircle className="w-6 h-6 text-green-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-800">Ask Assistant</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Question</label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
                  placeholder="Ask me about your expenses, spending patterns, or financial advice..."
                  rows="4"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
              </div>

              <button
                onClick={() => askQuestion(question)}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? 'Thinking...' : 'Ask Assistant'}
              </button>

              {questionAnswer && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Assistant's Answer:</h3>
                  <p className="text-green-700">{questionAnswer}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center mb-6">
            <TrendingUp className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-800">Financial Dashboard</h2>
          </div>
          
          {summary ? (
            <div className="space-y-6">
              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Total Income</p>
                      <p className="text-2xl font-bold">{formatCurrency(summary.income)}</p>
                    </div>
                    <ArrowUpCircle className="w-8 h-8 text-green-200" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-xl p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-100 text-sm">Total Expenses</p>
                      <p className="text-2xl font-bold">{formatCurrency(summary.expense)}</p>
                    </div>
                    <ArrowDownCircle className="w-8 h-8 text-red-200" />
                  </div>
                </div>
                
                <div className={`bg-gradient-to-r ${netIncome >= 0 ? 'from-blue-500 to-indigo-500' : 'from-orange-500 to-red-500'} rounded-xl p-4 text-white`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Net Income</p>
                      <p className="text-2xl font-bold">{formatCurrency(netIncome)}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-blue-200" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Savings Rate</p>
                      <p className="text-2xl font-bold">{savingsRate.toFixed(1)}%</p>
                    </div>
                    <Wallet className="w-8 h-8 text-purple-200" />
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Money Distribution</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Bar Chart */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Income vs Expenses</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                        {barData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Financial Health Indicator */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Financial Health</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Expense Ratio</span>
                      <span>{((summary.expense / summary.income) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${
                          (summary.expense / summary.income) > 0.8 ? 'bg-red-500' : 
                          (summary.expense / summary.income) > 0.6 ? 'bg-yellow-500' : 
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min((summary.expense / summary.income) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {(summary.expense / summary.income) > 0.8 ? 'High spending - consider reducing expenses' :
                       (summary.expense / summary.income) > 0.6 ? 'Moderate spending - room for improvement' :
                       'Great! You\'re saving well'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-center py-12">
              <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg mb-2">No financial data available yet</p>
              <p className="text-sm">Add some transactions to see your beautiful dashboard!</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}