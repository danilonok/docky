import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { loadConfig } from './config/runtime'

// Configuration is resolved before the first render so that no screen ever
// paints one edition's copy and then swaps it for the other's. `loadConfig`
// does not reject, so a failure here still renders the app.
loadConfig().then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
