import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { GoogleOAuthProvider } from '@react-oauth/google'; // <-- 1. Add this import

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 2. Wrap your App and PASTE YOUR CLIENT ID BELOW */}
    <GoogleOAuthProvider clientId="729019378797-51lvcl5qe6muoc4e7qaninnbpk5bk36f.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
);