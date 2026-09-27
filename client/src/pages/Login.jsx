import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sun, Moon, Wallet } from 'lucide-react';
import axios from 'axios';
import { useGoogleLogin } from '@react-oauth/google'; 

export default function Login({ isDark, onToggleTheme }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Standard Email/Password Login
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email: email,
        password: password,
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      window.location.hash = "#dashboard"; 
    } catch (error) {
      console.error("Login error:", error.response?.data?.message || error.message);
      alert(error.response?.data?.message || "Login failed. Please check your credentials.");
    }
  };

  // Google OAuth Login with Gmail Permissions
  const handleGoogleLogin = useGoogleLogin({
    // 1. Request permission to read emails along with standard profile data
    scope: 'email profile https://www.googleapis.com/auth/gmail.readonly',
    
    // 2. When they click "Allow", capture the token and log them in
    onSuccess: async (tokenResponse) => {
      try {
        console.log("✅ Google Popup Success!");
        
        // A. Clear any old session/tokens first so accounts never mix
        localStorage.clear();

        // B. Save the new Gmail Access Token
        localStorage.setItem('google_access_token', tokenResponse.access_token);
        
        // B. Send the token directly to your backend (This matches your auth.js logic!)
        const res = await axios.post('http://localhost:5000/api/auth/google', {
          access_token: tokenResponse.access_token
        });

        // C. Save your app's secure JWT token and user data
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));

        // D. Navigate to the Dashboard
        window.location.hash = "#dashboard"; 
        
      } catch (error) {
        console.error("❌ Login process failed:", error);
        alert("Failed to connect to the server. Check the console.");
      }
    },
    onError: error => console.error('Google Login Popup Failed:', error)
  });

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

      {/* Viewport Fitted Login Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-[430px] theme-panel p-6 md:p-8 rounded-[24px] shadow-2xl relative"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center justify-center text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/10 mb-3">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-main)' }}>
            SpendSmart
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Sign in to access your money management dashboard.
          </p>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: 'var(--text-main)' }}>
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter Your Email"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl text-xs theme-input"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: 'var(--text-main)' }}>
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Password"
                className="w-full pl-11 pr-11 py-2.5 rounded-xl text-xs theme-input"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors focus:outline-none cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
              >
                {showPassword ? <EyeOff className="w-4 h-4 hover:text-teal-500" /> : <Eye className="w-4 h-4 hover:text-teal-500" />}
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-between items-center text-[11px] pt-0.5">
            <label className="flex items-center space-x-2 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-gray-300 dark:border-white/20 bg-transparent text-teal-600 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
              />
              <span style={{ color: 'var(--text-muted)' }} className="group-hover:opacity-80 transition-opacity">
                Keep me authenticated
              </span>
            </label>
            <a href="#forgot" className="text-teal-500 font-semibold hover:text-teal-400 transition-colors">
              Forgot Password?
            </a>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full mt-1 py-3 px-4 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-semibold rounded-xl text-xs transition-all duration-200 shadow-md shadow-teal-600/10 flex items-center justify-center space-x-2 group cursor-pointer"
          >
            <span>Sign In to Dashboard</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" style={{ borderColor: 'var(--border-color)' }}></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="px-2 tracking-wider" style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
              Third-Party Secure Auth
            </span>
          </div>
        </div>

        {/* Google OAuth Button */}
       <button 
        onClick={() => handleGoogleLogin()} 
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-semibold cursor-pointer"
      >
        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
        Continue with Google
      </button>

        {/* Redirect */}
        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          New to our platform?{' '}
          <a href="#register" className="text-teal-500 font-semibold hover:text-teal-400 transition-colors">
            Register
          </a>
        </p>
      </motion.div>
    </div>
  );
}