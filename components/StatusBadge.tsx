// Shared across admin and agent panels (server and client components both import this).
// No 'use client' — renders pure markup, works in either context.

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  approved: { label: 'Approved', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  pending:  { label: 'Pending',  bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500'   },
  rejected: { label: 'Rejected', bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-500'     },
};

export default function StatusBadge({ status }: { status: string }) {
  const c = STATUS_CONFIG[status] ?? {
    label: status,
    bg:    'bg-stone-100',
    text:  'text-stone-600',
    dot:   'bg-stone-400',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
