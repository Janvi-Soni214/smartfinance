import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, PieChart, Wallet, Bot,
  Newspaper, MessageSquarePlus, User, Settings,
  LogOut, Menu, X, Sun, Moon,
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Activity, ShoppingBag, Coffee, Monitor, Search, Filter, Plus, Send,
  ExternalLink, Clock, Camera, Shield, Bell, Key, Smartphone, Mail, Trash2, Calendar, Edit2, Eye, EyeOff
} from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { io } from 'socket.io-client';
import ReactMarkdown from 'react-markdown';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const CustomSelect = ({ value, onChange, options, icon: Icon, className, variant }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isTransparent = variant === 'transparent';

  return (
    <div className={`relative ${className || ''}`} ref={dropdownRef}>
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50 z-10 pointer-events-none" />}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left transition-all flex items-center justify-between ${Icon ? 'pl-9' : (isTransparent ? 'px-0' : 'px-4')} pr-8 py-2.5 rounded-xl text-xs font-medium focus:outline-none cursor-pointer ${isTransparent ? 'bg-transparent border-0 hover:text-teal-500' : 'theme-input border'}`}
        style={isTransparent ? { color: 'var(--text-muted)' } : { backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
      >
        <span className="truncate">{value}</span>
        <svg className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-teal-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-48 min-w-full mt-1 rounded-xl shadow-lg py-1 max-h-60 overflow-auto border left-0" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-xs transition-colors hover:bg-teal-500/10 hover:text-teal-500 ${value === opt ? 'bg-teal-500/10 text-teal-500 font-semibold' : ''} cursor-pointer break-words`}
              style={{ color: value === opt ? undefined : 'var(--text-main)' }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};


export default function Dashboard({ isDark, onToggleTheme }) {

  // 1. Get the user object from local storage
  const storedUser = JSON.parse(localStorage.getItem('user'));

  // 2. Extract user details safely for the UI
  const fullName = storedUser?.name || 'Active User';
  const firstName = fullName.split(' ')[0];
  const lastName = fullName.split(' ').slice(1).join(' ');
  const userEmail = storedUser?.email || 'user@example.com';
  const initial = firstName.charAt(0).toUpperCase();

  const getLocalDateString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('Overview');
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

  // Close notification panel on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Expenses Module State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // New features state
  const [dateFilter, setDateFilter] = useState('');
  const [isUpdateBalanceModalOpen, setIsUpdateBalanceModalOpen] = useState(false);
  const [newTotalBalance, setNewTotalBalance] = useState('');

  // Dynamic Backend State
  const [allTransactions, setAllTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTx, setNewTx] = useState({ name: '', category: 'Uncategorized', amount: '', type: 'Expense' });

  // Baseline Modal State
  const [showBaselineModal, setShowBaselineModal] = useState(false);
  const [startingBalance, setStartingBalance] = useState('');

  // Profile Editing State
  const [profileFirstName, setProfileFirstName] = useState(firstName);
  const [profileLastName, setProfileLastName] = useState(lastName);
  const [profilePhone, setProfilePhone] = useState(storedUser?.phone || '');
  const [profileImage, setProfileImage] = useState(storedUser?.profileImage || '');

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Categories Editing State
  const defaultCategories = [
    'Living expenses', 'Transportation expenses', 'Family care',
    'Personal care', 'Health care', 'Technology', 'Debt payments',
    'Savings and investments', 'Entertainment', 'Miscellaneous expenses'
  ];
  const [customCategories, setCustomCategories] = useState(storedUser?.categories || defaultCategories);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Statement Download & Reminder States
  const [showReminder, setShowReminder] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [downloadFrom, setDownloadFrom] = useState('');
  const [downloadTo, setDownloadTo] = useState('');

  // AI Chat Assistant State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { id: 1, role: 'bot', text: `Hello ${firstName}! I am your AI Finance Assistant. How can I help you analyze your spending or optimize your budget today?` }
  ]);
  const chatEndRef = useRef(null);

  // Budget State
  const [budgets, setBudgets] = useState([]);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showPasswordCurrent, setShowPasswordCurrent] = useState(false);
  const [showPasswordNew, setShowPasswordNew] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [showPasswordDelete, setShowPasswordDelete] = useState(false);

  // Settings State
  const [settings, setSettings] = useState(storedUser?.settings || {
    twoFactorEnabled: false,
    emailAlerts: true,
    smsParsing: true
  });
  const [newBudget, setNewBudget] = useState({ category: 'Food & Dining', limit: '' });

  // Market News State
  const [marketNews, setMarketNews] = useState([]);
  const [isNewsLoading, setIsNewsLoading] = useState(true);

  // Yearly Calendar State
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const menuItems = [
    { name: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: 'Expenses', icon: <PieChart className="w-4 h-4" /> },
    { name: 'Budgets', icon: <Wallet className="w-4 h-4" /> },
    { name: 'AI Finance Assistant', icon: <Bot className="w-4 h-4" /> },
    { name: 'Market News', icon: <Newspaper className="w-4 h-4" /> },
    { name: 'Yearly Calendar', icon: <Calendar className="w-4 h-4" /> },
    { name: 'Profile', icon: <User className="w-4 h-4" /> },
    { name: 'Settings', icon: <Settings className="w-4 h-4" /> }
  ];

  // Helper function to map string categories from DB to React Icons
  const getIconForCategory = (category, amount) => {
    const colorClass = amount > 0 ? 'text-emerald-500' : 'text-rose-500';
    switch (category) {
      case 'Income': return <TrendingUp className={`w-4 h-4 ${colorClass}`} />;
      case 'Electronics': return <Monitor className={`w-4 h-4 ${colorClass}`} />;
      case 'Food & Dining': return <Coffee className={`w-4 h-4 ${colorClass}`} />;
      case 'Groceries': return <ShoppingBag className={`w-4 h-4 ${colorClass}`} />;
      case 'Entertainment': return <Monitor className={`w-4 h-4 ${colorClass}`} />;
      case 'Transport': return <Activity className={`w-4 h-4 ${colorClass}`} />;
      case 'Housing': return <Wallet className={`w-4 h-4 ${colorClass}`} />;
      default: return <ShoppingBag className={`w-4 h-4 ${colorClass}`} />;
    }
  };

  // Fetch Market News
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await axios.get('http://localhost:5000/api/news', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMarketNews(response.data);
      } catch (err) {
        console.error('Error fetching market news:', err);
      } finally {
        setIsNewsLoading(false);
      }
    };
    fetchNews();
  }, []);

  // Fetch Data from Backend
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const token = localStorage.getItem('token'); // <-- Get the token

        // Pass the token in the headers
        const response = await axios.get('http://localhost:5000/api/transactions', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const formattedData = response.data
          .map(tx => ({
            ...tx,
            id: tx._id,
            icon: getIconForCategory(tx.category, tx.amount)
          }))
          // Sort: newest date first, then by createdAt for same-day ties
          .sort((a, b) => {
            const dateDiff = new Date(b.date) - new Date(a.date);
            if (dateDiff !== 0) return dateDiff;
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
          });

        setAllTransactions(formattedData);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // Fetch Budgets from Backend
  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await axios.get('http://localhost:5000/api/budgets', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBudgets(response.data);
      } catch (error) {
        console.error("Error fetching budgets:", error);
      }
    };
    fetchBudgets();
  }, []);

  // 🔥 BASELINE BALANCE CHECKER 🔥
  useEffect(() => {
    // Only check after the database has finished loading their transactions
    if (!isLoading) {
      // Look to see if they already have an initial balance set
      const hasBaseline = allTransactions.some(tx => tx.name === 'Initial Bank Balance');

      // Check if they previously clicked "Skip"
      const hasSkipped = localStorage.getItem(`skip_baseline_${userEmail}`);

      if (!hasBaseline && !hasSkipped) {
        setShowBaselineModal(true);
      }
    }
  }, [isLoading, allTransactions, userEmail]);

  // 🔥 AUTOMATIC GMAIL SYNC ENGINE 🔥
  useEffect(() => {
    const autoSyncGmail = async () => {
      const googleToken = localStorage.getItem('google_access_token');
      const appToken = localStorage.getItem('token');
      const currentUser = JSON.parse(localStorage.getItem('user'));

      // Only attempt to sync if logged in via Google and email matches the stored user session
      if (googleToken && appToken && currentUser?.email) {
        console.log(`🔄 Background Gmail Sync Started for ${currentUser.email}...`);
        try {
          const response = await axios.post('http://localhost:5000/api/gmail/sync',
            { googleAccessToken: googleToken },
            { headers: { Authorization: `Bearer ${appToken}` } }
          );

          console.log(response.data.message);

          if (response.data.message.includes("Successfully") && !response.data.message.includes(" 0 ")) {
            console.log("New transactions found! Updating dashboard...");
          }
        } catch (err) {
          console.error("Auto-sync failed in background:", err);
        }
      }
    };

    autoSyncGmail();
    // Check every 10 minutes instead of every minute to save Gemini API Quota!
    const interval = setInterval(autoSyncGmail, 600000);

    return () => clearInterval(interval);
  }, []);

  // 🔥 REAL-TIME SOCKET.IO LISTENER 🔥
  useEffect(() => {
    // Connect to the backend
    const socket = io('http://localhost:5000');

    // Extract user ID (Check if your DB uses _id or id)
    const userId = storedUser?._id || storedUser?.id;

    if (userId) {
      // 1. Join the secure private room
      socket.emit('join_user_room', userId);

      // 2. Listen for any new transactions pushed from the server
      socket.on('transaction_added', (newTx) => {
        console.log("⚡ Real-time transaction received!", newTx);

        const formattedTx = {
          ...newTx,
          id: newTx._id,
          icon: getIconForCategory(newTx.category, newTx.amount)
        };

        setAllTransactions(prev => {
          // 🔥 THE FIX: Check if this transaction ID is already on the screen!
          const alreadyExists = prev.some(tx => tx.id === formattedTx.id);

          if (alreadyExists) {
            return prev; // Do nothing, Axios already handled it!
          }

          return [formattedTx, ...prev]; // Otherwise, it came from an email sync, so add it!
        });
      });
    }

    // Cleanup the connection when the user logs out or leaves the page
    return () => {
      socket.disconnect();
    };
  }, []); // Empty dependency array ensures this connects only once on load

  // 🔥 AUTOMATED BALANCE REMINDER LOGIC
  useEffect(() => {
    if (allTransactions.length > 0) {
      // Find the most recent time the user synced their balance
      const lastSyncTx = allTransactions.find(tx =>
        tx.name === 'Manual Balance Adjustment' ||
        tx.name === 'Initial Bank Balance'
      );

      if (lastSyncTx) {
        const lastSyncDate = new Date(lastSyncTx.date);
        const today = new Date();

        // Calculate the difference in days
        const diffTime = Math.abs(today - lastSyncDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Trigger reminder if it has been 14 days or more
        if (diffDays >= 14) {
          setShowReminder(true);
        } else {
          setShowReminder(false);
        }
      }
    }
  }, [allTransactions]);

  // Handle Form Submission for New Transaction
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      // 🔥 FIX 1: Close modal and reset form immediately to prevent double-clicks
      setIsAddModalOpen(false);

      const finalAmount = newTx.type === 'Expense' ? -Math.abs(parseFloat(newTx.amount)) : Math.abs(parseFloat(newTx.amount));

      const payload = {
        name: newTx.name,
        category: newTx.category,
        amount: finalAmount,
        status: 'Completed',
        date: getLocalDateString()
      };

      // Reset form state so it's clean for the next time it opens
      setNewTx({ name: '', category: 'Uncategorized', amount: '', type: 'Expense' });

      // POST to backend
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/transactions', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 🔥 FIX 2: We REMOVED setAllTransactions here!
      // The Socket.IO listener will push this to the screen automatically.

    } catch (error) {
      console.error("Error adding transaction:", error);
      alert("Database Error: " + (error.response?.data?.message || error.message));
    }
  };

  // Handle Manual Balance Update
  const handleUpdateBalance = async (e) => {
    e.preventDefault();
    try {
      const targetBalance = parseFloat(newTotalBalance);
      if (isNaN(targetBalance)) return;

      const adjustment = targetBalance - currentBalance;

      if (adjustment === 0) {
        setIsUpdateBalanceModalOpen(false);
        return;
      }

      // 🔥 FIX 1: Close modal immediately to prevent accidental double-clicks
      setIsUpdateBalanceModalOpen(false);
      setNewTotalBalance('');

      const payload = {
        name: 'Manual Balance Adjustment',
        category: 'Income',
        amount: adjustment,
        status: 'Completed',
        date: getLocalDateString()
      };

      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/transactions', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 🔥 FIX 2: We REMOVED setAllTransactions here! 
      // The Socket.IO listener will automatically detect the save and update the UI.

    } catch (error) {
      console.error("Error updating balance:", error);
      alert("Failed to update balance.");
    }
  };

  // Handle Setting the Initial Balance from the Welcome Popup
  const handleSetStartingBalance = async (e) => {
    e.preventDefault();
    try {
      // 🔥 FIX 1: Close the modal immediately to prevent accidental double-clicks
      setShowBaselineModal(false);

      const payload = {
        name: 'Initial Bank Balance',
        category: 'Income',
        amount: Math.abs(parseFloat(startingBalance)),
        status: 'Completed',
        date: getLocalDateString(),
        isInitialSetup: true
      };

      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/transactions', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 🔥 FIX 2: We REMOVED setAllTransactions here! 
      // The Socket.IO engine will now push it to the screen cleanly.

    } catch (error) {
      console.error("Error setting starting balance:", error);
      alert("Failed to save starting balance.");
    }
  };

  const handleSkipBaseline = () => {
    localStorage.setItem(`skip_baseline_${userEmail}`, 'true');
    setShowBaselineModal(false);
  };

  // Handle Deleting a Transaction
  const handleDeleteTransaction = async (id) => {
    try {
      const token = localStorage.getItem('token'); // <-- Get the token

      // Pass the token in the headers object
      await axios.delete(`http://localhost:5000/api/transactions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAllTransactions(prevTransactions => prevTransactions.filter(tx => tx.id !== id));
    } catch (error) {
      console.error("Error deleting transaction:", error);
      alert("Failed to delete transaction.");
    }
  };

  // Handle Update Transaction Category Inline
  const handleUpdateTransactionCategory = async (id, newCategory) => {
    try {
      const token = localStorage.getItem('token');
      // Optimistic UI update
      setAllTransactions(prev => prev.map(tx => {
        if (tx.id === id) {
          return { ...tx, category: newCategory, icon: getIconForCategory(newCategory, tx.amount) };
        }
        return tx;
      }));

      await axios.put(`http://localhost:5000/api/transactions/${id}`, { category: newCategory }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error("Error updating category:", error);
      alert("Failed to update category.");
      // Ideally trigger a refresh to restore true state if it fails
    }
  };

  // Handle Profile Update
  const handleProfileUpdate = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await axios.put('http://localhost:5000/api/auth/profile',
        {
          firstName: profileFirstName,
          lastName: profileLastName,
          phone: profilePhone,
          profileImage: profileImage
        },
        { headers: { Authorization: `Bearer ${token}` } } // Send the secure token!
      );

      // Update local storage so it persists on page reload
      localStorage.setItem('user', JSON.stringify(response.data.user));
      alert("Profile updated successfully! 🎉");

    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    }
  };

  const handleToggleSetting = async (settingKey) => {
    const newSettings = { ...settings, [settingKey]: !settings[settingKey] };
    setSettings(newSettings);
    
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put('http://localhost:5000/api/auth/settings', { settings: newSettings }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      localStorage.setItem('user', JSON.stringify(res.data.user));
    } catch (err) {
      console.error('Error updating settings:', err);
      setSettings(settings); // Revert on error
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("New passwords do not match!");
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Password changed successfully! 🎉");
      setIsChangePasswordModalOpen(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to change password.");
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    const confirmDelete = window.confirm("Are you absolutely sure you want to delete your account? This action cannot be undone.");
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete('http://localhost:5000/api/auth/account', {
        headers: { Authorization: `Bearer ${token}` },
        data: { currentPassword: deletePassword }
      });
      alert("Account deleted successfully.");
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete account.");
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim() || customCategories.includes(newCategoryName.trim())) return;
    const updated = [...customCategories, newCategoryName.trim()];
    await updateCategoriesBackend(updated);
    setNewCategoryName('');
  };

  const handleRemoveCategory = async (catToRemove) => {
    const updated = customCategories.filter(c => c !== catToRemove);
    await updateCategoriesBackend(updated);
  };

  const updateCategoriesBackend = async (newCategories) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put('http://localhost:5000/api/auth/categories', 
        { categories: newCategories },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setCustomCategories(newCategories);
    } catch (error) {
      console.error("Error updating categories:", error);
      alert("Failed to update categories.");
    }
  };

  // 🔥 PDF STATEMENT GENERATOR
  const handleDownloadStatement = (e) => {
    e.preventDefault();
    if (!downloadFrom || !downloadTo) return alert('Please select both dates.');

    const [fYear, fMonth, fDay] = downloadFrom.split('-');
    const fromDate = new Date(fYear, fMonth - 1, fDay, 0, 0, 0);
    const [tYear, tMonth, tDay] = downloadTo.split('-');
    const toDate = new Date(tYear, tMonth - 1, tDay, 23, 59, 59);

    // Normalize any date string to "DD Mon YYYY" for consistent PDF display
    const normalizeDate = (raw) => {
      const d = new Date(raw);
      if (isNaN(d.getTime())) return raw; // return as-is if unparseable
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const statementData = [...allTransactions]
      .filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= fromDate && txDate <= toDate;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (statementData.length === 0) return alert('No transactions found in this date range.');

    let totalCredit = 0;
    let totalDebit = 0;
    statementData.forEach(tx => {
      if (tx.amount > 0) totalCredit += tx.amount;
      else totalDebit += Math.abs(tx.amount);
    });
    const closingBalance = totalCredit - totalDebit;

    // ── Build PDF ──
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();

    // Header band
    doc.setFillColor(13, 148, 136);
    doc.rect(0, 0, pageW, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('SpendSmart', 14, 11);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Account Statement', 14, 17);
    doc.text(`Period: ${downloadFrom}  to  ${downloadTo}`, 14, 23);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, pageW - 14, 23, { align: 'right' });

    // Summary cards row
    doc.setTextColor(30, 30, 30);
    const cardY = 34;
    const cardH = 18;
    const cardW = (pageW - 28 - 8) / 3;
    const cardX = [14, 14 + cardW + 4, 14 + (cardW + 4) * 2];
    const cardData = [
      { label: 'Total Credit', value: `INR ${totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: [209, 250, 229] },
      { label: 'Total Debit',  value: `INR ${totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: [254, 226, 226] },
      { label: 'Net Balance',  value: `INR ${closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: [219, 234, 254] },
    ];
    cardData.forEach((card, i) => {
      doc.setFillColor(...card.color);
      doc.roundedRect(cardX[i], cardY, cardW, cardH, 3, 3, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(card.label.toUpperCase(), cardX[i] + 4, cardY + 5);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(20, 20, 20);
      doc.text(card.value, cardX[i] + 4, cardY + 12);
    });

    // Transaction table — numbers use normalizeDate for uniform date display
    const tableRows = statementData.map((tx, idx) => [
      String(idx + 1),          // string so autoTable never wraps digits
      normalizeDate(tx.date),   // uniform "DD Mon YYYY" regardless of stored format
      tx.name,
      tx.category,
      tx.amount > 0 ? 'Credit' : 'Debit',
      `${tx.amount > 0 ? '+' : '-'} INR ${Math.abs(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    ]);

    autoTable(doc, {
      startY: cardY + cardH + 6,
      head: [['#', 'Date', 'Description', 'Category', 'Type', 'Amount (INR)']],
      body: tableRows,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
      headStyles: { fillColor: [13, 148, 136], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 },  // wider so "10", "99" never wrap
        1: { cellWidth: 26 },
        2: { cellWidth: 54 },
        3: { cellWidth: 28 },
        4: { cellWidth: 16, halign: 'center' },
        5: { halign: 'right', cellWidth: 36 },
      },
      didParseCell: (data) => {
        if (data.column.index === 4 && data.section === 'body') {
          data.cell.styles.textColor = data.cell.raw === 'Credit' ? [5, 150, 105] : [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        }
        if (data.column.index === 5 && data.section === 'body') {
          data.cell.styles.textColor = String(data.cell.raw).startsWith('+') ? [5, 150, 105] : [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        }
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    // Footer on every page
    const pageCount = doc.internal.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p);
      doc.setFontSize(7);
      doc.setTextColor(160, 160, 160);
      doc.text(`SpendSmart — Confidential Statement | Page ${p} of ${pageCount}`, pageW / 2, doc.internal.pageSize.getHeight() - 6, { align: 'center' });
    }

    doc.save(`SpendSmart_Statement_${downloadFrom}_to_${downloadTo}.pdf`);
    setIsDownloadModalOpen(false);
    setDownloadFrom('');
    setDownloadTo('');
  };



  // Dynamically Calculate Totals for Overview Cards (Forced as Numbers)
  // Helper to parse dates securely from existing format 'YYYY-MM-DD' or 'MMM DD, YYYY'
  const parseTxDate = (dateStr) => new Date(dateStr);
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  let currentMonthIncome = 0;
  let currentMonthExpenses = 0;
  let lastMonthIncome = 0;
  let lastMonthExpenses = 0;
  let totalIncome = 0;
  let totalExpenses = 0;

  allTransactions.forEach(tx => {
    const amt = Number(tx.amount);
    const date = parseTxDate(tx.date);
    const m = date.getMonth();
    const y = date.getFullYear();

    if (amt > 0) {
      totalIncome += amt;
      if (m === currentMonth && y === currentYear) currentMonthIncome += amt;
      if (m === lastMonth && y === lastMonthYear) lastMonthIncome += amt;
    } else {
      const absAmt = Math.abs(amt);
      totalExpenses += absAmt;
      if (m === currentMonth && y === currentYear) currentMonthExpenses += absAmt;
      if (m === lastMonth && y === lastMonthYear) lastMonthExpenses += absAmt;
    }
  });

  const currentBalance = totalIncome - totalExpenses;

  // Calculate Trends
  const calcTrend = (curr, last) => {
    if (last === 0) return { val: curr > 0 ? "100%" : "0%", isPos: curr >= 0, isUp: curr >= last };
    const diff = curr - last;
    const pct = (diff / last) * 100;
    return { val: `${Math.abs(pct).toFixed(1)}%`, isPos: pct >= 0, isUp: pct >= 0 };
  };

  const incomeTrend = calcTrend(currentMonthIncome, lastMonthIncome);
  
  // For expenses, a mathematical increase (isUp: true) is visually negative (isPos: false)
  const expRaw = lastMonthExpenses === 0 ? (currentMonthExpenses > 0 ? 100 : 0) : ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100;
  const expenseTrend = { val: `${Math.abs(expRaw).toFixed(1)}%`, isPos: expRaw <= 0, isUp: expRaw >= 0 };

  const currentBalMon = currentMonthIncome - currentMonthExpenses;
  const lastBalMon = lastMonthIncome - lastMonthExpenses;
  const balTrend = calcTrend(currentBalMon, lastBalMon);

  // Generate dynamic chart data (last 7 months)
  const chartDataMap = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    const monthName = d.toLocaleDateString('en-US', { month: 'short' });
    chartDataMap[`${d.getFullYear()}-${d.getMonth()}`] = { month: monthName, income: 0, expense: 0, rawIncome: 0, rawExpense: 0 };
  }
  
  allTransactions.forEach(tx => {
    const amt = Number(tx.amount);
    const date = parseTxDate(tx.date);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    if (chartDataMap[key]) {
      if (amt > 0) chartDataMap[key].rawIncome += amt;
      else chartDataMap[key].rawExpense += Math.abs(amt);
    }
  });

  const rawChartData = Object.values(chartDataMap);
  const maxVal = Math.max(...rawChartData.map(d => Math.max(d.rawIncome, d.rawExpense)), 1);
  const chartData = rawChartData.map(d => ({
    month: d.month,
    income: (d.rawIncome / maxVal) * 100,
    expense: (d.rawExpense / maxVal) * 100,
    rawIncome: d.rawIncome || 0,
    rawExpense: d.rawExpense || 0
  }));


  // Dynamically calculate spending for each active budget
  const dynamicBudgets = budgets.map(budget => {
    // 1. Find all negative transactions (expenses) that match this category
    const spent = allTransactions
      .filter(tx => tx.category === budget.category && Number(tx.amount) < 0)
      .reduce((acc, curr) => acc + Math.abs(Number(curr.amount)), 0);

    return {
      id: budget._id,
      category: budget.category,
      limit: budget.limit,
      spent: spent,
      icon: getIconForCategory(budget.category, -1) // Reuses your existing icon helper!
    };
  });

  // (Hardcoded marketNews array removed in favor of real API)

  // Helper to match input date (YYYY-MM-DD) to Database date format (MMM DD, YYYY)
  const getFormattedFilterDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  const formattedDateFilter = getFormattedFilterDate(dateFilter);

  const filteredTransactions = allTransactions.filter(tx => {
    const matchesSearch = tx.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || tx.category === categoryFilter;
    const matchesDate = dateFilter === '' || tx.date === formattedDateFilter; // NEW DATE FILTER
    return matchesSearch && matchesCategory && matchesDate;
  });

  const categories = ['All', 'Income', ...customCategories, 'Uncategorized'];

  // Calculate Yearly Data for Calendar
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const yearlyData = months.map(month => ({ name: month, amount: 0 }));
  
  allTransactions.forEach(tx => {
    const txDate = new Date(tx.date);
    if (!isNaN(txDate) && txDate.getFullYear().toString() === selectedYear) {
      if (tx.amount < 0 || tx.category !== 'Income') { // Only count expenses
        const monthIndex = txDate.getMonth();
        yearlyData[monthIndex].amount += Math.abs(tx.amount);
      }
    }
  });

  const availableYears = [...new Set(allTransactions.map(tx => {
    const d = new Date(tx.date);
    return isNaN(d) ? null : d.getFullYear().toString();
  }).filter(Boolean))].sort((a, b) => b - a);

  if (availableYears.length === 0) availableYears.push(new Date().getFullYear().toString());

  const COLORS = ['#14b8a6', '#0ea5e9', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#6366f1', '#d946ef', '#f43f5e'];

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const cardVariants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } };

  const MetricCard = ({ title, amount, trend, isPositive, isUp, icon, trendText }) => {
    // If isUp is not provided explicitly, default to following isPositive
    const arrowUp = isUp !== undefined ? isUp : isPositive;
    return (
      <motion.div variants={cardVariants} className="theme-panel p-4 sm:p-5 rounded-[20px] shadow-sm flex flex-col justify-between space-y-3 sm:space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1 min-w-0 mr-2">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{title}</p>
            <h3 className="text-lg sm:text-2xl font-black tracking-tight text-teal-500">{amount}</h3>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center shrink-0">{icon}</div>
        </div>
        <div className="flex items-center space-x-1.5 text-[10px] sm:text-xs">
          <span className={`flex items-center font-bold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
            {arrowUp ? <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-0.5" />}
            {trend}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>{trendText}</span>
        </div>
      </motion.div>
    );
  };

  // const handleSendMessage = (e) => {
  //   e.preventDefault();
  //   if (!chatInput.trim()) return;
  //   const newMsg = { id: Date.now(), role: 'user', text: chatInput };
  //   setChatMessages((prev) => [...prev, newMsg]);
  //   setChatInput('');
  //   setTimeout(() => {
  //     setChatMessages((prev) => [...prev, { id: Date.now() + 1, role: 'bot', text: 'I am currently running in frontend sandbox mode. Once connected to the backend API, I will evaluate this against your transaction history and budgets!' }]);
  //   }, 1200);
  // };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    // 1. Save the user's input and immediately add it to the chat screen
    const userText = chatInput;
    const newMsg = { id: Date.now(), role: 'user', text: userText };
    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput('');

    // 2. Add a temporary "loading" bubble so the user knows the AI is thinking
    const loadingId = Date.now() + 1;
    setChatMessages((prev) => [...prev, { id: loadingId, role: 'bot', text: 'Analyzing your finances...' }]);

    try {
      const token = localStorage.getItem('token');

      // 3. Send the secure request to your Node.js backend AI route
      const response = await axios.post('http://localhost:5000/api/ai/chat',
        {
          message: userText,
          intent: 'GENERAL'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 4. Swap the "loading" text out for Gemini's actual response
      setChatMessages((prev) =>
        prev.map(msg =>
          msg.id === loadingId ? { ...msg, text: response.data.reply } : msg
        )
      );

    } catch (error) {
      console.error("AI Error:", error);

      let errorMessage = "Error: Could not connect to the AI engine. Please make sure your backend is running!";
      
      if (error.response?.status === 503) {
        errorMessage = "The AI is currently experiencing high traffic. Please wait a few seconds and try again!";
      } else if (error.response?.status === 429) {
        errorMessage = "Error: Google Gemini API quota exceeded (Rate Limit). Please wait 1 minute before asking another question.";
      } else if (error.response?.data?.message) {
        errorMessage = `Error: ${error.response.data.message}`;
      }

      setChatMessages((prev) =>
        prev.map(msg =>
          msg.id === loadingId ? { ...msg, text: errorMessage } : msg
        )
      );
    }
  };

  useEffect(() => {
    if (activeMenu === 'AI Finance Assistant' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeMenu]);

  // Handle Save Budget
  const handleSaveBudget = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/budgets',
        { category: newBudget.category, limit: Number(newBudget.limit) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Instantly update the UI without reloading
      setBudgets(prev => {
        const exists = prev.find(b => b.category === response.data.category);
        if (exists) {
          return prev.map(b => b.category === response.data.category ? response.data : b);
        }
        return [...prev, response.data];
      });

      setIsBudgetModalOpen(false);
      setNewBudget({ category: 'Food & Dining', limit: '' });
    } catch (error) {
      console.error("Error saving budget:", error);
      alert("Failed to save budget.");
    }
  };

  const handleDeleteBudget = async (id) => {
    if (!window.confirm("Are you sure you want to delete this budget limit?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/budgets/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBudgets(prev => prev.filter(b => b._id !== id));
    } catch (error) {
      console.error("Error deleting budget:", error);
      alert("Failed to delete budget.");
    }
  };

  const handleEditBudget = (budget) => {
    setNewBudget({ category: budget.category, limit: budget.limit });
    setIsBudgetModalOpen(true);
  };

  return (
    <div className="min-h-screen w-full flex overflow-hidden transition-colors duration-300" style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-main)' }}>

      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR PANEL — always fixed, never scrolls */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r transition-transform duration-300 flex flex-col justify-between p-5 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        {/* TOP: logo + nav */}
        <div className="flex flex-col space-y-4 min-h-0 flex-1">
          <div className="flex items-center justify-between pb-2 border-b shrink-0" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/10"><Wallet className="w-4 h-4" /></div>
              <span className="font-bold tracking-tight text-base">SpendSmart</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="p-1 rounded lg:hidden text-gray-400 hover:text-gray-500"><X className="w-4 h-4" /></button>
          </div>

          <nav className="space-y-1 flex-1 overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.name}
                onClick={() => { setActiveMenu(item.name); setIsSidebarOpen(false); }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer 
                  ${activeMenu === item.name
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/10'
                    : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800'
                  }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </button>
            ))}
          </nav>

          {/* 14-DAY BALANCE REMINDER — shows inside sidebar */}
          {showReminder && (
            <button
              onClick={() => { setIsUpdateBalanceModalOpen(true); setIsSidebarOpen(false); }}
              className="w-full flex items-start space-x-2.5 px-3.5 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-colors cursor-pointer text-left shrink-0"
            >
              <span className="relative flex h-2.5 w-2.5 mt-0.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <div>
                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 leading-tight">Balance Check Needed</p>
                <p className="text-[9px] text-amber-700/70 dark:text-amber-500/70 mt-0.5 leading-tight">14+ days since last sync. Tap to update.</p>
              </div>
            </button>
          )}
        </div>

        {/* BOTTOM: theme + logout — always visible */}
        <div className="pt-4 border-t space-y-2 shrink-0" style={{ borderColor: 'var(--border-color)' }}>
          <button
            onClick={onToggleTheme}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <span className="opacity-70">Switch Mode</span>
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.hash = "#login";
            }}
            className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer border-0 bg-transparent text-left"
          >
            <LogOut className="w-4 h-4" /><span>Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* VIEWPORT CONTROLLER COLUMN WRAPPER — offset by sidebar width on desktop */}
      <div className="flex-1 flex flex-col min-w-0 relative lg:ml-64">
        <header className="h-16 w-full border-b flex items-center justify-between px-4 sm:px-6 z-30 transition-colors" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center space-x-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-xl theme-panel lg:hidden cursor-pointer"><Menu className="w-4 h-4" /></button>
            <h1 className="text-sm font-bold tracking-tight opacity-80">Console / <span className="text-teal-500">{activeMenu}</span></h1>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="flex items-center space-x-3 text-xs border pl-3 pr-1.5 py-1.5 rounded-xl theme-panel">
              {/* DYNAMIC HEADER NAME & AVATAR */}
              <span className="font-semibold opacity-80 hidden sm:inline">{fullName}</span>
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-6 h-6 rounded-lg object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-lg bg-teal-600/10 text-teal-500 font-bold flex items-center justify-center">
                  {initial}
                </div>
              )}
            </div>

            {/* NOTIFICATION BELL */}
            <div className="relative" ref={notifRef}>
              <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                <Bell className="w-4.5 h-4.5" style={{ color: 'var(--text-muted)' }} />
                {dynamicBudgets.some(b => b.limit > 0 && (b.spent / b.limit) >= 0.5) && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
                )}
              </button>
              {isNotifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl shadow-xl border z-50 p-3 space-y-2" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                  <p className="text-xs font-bold px-2 pb-2 border-b" style={{ borderColor: 'var(--border-color)' }}>Budget Alerts</p>
                  {dynamicBudgets.filter(b => b.limit > 0 && (b.spent / b.limit) >= 0.5).length > 0 ? (
                    dynamicBudgets.map(b => {
                      if (b.limit <= 0) return null;
                      const pct = (b.spent / b.limit) * 100;
                      if (pct < 50) return null;
                      let msg = '';
                      let dotColor = '';
                      if (pct >= 100) {
                        msg = `Budget exceeded for ${b.category}!`;
                        dotColor = 'bg-rose-500';
                      } else if (pct >= 75) {
                        msg = `${pct.toFixed(0)}% of ${b.category} budget used.`;
                        dotColor = 'bg-amber-500';
                      } else {
                        msg = `${pct.toFixed(0)}% of ${b.category} budget used.`;
                        dotColor = 'bg-blue-500';
                      }
                      return (
                        <div key={`notif-${b.id}`} className="flex items-start space-x-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dotColor}`}></span>
                          <div>
                            <p className="text-xs font-semibold">{msg}</p>
                            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>₹{b.spent.toLocaleString('en-IN')} of ₹{b.limit.toLocaleString('en-IN')}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs p-3 text-center" style={{ color: 'var(--text-muted)' }}>No alerts — all budgets on track! 🎉</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* WORKSPACE VIEWPORT PANEL */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto z-20">

          {/* OVERVIEW MODULE */}
          {activeMenu === 'Overview' && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  {/* DYNAMIC GREETING */}
                  <h2 className="text-2xl font-extrabold tracking-tight">Welcome back, {firstName}! 👋</h2>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Here is a summary of your accounts and cash flow this month.</p>
                </div>
              </div>

              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title="Total Balance"
                  amount={`₹${currentBalance.toLocaleString('en-IN')}`}
                  trend={balTrend.val}
                  isPositive={balTrend.isPos}
                  isUp={balTrend.isUp}
                  trendText="vs last month"
                  icon={<Wallet className="w-5 h-5" />}
                />
                <MetricCard
                  title="Monthly Income"
                  amount={`₹${currentMonthIncome.toLocaleString('en-IN')}`}
                  trend={incomeTrend.val}
                  isPositive={incomeTrend.isPos}
                  isUp={incomeTrend.isUp}
                  trendText="vs last month"
                  icon={<TrendingUp className="w-5 h-5" />}
                />
                <MetricCard
                  title="Monthly Expenses"
                  amount={`₹${currentMonthExpenses.toLocaleString('en-IN')}`}
                  trend={expenseTrend.val}
                  isPositive={expenseTrend.isPos}
                  isUp={expenseTrend.isUp}
                  trendText="vs last month"
                  icon={<TrendingDown className="w-5 h-5" />}
                />
                <MetricCard
                  title="Active Budgets"
                  amount={`${dynamicBudgets.length}`}
                  trend={dynamicBudgets.some(b => b.limit > 0 && (b.spent / b.limit) >= 1) ? "Over budget" : "Stable"}
                  isPositive={!dynamicBudgets.some(b => b.limit > 0 && (b.spent / b.limit) >= 1)}
                  trendText="limits tracking"
                  icon={<Activity className="w-5 h-5" />}
                />
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }} className="lg:col-span-2 theme-panel p-5 sm:p-6 rounded-[24px] shadow-sm flex flex-col space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-sm">Cashflow Analytics</h3>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Income vs Expenses over time</p>
                    </div>
                  </div>
                  <div className="flex-1 min-h-[250px] flex items-end justify-between pt-4 space-x-2">
                    {chartData.map((data, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full space-y-2">
                        <div className="w-full flex justify-center items-end space-x-1 h-full">
                          <motion.div title={`Income: ₹${data.rawIncome.toLocaleString('en-IN')}`} initial={{ height: 0 }} animate={{ height: `${data.income}%` }} transition={{ duration: 0.7, delay: idx * 0.1 }} className="w-full max-w-[12px] bg-teal-500 rounded-t-sm" />
                          <motion.div title={`Expense: ₹${data.rawExpense.toLocaleString('en-IN')}`} initial={{ height: 0 }} animate={{ height: `${data.expense}%` }} transition={{ duration: 0.7, delay: idx * 0.1 + 0.1 }} className="w-full max-w-[12px] bg-rose-500 rounded-t-sm" />
                        </div>
                        <span className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>{data.month}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }} className="lg:col-span-1 theme-panel p-6 rounded-[24px] shadow-sm flex flex-col space-y-4">
                  <div className="flex justify-between items-center border-b pb-4" style={{ borderColor: 'var(--border-color)' }}>
                    <h3 className="font-bold text-sm">Recent Transactions</h3>
                  </div>
                  <div className="flex flex-col space-y-4 overflow-y-auto flex-1 pr-1">
                    {allTransactions.slice(0, 4).map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between group">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-gray-800">{tx.icon}</div>
                          <div>
                            <p className="text-xs font-bold">{tx.name}</p>
                            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{tx.category} • {tx.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs font-black ${tx.amount > 0 ? 'text-emerald-500' : ''}`}>
                            {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setActiveMenu('Expenses')}
                    className="w-full py-2.5 text-xs font-bold rounded-xl border transition-colors mt-2 cursor-pointer 
                    bg-gray-100 text-gray-800 hover:bg-gray-200 
                    dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    View All Activity
                  </button>
                </motion.div>
              </div>
            </div>
          )}

          {/* EXPENSES MODULE */}
          {activeMenu === 'Expenses' && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-7xl mx-auto space-y-6">

              <div className="flex items-center flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs theme-input"
                  />
                </div>

                {/* DATE FILTER with custom teal icon */}
                <div className="relative flex-1 min-w-[140px]">
                  <input
                    type="date"
                    id="expenseDateFilter"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full pl-4 pr-9 py-2.5 rounded-xl text-xs theme-input cursor-pointer date-no-indicator"
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('expenseDateFilter').showPicker()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-teal-500/10 transition-colors cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>

                <CustomSelect
                  icon={Filter}
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  options={categories}
                  className="flex-1 min-w-[140px]"
                />

                {/* ACTION BUTTONS GROUP */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {/* DOWNLOAD STATEMENT BUTTON */}
                  <button onClick={() => setIsDownloadModalOpen(true)} className="flex-1 px-3 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center whitespace-nowrap">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    <span className="ml-1.5">Statement</span>
                  </button>

                  {/* UPDATE BALANCE BUTTON */}
                  <button onClick={() => setIsUpdateBalanceModalOpen(true)} className="flex-1 px-3 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center whitespace-nowrap">
                    <Wallet className="w-4 h-4 shrink-0" />
                    <span className="ml-1.5">Balance</span>
                  </button>

                  {/* ADD NEW BUTTON */}
                  <button onClick={() => setIsAddModalOpen(true)} className="flex-1 px-3 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center whitespace-nowrap">
                    <Plus className="w-4 h-4 shrink-0" />
                    <span className="ml-1.5">Add New</span>
                  </button>
                </div>
              </div>


              <div className="theme-panel rounded-[24px] overflow-hidden shadow-sm">

                {/* DESKTOP TABLE — hidden on small screens */}
                <div className="hidden md:block">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b text-[10px] uppercase tracking-wider" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                        <th className="p-4 font-bold">Transaction</th>
                        <th className="p-4 font-bold">Category</th>
                        <th className="p-4 font-bold">Date</th>
                        <th className="p-4 font-bold">Type</th>
                        <th className="p-4 font-bold text-right">Amount</th>
                        <th className="p-4 font-bold text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs divide-y" style={{ borderColor: 'var(--border-color)' }}>
                      {filteredTransactions.length > 0 ? (
                        filteredTransactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-400/40 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-gray-800 shrink-0">
                                  {tx.icon}
                                </div>
                                <span className="font-bold">{tx.name}</span>
                              </div>
                            </td>
                            <td className="p-4 font-medium" style={{ color: 'var(--text-muted)' }}>
                              <CustomSelect 
                                value={tx.category} 
                                onChange={(val) => handleUpdateTransactionCategory(tx.id, val)}
                                className="w-32"
                                variant="transparent"
                                options={categories.filter(c => c !== 'All')}
                              />
                            </td>
                            <td className="p-4 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{tx.date}</td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${tx.amount > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                {tx.amount > 0 ? 'Credit' : 'Debit'}
                              </span>
                            </td>
                            <td className={`p-4 text-right font-black whitespace-nowrap ${tx.amount > 0 ? 'text-emerald-500' : ''}`}>
                              {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => handleDeleteTransaction(tx.id)}
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors opacity-70 hover:opacity-100 cursor-pointer"
                                title="Delete Transaction"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>
                            No transactions found matching your criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE CARDS — shown only on small screens */}
                <div className="md:hidden divide-y" style={{ borderColor: 'var(--border-color)' }}>
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((tx) => (
                      <div key={tx.id} className="p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-gray-800 shrink-0">
                            {tx.icon}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-xs truncate">{tx.name}</p>
                            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{tx.category} · {tx.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 shrink-0">
                          <div className="text-right">
                            <p className={`font-black text-xs ${tx.amount > 0 ? 'text-emerald-500' : ''}`}>
                              {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </p>
                            <span className={`text-[9px] font-bold ${tx.amount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {tx.amount > 0 ? 'Credit' : 'Debit'}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteTransaction(tx.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                      No transactions found matching your criteria.
                    </div>
                  )}
                </div>

                <div className="p-4 border-t flex justify-between items-center text-xs" style={{ borderColor: 'var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Showing {filteredTransactions.length} of {allTransactions.length} entries</span>
                  <div className="flex space-x-1">
                    <div className="flex space-x-1">
                      <button
                        className="px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 
                                  bg-white text-gray-600 hover:bg-gray-100 
                                  dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                        style={{ borderColor: 'var(--border-color)' }}
                        disabled
                      >
                        Prev
                      </button>

                      <button className="px-3 py-1.5 rounded-lg bg-teal-600 text-white font-medium">1</button>

                      <button
                        className="px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 
                                  bg-white text-gray-600 hover:bg-gray-100 
                                  dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                        style={{ borderColor: 'var(--border-color)' }}
                        disabled
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* BUDGETS MODULE */}
          {activeMenu === 'Budgets' && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-7xl mx-auto space-y-6">

              <div className="flex flex-row justify-between items-end gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight">Budget Management</h2>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Set limits and monitor your spending across categories.</p>
                </div>

                <button onClick={() => setIsBudgetModalOpen(true)} className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center space-x-2 cursor-pointer active:scale-95 whitespace-nowrap shrink-0">
                  <Plus className="w-4 h-4" />
                  <span>Create Budget</span>
                </button>
              </div>



              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {dynamicBudgets.map((budget) => {
                  // ... keep the rest of the progress bar code exactly the same ...
                  const percent = Math.min((budget.spent / budget.limit) * 100, 100);
                  const isOver = percent >= 90;
                  const isWarning = percent >= 75 && percent < 90;

                  let progressColor = 'bg-teal-500';
                  if (isOver) progressColor = 'bg-rose-500';
                  else if (isWarning) progressColor = 'bg-amber-500';

                  return (
                    <motion.div key={budget.id} variants={cardVariants} className="theme-panel p-6 rounded-[24px] shadow-sm flex flex-col space-y-5">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                            {budget.icon}
                          </div>
                          <h3 className="font-bold text-sm">{budget.category}</h3>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-gray-50 dark:bg-gray-800" style={{ color: 'var(--text-muted)' }}>
                            {percent.toFixed(0)}% Used
                          </span>
                          <button onClick={() => handleEditBudget(budget)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer" title="Edit Budget">
                            <Edit2 className="w-3.5 h-3.5 opacity-70 hover:opacity-100" />
                          </button>
                          <button onClick={() => handleDeleteBudget(budget.id)} className="p-1 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-colors cursor-pointer" title="Delete Budget">
                            <Trash2 className="w-3.5 h-3.5 opacity-70 hover:opacity-100" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-end text-xs">
                          <span className="font-black text-lg">₹{budget.spent.toLocaleString('en-IN')}</span>
                          <span style={{ color: 'var(--text-muted)' }}>of ₹{budget.limit.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className={`h-full rounded-full ${progressColor}`}
                          />
                        </div>
                      </div>

                      <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                        {budget.limit - budget.spent > 0
                          ? `₹${(budget.limit - budget.spent).toLocaleString('en-IN')} remaining this month`
                          : 'Budget limit exceeded'}
                      </p>
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.div>
          )}

          {/* MARKET NEWS MODULE */}
          {activeMenu === 'Market News' && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-row justify-between items-end gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight">Market News & Insights</h2>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Stay updated with the latest macroeconomic trends and financial news.</p>
                </div>
              </div>
              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {isNewsLoading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="theme-panel p-6 rounded-[24px] shadow-sm flex flex-col justify-between space-y-4 animate-pulse">
                      <div className="space-y-3">
                        <div className="w-16 h-5 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-800">
                        <div className="w-20 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="w-16 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                    </div>
                  ))
                ) : marketNews.length > 0 ? (
                  marketNews.map((news) => (
                    <motion.div key={news.id} variants={cardVariants}>
                      <a href={news.link} target="_blank" rel="noopener noreferrer" className="block h-full">
                        <div className="theme-panel p-6 rounded-[24px] shadow-sm flex flex-col justify-between space-y-4 group cursor-pointer hover:shadow-md transition-shadow h-full">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-teal-500/10 text-teal-500 uppercase tracking-wider">{news.tag}</span>
                              <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-teal-500" />
                            </div>
                            <h3 className="font-bold text-sm leading-snug group-hover:text-teal-500 transition-colors">{news.title}</h3>
                          </div>
                          <div className="flex items-center justify-between text-[11px] pt-4 border-t" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                            <span className="font-medium">{news.source}</span>
                            <div className="flex items-center space-x-1"><Clock className="w-3 h-3" /><span>{news.time}</span></div>
                          </div>
                        </div>
                      </a>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-3 py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    No financial news available at the moment.
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* AI FINANCE ASSISTANT MODULE */}
          {activeMenu === 'AI Finance Assistant' && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-140px)] space-y-4">
              <div className="flex-shrink-0">
                <h2 className="text-2xl font-extrabold tracking-tight">AI Finance Assistant</h2>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Ask questions about your habits, request budget reviews, or get wealth optimization tips.</p>
              </div>
              <div className="flex-1 theme-panel rounded-[24px] shadow-sm flex flex-col overflow-hidden">
                <div className="flex-1 p-6 overflow-y-auto space-y-4 flex flex-col">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3.5 text-[13px] leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-teal-600 text-white rounded-2xl rounded-br-sm' : 'bg-gray-100 dark:bg-gray-800/60 rounded-2xl rounded-bl-sm text-gray-800 dark:text-gray-200'}`}>
                        {msg.role === 'user' ? (
                          msg.text
                        ) : (
                          <ReactMarkdown
                            components={{
                              p: ({ node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
                              h3: ({ node, ...props }) => <h3 className="font-bold text-sm mt-4 mb-2 text-teal-600 dark:text-teal-400" {...props} />,
                              strong: ({ node, ...props }) => <strong className="font-bold text-teal-700 dark:text-teal-400" {...props} />,
                              ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
                              ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />,
                              li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                              hr: ({ node, ...props }) => <hr className="my-3 border-t border-gray-300 dark:border-gray-600" {...props} />
                            }}
                          >
                            {msg.text}
                          </ReactMarkdown>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="p-4 border-t flex items-center space-x-3" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface)' }}>
                  <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="E.g., How much did I spend on food this month?" className="flex-1 pl-4 pr-4 py-3 rounded-xl text-xs theme-input" />
                  <button type="submit" disabled={!chatInput.trim()} className="p-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl shadow-md"><Send className="w-4 h-4" /></button>
                </form>
              </div>
            </motion.div>
          )}

          {/* BALANCE REMINDER BANNER */}
          {showReminder && (
            <div className="mb-6 w-full bg-amber-500/10 border border-amber-500/50 rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-500/20 rounded-full text-amber-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-600 dark:text-amber-400">Time for a Checkup!</h4>
                  <p className="text-xs text-amber-700/80 dark:text-amber-500/80 mt-0.5">It has been over 14 days since you last verified your bank balance. Update it now to keep your AI analytics accurate.</p>
                </div>
              </div>
              <button onClick={() => setIsUpdateBalanceModalOpen(true)} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-xs transition-colors shadow-md whitespace-nowrap">
                Verify Balance
              </button>
            </div>
          )}

          {/* PROFILE MODULE - NOW FULLY DYNAMIC */}
          {activeMenu === 'Profile' && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight">User Profile</h2>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Manage your personal information and account preferences.</p>
              </div>
              <div className="theme-panel p-5 sm:p-8 rounded-[24px] shadow-sm flex flex-col md:flex-row gap-8">
                <div className="flex flex-col items-center space-y-4 md:w-1/3 border-b md:border-b-0 md:border-r pb-6 md:pb-0 md:pr-8" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="relative">
                    {/* DYNAMIC AVATAR INITIAL */}
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" className="w-24 h-24 rounded-full object-cover shadow-lg" />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center text-white text-3xl font-bold shadow-lg uppercase">
                        {initial}
                      </div>
                    )}
                    <input 
                      type="file" 
                      id="profileImageInput" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                    />
                    <label htmlFor="profileImageInput" className="absolute bottom-0 right-0 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md border hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer" style={{ borderColor: 'var(--border-color)' }}>
                      <Camera className="w-4 h-4 text-teal-500" />
                    </label>
                  </div>
                  <div className="text-center">
                    {/* DYNAMIC FULL NAME */}
                    <h3 className="font-bold text-lg">{fullName}</h3>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Joined July 2026</p>
                  </div>
                </div>

                <div className="md:w-2/3 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold tracking-wide uppercase" style={{ color: 'var(--text-main)' }}>First Name</label>
                      <input
                        type="text"
                        value={profileFirstName}
                        onChange={(e) => setProfileFirstName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl text-xs theme-input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold tracking-wide uppercase" style={{ color: 'var(--text-main)' }}>Last Name</label>
                      <input
                        type="text"
                        value={profileLastName}
                        onChange={(e) => setProfileLastName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl text-xs theme-input"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold tracking-wide uppercase" style={{ color: 'var(--text-main)' }}>Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                      <input type="email" value={userEmail} className="w-full pl-11 pr-4 py-2.5 rounded-xl text-xs theme-input opacity-70 cursor-not-allowed" disabled />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold tracking-wide uppercase" style={{ color: 'var(--text-main)' }}>Phone Number</label>
                    <div className="relative">
                      <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                      <input
                        type="tel"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl text-xs theme-input"
                      />
                    </div>
                  </div>
                  <div className="pt-4">
                    <button
                      onClick={handleProfileUpdate} // <-- Connected the function here!
                      className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer active:scale-95"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>

              <div className="theme-panel p-5 sm:p-8 rounded-[24px] shadow-sm mt-6">
                <h3 className="font-bold text-lg mb-4">Manage Categories</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {customCategories.map(cat => (
                    <div key={cat} className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-semibold">
                      <span>{cat}</span>
                      <button onClick={() => handleRemoveCategory(cat)} className="ml-1 hover:text-rose-500 transition-colors cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleAddCategory} className="flex space-x-3 max-w-sm">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="New category..."
                    className="flex-1 px-4 py-2.5 rounded-xl text-xs theme-input"
                  />
                  <button type="submit" disabled={!newCategoryName.trim()} className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                    Add
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* SETTINGS MODULE */}
          {activeMenu === 'Settings' && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight">System Settings</h2>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Configure notifications, security, and application behavior.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Security Card */}
                <div className="theme-panel p-6 rounded-[24px] shadow-sm space-y-5">
                  <div className="flex items-center space-x-3 mb-2 border-b pb-4" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-500 flex items-center justify-center"><Shield className="w-4 h-4" /></div>
                    <h3 className="font-bold text-sm">Security</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold">Two-Factor Authentication</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Add an extra layer of security.</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400">Coming Soon</span>
                    </div>
                    {storedUser?.isGoogleUser ? (
                      <div className="w-full py-2.5 text-xs font-bold rounded-xl border flex items-center justify-center space-x-2 bg-gray-50 text-gray-400 dark:bg-gray-800/50 dark:text-gray-500 cursor-not-allowed" style={{ borderColor: 'var(--border-color)' }}>
                        <Key className="w-4 h-4" />
                        <span>Managed by Google</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsChangePasswordModalOpen(true)}
                        className="w-full py-2.5 text-xs font-bold rounded-xl border transition-colors flex items-center justify-center space-x-2 bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 cursor-pointer"
                        style={{ borderColor: 'var(--border-color)' }}
                      >
                        <Key className="w-4 h-4" />
                        <span>Change Password</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Notifications Card */}
                <div className="theme-panel p-6 rounded-[24px] shadow-sm space-y-5">
                  <div className="flex items-center space-x-3 mb-2 border-b pb-4" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-500 flex items-center justify-center"><Bell className="w-4 h-4" /></div>
                    <h3 className="font-bold text-sm">Notifications</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold">Email Parsing</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Automatically track bank email receipts.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={settings.emailAlerts} onChange={() => handleToggleSetting('emailAlerts')} />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-teal-500"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold">SMS Parsing</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Automatically track bank text messages.</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400">Coming Soon</span>
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="md:col-span-2 theme-panel p-6 rounded-[24px] shadow-sm border border-rose-500/20 bg-rose-500/5">
                  <h3 className="font-bold text-sm text-rose-500 mb-2">Danger Zone</h3>
                  <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Permanently delete your account and remove all transaction data from our servers.</p>
                  <button onClick={() => setIsDeleteAccountModalOpen(true)} className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white font-bold rounded-xl text-xs transition-colors border border-rose-500/20 hover:border-rose-500 shadow-sm">
                    Delete Account
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* YEARLY CALENDAR MODULE */}
          {activeMenu === 'Yearly Calendar' && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight">Yearly Expenses Calendar</h2>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Track and visualize your total monthly expenses across the year.</p>
                </div>
                <div className="relative">
                  <CustomSelect 
                    value={selectedYear} 
                    onChange={setSelectedYear}
                    className="w-32"
                    options={availableYears}
                    icon={Calendar}
                  />
                </div>
              </div>

              {/* Mini Rectangle Boxes for Months */}
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                {yearlyData.map((data, index) => (
                  <motion.div 
                    key={data.name} 
                    initial={{ opacity: 0, scale: 0.9 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    transition={{ delay: index * 0.05 }}
                    className="theme-panel p-4 rounded-2xl shadow-sm flex flex-col justify-center items-center text-center border hover:border-teal-500 transition-colors cursor-default"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <span className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>{data.name}</span>
                    <span className="font-extrabold text-lg text-teal-500">
                      ₹{data.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Bar Chart */}
                <div className="theme-panel p-6 rounded-[24px] shadow-sm flex flex-col items-center">
                  <h3 className="font-bold text-sm mb-6 w-full text-left" style={{ color: 'var(--text-muted)' }}>Monthly Trend (Bar)</h3>
                  <div className="w-full h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={yearlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} tickFormatter={(value) => `₹${value / 1000}k`} />
                        <Tooltip 
                          cursor={{ fill: 'rgba(20, 184, 166, 0.1)' }}
                          contentStyle={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}
                          formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Expenses']}
                        />
                        <Bar dataKey="amount" fill="#14b8a6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Pie Chart */}
                <div className="theme-panel p-6 rounded-[24px] shadow-sm flex flex-col items-center">
                  <h3 className="font-bold text-sm mb-6 w-full text-left" style={{ color: 'var(--text-muted)' }}>Monthly Distribution (Pie)</h3>
                  <div className="w-full h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={yearlyData.filter(d => d.amount > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="amount"
                        >
                          {yearlyData.filter(d => d.amount > 0).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}
                          formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Expenses']}
                        />
                        <Legend 
                          layout="horizontal" 
                          verticalAlign="bottom" 
                          align="center"
                          wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </main>
      </div>
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="theme-panel w-full max-w-md rounded-[24px] p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">

            <div className="flex justify-between items-center mb-6 border-b pb-4" style={{ borderColor: 'var(--border-color)' }}>
              <h3 className="font-extrabold text-lg">New Transaction</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="modal-close-btn"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div className="grid grid-cols-2 gap-3 mb-2">
                <button type="button" onClick={() => setNewTx({ ...newTx, type: 'Expense' })} className={`py-2 text-xs font-bold rounded-xl border transition-colors ${newTx.type === 'Expense' ? 'bg-rose-500 text-white border-rose-500' : 'theme-panel border-transparent opacity-60 hover:opacity-100'}`}>Expense</button>
                <button type="button" onClick={() => setNewTx({ ...newTx, type: 'Income' })} className={`py-2 text-xs font-bold rounded-xl border transition-colors ${newTx.type === 'Income' ? 'bg-emerald-500 text-white border-emerald-500' : 'theme-panel border-transparent opacity-60 hover:opacity-100'}`}>Income</button>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>Name / Merchant</label>
                <input required type="text" value={newTx.name} onChange={e => setNewTx({ ...newTx, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl text-xs theme-input" placeholder="e.g. Starbucks" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>Amount (₹)</label>
                  <input required type="number" step="any" value={newTx.amount} onChange={e => setNewTx({ ...newTx, amount: e.target.value })} className="w-full px-4 py-2.5 rounded-xl text-xs theme-input" placeholder="0.00" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>Category</label>
                  <CustomSelect
                    value={newTx.category}
                    onChange={(val) => setNewTx({ ...newTx, category: val })}
                    options={categories.filter(c => c !== 'All')}
                  />
                </div>
              </div>

              <button type="submit" className="w-full mt-4 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer">
                Save Transaction
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* STARTING BALANCE WELCOME MODAL */}
      {showBaselineModal && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="theme-panel w-full max-w-md rounded-[24px] p-6 sm:p-8 shadow-2xl relative text-center border border-teal-500/20 max-h-[90vh] overflow-y-auto">

            <div className="w-16 h-16 rounded-2xl bg-teal-500/10 text-teal-500 flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8" />
            </div>

            <h3 className="font-extrabold text-2xl mb-2">Welcome to SpendSmart! 🎉</h3>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              To make your dashboard accurate, please enter your current real-world bank balance. This gives us a baseline to track your incoming email transactions against!
            </p>

            <form onSubmit={handleSetStartingBalance} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>Current Bank Balance (₹)</label>
                <input
                  required
                  type="number"
                  step="any"
                  value={startingBalance}
                  onChange={e => setStartingBalance(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl text-sm theme-input font-bold"
                  placeholder="e.g. 15000"
                />
              </div>

              <div className="flex flex-col space-y-2 pt-2">
                <button type="submit" className="w-full py-3.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-sm shadow-md transition-colors cursor-pointer active:scale-95">
                  Set Starting Balance
                </button>
                <button type="button" onClick={handleSkipBaseline} className="w-full py-2.5 text-xs font-bold opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
                  Skip for now
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* UPDATE BALANCE MODAL */}
      {isUpdateBalanceModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="theme-panel w-full max-w-md rounded-[24px] p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">

            <div className="flex justify-between items-center mb-4 border-b pb-4" style={{ borderColor: 'var(--border-color)' }}>
              <h3 className="font-extrabold text-lg">Update Total Balance</h3>
              <button onClick={() => setIsUpdateBalanceModalOpen(false)} className="modal-close-btn"><X className="w-5 h-5" /></button>
            </div>

            <div className="mb-4 p-3 rounded-xl border" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)' }}>
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Current App Balance</p>
              <p className="text-xl font-black text-teal-500">₹{currentBalance.toLocaleString('en-IN')}</p>
            </div>

            <form onSubmit={handleUpdateBalance} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold tracking-wide uppercase" style={{ color: 'var(--text-main)' }}>Actual Bank Balance (₹)</label>
                <input
                  required
                  type="number"
                  step="any"
                  value={newTotalBalance}
                  onChange={e => setNewTotalBalance(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm theme-input font-bold"
                  placeholder="Enter your real balance..."
                />
              </div>

              <button type="submit" className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer">
                Sync Balance
              </button>
            </form>
          </motion.div>
        </div>
      )}
      {/* DOWNLOAD STATEMENT MODAL */}
      {isDownloadModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="theme-panel w-full max-w-md rounded-[24px] p-6 shadow-xl relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">

            <div className="flex justify-between items-center mb-6 border-b pb-4" style={{ borderColor: 'var(--border-color)' }}>
              <h3 className="font-extrabold text-lg flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                Download Statement
              </h3>
              <button onClick={() => setIsDownloadModalOpen(false)} className="modal-close-btn">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <form onSubmit={handleDownloadStatement} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {/* FROM DATE */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold tracking-wide uppercase" style={{ color: 'var(--text-main)' }}>From Date</label>
                  <div className="relative">
                    <input
                      required
                      type="date"
                      id="downloadFromInput"
                      value={downloadFrom}
                      onChange={e => setDownloadFrom(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 rounded-xl text-sm theme-input font-medium cursor-pointer date-no-indicator"
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('downloadFromInput').showPicker()}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-teal-500/10 transition-colors cursor-pointer"
                    >
                      <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                {/* TO DATE */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold tracking-wide uppercase" style={{ color: 'var(--text-main)' }}>To Date</label>
                  <div className="relative">
                    <input
                      required
                      type="date"
                      id="downloadToInput"
                      value={downloadTo}
                      onChange={e => setDownloadTo(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 rounded-xl text-sm theme-input font-medium cursor-pointer date-no-indicator"
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('downloadToInput').showPicker()}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-teal-500/10 transition-colors cursor-pointer"
                    >
                      <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                <p className="text-xs text-indigo-800 dark:text-indigo-300 font-medium">Generates a professional PDF statement with a summary of credits, debits, net balance, and a full transaction table. Perfect for records or sharing.</p>
              </div>

              <button type="submit" className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm shadow-md transition-colors cursor-pointer flex justify-center items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                Download PDF Statement
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE/EDIT BUDGET MODAL */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="theme-panel w-full max-w-md rounded-[24px] p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">

            <div className="flex justify-between items-center mb-6 border-b pb-4" style={{ borderColor: 'var(--border-color)' }}>
              <h3 className="font-extrabold text-lg">Set Budget Limit</h3>
              <button onClick={() => setIsBudgetModalOpen(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>Category</label>
                <CustomSelect
                  value={newBudget.category}
                  onChange={val => setNewBudget({ ...newBudget, category: val })}
                  className="w-full"
                  options={categories.filter(c => c !== 'All' && c !== 'Income')}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>Monthly Limit (₹)</label>
                <input
                  required
                  type="number"
                  step="any"
                  value={newBudget.limit}
                  onChange={e => setNewBudget({ ...newBudget, limit: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-xs theme-input"
                  placeholder="e.g. 5000"
                />
              </div>

              <button type="submit" className="w-full mt-4 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer">
                Save Budget
              </button>
            </form>
          </motion.div>
        </div>
      )}
      {/* CHANGE PASSWORD MODAL */}
      {isChangePasswordModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="theme-panel w-full max-w-md rounded-[24px] p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-4" style={{ borderColor: 'var(--border-color)' }}>
              <h3 className="font-extrabold text-lg">Change Password</h3>
              <button onClick={() => setIsChangePasswordModalOpen(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>Current Password</label>
                <div className="relative">
                  <input required type={showPasswordCurrent ? "text" : "password"} value={passwordForm.currentPassword} onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} className="w-full pl-4 pr-10 py-2.5 rounded-xl text-xs theme-input" />
                  <button type="button" onClick={() => setShowPasswordCurrent(!showPasswordCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity">
                    {showPasswordCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>New Password</label>
                <div className="relative">
                  <input required type={showPasswordNew ? "text" : "password"} value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} className="w-full pl-4 pr-10 py-2.5 rounded-xl text-xs theme-input" />
                  <button type="button" onClick={() => setShowPasswordNew(!showPasswordNew)} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity">
                    {showPasswordNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>Confirm New Password</label>
                <div className="relative">
                  <input required type={showPasswordConfirm ? "text" : "password"} value={passwordForm.confirmPassword} onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} className="w-full pl-4 pr-10 py-2.5 rounded-xl text-xs theme-input" />
                  <button type="button" onClick={() => setShowPasswordConfirm(!showPasswordConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity">
                    {showPasswordConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" className="w-full mt-4 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer">
                Update Password
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* DELETE ACCOUNT MODAL */}
      {isDeleteAccountModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-rose-50 dark:bg-[#1a0f14] border border-rose-500/30 w-full max-w-md rounded-[24px] p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b border-rose-500/20 pb-4">
              <h3 className="font-extrabold text-lg text-rose-600 dark:text-rose-500">Delete Account</h3>
              <button onClick={() => setIsDeleteAccountModalOpen(false)} className="p-1.5 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-500 rounded-full transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="mb-6 space-y-3 text-sm text-rose-700 dark:text-rose-400">
              <p><strong>Warning:</strong> This action is irreversible.</p>
              <p>All your transactions, budgets, settings, and personal data will be permanently deleted from our servers.</p>
              <p>Please enter your current password to confirm deletion.</p>
            </div>
            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold tracking-wide uppercase text-rose-600 dark:text-rose-500">Current Password</label>
                <div className="relative">
                  <input required type={showPasswordDelete ? "text" : "password"} value={deletePassword} onChange={e => setDeletePassword(e.target.value)} className="w-full pl-4 pr-10 py-2.5 rounded-xl text-xs bg-white dark:bg-[#0f0a0d] border border-rose-500/30 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none text-rose-900 dark:text-rose-100" />
                  <button type="button" onClick={() => setShowPasswordDelete(!showPasswordDelete)} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity text-rose-900 dark:text-rose-100 cursor-pointer">
                    {showPasswordDelete ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" className="w-full mt-4 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer">
                Permanently Delete Account
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}