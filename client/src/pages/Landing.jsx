import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, ArrowRight, Shield, BarChart3, 
  Zap, CheckCircle2, Sun, Moon, Plus, 
  Mail, TrendingUp, Bell, Layers, RefreshCw
} from 'lucide-react';

export default function Landing({ isDark, onToggleTheme }) {
  const [balance, setBalance] = useState(96800);
  const [expenses, setExpenses] = useState(12400);
  const [foodBudget, setFoodBudget] = useState(4200);

  // Smooth scrolling for anchor links
  useEffect(() => {
    const handleScrollToHash = () => {
      const hash = window.location.hash;
      const scrollHashes = ['#workflow', '#features', '#security'];
      
      if (scrollHashes.includes(hash)) {
        const targetElement = document.querySelector(hash);
        if (targetElement) {
          setTimeout(() => {
            const navbarHeight = 80;
            const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
            const absoluteOffsetPosition = elementPosition - navbarHeight;

            window.scrollTo({
              top: absoluteOffsetPosition,
              behavior: 'smooth'
            });
          }, 50);
        }
      }
    };

    window.addEventListener('hashchange', handleScrollToHash);
    return () => window.removeEventListener('hashchange', handleScrollToHash);
  }, []);

  const runDemoSimulation = () => {
    const expensesPool = [200, 350, 500, 750];
    const pickedExpense = expensesPool[Math.floor(Math.random() * expensesPool.length)];
    
    setBalance(prev => prev - pickedExpense);
    setExpenses(prev => prev + pickedExpense);
    setFoodBudget(prev => Math.min(prev + pickedExpense, 10000));
  };

  // FIX: Removed the 'y' movement so elements just fade in perfectly still
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  return (
    <div className="min-h-screen w-full font-sans antialiased selection:bg-teal-500/20 transition-colors duration-300 overflow-x-hidden" style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-main)' }}>
      
      {/* NAVIGATION BAR */}
      <nav className="w-full border-b sticky top-0 z-50 transition-colors shadow-sm" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface)' }}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center shadow-md shadow-teal-500/10">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">SpendSmart</span>
          </div>

          <div className="hidden md:flex items-center space-x-8 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            <a href="#workflow" className="hover:text-teal-500 transition-colors">How it works</a>
            <a href="#features" className="hover:text-teal-500 transition-colors">Features</a>
            <a href="#security" className="hover:text-teal-500 transition-colors">Security</a>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl theme-panel cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              title="Toggle Layout Theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
            <a 
              href="#login" 
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm rounded-xl shadow-sm transition-all flex items-center space-x-1 group"
            >
              <span>Launch App</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="lg:col-span-6 space-y-6 text-center lg:text-left"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
            The only app that gets your <br />
            <span className="bg-gradient-to-r from-teal-500 to-emerald-400 bg-clip-text text-transparent">money into shape</span>
          </h1>
          <p className="text-base md:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Manage money on the go. Have perfect control over all your automated cash records, bank allocations, and smart budget goals inside one single screen.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
            <button 
              onClick={runDemoSimulation}
              className="w-full sm:w-auto px-6 py-3.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-md text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
            >
              <span>Simulate Live Expense</span>
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* HERO RIGHT MOCKUPS PANEL */}
        <div className="lg:col-span-6 flex justify-center relative">
          <div className="absolute inset-0 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-[440px] theme-panel rounded-[24px] p-5 shadow-2xl relative bg-opacity-70 backdrop-blur-md"
          >
            <div className="flex justify-between items-center mb-4 border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>
              <span className="text-xs font-bold tracking-wide uppercase opacity-60">Live Vault Preview</span>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 dark:bg-black/20 border rounded-xl flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
                <span className="text-xs font-bold">Total Aggregated Balance</span>
                <motion.span 
                  key={balance}
                  initial={{ scale: 0.9, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-sm font-black text-teal-500"
                >
                  ₹{balance.toLocaleString('en-IN')}
                </motion.span>
              </div>
              <div className="h-32 rounded-xl bg-gradient-to-br from-teal-600/10 to-emerald-500/10 border border-teal-500/20 p-4 flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Monthly Yield Delta</span>
                <div className="w-full h-12 flex items-end space-x-1.5">
                  {[40, 55, 35, 70, 60, 90, 85].map((h, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      className="flex-1 bg-teal-500 rounded-t-sm" 
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* TRUST BADGES */}
      <section className="border-t border-b py-8 my-6" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface)' }}>
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs font-semibold tracking-wide" style={{ color: 'var(--text-muted)' }}>
          <div className="space-y-1">
            <p className="text-base font-bold text-teal-500">4.7 out of 5 stars</p>
            <p className="text-[11px]">In Global Evaluation Metrics</p>
          </div>
          <div className="space-y-1 sm:border-l sm:border-r" style={{ borderColor: 'var(--border-color)' }}>
            <p className="text-base font-bold text-teal-500">Automated Pipeline</p>
            <p className="text-[11px]">Zero-friction Data Ingestion</p>
          </div>
          <div className="space-y-1">
            <p className="text-base font-bold text-teal-500">Enterprise Scale Blueprint</p>
            <p className="text-[11px]">Built strictly around placement criteria</p>
          </div>
        </div>
      </section>

      {/* THREE CORE BRIEF SECTIONS PANEL */}
      <section className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: <Shield className="w-4 h-4" />, title: "Have perfect control", text: "Oversee your total transactions, custom budgets, and bank alert balances in one dashboard interface." },
          { icon: <BarChart3 className="w-4 h-4" />, title: "Get a quick overview", text: "Analyze total incomes, active targets, and shifting month-to-month cash behaviors instantly." },
          { icon: <Zap className="w-4 h-4" />, title: "Use our smart budgets", text: "Establish programmatic limit metrics to cut down unnecessary leaks before they trigger budget breaks." }
        ].map((item, idx) => (
          <motion.div 
            key={idx}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={fadeIn}
            className="theme-panel p-5 rounded-xl space-y-2 text-center md:text-left shadow-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-500 flex items-center justify-center mx-auto md:mx-0">{item.icon}</div>
            <h4 className="font-bold text-sm">{item.title}</h4>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.text}</p>
          </motion.div>
        ))}
      </section>

      {/* DYNAMIC SECTION WORKFLOW */}
      <section id="workflow" className="max-w-6xl mx-auto px-4 py-16 space-y-24">
        
        {/* STEP 1 PANEL */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeIn}
            className="space-y-4 order-last lg:order-first"
          >
            <span className="text-xs font-black text-teal-500 uppercase tracking-widest block">Step 1</span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Track your cash flow automatically</h2>
            <div className="space-y-3 pt-2 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              <div className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                <p><strong className="text-teal-500">Automated SMS/Email Parsing Ingestion:</strong> Connect secure notification alerts to parse incoming bank transaction logs instantly without manual inputs.</p>
              </div>
              <div className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                <p>Add cash adjustments cleanly via rapid entry modal panels.</p>
              </div>
            </div>
          </motion.div>
          <div className="flex justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="w-full max-w-[360px] theme-panel rounded-2xl p-4 space-y-3 shadow-xl"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-40 block">Connected Wallets Ledger</span>
              <div className="p-3 bg-teal-600 text-white rounded-xl flex justify-between items-center">
                <div>
                  <p className="text-[10px] opacity-80 font-bold">Primary Checking Account</p>
                  <p className="text-xs">Active SMS Parsing</p>
                </div>
                <span className="text-sm font-bold">₹56,200</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-black/20 border rounded-xl flex justify-between items-center" style={{ borderColor: 'var(--border-color)' }}>
                <span className="text-xs font-medium">Cash Stash Envelope</span>
                <span className="text-xs font-bold">₹7,950</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* STEP 2 PANEL */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="flex justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="w-full max-w-[360px] theme-panel rounded-2xl p-5 space-y-4 shadow-xl"
            >
              <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: 'var(--border-color)' }}>
                <span className="text-xs font-bold">Account Chart Delta</span>
                <span className="text-[10px] font-semibold opacity-60">Overview Period</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <div>
                  <p className="text-[9px] uppercase opacity-50">Current Balance</p>
                  <p className="font-bold text-teal-500">+₹96,800</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] uppercase opacity-50">Monthly Flow</p>
                  <p className="font-bold text-rose-500">-₹12,400</p>
                </div>
              </div>
            </motion.div>
          </div>
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeIn}
            className="space-y-4"
          >
            <span className="text-xs font-black text-teal-500 uppercase tracking-widest block">Step 2</span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Understand your financial habits</h2>
            <div className="space-y-3 pt-2 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              <div className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                <p>Analyze your daily outflows using simple graphic panels. No need for complicated Excel sheets.</p>
              </div>
              <div className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                <p><strong className="text-teal-500">Live Macroeconomic Ticker:</strong> Keep track of daily economic movements directly from external financial REST APIs.</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* STEP 3 PANEL */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeIn}
            className="space-y-4 order-last lg:order-first"
          >
            <span className="text-xs font-black text-teal-500 uppercase tracking-widest block">Step 3</span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Make your spending stress-free</h2>
            <div className="space-y-3 pt-2 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              <div className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                <p>Set budget limits for chosen categories to control sudden cash leaks.</p>
              </div>
              <div className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                <p><strong className="text-teal-500">AI Assistant Guidance Sandbox:</strong> Get automated recommendations for wealth growth custom-tailored to your exact asset bracket.</p>
              </div>
            </div>
          </motion.div>
          <div className="flex justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="w-full max-w-[360px] theme-panel rounded-2xl p-4 space-y-3 shadow-xl"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-40 block">Active Budgets Outflow</span>
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between font-medium mb-1">
                    <span>Food & Dining Budget</span>
                    <span className="font-bold">₹{foodBudget.toLocaleString('en-IN')} / ₹10,000</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <motion.div animate={{ width: `${(foodBudget / 10000) * 100}%` }} className="h-full bg-teal-500 rounded-full" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

      </section>

      {/* FEATURES GRID */}
      <section id="features" className="max-w-6xl mx-auto px-4 py-16 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Features our users love</h2>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Engineered simply to build healthy money choices day by day.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: <Layers className="w-4 h-4" />, title: "Shared Envelopes", text: "Perfect for track management across couples, family members, or roommates handling budgets together." },
            { icon: <Mail className="w-4 h-4" />, title: "Automated Pipeline", text: "Eliminates data entry friction by fetching transactions straight from bank messaging formats." },
            { icon: <Plus className="w-4 h-4" />, title: "Custom Categories", text: "Customize your categories dynamically and add custom metadata fields to every asset record." },
            { icon: <TrendingUp className="w-4 h-4" />, title: "Macroeconomic Sync", text: "Connect live economic data feeds to stay informed of daily financial market movements." },
            { icon: <Bell className="w-4 h-4" />, title: "Alerts and Reminders", text: "Receive notifications before approaching budget thresholds or missing billing cycles." },
            { icon: <RefreshCw className="w-4 h-4" />, title: "Cross-Device Portability", text: "Keep your data synchronized perfectly across multiple devices without manual ledger conflicts." }
          ].map((feat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="theme-panel p-5 rounded-xl space-y-2 shadow-sm"
            >
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-500 flex items-center justify-center">{feat.icon}</div>
              <h4 className="font-bold text-sm">{feat.title}</h4>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{feat.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SECURITY */}
      <section id="security" className="max-w-6xl mx-auto px-4 py-12 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="theme-panel p-8 rounded-[24px] shadow-lg text-center space-y-3 max-w-2xl mx-auto"
        >
          <div className="w-11 h-11 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center mx-auto">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-extrabold tracking-tight">Your data is locked & secure</h3>
          <p className="text-xs max-w-md mx-auto leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            We leverage tokenized cryptographic user access standards to keep your transactions completely isolated and private.
          </p>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="w-full border-t py-6 text-center text-[11px]" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
        <p>© 2026 SpendSmart Inc. Clean, straightforward, smart wealth tracking.</p>
      </footer>
    </div>
  );
}