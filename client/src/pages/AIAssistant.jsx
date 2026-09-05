import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

// --- Guided Interaction Data ---
const CATEGORIES = [
  { id: 'BALANCE', title: 'My Money', icon: '💰', desc: 'Balances & cash flow' },
  { id: 'EXPENSES', title: 'Expenses', icon: '📊', desc: 'Spending analysis' },
  { id: 'BUDGET', title: 'Budget', icon: '🎯', desc: 'Limits & tracking' },
  { id: 'SAVINGS', title: 'Savings', icon: '💵', desc: 'Goals & plans' },
  { id: 'TRANSACTIONS', title: 'Transactions', icon: '📧', desc: 'Missing or duplicated' },
  { id: 'SUMMARY', title: 'Monthly Summary', icon: '📅', desc: 'Overall financial health' },
  { id: 'INVESTMENTS', title: 'Investments', icon: '📈', desc: 'Education & concepts' },
];

const PREDEFINED_QUESTIONS = {
  BALANCE: ["What is my current balance?", "Why did my balance decrease?", "Show my balance history", "How much money do I have available?"],
  EXPENSES: ["Where am I spending the most?", "Why are my expenses increasing?", "Compare my expenses with last month", "How can I reduce my expenses?"],
  BUDGET: ["Am I within my budget?", "How much budget do I have left?", "Which category is over budget?", "Help me create a monthly budget"],
  SAVINGS: ["How much did I save this month?", "How can I save more money?", "Can I reach my savings goal?", "Create a simple savings plan"],
  TRANSACTIONS: ["Show my recent transactions", "Why is a transaction missing?", "Why is my transaction amount incorrect?", "Why wasn't my expense updated?"],
  SUMMARY: ["Give me my monthly financial summary", "How much did I spend this month?", "Compare this month with last month", "Am I improving financially?"],
  INVESTMENTS: ["Explain stocks", "Explain SIP", "Explain mutual funds", "What is diversification?", "Explain investment risk"]
};

// Map questions to suggested follow-ups
const FOLLOW_UPS = {
  "Where am I spending the most?": ["How can I reduce it?", "Show my top transactions", "Compare with last month"],
  "How can I reduce my expenses?": ["Show my biggest expense", "Analyze my spending", "Create a budget"],
  // Add more mappings as needed
};

const AIAssistant = () => {
  const [viewState, setViewState] = useState('categories'); // 'categories', 'questions', or 'chat'
  const [activeCategory, setActiveCategory] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentFollowUps, setCurrentFollowUps] = useState([]);
  
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleCategoryClick = (categoryId) => {
    setActiveCategory(categoryId);
    setViewState('questions');
  };

  const handleSendQuestion = async (text, intent = null) => {
    if (!text.trim()) return;

    // Transition to chat view
    setViewState('chat');
    
    // Add user message
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    setCurrentFollowUps([]);

    try {
      const token = localStorage.getItem('token');
      // Replace with your actual backend URL
      const response = await axios.post('http://localhost:5000/api/ai/chat', 
        { 
          message: text,
          intent: intent || activeCategory || 'GENERAL'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const aiMsg = { role: 'ai', content: response.data.reply };
      setMessages(prev => [...prev, aiMsg]);
      
      // Check if this question triggers specific follow-up suggestions
      if (FOLLOW_UPS[text]) {
        setCurrentFollowUps(FOLLOW_UPS[text]);
      }

    } catch (error) {
      const errorMsg = { role: 'error', content: "Network error or missing financial data. Please try again." };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (viewState === 'questions') setViewState('categories');
    if (viewState === 'chat') {
        // If returning to menu, we keep the chat history but change the view
        setViewState('categories');
        setActiveCategory(null);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      
      {/* Header Area */}
      <header className="px-6 py-8 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
               AI Finance Assistant
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
              Get quick answers about your expenses, budget, savings and transactions.
            </p>
          </div>
          {viewState !== 'categories' && (
            <button 
              onClick={handleBack}
              className="px-4 py-2 text-sm font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl transition-colors"
            >
              ← Back to Options
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 flex justify-center">
        <div className="w-full max-w-4xl">
          
          {/* STATE 1: CATEGORIES */}
          {viewState === 'categories' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8 text-center sm:text-left">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  Hello! 👋 How can I help you with your finances today?
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
                    className="p-5 flex flex-col items-start bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer text-left group"
                  >
                    <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">{cat.icon}</span>
                    <h3 className="font-bold text-gray-900 dark:text-white">{cat.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{cat.desc}</p>
                  </button>
                ))}
              </div>
              
              {/* If there is existing chat history, allow them to return to it quickly */}
              {messages.length > 0 && (
                <div className="mt-8 text-center">
                    <button onClick={() => setViewState('chat')} className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                        Return to active conversation ↓
                    </button>
                </div>
              )}
            </div>
          )}

          {/* STATE 2: PREDEFINED QUESTIONS */}
          {viewState === 'questions' && activeCategory && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
                {CATEGORIES.find(c => c.id === activeCategory)?.icon} 
                Ask about {CATEGORIES.find(c => c.id === activeCategory)?.title}
              </h2>
              <div className="flex flex-col gap-3">
                {PREDEFINED_QUESTIONS[activeCategory].map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendQuestion(q, activeCategory)}
                    className="px-6 py-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors text-left flex justify-between items-center group"
                  >
                    {q}
                    <span className="text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STATE 3: ACTIVE CHAT */}
          {viewState === 'chat' && (
            <div className="flex flex-col space-y-6 pb-20">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : msg.role === 'error'
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-tl-none'
                  }`}>
                    {/* Render basic markdown/newlines cleanly */}
                    {msg.role === 'user' ? (
                    <p className="text-[13px] leading-relaxed">{msg.content}</p>
                  ) : (
                    <div className="text-[13px] leading-relaxed">
                      <ReactMarkdown
                        components={{
                          p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} />,
                          h3: ({node, ...props}) => <h3 className="font-bold text-sm mt-4 mb-2" style={{ color: 'var(--text-main)' }} {...props} />,
                          strong: ({node, ...props}) => <strong className="font-bold text-teal-600 dark:text-teal-400" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />,
                          li: ({node, ...props}) => <li className="pl-1" {...props} />,
                          hr: ({node, ...props}) => <hr className="my-3 border-t opacity-30" style={{ borderColor: 'var(--border-color)' }} {...props} />
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                  </div>
                </div>
              ))}
              
              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-none p-4 flex gap-2 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              )}

              {/* Dynamic Follow-Up Suggestions */}
              {!isLoading && currentFollowUps.length > 0 && msg.role !== 'user' && (
                <div className="flex flex-wrap gap-2 mt-4 animate-in fade-in duration-500">
                  {currentFollowUps.map((followUp, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendQuestion(followUp)}
                      className="px-4 py-2 text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                    >
                      {followUp}
                    </button>
                  ))}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Persistent Bottom Chat Input */}
      <footer className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 z-20">
        <form 
          className="max-w-4xl mx-auto relative flex items-center"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendQuestion(inputText);
          }}
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask a finance question..."
            disabled={isLoading}
            className="w-full px-5 py-4 bg-gray-100 dark:bg-gray-900 border border-transparent dark:border-gray-700 rounded-full text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow disabled:opacity-50"
          />
          <button 
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
          </button>
        </form>
      </footer>

    </div>
  );
};

export default AIAssistant;