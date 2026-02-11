import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { AuthProvider } from './contexts/AuthContext'
import { BillingProvider } from './contexts/BillingContext'
import App from './App'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <BillingProvider>
            <App />
          </BillingProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
)
