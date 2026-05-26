import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

/**
 * Modal — accessible dialog overlay.
 *
 * Usage:
 *   <Modal title="Edit Item" onClose={() => setOpen(false)}>
 *     <p>Content here</p>
 *   </Modal>
 *
 * With a pinned footer (for long scrollable content):
 *   <Modal title="Details" onClose={close} footer={<button>Save</button>}>
 *     <div>Long content...</div>
 *   </Modal>
 *
 * size: 'sm' | 'md' | 'lg' | 'xl'  (default: 'md')
 */

const SIZE_MAP = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof SIZE_MAP;
}

export default function Modal({
  title,
  onClose,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => {
        // Close on backdrop click
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`bg-white rounded-xl shadow-xl w-full ${SIZE_MAP[size]} flex flex-col max-h-[90vh]`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <h2 id="modal-title" className="text-base font-semibold text-slate-800">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 min-h-0 px-5 py-4">
          {children}
        </div>

        {/* Pinned footer (optional) */}
        {footer && (
          <div className="border-t border-slate-100 px-5 py-3 shrink-0 bg-white rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
