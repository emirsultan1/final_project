import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Apply saved theme before render to prevent flash of light mode
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);