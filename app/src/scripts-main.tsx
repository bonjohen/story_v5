import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { ScriptBrowserPage } from './scripts/pages/ScriptBrowserPage.tsx'
import { ScriptReaderPage } from './scripts/pages/ScriptReaderPage.tsx'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename={basename}>
        <Routes>
          <Route path="/scripts" element={<ScriptBrowserPage />} />
          <Route path="/scripts/:slug" element={<ScriptReaderPage />} />
          <Route path="*" element={<Navigate to="/scripts" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
