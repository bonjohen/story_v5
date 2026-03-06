import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { ScriptBrowserPage } from './scripts/pages/ScriptBrowserPage.tsx'
import { ScriptReaderPage } from './scripts/pages/ScriptReaderPage.tsx'
import { SeriesBrowserPage } from './generation/series/pages/SeriesBrowserPage.tsx'
import { SeriesDashboardPage } from './generation/series/pages/SeriesDashboardPage.tsx'
import { EpisodeCurationPage } from './generation/series/pages/EpisodeCurationPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Routes>
          <Route path="/scripts" element={<ScriptBrowserPage />} />
          <Route path="/scripts/:slug" element={<ScriptReaderPage />} />
          <Route path="/series" element={<SeriesBrowserPage />} />
          <Route path="/series/:seriesId" element={<SeriesDashboardPage />} />
          <Route path="/series/:seriesId/slot/:slotNumber" element={<EpisodeCurationPage />} />
          <Route path="/*" element={<App />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
