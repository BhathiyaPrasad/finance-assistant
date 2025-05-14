'use client';
import { useState, useEffect, useRef } from 'react';
import { Bot, Plus, AlertCircle, DollarSign, PieChart, Send, Wallet, Mic, X, Volume2, Monitor } from 'lucide-react';

export default function Home() {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [summary, setSummary] = useState('');
  const [question, setQuestion] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceCommand, setVoiceCommand] = useState('');
  const [botMessage, setBotMessage] = useState('');
  const [interactionStep, setInteractionStep] = useState(0);
  
  // Create refs for speech recognition
  const recognitionRef = useRef(null);
  const speechSynthesisRef = useRef(null);

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

  const askQuestion = async (q) => {
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
  useEffect(() => {
    if (typeof window !== 'undefined' && window.SpeechRecognition || window.webkitSpeechRecognition) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        setVoiceCommand(transcript);
        processVoiceCommand(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event);
        setIsListening(false);
        speakResponse("I couldn't hear you clearly. Could you try again?");
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        
        if (interactionStep === 0) {
          speakResponse("Hello! I'm FinBot. Would you like to add an expense, income, or ask about your finances?");
          setInteractionStep(1);
        }
      } catch (err) {
        console.error('Speech recognition error:', err);
      }
    } else {
      alert('Speech recognition is not supported in your browser.');
    }
  };

  const speakResponse = (text) => {
    setBotMessage(text);
    
    // Use speech synthesis if available
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      // Find a robot-like voice if possible
      const voices = window.speechSynthesis.getVoices();
      const robotVoice = voices.find(voice => 
        voice.name.includes('Google') || voice.name.includes('Microsoft')
      );
      
      if (robotVoice) {
        utterance.voice = robotVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const processVoiceCommand = (command) => {
    const normalizedCommand = command.toLowerCase().trim();
    
    // State machine for multi-step voice interactions
    switch (interactionStep) {
      case 1: // Initial command
        if (normalizedCommand.includes('expense') || normalizedCommand.includes('spent')) {
          setType('expense');
          speakResponse("Adding an expense. How much did you spend?");
          setInteractionStep(2);
        } else if (normalizedCommand.includes('income') || normalizedCommand.includes('earned')) {
          setType('income');
          speakResponse("Adding income. How much did you receive?");
          setInteractionStep(2);
        } else if (normalizedCommand.includes('check limit') || normalizedCommand.includes('alert')) {
          speakResponse("Checking your monthly spending limits.");
          checkAlert();
          setInteractionStep(0);
        } else if (normalizedCommand.includes('ask') || normalizedCommand.includes('question')) {
          speakResponse("What would you like to know about your finances?");
          setInteractionStep(5);
        } else if (normalizedCommand.includes('summary') || normalizedCommand.includes('overview')) {
          speakResponse("Here's your financial summary.");
          setInteractionStep(0);
        } else {
          speakResponse("I didn't understand. Would you like to add an expense, income, or ask about your finances?");
          setInteractionStep(1);
        }
        break;
        
      case 2: // Amount input
        const amountMatch = normalizedCommand.match(/\d+(\.\d+)?/);
        if (amountMatch) {
          const extractedAmount = amountMatch[0];
          setAmount(extractedAmount);
          speakResponse(`Amount set to ${extractedAmount}. What category is this for?`);
          setInteractionStep(3);
        } else {
          speakResponse("I couldn't catch the amount. Please say a number.");
        }
        break;
        
      case 3: // Category input
        setCategory(normalizedCommand);
        speakResponse(`Category set to ${normalizedCommand}. Any notes you'd like to add?`);
        setInteractionStep(4);
        break;
        
      case 4: // Note input
        setNote(normalizedCommand);
        speakResponse("Thank you! Adding your transaction now.");
        // Wait a bit then add the expense/income
        setTimeout(() => {
          addExpense();
          setInteractionStep(0);
          speakResponse("Transaction added successfully!");
        }, 1000);
        break;
        
      case 5: // Question input
        setQuestion(normalizedCommand);
        speakResponse("Let me find that information for you.");
        askQuestion(normalizedCommand);
        setInteractionStep(0);
        break;
        
      default:
        speakResponse("Would you like to add an expense, income, or ask about your finances?");
        setInteractionStep(1);
    }
  };

  const toggleVoiceMode = () => {
    setVoiceMode(!voiceMode);
    if (!voiceMode) {
      // Entering voice mode
      speakResponse("Voice mode activated. Click the microphone when you're ready to speak.");
    } else {
      // Exiting voice mode
      setBotMessage('');
      setInteractionStep(0);
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
  };
    
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto p-6 max-w-md">
        {/* Robot Header with Mode Toggle */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div className="rounded-full bg-blue-600 p-3 mr-3">
              <Bot size={32} />
            </div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
              FinBot
            </h1>
          </div>
          <button 
            onClick={toggleVoiceMode}
            className={`rounded-full p-2 transition ${voiceMode ? 'bg-green-600' : 'bg-gray-700'}`}
            title={voiceMode ? "Disable Voice Mode" : "Enable Voice Mode"}
          >
            <Monitor size={24} />
          </button>
        </div>
        
        {/* Voice Assistant Mode */}
        {voiceMode && (
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700 mb-6 relative overflow-hidden">
            {/* Robot Animation */}
            <div className="flex justify-center mb-4">
              <div className={`relative w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ${isListening ? 'animate-pulse' : ''}`}>
                <Bot size={64} />
                
                {/* Voice Visualization */}
                {isListening && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div 
                          key={i}
                          className="w-1 bg-white rounded-full animate-bounce" 
                          style={{ 
                            height: `${20 + Math.random() * 20}px`,
                            animationDelay: `${i * 0.1}s`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Bot Message */}
            {botMessage && (
              <div className="bg-gray-700 rounded-lg p-3 mb-4 text-center">
                <p>{botMessage}</p>
              </div>
            )}
            
            {/* Voice Input Controls */}
            <div className="flex justify-center space-x-4">
              <button
                className={`rounded-full p-4 flex items-center justify-center transition ${isListening 
                  ? 'bg-red-600 animate-pulse' 
                  : 'bg-blue-600 hover:bg-blue-500'}`}
                onClick={isListening ? () => {
                  if (recognitionRef.current) recognitionRef.current.abort();
                  setIsListening(false);
                } : startListening}
              >
                {isListening ? <X size={24} /> : <Mic size={24} />}
              </button>
            </div>
            
            {/* Current Transaction Preview */}
            {(amount || category || note) && (
              <div className="mt-4 bg-gray-700 bg-opacity-50 rounded-lg p-3">
                <h3 className="font-medium text-center mb-2">Current Transaction</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-400">Type:</span>
                  <span className={type === 'expense' ? 'text-red-400' : 'text-green-400'}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </span>
                  
                  {amount && (
                    <>
                      <span className="text-gray-400">Amount:</span>
                      <span>${amount}</span>
                    </>
                  )}
                  
                  {category && (
                    <>
                      <span className="text-gray-400">Category:</span>
                      <span>{category}</span>
                    </>
                  )}
                  
                  {note && (
                    <>
                      <span className="text-gray-400">Note:</span>
                      <span>{note}</span>
                    </>
                  )}
                </div>
              </div>
            )}
            
            {/* Voice Commands Guide */}
            <div className="mt-4 text-xs text-gray-400">
              <p className="text-center mb-1">Voice Commands:</p>
              <ul className="grid grid-cols-2 gap-x-2 gap-y-1">
                <li>"Add expense"</li>
                <li>"Add income"</li>
                <li>"Check limit"</li>
                <li>"Ask a question"</li>
              </ul>
            </div>
          </div>
        )}
        
        {/* Standard Interface (hidden in voice mode) */}
        {!voiceMode && (
          <>
            {/* Main Interface */}
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
            
            {/* AI Assistant Section */}
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
            
            {/* Summary Section */}
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
          </>
        )}
        
        {/* Footer */}
        <div className="text-center mt-8 text-gray-400 text-sm">
          <p>FinBot v1.0 | Your Personal Finance Assistant</p>
        </div>
      </div>
    </div>
  );
}