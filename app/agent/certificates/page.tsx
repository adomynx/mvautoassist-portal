import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Certificates · MVAutoAssist',
};

import { redirect } from 'next/navigation';
import { Shield } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import SignOutButton from '@/components/SignOutButton';

export default async function AgentCertificatesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'dealer') redirect('/login');

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      className="min-h-screen bg-stone-50 text-slate-900"
    >
      {/* Top bar */}
      <header className="border-b border-stone-200 bg-white px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #dc2626 100%)' }}
            >
              <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-bold text-base tracking-tight leading-none">MVAutoAssist</div>
              <div className="text-[10px] text-stone-400 tracking-[0.15em] uppercase">
                Service Certificate Portal
              </div>
            </div>
          </div>
          <SignOutButton />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-16 flex items-start justify-center">
        <div className="w-full max-w-lg bg-white border border-stone-200 rounded-2xl shadow-sm p-10">
          {/* Role badge */}
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 mb-6">
            {profile.role}
          </span>

          <h1
            style={{ fontFamily: "'Instrument Serif', serif" }}
            className="text-5xl tracking-tight mb-4"
          >
            My Certificates
          </h1>

          <p className="text-stone-500 text-lg leading-relaxed">
            Welcome,{' '}
            <span className="font-semibold text-slate-900">{profile.full_name}</span>.
            Certificate management coming next week.
          </p>
        </div>
      </main>
    </div>
  );
}
