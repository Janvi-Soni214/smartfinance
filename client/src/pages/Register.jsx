import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Sun, Moon, Wallet } from 'lucide-react';
import axios from 'axios';
import { useGoogleLogin } from '@react-oauth/google';

export default function Register({ isDark, onToggleTheme }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Standard Email/Password Registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!agreeTerms) {
      alert("Please agree to the Terms of Service.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/register`, {
        fullName: fullName,
        email: email,
        password: password,
      });

      alert(response.data.message); 
      window.location.hash = "#login"; 

    } catch (error) {
      console.error("Registration error:", error.response?.data?.message || error.message);
      alert(error.response?.data?.message || "Registration failed. Please try again.");
    }
  };

  // Google OAuth Registration / Login
  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/google`, {
          access_token: tokenResponse.access_token
        });
        
        // Save token and route straight to dashboard
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        window.location.hash = "#dashboard"; 
      } catch (error) {
        console.error("Google Login Error:", error);
        alert("Failed to authenticate with our server.");
      }
    },
    onError: () => {
      console.log('Google Sign-In Failed');
    },
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

      {/* Viewport Fitted Registration Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-[440px] theme-panel p-6 md:p-8 rounded-[24px] shadow-2xl relative"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center justify-center text-center mb-5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/10 mb-2">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-main)' }}>
            Create Account
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Join SpendSmart to automate and plan your budgets.
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold tracking-wide uppercase" style={{ color: 'var(--text-main)' }}>
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter Your Full Name"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl text-xs theme-input"
                required
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold tracking-wide uppercase" style={{ color: 'var(--text-main)' }}>
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
          <div className="space-y-1">
            <label className="text-[10px] font-semibold tracking-wide uppercase" style={{ color: 'var(--text-main)' }}>
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

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold tracking-wide uppercase" style={{ color: 'var(--text-main)' }}>
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-Enter Password"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl text-xs theme-input"
                required
              />
            </div>
          </div>

          {/* Terms and Conditions Checkbox */}
          <div className="flex items-center text-[10px] pt-0.5">
            <label className="flex items-center space-x-2 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="rounded border-gray-300 dark:border-white/20 bg-transparent text-teal-600 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                required
              />
              <span style={{ color: 'var(--text-muted)' }} className="group-hover:opacity-80 transition-opacity">
                I agree to the Terms of Service & Privacy Policy
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full mt-1 py-3 px-4 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-semibold rounded-xl text-xs transition-all duration-200 shadow-md shadow-teal-600/10 flex items-center justify-center space-x-2 group cursor-pointer"
          >
            <span>Create Account</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-4.5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" style={{ borderColor: 'var(--border-color)' }}></div>
          </div>
          <div className="relative flex justify-center text-[9px] uppercase">
            <span className="px-2 tracking-wider" style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
              Or Onboard via
            </span>
          </div>
        </div>

        {/* Google Sign-up Integration */}
        <button
          type="button"
          onClick={() => loginWithGoogle()}
          className="w-full py-2.5 px-4 bg-transparent border text-xs font-medium rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray/10"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          <span>Sign up with Google</span>
        </button>

        {/* Redirect back to Login */}
        <p className="text-center text-xs mt-5" style={{ color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <a href="#login" className="text-teal-500 font-semibold hover:text-teal-400 transition-colors">
            Sign In
          </a>
        </p>
      </motion.div>
    </div>
  );
}