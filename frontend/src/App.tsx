import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import ItemsPage from './pages/ItemsPage';

/**
 * App router.
 *
 * Add new pages here:
 *   1. Create `src/pages/MyPage.tsx`
 *   2. Import it above
 *   3. Add a <Route> below
 *   4. Add a nav link in `src/components/Layout.tsx`
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="items" element={<ItemsPage />} />
          {/* Add more routes here */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
