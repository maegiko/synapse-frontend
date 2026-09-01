import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AppErrorBoundary } from './components/AppErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/*
      Outside every provider, so a failure while rendering the router, the auth
      provider or any page still lands on the fallback page rather than an
      empty document.
    */}
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)
