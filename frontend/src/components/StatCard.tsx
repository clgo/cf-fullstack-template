import type { ReactNode } from 'react';

/**
 * StatCard — numeric summary card with a colour-coded left border.
 *
 * Usage:
 *   <StatCard label="Total Items" value={42} color="violet" />
 *   <StatCard label="Revenue" value="$1,200" color="emerald" onClick={openModal} />
 *
 * color options: violet | emerald | rose | amber | sky | slate
 *
 * When onClick is provided, the card renders as a <button> with a
 * hover effect and a "↗ detail" badge — use for drill-down modals.
 */

const COLOR_MAP: Record<
  string,
  { border: string; iconBg: string; iconText: string }
> = {
  violet: {
    border: 'border-l-violet-500',
    iconBg: 'bg-violet-50',
    iconText: 'text-violet-600',
  },
  emerald: {
    border: 'border-l-emerald-500',
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-600',
  },
  rose: {
    border: 'border-l-rose-500',
    iconBg: 'bg-rose-50',
    iconText: 'text-rose-600',
  },
  amber: {
    border: 'border-l-amber-500',
    iconBg: 'bg-amber-50',
    iconText: 'text-amber-600',
  },
  sky: {
    border: 'border-l-sky-500',
    iconBg: 'bg-sky-50',
    iconText: 'text-sky-600',
  },
  slate: {
    border: 'border-l-slate-500',
    iconBg: 'bg-slate-50',
    iconText: 'text-slate-600',
  },
};

interface StatCardProps {
  label: string;
  value: ReactNode;
  color?: keyof typeof COLOR_MAP;
  icon?: ReactNode;
  onClick?: () => void;
  children?: ReactNode; // optional sub-content below value
}

export default function StatCard({
  label,
  value,
  color = 'violet',
  icon,
  onClick,
  children,
}: StatCardProps) {
  const { border, iconBg, iconText } = COLOR_MAP[color] ?? COLOR_MAP.violet;

  const content = (
    <div className="relative">
      {/* ↗ detail badge — shown when card is clickable */}
      {onClick && (
        <span className="absolute top-0 right-0 text-[10px] font-semibold text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded-full">
          ↗ detail
        </span>
      )}

      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="uppercase tracking-wide text-xs font-medium text-slate-500 mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold text-slate-800 break-words">{value}</p>
          {children && <div className="mt-1">{children}</div>}
        </div>

        {icon && (
          <div className={`p-2 rounded-lg ${iconBg} ${iconText} ml-3 shrink-0`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );

  const classes = `bg-white rounded-xl border-l-4 ${border} p-4 shadow-sm transition-shadow duration-200`;

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`${classes} hover:shadow-md w-full text-left`}
      >
        {content}
      </button>
    );
  }

  return <div className={classes}>{content}</div>;
}
