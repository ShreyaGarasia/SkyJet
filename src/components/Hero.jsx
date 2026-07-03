import React from 'react';
import { ShieldCheck, RefreshCw, MessageSquare, ArrowRight, PlaneTakeoff, Info } from 'lucide-react';

export default function Hero({ onSearchSubmit, onLoginClick }) {
  const [bookingId, setBookingId] = React.useState('');
  const [lastName, setLastName] = React.useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
      if (bookingId && lastName) {
      onSearchSubmit(bookingId, lastName);
    } else {
      onLoginClick();
    }
  };

  return (
    <div id="home" className="relative overflow-hidden bg-white">
      {/* Decorative background grids/blobs */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-100/50 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-emerald-50/70 blur-3xl"></div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-16 pb-20 md:px-8 lg:pt-24 lg:pb-28">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8 items-center">
          
          {/* Hero Left: Text & CTA */}
          <div className="lg:col-span-7 flex flex-col justify-center text-left">


            <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-blue-dark sm:text-5xl md:text-6xl leading-[1.1]">
              Fly Smart. <br />
              <span className="bg-gradient-to-r from-brand-blue to-brand-green bg-clip-text text-transparent">
                Recover Instantly.
              </span>
            </h1>
            
            <p className="mt-4 text-lg text-slate-500 max-w-xl">
              Welcome to SkyJet, where premium comfort meets next-generation passenger protection. Enjoy reliable flights, real-time tracking, and automated recovery options in case of disruptions.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <button 
                onClick={onLoginClick}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-6 py-3 text-base font-semibold text-white shadow-md hover:bg-blue-700 hover:shadow-lg transition-all cursor-pointer"
              >
                <span>Access My Booking</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a 
                href="#about"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-base font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-all"
              >
                Learn More
              </a>
            </div>
          </div>

          {/* Hero Right: Booking Lookup Box */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xl lg:p-8">
              <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                <PlaneTakeoff className="h-6 w-6 text-brand-blue" />
                <div>
                  <h3 className="font-display text-lg font-bold text-brand-blue-dark">Flight Lookup</h3>
                  <p className="text-xs text-slate-400">View real-time status and recovery features</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Booking Reference (ID)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SJ987"
                    value={bookingId}
                    onChange={(e) => setBookingId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm focus:border-brand-blue focus:bg-white focus:outline-hidden transition-all font-mono"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Last Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Patel"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm focus:border-brand-blue focus:bg-white focus:outline-hidden transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-brand-green py-3 text-sm font-semibold text-white shadow-md hover:bg-emerald-600 hover:shadow-lg transition-all duration-200 cursor-pointer"
                >
                  Retrieve Booking Details
                </button>
              </form>
              
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-blue-50/60 p-3 text-xs text-brand-blue-dark leading-relaxed">
                <Info className="w-4 h-4 text-brand-blue shrink-0" />
                <span>Use Booking ID <strong className="font-mono">SJ987</strong> & last name <strong className="font-semibold">Patel</strong> for simulation.</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* About Us & Key Features Section */}
      <section id="about" className="bg-slate-50 py-20 md:py-24 border-y border-slate-100">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-3xl font-bold tracking-tight text-brand-blue-dark sm:text-4xl">
              Next-Gen Flight Management
            </h2>
            <p className="mt-4 text-slate-500">
              SkyJet is redefining air travel peace-of-mind. With our built-in Smart Recovery engine, cancelled or delayed flights are no longer a source of stress. We put choice back in your hands.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            
            {/* Feature 1 */}
            <div className="relative rounded-2xl border border-slate-100 bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-brand-blue mb-6">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-brand-blue-dark mb-2">Automated Compensation</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Immediate eligibility evaluation. Weather disruption or carrier cancellation—we clearly communicate options and process actions instantly.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="relative rounded-2xl border border-slate-100 bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-brand-green mb-6">
                <RefreshCw className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-brand-blue-dark mb-2">Smart Recovery System</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                In the event of cancellation, choose your recovery flight option (Flight tonight or flight tomorrow) or file for a full refund instantly with single-click actions.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="relative rounded-2xl border border-slate-100 bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-brand-blue mb-6">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-brand-blue-dark mb-2">AI Recovery Assistant</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Our chatbot is integrated directly with passenger details, allowing you to ask queries, request rebookings, or claim refunds via a simple conversation.
              </p>
            </div>

          </div>

        </div>
      </section>
    </div>
  );
}
