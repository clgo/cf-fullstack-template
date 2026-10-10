/**
 * useSortFilter — sortable + filterable data hook for tables.
 *
 * Usage:
 *   const { filtered, filter, setFilter, sortKey, sortDir, toggleSort } =
 *     useSortFilter(items, ['name', 'description']);
 *
 *   // In JSX:
 *   <FilterInput value={filter} onChange={setFilter} placeholder="Search..." />
 *   <table>
 *     <thead>
 *       <tr>
 *         <SortTh col="name" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort}>Name</SortTh>
 *         <SortTh col="created_at" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort}>Created</SortTh>
 *       </tr>
 *     </thead>
 *     <tbody>
 *       {filtered.map(item => <tr key={item.id}>...</tr>)}
 *     </tbody>
 *   </table>
 *
 * Rules:
 *   - Every new data table MUST use this hook + SortTh + FilterInput.
 *   - Never build tables with plain <th> elements when sort/filter is expected.
 */

import { useState, useMemo, type ReactNode } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

type SortDir = 'asc' | 'desc';

// T is any row object (an interface works; no index signature needed)
export function useSortFilter<T extends object>(
  data: T[],
  searchFields: (keyof T)[]
) {
  const [filter, setFilter] = useState('');
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const toggleSort = (col: keyof T) => {
    if (sortKey === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(col);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    let result = [...data];

    // Filter
    if (filter.trim()) {
      const q = filter.toLowerCase();
      result = result.filter((row) =>
        searchFields.some((field) => {
          const val: unknown = row[field];
          return typeof val === 'string' && val.toLowerCase().includes(q);
        })
      );
    }

    // Sort
    if (sortKey) {
      result.sort((a, b) => {
        const av = a[sortKey] as unknown as string | number | null | undefined;
        const bv = b[sortKey] as unknown as string | number | null | undefined;
        if (av === null || av === undefined) return 1;
        if (bv === null || bv === undefined) return -1;
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [data, filter, sortKey, sortDir, searchFields]);

  return { filtered, filter, setFilter, sortKey, sortDir, toggleSort };
}

// ── Components ────────────────────────────────────────────────────────────────

interface SortThProps<K extends PropertyKey> {
  col: K;
  sortKey: K | null;
  sortDir: SortDir;
  onToggle: (col: K) => void;
  children: ReactNode;
  className?: string;
}

export function SortTh<K extends PropertyKey>({
  col,
  sortKey,
  sortDir,
  onToggle,
  children,
  className = '',
}: SortThProps<K>) {
  const isActive = sortKey === col;

  return (
    <th
      className={`cursor-pointer select-none px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hover:text-slate-700 ${className}`}
      onClick={() => onToggle(col)}
    >
      <span className="flex items-center gap-1">
        {children}
        {isActive ? (
          sortDir === 'asc' ? (
            <ChevronUp size={14} />
          ) : (
            <ChevronDown size={14} />
          )
        ) : (
          <ChevronsUpDown size={14} className="text-slate-300" />
        )}
      </span>
    </th>
  );
}

interface FilterInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

export function FilterInput({
  value,
  onChange,
  placeholder = 'Filter...',
  className = '',
}: FilterInputProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 ${className}`}
    />
  );
}
