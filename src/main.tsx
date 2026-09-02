import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AppErrorBoundary } from './components/AppErrorBoundary'
import { ProductAnalyticsProvider } from './components/ProductAnalyticsProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <ProductAnalyticsProvider>
        <App />
      </ProductAnalyticsProvider>
    </AppErrorBoundary>
  </StrictMode>,
)
