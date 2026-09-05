# SmartFinance 💸

An AI-powered, full-stack personal finance dashboard that automates expense tracking by securely reading receipts, using a Large Language Model (LLM) to extract transaction details, and automatically categorizing them into your database.

## Features ✨
- **AI-Powered Tracking:** Integrated Gmail API and an LLM to automatically scan receipts, extract transaction data, and auto-categorize expenses with zero manual entry.
- **Real-Time Sync:** A secure, responsive dashboard built with React and Socket.IO to instantly sync and reflect new transactions across active sessions.
- **Smart Backend:** Robust Node.js/Express + MongoDB architecture featuring intelligent email deduplication to prevent overlapping transaction records.
- **Custom Reporting:** Client-side PDF generation (jsPDF) allowing perfectly formatted, custom-date transaction statements.
- **Premium UI/UX:** Modern, fully responsive interface built with Tailwind CSS, featuring seamless Light/Dark mode toggles and custom interactive components.

## Tech Stack 🛠️
- **Frontend:** React, Tailwind CSS, Framer Motion, Socket.IO Client, jsPDF
- **Backend:** Node.js, Express, MongoDB (Mongoose), Socket.IO
- **Integrations:** Gmail API, Gemini LLM API (for data extraction)

## Getting Started 🚀

### Prerequisites
- Node.js installed
- MongoDB installed and running
- Google Cloud Project with Gmail API enabled
- Gemini API Key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/smartfinance.git
   cd smartfinance
   ```

2. Install backend dependencies:
   ```bash
   cd server
   npm install
   ```

3. Configure environment variables in `server/.env`:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/smartfinance
   GEMINI_API_KEY=your_gemini_key
   ```

4. Install frontend dependencies:
   ```bash
   cd ../client
   npm install
   ```

5. Run the application:
   - In the `server` directory run `npm run dev`
   - In the `client` directory run `npm run dev`

Navigate to `http://localhost:5173` in your browser.

## License
MIT License
