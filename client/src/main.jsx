// ─────────────────────────────────────────────────────────
// main.jsx — React Application Entry Point
// This is the very first file that runs in the browser.
// It mounts the root <App /> component into the HTML element
// with the id "root" (defined in index.html).
// StrictMode helps catch potential issues during development.
// ─────────────────────────────────────────────────────────

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'   // Global base styles
import App from './App.jsx'

// Mount the entire React application into the #root div in index.html
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
