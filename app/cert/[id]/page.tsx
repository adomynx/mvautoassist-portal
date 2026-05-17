import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import StatusBadge from '@/components/StatusBadge';

export const metadata: Metadata = {
  title: 'Certificate · MVAutoAssist',
};

export default async function CertPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Role determines the Back link destination
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const backHref = profile?.role === 'admin'
    ? '/admin/certificates'
    : '/agent/certificates';

  // RLS automatically scopes this: dealer only sees own certs, admin sees all
  const { data: cert } = await supabase
    .from('certificates')
    .select('id, cert_number, customer_name, make_model, vehicle_type, status, total_amount')
    .eq('id', id)
    .single();

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      className="min-h-screen bg-stone-50 text-slate-900 flex flex-col"
    >
      {/* Minimal top bar */}
      <div className="bg-white border-b border-stone-200 px-6 py-4">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-slate-900 transition-colors"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back
        </Link>
      </div>

      {/* Content */}
      <main className="flex-1 flex items-start justify-center px-6 py-16">
        {!cert ? (
          /* ── Not found ───────────────────────────────────────────────── */
          <div className="w-full max-w-lg bg-white border border-stone-200 rounded-2xl shadow-sm p-10 text-center">
            <p className="text-sm font-semibold text-stone-400 mb-2">Certificate not found</p>
            <p className="text-xs text-stone-400">
              This certificate doesn&apos;t exist or you don&apos;t have access to it.
            </p>
          </div>
        ) : (
          /* ── Placeholder card ────────────────────────────────────────── */
          <div className="w-full max-w-lg bg-white border border-stone-200 rounded-2xl shadow-sm p-10">

            {/* Heading */}
            <h1
              style={{ fontFamily: "'Instrument Serif', serif" }}
              className="text-4xl tracking-tight mb-1"
            >
              Certificate Preview
            </h1>
            <p className="text-sm text-stone-500 mb-8">
              Coming in Week 4 — full PDF view
            </p>

            {/* Cert details */}
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold tracking-wider uppercase text-stone-400 mb-1">
                  Certificate no.
                </p>
                <p
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  className="text-sm font-semibold"
                >
                  {cert.cert_number}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold tracking-wider uppercase text-stone-400 mb-1">
                  Customer
                </p>
                <p className="font-semibold">{cert.customer_name}</p>
                <p className="text-sm text-stone-500">{cert.make_model} · {cert.vehicle_type}</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                <div>
                  <p className="text-xs font-semibold tracking-wider uppercase text-stone-400 mb-1">
                    Status
                  </p>
                  <StatusBadge status={cert.status} />
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold tracking-wider uppercase text-stone-400 mb-1">
                    Total
                  </p>
                  <p className="font-bold text-lg">
                    ₹{(cert.total_amount ?? 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
