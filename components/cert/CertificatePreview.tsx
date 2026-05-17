'use client';

import Link from 'next/link';
import { Shield, ChevronRight, Printer, Download } from 'lucide-react';

// ─── types ────────────────────────────────────────────────────────────────────

export type CertData = {
  id: string;
  cert_number: string;
  customer_name: string;
  customer_dob: string | null;
  customer_mobile: string;
  customer_email: string | null;
  customer_address: string | null;
  vehicle_type: string;
  registration_no: string | null;
  make_model: string;
  variant: string | null;
  engine_no: string;
  chassis_no: string;
  fuel_type: string | null;
  manufacturing_year: number | null;
  start_date: string;
  end_date: string;
  insurance_amount: number;
  rsa_amount: number;
  total_amount: number;
  status: string;
  agent_id: string;
};

export type AgentData = {
  full_name: string;
  email: string;
  location: string | null;
};

// ─── coverage rows ────────────────────────────────────────────────────────────

const COVERAGES = [
  { id: 1, title: 'Battery Check Up & Jump Start',      desc: 'A Technician to be arranged for Jumpstart',                                                                                      val: 'Yes' },
  { id: 2, title: 'Flat Tyre',                           desc: 'Arrange For a Technician to Repair the Puncture Tyre. The Cost of Puncture repair and all incidental charges to be borne by Customer on actual basis', val: 'Yes' },
  { id: 3, title: 'Fuel Arrangement Assistance*',        desc: 'Arrange For a Fuel Delivery in Case Vehicle Is Out of Fuel. Fuel Cost on actual basis payable by Customer',                     val: 'Yes' },
  { id: 4, title: 'Relay of Urgent Messages',            desc: "Pass On Message to Rider's Friends & Family",                                                                                    val: 'Yes' },
  { id: 5, title: 'Vehicle Breakdown Phone Support',     desc: 'Guiding The Rider On Phone about Vehicle Related Problem',                                                                       val: 'Yes' },
  { id: 6, title: 'Towing Assistance',                   desc: 'To and fro upto-15 kms from the breakdown spot (one towing)*',                                                                   val: 'Yes' },
  { id: 7, title: 'Number of Services',                  desc: 'during a plan',                                                                                                                  val: '1'   },
] as const;

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtYMD(d: string | null, time = '00:00') { return d ? `${d} ${time}` : '—'; }
function fmtDMY(d: string | null, time?: string) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return time ? `${day}-${m}-${y} ${time}` : `${day}-${m}-${y}`;
}
function fmtAmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n);
}

// ─── shared inline styles ─────────────────────────────────────────────────────

