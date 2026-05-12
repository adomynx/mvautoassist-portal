'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function addPriceTier(userId: string, amount: number): Promise<void> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('price_tiers')
    .insert({ user_id: userId, amount, is_default: false });

  if (error) throw new Error(error.message);

  revalidatePath('/admin/pricing');
}

export async function removePriceTier(userId: string, amount: number): Promise<void> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('price_tiers')
    .delete()
    .eq('user_id', userId)
    .eq('amount', amount);

  if (error) throw new Error(error.message);

  revalidatePath('/admin/pricing');
}
