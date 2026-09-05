import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, ArrowLeft, Sun, Moon, Wallet } from 'lucide-react';

export default function ForgotPassword({ isDark, onToggleTheme }) {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Recovery request logic will connect to Backend API Layer during Module 22
    console.log({ email });
    setIsSubmitted(true);
  };

  return (
    <div className="no-scroll-view w-screen flex flex-col items-center justify-center p-4 font-sans antialiased relative transition-colors duration-300" style={{ backgroundColor: 'var(--bg-app)' }}>
      
      {/* Dynamic Theme Controller */}
      <div className="absolute top-4 right-4 z-50">
        <button
          type="button"
          onClick={onToggleTheme}
          className="p-2.5 rounded-xl theme-panel cursor-pointer hover:scale-105 active:scale-95 transition-all"
          title="Toggle UI Mode"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>
      </div>

      {/* Viewport Fitted Recovery Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-[420px] theme-panel p-6 md:p-8 rounded-[24px] shadow-2xl relative"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center justify-center text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/10 mb-2">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-main)' }}>
            Reset Password
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {isSubmitted 
              ? "Check your inbox for access link instructions." 
              : "Enter your email to receive a secure dashboard recovery link."}
          </p>
        </div>

        {!isSubmitted ? (
          /* Password Recovery Input Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold tracking-wide uppercase" style={{ color: 'var(--text-main)' }}>
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl text-xs theme-input"
                  required
                />
              </div>
            </div>

            {/* Submit Request Button */}
            <button
              type="submit"
              className="w-full mt-2 py-3 px-4 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-semibold rounded-xl text-xs transition-all duration-200 shadow-md shadow-teal-600/10 flex items-center justify-center space-x-2 group cursor-pointer"
            >
              <span>Send Recovery Link</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>
        ) : (
          /* Post Submission Message Confirmation Box */
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center p-4 bg-teal-500/10 border border-teal-500/20 rounded-xl space-y-2"
          >
            <p className="text-xs font-medium text-teal-600 dark:text-teal-400">
              Recovery Link Transmitted Successfully
            </p>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              We have dispatched instructions to <strong className="font-semibold" style={{ color: 'var(--text-main)' }}>{email}</strong> if an account exists.
            </p>
          </motion.div>
        )}

        {/* Back to Login Anchor link redirect */}
        <div className="mt-6 pt-4 border-t flex justify-center text-xs" style={{ borderColor: 'var(--border-color)' }}>
          <a 
            href="#login" 
            className="inline-flex items-center space-x-1 font-semibold hover:text-teal-500 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Sign In</span>
          </a>
        </div>
      </motion.div>
    </div>
  );
}