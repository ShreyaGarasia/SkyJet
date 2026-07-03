import React from 'react';
import { HelpCircle, CheckCircle2, AlertCircle, RefreshCcw, DollarSign, Info } from 'lucide-react';

export default function RefundEligibility() {
  const policies = [
    {
      scenario: "Cancelled by SkyJet (Operational/Technical)",
      status: "Fully Eligible",
      rebooking: "Free rebooking on next flight",
      compensation: "Eligible for standard airline delay voucher",
      color: "emerald"
    },
    {
      scenario: "Weather Disruption / Severe Weather",
      status: "Eligible for Refund or Free Rebooking",
      rebooking: "Free rebooking on any available flight",
      compensation: "No airline cash compensation, but meal/hotel vouchers provided",
      color: "emerald"
    },
    {
      scenario: "Air Traffic Control delays",
      status: "Free Rebooking Only",
      rebooking: "Free rebooking on next flight",
      compensation: "Standard airport amenity vouchers",
      color: "amber"
    },
    {
      scenario: "Passenger voluntary cancellation",
      status: "Subject to fare conditions",
      rebooking: "Change fees + fare difference may apply",
      compensation: "Not eligible for cash refund (credits only)",
      color: "amber"
    }
  ];

  return (
    <div id="eligibility" className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs md:p-8">
      
      {/* Title */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-5 mb-6">
        <HelpCircle className="w-6 h-6 text-brand-blue" />
        <div>
          <h3 className="font-display text-xl font-bold text-brand-blue-dark">Refund & Rebooking Eligibility</h3>
          <p className="text-sm text-slate-400">Review guidelines based on the cause of flight disruptions</p>
        </div>
      </div>

      {/* Grid or Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {policies.map((policy, idx) => (
          <div 
            key={idx}
            className={`flex flex-col justify-between p-5 rounded-xl border transition-all ${
              policy.color === 'emerald' 
                ? 'border-emerald-100 bg-emerald-50/20 hover:border-emerald-200' 
                : 'border-amber-100 bg-amber-50/20 hover:border-amber-200'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <h4 className="font-bold text-brand-blue-dark text-base">{policy.scenario}</h4>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  policy.color === 'emerald'
                    ? 'bg-brand-green-light text-brand-green-dark'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {policy.color === 'emerald' ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5" />
                  )}
                  {policy.status}
                </span>
              </div>
              
              <div className="space-y-2 mt-4 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <RefreshCcw className="w-4 h-4 text-brand-blue shrink-0" />
                  <span><strong>Rebooking:</strong> {policy.rebooking}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-brand-green shrink-0" />
                  <span><strong>Compensation:</strong> {policy.compensation}</span>
                </div>
              </div>
            </div>
            
          </div>
        ))}
      </div>

      {/* Info Warning Banner */}
      <div className="mt-6 flex items-start gap-3 rounded-xl bg-blue-50/80 p-4 text-sm text-brand-blue-dark leading-relaxed">
        <Info className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold">Airline Cancellation Rule:</strong> In compliance with aviation regulations, if SkyJet cancels your flight or it experiences a delay of 4+ hours, you are fully entitled to select a free alternative flight or submit a claim for a 100% refund immediately via our digital channels.
        </div>
      </div>

    </div>
  );
}
