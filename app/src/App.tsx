import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './features/home';
import { GameDetailPage } from './features/game-detail';
import { MetaDashboardPage } from './features/meta-dashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/games/:gameId" element={<GameDetailPage />} />
        <Route path="/meta" element={<MetaDashboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}
