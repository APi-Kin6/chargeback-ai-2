import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#111418',
            color: '#e8ecf0',
            border: '1px solid #2a3340',
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#0a0c0f' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#0a0c0f' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
