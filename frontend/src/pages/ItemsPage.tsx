import { useEffect, useState } from 'react';
import { List, Plus, Trash2, Pencil, RefreshCw } from 'lucide-react';
import { itemsApi, type Item } from '../api/items';
import Modal from '../components/Modal';
import { useSortFilter, SortTh, FilterInput } from '../hooks/useSortFilter';

/**
 * ItemsPage — CRUD example page.
 *
 * Copy this file and adapt it for each resource in your app.
 * Replace 'Item'/'items' with your resource name throughout.
 */

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sort + filter
  const { filtered, filter, setFilter, sortKey, sortDir, toggleSort } =
    useSortFilter(items, ['name', 'description']);

  // Modal state
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setItems(await itemsApi.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleDelete(id: number) {
    if (!confirm('Delete this item?')) return;
    try {
      await itemsApi.delete(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <List className="text-violet-600" size={24} />
          <h1 className="text-xl font-bold text-slate-800">Items</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void load()}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
          >
            <Plus size={16} />
            Add Item
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between">
          <p className="text-rose-700 text-sm">{error}</p>
          <button onClick={() => void load()} className="text-sm font-medium text-rose-600 hover:underline">
            Retry
          </button>
        </div>
      )}

      {/* Table card */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <FilterInput
            value={filter}
            onChange={setFilter}
            placeholder="Filter items..."
          />
          <span className="text-sm text-slate-500">{filtered.length} item(s)</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-violet-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <List size={32} className="mx-auto mb-2 opacity-40" />
            <p>{filter ? 'No items match your filter.' : 'No items yet. Add your first one!'}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <SortTh col="name" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort}>
                  Name
                </SortTh>
                <SortTh col="description" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} className="hidden sm:table-cell">
                  Description
                </SortTh>
                <SortTh col="status" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort}>
                  Status
                </SortTh>
                <SortTh col="created_at" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} className="hidden md:table-cell">
                  Created
                </SortTh>
                <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                  <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">
                    {item.description ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        item.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                    {item.created_at.slice(0, 10)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditItem(item)}
                        className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded transition-colors"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => void handleDelete(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <ItemFormModal
          title="Add Item"
          onClose={() => setShowAdd(false)}
          onSave={async (data) => {
            const newItem = await itemsApi.create(data);
            setItems((prev) => [newItem, ...prev]);
            setShowAdd(false);
          }}
        />
      )}

      {/* Edit Modal */}
      {editItem && (
        <ItemFormModal
          title="Edit Item"
          initial={editItem}
          onClose={() => setEditItem(null)}
          onSave={async (data) => {
            const updated = await itemsApi.update(editItem.id, data);
            setItems((prev) => prev.map((i) => (i.id === editItem.id ? updated : i)));
            setEditItem(null);
          }}
        />
      )}
    </div>
  );
}

// ── Form Modal ────────────────────────────────────────────────────────────────

interface ItemFormModalProps {
  title: string;
  initial?: Item;
  onClose: () => void;
  onSave: (data: { name: string; description?: string }) => Promise<void>;
}

function ItemFormModal({ title, initial, onClose, onSave }: ItemFormModalProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({ name: name.trim(), description: description.trim() || undefined });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
      setSaving(false);
    }
  }

  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            form="item-form"
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      }
    >
      <form id="item-form" onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        {error && (
          <p className="text-sm text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
            placeholder="Item name"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none"
            placeholder="Optional description"
          />
        </div>
      </form>
    </Modal>
  );
}
