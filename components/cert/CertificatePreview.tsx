'use client';

import Link from 'next/link';
import { Shield, ChevronRight, Printer, Download } from 'lucide-react';
import InfoBox from '@/components/cert/InfoBox';

// ─── types (shared with page.tsx) ────────────────────────────────────────────

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

// ─── date helpers ─────────────────────────────────────────────────────────────

function fmtYMD(d: string | null): string {
  if (!d) return '—';
  return d; // stored as YYYY-MM-DD
}

function fmtDMY(d: string | null): string {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}-${m}-${y}`;
}

// ─── component ────────────────────────────────────────────────────────────────

type Props = {
  cert:     CertData;
  agent:    AgentData;
  helpline: string;
  backHref: string;
};

export default function CertificatePreview({ cert, agent, helpline, backHref }: Props) {
  return (
    <div
      className="min-h-screen bg-stone-200 p-4 sm:p-8"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* ── Top action bar ─────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto mb-4 flex flex-wrap items-center gap-3 justify-between">
        <Link
          href={backHref}
          className="flex items-center gap-2 text-sm font-semibold bg-white px-4 py-2 rounded-lg border border-stone-300 hover:bg-stone-50 transition-colors"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back
        </Link>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 text-sm font-semibold bg-white px-4 py-2 rounded-lg border border-stone-300 hover:bg-stone-50 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          {/* Download PDF — Phase 5 */}
          <button
            title="Coming soon"
            className="flex items-center gap-2 text-sm font-semibold bg-slate-900 text-white px-4 py-2 rounded-lg opacity-60 cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      {/* ── Certificate card ───────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl border border-stone-200 overflow-hidden">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="p-6 border-b-2 border-slate-900 flex items-start justify-between gap-6">

          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #dc2626 100%)' }}
            >
              <Shield className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-bold text-lg tracking-tight">MVAUTOASSIST</div>
              <div className="text-[10px] text-stone-500 tracking-[0.15em] uppercase">
                Service Certificate Portal
              </div>
            </div>
          </div>

          {/* Centre — cert number */}
          <div className="flex-1 text-center px-4">
            <div className="text-[10px] text-stone-500 uppercase tracking-wider mb-1">
              Tax Invoice cum Certificate Number :
            </div>
            <div
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
              className="font-bold text-base"
            >
              {cert.cert_number}
            </div>
          </div>

          {/* Right — issuer block */}
          <div className="text-right text-[11px] shrink-0 max-w-[220px]">
            <div className="text-[10px] text-stone-500 uppercase tracking-wider mb-1">
              Certificate issuer &amp; Servicing Office :
            </div>
            <div className="font-bold text-sm">SHREEVARDHAN SERVICES</div>
            <div className="text-stone-600 mt-0.5 leading-snug">
              RS No. 226/A/1, Unit No. 2, Kamabe Turf,<br />
              Thane, Kolhapur – 416012
            </div>
            <div className="text-stone-600 mt-1 leading-snug">
              For Road Side Assistance, Please contact on<br />
              toll free no:{' '}
              <span className="font-semibold">{helpline}</span>
            </div>
            <div className="text-stone-500 mt-0.5">care@mvautoassist.com</div>
            <div className="text-stone-500">www.mvautoassist.com</div>
          </div>
        </div>

        {/* ── Customer info grid ──────────────────────────────────────────── */}
        {/* Each row is grid-cols-2; InfoBox provides p-4 + border-r + border-b */}
        <div className="border-b border-stone-200">

          <div className="grid grid-cols-2">
            <InfoBox
              label="Tax Invoice Cum Certificate Number"
              value={cert.cert_number}
              mono
            />
            <InfoBox
              label="Certificate Start Date"
              value={fmtYMD(cert.start_date)}
            />
          </div>

          <div className="grid grid-cols-2">
            <InfoBox
              label="Name of the Certificate Holder"
              value={cert.customer_name}
            />
            <InfoBox
              label="Certificate End Date"
              value={fmtDMY(cert.end_date)}
            />
          </div>

          <div className="grid grid-cols-2">
            <InfoBox
              label="Customer DOB"
              value={fmtDMY(cert.customer_dob)}
            />
            <InfoBox
              label="Customer Mobile No"
              value={cert.customer_mobile}
            />
          </div>

          {/* Full-width rows */}
          <div>
            <InfoBox
              label="Customer Address"
              value={cert.customer_address}
            />
          </div>

          <div>
            <InfoBox
              label="Customer Email ID"
              value={cert.customer_email}
            />
          </div>

        </div>

        {/* ── Vehicle Details ──────────────────────────────────────────────── */}
        <div className="bg-stone-50 px-6 py-2 text-center text-xs font-semibold uppercase tracking-wider border-b border-stone-200">
          Vehicle Details
        </div>

        <div>

          <div className="grid grid-cols-2">
            <InfoBox
              label="Registration No"
              value={cert.registration_no || 'New'}
            />
            <InfoBox
              label="Vehicle Type"
              value={cert.vehicle_type}
            />
          </div>

          <div className="grid grid-cols-2">
            <InfoBox
              label="Make and Model"
              value={cert.make_model}
            />
            <InfoBox
              label="Variant"
              value={cert.variant}
            />
          </div>

          <div className="grid grid-cols-2">
            <InfoBox
              label="Engine No"
              value={cert.engine_no}
              mono
            />
            <InfoBox
              label="Chassis No"
              value={cert.chassis_no}
              mono
            />
          </div>

          <div className="grid grid-cols-2 border-b border-stone-200">
            <InfoBox
              label="Fuel Type"
              value={cert.fuel_type}
            />
            <InfoBox
              label="Manufacturing Year"
              value={cert.manufacturing_year?.toString()}
            />
          </div>

        </div>

      </div>
    </div>
  );
}
