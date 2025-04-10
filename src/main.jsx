import 'dotenv/config';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import connectDB from './db/connection';
import './styles/base.css';

// Connect to MongoDB
connectDB();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
