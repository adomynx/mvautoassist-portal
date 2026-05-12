'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function approveCertificate(certId: string): Promise<void> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('certificates')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: user.id,
    })
    .eq('id', certId)
    .eq('status', 'pending'); // guard: only transition from pending

  if (error) throw new Error(error.message);

  revalidatePath('/admin/certificates');
  revalidatePath('/admin/dashboard');
}

export async function rejectCertificate(certId: string): Promise<void> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('certificates')
    .update({
      status: 'rejected',
      approved_at: new Date().toISOString(),
      approved_by: user.id,
    })
    .eq('id', certId)
    .eq('status', 'pending'); // guard: only transition from pending

  if (error) throw new Error(error.message);

  revalidatePath('/admin/certificates');
  revalidatePath('/admin/dashboard');
}
