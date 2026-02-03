import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// NOTE: StrictMode removed to prevent double initialization of Three.js scene
// In dev mode, StrictMode renders components twice which causes orphaned scene objects
ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />,
)
