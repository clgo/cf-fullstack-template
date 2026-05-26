import { useEffect, useState } from 'react';
import { LayoutDashboard, List, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import StatCard from '../components/StatCard';

/**
 * DashboardPage — summary stats + quick overview.
 *
 * Fetches /api/ping on mount to verify the Worker is reachable,
 * then loads summary data from /api/summary (implement this endpoint
 * in worker/src/index.ts as needed).
 *
 * Replace the placeholder stats with your actual data.
 */

interface Summary {
  total_items: number;
  // Add your own summary fields here
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Summary>('/summary');
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="text-violet-600" size={24} />
          <div>
            <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
            <p className="text-sm text-slate-500">Overview of your data</p>
          </div>
        </div>
        <button
          onClick={() => void load()}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between">
          <p className="text-rose-700 text-sm">{error}</p>
          <button
            onClick={() => void load()}
            className="text-sm font-medium text-rose-600 hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-violet-500 rounded-full animate-spin" />
        </div>
      )}

      {/* Stats grid */}
      {!loading && summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Items"
            value={summary.total_items}
            color="violet"
            icon={<List size={18} />}
          />
          {/* Add more StatCards here as you build out your data model */}
        </div>
      )}

      {/* Quick links / recent activity */}
      {!loading && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">
            Getting Started
          </h2>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>
              1. Edit <code className="bg-slate-100 px-1 rounded">worker/src/db/schema.sql</code> — define your data model
            </li>
            <li>
              2. Edit <code className="bg-slate-100 px-1 rounded">worker/src/routes/items.ts</code> — implement your API
            </li>
            <li>
              3. Edit <code className="bg-slate-100 px-1 rounded">frontend/src/pages/DashboardPage.tsx</code> — this page
            </li>
            <li>
              4. Add more pages in <code className="bg-slate-100 px-1 rounded">frontend/src/pages/</code> and wire them in <code className="bg-slate-100 px-1 rounded">App.tsx</code>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