const BORDER = '1px solid #d1d5db';          // gray-300
const TD     = { border: BORDER, padding: '6px 10px', verticalAlign: 'top' as const };
const LBL: React.CSSProperties = { fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#6b7280', marginBottom: '2px' };
const VAL: React.CSSProperties = { fontSize: '11px', fontWeight: 600, color: '#0f172a' };
const VAL_MONO: React.CSSProperties = { ...VAL, fontFamily: "'JetBrains Mono', monospace" };
const BANNER: React.CSSProperties = { ...TD, background: '#292524', color: '#fff', textAlign: 'center', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '6px 10px' };
const HEADER_ROW: React.CSSProperties = { ...TD, background: '#f5f5f4', fontSize: '9px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#44403c' };

function Cell({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div>
      <div style={LBL}>{label}</div>
      <div style={mono ? VAL_MONO : VAL}>{value ?? '—'}</div>
    </div>
  );
}

// ─── component ────────────────────────────────────────────────────────────────

type Props = { cert: CertData; agent: AgentData; helpline: string; backHref: string };

export default function CertificatePreview({ cert, agent, helpline, backHref }: Props) {
  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
         className="min-h-screen bg-stone-200 p-4 sm:p-8 print:bg-white print:p-0">

      {/* ── Action bar — print:hidden ─────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto mb-3 flex flex-wrap items-center gap-2 justify-between print:hidden">
        <Link href={backHref}
              className="flex items-center gap-2 text-sm font-semibold bg-white px-4 py-2 rounded-lg border border-stone-300 hover:bg-stone-50 transition-colors">
          <ChevronRight className="w-4 h-4 rotate-180" /> Back
        </Link>
        <div className="flex gap-2">
          <button onClick={() => window.print()}
                  className="flex items-center gap-2 text-sm font-semibold bg-white px-4 py-2 rounded-lg border border-stone-300 hover:bg-stone-50 transition-colors">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button title="Coming soon"
                  className="flex items-center gap-2 text-sm font-semibold bg-slate-900 text-white px-4 py-2 rounded-lg opacity-60 cursor-not-allowed">
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </div>

      {/* ── Certificate document ──────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto bg-white shadow-xl print:shadow-none print:max-w-full">
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          {/* 4 equal columns: coverages use them as 4 distinct; 2-col sections use colSpan=2 per side */}
          <colgroup>
            <col style={{ width: '25%' }} />
            <col style={{ width: '25%' }} />
            <col style={{ width: '25%' }} />
            <col style={{ width: '25%' }} />
          </colgroup>
          <tbody>

            {/* ── ROW A: Logo | Cert number ─────────────────────────────── */}
            <tr>
              <td colSpan={2} style={TD}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 6, flexShrink: 0, background: 'linear-gradient(135deg,#f59e0b,#dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '14px', letterSpacing: '-0.01em', color: '#0f172a' }}>MVAUTOASSIST</div>
                    <div style={{ fontSize: '8px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9ca3af' }}>Service Certificate Portal</div>
                  </div>
                </div>
              </td>
              <td colSpan={2} style={{ ...TD, textAlign: 'center' }}>
                <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b7280', marginBottom: '4px' }}>
                  Tax Invoice cum Certificate Number :
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>
                  {cert.cert_number}
                </div>
              </td>
            </tr>

            {/* ── ROW B: Issuer | Contact ───────────────────────────────── */}
            <tr>
              <td colSpan={2} style={TD}>
                <div style={LBL}>Certificate issuer &amp; Servicing Office :</div>
                <div style={{ ...VAL, fontSize: '12px' }}>SHREEVARDHAN SERVICES</div>
                <div style={{ fontSize: '10px', color: '#4b5563', marginTop: '2px', lineHeight: 1.5 }}>
                  RS No. 226/A/1, Unit No. 2, Kamabe Turf,<br />Thane, Kolhapur – 416012
                </div>
              </td>
              <td colSpan={2} style={TD}>
                <div style={LBL}>For Road Side Assistance :</div>
                <div style={{ fontSize: '10px', color: '#374151', lineHeight: 1.7 }}>
                  Please contact on toll free no :{' '}
                  <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '12px' }}>{helpline}</span><br />
                  Email : care@mvautoassist.com<br />
                  Web : www.mvautoassist.com
                </div>
              </td>
            </tr>

            {/* ── Customer info ─────────────────────────────────────────── */}
            <tr>
              <td colSpan={2} style={TD}><Cell label="Tax Invoice Cum Certificate Number" value={cert.cert_number} mono /></td>
              <td colSpan={2} style={TD}><Cell label="Certificate Start Date" value={fmtYMD(cert.start_date, '00:00')} /></td>
            </tr>
            <tr>
              <td colSpan={2} style={TD}><Cell label="Name of the Certificate Holder" value={cert.customer_name} /></td>
              <td colSpan={2} style={TD}><Cell label="Certificate End Date" value={fmtDMY(cert.end_date, '23:59')} /></td>
            </tr>
            <tr>
              <td colSpan={2} style={TD}><Cell label="Customer DOB" value={fmtDMY(cert.customer_dob)} /></td>
              <td colSpan={2} style={TD}><Cell label="Customer Mobile No" value={cert.customer_mobile} /></td>
            </tr>
            <tr>
              <td colSpan={4} style={TD}><Cell label="Customer Address" value={cert.customer_address} /></td>
            </tr>
            <tr>
              <td colSpan={4} style={TD}><Cell label="Customer Email ID" value={cert.customer_email} /></td>
            </tr>

            {/* ── Vehicle Details banner ────────────────────────────────── */}
            <tr>
              <td colSpan={4} style={BANNER}>Vehicle Details</td>
            </tr>

            <tr>
              <td colSpan={2} style={TD}><Cell label="Registration No"    value={cert.registration_no || 'New'} /></td>
              <td colSpan={2} style={TD}><Cell label="Vehicle Type"        value={cert.vehicle_type} /></td>
            </tr>
            <tr>
              <td colSpan={2} style={TD}><Cell label="Make and Model"      value={cert.make_model} /></td>
              <td colSpan={2} style={TD}><Cell label="Variant"             value={cert.variant} /></td>
            </tr>
            <tr>
              <td colSpan={2} style={TD}><Cell label="Engine No"           value={cert.engine_no}  mono /></td>
              <td colSpan={2} style={TD}><Cell label="Chassis No"          value={cert.chassis_no} mono /></td>
            </tr>
            <tr>
              <td colSpan={2} style={TD}><Cell label="Fuel Type"           value={cert.fuel_type} /></td>
              <td colSpan={2} style={TD}><Cell label="Manufacturing Year"  value={cert.manufacturing_year?.toString()} /></td>
            </tr>

            {/* ── Coverages banner ──────────────────────────────────────── */}
            <tr>
              <td colSpan={4} style={BANNER}>
                Coverages of Road Side Assistance — Toll free No. {helpline}
              </td>
            </tr>

            {/* Coverages table header */}
            <tr>
              <td style={{ ...HEADER_ROW, textAlign: 'center', width: '6%' }}>Sl. No.</td>
              <td style={HEADER_ROW}>Featured Benefits</td>
              <td style={{ ...HEADER_ROW, width: '44%' }}>Description</td>
              <td style={{ ...HEADER_ROW, textAlign: 'center', width: '12%' }}>Applicable</td>
            </tr>

            {COVERAGES.map((row, i) => (
              <tr key={row.id} style={{ background: i % 2 === 1 ? '#fafaf9' : '#fff' }}>
                <td style={{ ...TD, textAlign: 'center', color: '#6b7280' }}>{row.id}</td>
                <td style={{ ...TD, fontWeight: 600 }}>{row.title}</td>
                <td style={{ ...TD, color: '#374151' }}>{row.desc}</td>
                <td style={{ ...TD, textAlign: 'center', fontWeight: 700 }}>{row.val}</td>
              </tr>
            ))}

            {/* ── RSA Premium Breakup banner ────────────────────────────── */}
            <tr>
              <td colSpan={4} style={BANNER}>RSA Premium Breakup</td>
            </tr>

            {/* Breakup header — Vilas rule 2: insurance + RSA + total, no GST */}
            <tr>
              <td style={HEADER_ROW}>Plan Name</td>
              <td style={{ ...HEADER_ROW, textAlign: 'right' }}>Insurance Premium</td>
              <td style={{ ...HEADER_ROW, textAlign: 'right' }}>RSA Premium</td>
              <td style={{ ...HEADER_ROW, textAlign: 'right' }}>Total Premium</td>
            </tr>
            <tr>
              <td style={{ ...TD, fontWeight: 600 }}>MVAutoAssist RSA</td>
              <td style={{ ...TD, textAlign: 'right' }}>{fmtAmt(cert.insurance_amount)}</td>
              <td style={{ ...TD, textAlign: 'right' }}>{fmtAmt(cert.rsa_amount)}</td>
              <td style={{ ...TD, textAlign: 'right', fontWeight: 700, fontSize: '13px' }}>{fmtAmt(cert.total_amount)}</td>
            </tr>

            {/* ── Special Conditions ────────────────────────────────────── */}
            <tr>
              <td colSpan={4} style={{ ...TD, fontSize: '9px', color: '#6b7280', lineHeight: 1.6 }}>
                <strong style={{ color: '#374151' }}>Special Conditions (applicable to all coverages):</strong>{' '}
                (a) All additional expenses regarding replacement of a part, additional Fuel and any other service
                which does not form a part of the standard services provided would be on chargeable basis to the
                Certificate holder. (b) This Certificate is valid subject to realisation of the payment and is
                effective from the Payment realisation date or certificate issue date, whichever is later.
              </td>
            </tr>

          </tbody>
        </table>
      </div>
    </div>
  );
}
