'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

// ─── shared form type ─────────────────────────────────────────────────────────
// All fields are strings — matches what the wizard form sends.
// The server action performs type coercion before inserting.

export type CertFormData = {
  customer_name:    string;
  customer_dob:     string;   // YYYY-MM-DD or ''
  customer_mobile:  string;
  customer_email:   string;
  customer_address: string;
  vehicle_type:     string;
  registration_no:  string;
  make_model:       string;
  variant:          string;
  engine_no:        string;
  chassis_no:       string;
  fuel_type:        string;
  manufacturing_year: string;
  start_date:       string;   // YYYY-MM-DD
  end_date:         string;   // YYYY-MM-DD
  insurance_amount: string;   // numeric string
  rsa_amount:       string;   // numeric string
};

// ─── getDealerPriceTiers ──────────────────────────────────────────────────────

export async function getDealerPriceTiers(): Promise<
  { ok: true; tiers: number[] } | { ok: false; error: string }
> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('price_tiers')
      .select('amount')
      .eq('user_id', user.id)
      .order('amount', { ascending: true });

    if (error) return { ok: false, error: error.message };
    return { ok: true, tiers: (data ?? []).map(r => Number(r.amount)) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

// ─── createCertificate ────────────────────────────────────────────────────────
// TODO (post-launch): Replace with PostgreSQL sequence or advisory lock for true
// concurrency safety. Two simultaneous submissions could generate the same
// cert_number; the UNIQUE constraint causes one INSERT to fail — dealer retries.

export async function createCertificate(form: CertFormData): Promise<
  { ok: true; certId: string; certNumber: string } | { ok: false; error: string }
> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: 'Not authenticated' };

    // ── Server-side validation (never trust client) ───────────────────────
    const CURRENT_YEAR = new Date().getFullYear();

    if (!form.customer_name.trim() || form.customer_name.trim().length < 2)
      return { ok: false, error: 'Customer name is required (min 2 characters)' };

    if (!/^\d{10}$/.test(form.customer_mobile))
      return { ok: false, error: 'Valid 10-digit mobile number required' };

    if (!['Two Wheeler', 'Four Wheeler'].includes(form.vehicle_type))
      return { ok: false, error: 'Invalid vehicle type' };

    if (!form.make_model.trim() || form.make_model.trim().length < 2)
      return { ok: false, error: 'Vehicle make and model required' };

    const mfgYear = parseInt(form.manufacturing_year, 10);
    if (!form.manufacturing_year || isNaN(mfgYear) || mfgYear < 1990 || mfgYear > CURRENT_YEAR)
      return { ok: false, error: `Manufacturing year must be between 1990 and ${CURRENT_YEAR}` };

    if (!form.engine_no.trim() || form.engine_no.trim().length < 3)
      return { ok: false, error: 'Engine number required' };

    if (!form.chassis_no.trim() || form.chassis_no.trim().length < 3)
      return { ok: false, error: 'Chassis number required' };

    if (!['Petrol', 'Diesel', 'Electric', 'CNG'].includes(form.fuel_type))
      return { ok: false, error: 'Invalid fuel type' };

    if (!form.start_date)
      return { ok: false, error: 'Start date required' };

    if (!form.end_date)
      return { ok: false, error: 'End date required' };

    if (form.end_date <= form.start_date)
      return { ok: false, error: 'End date must be after start date' };

    const insuranceAmt = parseFloat(form.insurance_amount);
    if (isNaN(insuranceAmt) || insuranceAmt <= 0)
      return { ok: false, error: 'Insurance premium must be a positive number' };

    const rsaAmt = parseFloat(form.rsa_amount);
    if (isNaN(rsaAmt) || rsaAmt <= 0)
      return { ok: false, error: 'RSA premium must be selected' };

    // Re-query price_tiers — never trust the client's rsa_amount (Vilas rule 10)
    const { data: tierCheck } = await supabase
      .from('price_tiers')
      .select('amount')
      .eq('user_id', user.id)
      .eq('amount', rsaAmt)
      .limit(1);

    if (!tierCheck || tierCheck.length === 0)
      return { ok: false, error: 'Selected RSA amount is not assigned to your account' };

    // ── Generate cert_number (MV + YYYY + 8-digit padded sequence) ────────
    // Service role needed to SELECT all cert_numbers, not just this dealer's.
    const adminClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const certYear = new Date().getFullYear();
    const { data: latestRows } = await adminClient
      .from('certificates')
      .select('cert_number')
      .like('cert_number', `MV${certYear}%`)
      .order('cert_number', { ascending: false })
      .limit(1);

    const latest = latestRows?.[0] ?? null;
    let sequence = 1;
    if (latest?.cert_number) {
      const lastSeq = parseInt(latest.cert_number.slice(-8), 10);
      if (!isNaN(lastSeq)) sequence = lastSeq + 1;
    }
    const cert_number = `MV${certYear}${String(sequence).padStart(8, '0')}`;

    // ── Compute total server-side — never trust client math ───────────────
    const total_amount = insuranceAmt + rsaAmt;

    // ── INSERT ────────────────────────────────────────────────────────────
    const { data: inserted, error: insertErr } = await supabase
      .from('certificates')
      .insert({
        cert_number,
        agent_id:          user.id,
        status:            'pending',
        customer_name:     form.customer_name.trim(),
        customer_dob:      form.customer_dob || null,
        customer_mobile:   form.customer_mobile,
        customer_email:    form.customer_email.trim() || null,
        customer_address:  form.customer_address.trim() || null,
        vehicle_type:      form.vehicle_type,
        registration_no:   form.registration_no.trim() || null,
        make_model:        form.make_model.trim(),
        variant:           form.variant.trim() || null,
        engine_no:         form.engine_no.trim(),
        chassis_no:        form.chassis_no.trim(),
        fuel_type:         form.fuel_type,
        manufacturing_year: mfgYear,
        start_date:        form.start_date,
        end_date:          form.end_date,
        insurance_amount:  insuranceAmt,
        rsa_amount:        rsaAmt,
        total_amount,
      })
      .select('id')
      .single();

    if (insertErr) return { ok: false, error: insertErr.message };
    if (!inserted)  return { ok: false, error: 'Certificate creation failed' };

    revalidatePath('/agent/certificates');
    revalidatePath('/admin/certificates');
    revalidatePath('/admin/dashboard');

    return { ok: true, certId: inserted.id, certNumber: cert_number };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unexpected error' };
  }
}
