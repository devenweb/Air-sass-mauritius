import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/global.css'
import ErrorBoundary from './components/ErrorBoundary.jsx'

window.onerror = (message, source, lineno, colno, error) => {
  console.error('CRITICAL BOOT ERROR:', { message, source, lineno, colno, error });
};

window.onunhandledrejection = (event) => {
  console.error('UNHANDLED PROMISE REJECTION:', event.reason);
};



ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
