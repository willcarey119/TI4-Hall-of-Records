import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

function RouteLoadingFallback() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--paper)',
      }}
    >
      <p
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '9px',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--ink-3)',
        }}
      >
        Loading…
      </p>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/games/:gameId" element={<GameDetailPage />} />
              <Route path="/meta" element={<MetaDashboardPage />} />
              <Route path="/agenda" element={<AgendaPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
    </AuthProvider>
  );
}
