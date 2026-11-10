
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

// Global error handler for unhandled promise rejections and other errors
window.addEventListener('error', (event) => {
  document.body.innerHTML = `<div style="color: red; padding: 20px; font-family: monospace; background: #000;">
    <h1>Runtime Error</h1>
    <p>${event.message}</p>
    <pre>${event.filename}:${event.lineno}</pre>
  </div>`;
});

window.addEventListener('unhandledrejection', (event) => {
  document.body.innerHTML = `<div style="color: red; padding: 20px; font-family: monospace; background: #000;">
    <h1>Unhandled Promise Rejection</h1>
    <p>${event.reason}</p>
  </div>`;
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
