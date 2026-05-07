import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppHeader } from './shared/AppHeader';
import { ErrorBoundary } from './shared';
import { AuthProvider } from './adapters/AuthContext';

const HomePage = lazy(() =>
  import('./features/home').then(m => ({ default: m.HomePage }))
);
const GameDetailPage = lazy(() =>
  import('./features/game-detail').then(m => ({ default: m.GameDetailPage }))
);
const MetaDashboardPage = lazy(() =>
  import('./features/meta-dashboard').then(m => ({ default: m.MetaDashboardPage }))
);
const AgendaPage = lazy(() =>
  import('./features/agenda/AgendaPage').then(m => ({ default: m.AgendaPage }))
);
const NotFoundPage = lazy(() =>
  import('./features/not-found').then(m => ({ default: m.NotFoundPage }))
);
const ComparePage = lazy(() =>
  import('./features/compare').then(m => ({ default: m.ComparePage }))
);

const loadingStyle: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 'var(--font-micro)',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--ink-3)',
};

function RouteLoadingFallback() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, background: 'var(--paper)' }}>
      <p style={loadingStyle}>Loading…</p>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--paper)' }}>
            <AppHeader />
            <main style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <Suspense fallback={<RouteLoadingFallback />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/games/:gameId" element={<GameDetailPage />} />
                  <Route path="/meta" element={<MetaDashboardPage />} />
                  <Route path="/agenda" element={<AgendaPage />} />
                  <Route path="/compare/:gameA/:gameB" element={<ComparePage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </main>
          </div>
        </ErrorBoundary>
      </BrowserRouter>
    </AuthProvider>
  );
}
