import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { ScriptBrowserPage } from './scripts/pages/ScriptBrowserPage.tsx'
import { ScriptReaderPage } from './scripts/pages/ScriptReaderPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/scripts" element={<ScriptBrowserPage />} />
          <Route path="/scripts/:slug" element={<ScriptReaderPage />} />
          <Route path="/*" element={<App />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
