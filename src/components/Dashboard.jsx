import React, { useState } from 'react';
import { Plane, User, Clock, RefreshCw, CheckCircle2, Download, FileText, Coffee, Hotel, Wifi } from 'lucide-react';
import SmartRecovery from './SmartRecovery';
import RefundEligibility from './RefundEligibility';
import { downloadTicketPdf } from '../utils/ticketPdf';

export default function Dashboard({ 
  user, 
  flight, 
  allowSimulate = false,
  onSimulateStatus, 
  onRebookSuccess, 
  onRefundSuccess, 
  addToast 
}) {
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const getStatusStyles = (status) => {
    switch (status) {
      case 'On Time':
        return {
          bg: 'bg-emerald-50 text-brand-green border-emerald-200',
          dot: 'bg-brand-green',
          text: 'On Time'
        };
      case 'Boarding':
        return {
          bg: 'bg-blue-50 text-brand-blue border-blue-200 animate-pulse',
          dot: 'bg-brand-blue',
          text: 'Boarding Now'
        };
      case 'Delayed':
        return {
          bg: 'bg-amber-50 text-amber-600 border-amber-200',
          dot: 'bg-amber-500',
          text: 'Delayed'
        };
      case 'Cancelled':
        return {
          bg: 'bg-red-50 text-red-600 border-red-200',
          dot: 'bg-red-500',
          text: 'Cancelled'
        };
      case 'Refund Processed':
        return {
          bg: 'bg-slate-50 text-slate-500 border-slate-200',
          dot: 'bg-slate-400',
          text: 'Refund Completed'
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-600 border-slate-200',
          dot: 'bg-slate-400',
          text: status
        };
    }
  };

  const statusInfo = getStatusStyles(flight?.status || 'On Time');

  // PDF Ticket Download using jsPDF
  const handleDownloadTicket = async () => {
    try {
      downloadTicketPdf(user, flight);
      addToast('Boarding pass PDF downloaded!', 'success');
    } catch (err) {
      addToast('PDF generation failed. Please try again.', 'warning');
      console.error(err);
    }
  };

  // PDF Cancellation Receipt Download
  const handleDownloadCancellationReceipt = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      // Header
      doc.setFillColor(220, 38, 38);
      doc.rect(0, 0, 210, 45, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('SkyJet Airways', 20, 22);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('CANCELLATION RECEIPT & REFUND CONFIRMATION', 20, 32);
      doc.setFontSize(9);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 40);

      // Main block
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Booking Cancellation Confirmed', 20, 60);

      const details = [
        ['Booking Reference', user.bookingId],
        ['Passenger Name', `${user.firstName} ${user.lastName}`],
        ['Email Address', user.email || ''],
        ['Flight Number', flight?.flightNumber || 'SJ-412'],
        ['Route', `${flight?.origin || ''} → ${flight?.destination || ''}`],
        ['Original Departure', flight?.scheduledTime || ''],
        ['Refund Amount', `$${(user.refundAmount || 540.00).toFixed(2)}`],
        ['Refund to Card', `**** **** **** ${user.cardLast4 || 'XXXX'}`],
        ['Refund Status', 'Approved - 3 to 5 Business Days'],
      ];

      let yPos = 75;
      details.forEach(([label, value]) => {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text(label.toUpperCase(), 20, yPos);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
        doc.text(String(value), 20, yPos + 7);
        yPos += 18;
      });

      // Notice box
      yPos += 5;
      doc.setFillColor(254, 242, 242);
      doc.roundedRect(15, yPos, 180, 22, 3, 3, 'F');
      doc.setFontSize(8);
      doc.setTextColor(153, 27, 27);
      doc.setFont('helvetica', 'bold');
      doc.text('Important Notice', 22, yPos + 8);
      doc.setFont('helvetica', 'normal');
      doc.text('This booking has been permanently cancelled. Please retain this receipt for your records.', 22, yPos + 16);

      // Footer
      yPos += 35;
      doc.setFillColor(220, 38, 38);
      doc.rect(0, yPos, 210, 18, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('SkyJet Airways • Disruption Recovery Portal • skyjet.aero', 20, yPos + 11);

      doc.save(`SkyJet-Cancellation-${user.bookingId}.pdf`);
      addToast('Cancellation receipt downloaded!', 'success');
    } catch (err) {
      addToast('PDF generation failed. Please try again.', 'warning');
      console.error(err);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:px-8">
      
      {/* Simulation Control Panel - only visible to admins */}
      {allowSimulate && (
        <div className="mb-8 rounded-2xl border border-blue-100 bg-blue-50/40 p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-brand-blue animate-spin-slow" />
              <div className="text-left">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Interactive Simulation Hub</h4>
                <p className="text-xs text-slate-400">Toggle flight statuses to test adaptive UI behaviors</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <button
                onClick={() => onSimulateStatus('On Time')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  flight.status === 'On Time' 
                    ? 'bg-brand-green text-white border-brand-green' 
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                On Time
              </button>
              <button
                onClick={() => onSimulateStatus('Delayed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  flight.status === 'Delayed' 
                    ? 'bg-amber-500 text-white border-amber-500' 
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                Delayed
              </button>
              <button
                onClick={() => onSimulateStatus('Boarding')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  flight.status === 'Boarding' 
                    ? 'bg-brand-blue text-white border-brand-blue' 
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                Boarding
              </button>
              <button
                onClick={() => onSimulateStatus('Cancelled')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  flight.status === 'Cancelled' 
                    ? 'bg-red-600 text-white border-red-600' 
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                Cancelled
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-12">
        
        {/* LEFT COLUMN: PASSENGER CARD & TICKET */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Flight Card (Boarding Pass style) */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-md overflow-hidden">
            
            {/* Ticket Header */}
            <div className="bg-brand-blue-dark p-6 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-white/10 text-white">
                  <Plane className="w-5 h-5 rotate-45" />
                </div>
                <div className="text-left">
                  <span className="block text-[10px] uppercase tracking-widest text-blue-200 font-bold">Boarding Pass</span>
                  <h3 className="font-display font-bold text-lg">SkyJet Itinerary</h3>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-blue-100">Booking Reference:</span>
                <span className="px-3 py-1 bg-white/15 rounded-md font-mono text-sm font-bold uppercase tracking-wider">{user.bookingId}</span>
              </div>
            </div>

            {/* Ticket Route */}
            <div className="p-6 border-b border-dashed border-slate-200 bg-slate-50/50">
              {flight?.flightType === 'International' && (
                <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                  Please carry a valid passport. Visa requirements depend on destination.
                </div>
              )}
              {flight?.flightType === 'Domestic' && (
                <div className="mb-4 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                  Domestic terminal — faster boarding applies on this route.
                </div>
              )}
              <div className="flex items-center justify-between gap-4">
                
                {/* Origin */}
                <div className="text-left">
                  <span className="block text-2xl font-extrabold text-brand-blue-dark tracking-tight">
                    {flight?.origin?.match(/\(([^)]+)\)/)?.[1] || 'SIN'}
                  </span>
                  <span className="text-xs text-slate-400">{flight?.origin || 'Singapore'}</span>
                </div>
                
                {/* Flight Path Line */}
                <div className="flex-1 flex items-center justify-center relative">
                  <div className="w-full border-t-2 border-dotted border-slate-300"></div>
                  <Plane className="w-5 h-5 text-brand-blue rotate-90 absolute bg-white/10 px-0.5" />
                </div>

                {/* Destination */}
                <div className="text-right">
                  <span className="block text-2xl font-extrabold text-brand-blue-dark tracking-tight">
                    {flight?.destination?.match(/\(([^)]+)\)/)?.[1] || 'HND'}
                  </span>
                  <span className="text-xs text-slate-400">{flight?.destination || 'Tokyo'}</span>
                </div>

              </div>
            </div>

            {/* Ticket Info Grid */}
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Passenger</span>
                <div className="flex items-center gap-1.5 text-slate-700 font-semibold text-sm">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="truncate">{user.firstName} {user.lastName}</span>
                </div>
              </div>
              
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Flight Number</span>
                <div className="text-slate-700 font-semibold text-sm font-mono">{flight?.flightNumber}</div>
              </div>

              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Gate Assignment</span>
                <div className="text-slate-700 font-semibold text-sm">{flight?.gate || 'TBD'}</div>
              </div>

              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Departure Time</span>
                <div className="flex items-center gap-1.5 text-slate-700 font-semibold text-sm">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{flight?.scheduledTime}</span>
                </div>
              </div>
            </div>

            {/* Ticket Footer (Flight Status + Download) */}
            <div className="p-5 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/20">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-semibold">Current Status:</span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${statusInfo.bg}`}>
                  <span className={`h-2 w-2 rounded-full ${statusInfo.dot}`}></span>
                  {statusInfo.text}
                </span>
              </div>

              {/* PDF Download Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadTicket}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-blue hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm"
                  title="Download Boarding Pass PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Ticket PDF</span>
                </button>
                {(flight?.status === 'Cancelled' || flight?.status === 'Refund Processed') && (
                  <button
                    onClick={handleDownloadCancellationReceipt}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                    title="Download Cancellation Receipt"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Cancellation PDF</span>
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* DELAY VOUCHER PANEL - shown only when flight is delayed */}
          {flight?.status === 'Delayed' && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-6 shadow-sm animate-fade-in">
              <div className="flex items-start gap-3 mb-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-amber-900">Flight Delay Notice</h3>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Flight {flight?.flightNumber} is delayed. SkyJet has automatically loaded your disruption vouchers.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="flex flex-col items-start gap-2 p-4 bg-white rounded-xl border border-amber-100 shadow-xs">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <Coffee className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-xs">Meal Voucher</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">$25 food & beverage credit at airport outlets</p>
                  </div>
                  <span className="mt-auto text-[9px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-wider">Active</span>
                </div>

                <div className="flex flex-col items-start gap-2 p-4 bg-white rounded-xl border border-amber-100 shadow-xs">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-brand-blue">
                    <Wifi className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-xs">Lounge WiFi Pass</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Complimentary airport lounge WiFi access</p>
                  </div>
                  <span className="mt-auto text-[9px] font-bold bg-blue-100 text-brand-blue px-2 py-0.5 rounded-full uppercase tracking-wider">Active</span>
                </div>

                <div className="flex flex-col items-start gap-2 p-4 bg-white rounded-xl border border-amber-100 shadow-xs">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                    <Hotel className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-xs">Hotel Eligibility</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">If delay exceeds 6h, hotel accommodation provided</p>
                  </div>
                  <span className="mt-auto text-[9px] font-bold bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full uppercase tracking-wider">Conditional</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-white rounded-xl border border-amber-100 text-xs text-amber-800 leading-relaxed">
                <strong>Updated Departure:</strong> Your gate agent will announce the revised boarding time. 
                Check the SkyJet app or airport departure boards for live updates. All delay vouchers can be redeemed at any SkyJet airport partner outlet.
              </div>
            </div>
          )}

          {/* Conditional Smart Recovery Flow */}
          {flight?.status === 'Cancelled' && (
            <SmartRecovery 
              flight={flight}
              user={user}
              onRebookSuccess={onRebookSuccess}
              onRefundSuccess={onRefundSuccess}
              addToast={addToast}
            />
          )}

          {/* Refund Eligibility Matrix */}
          <RefundEligibility />

        </div>

        {/* RIGHT COLUMN: PASSENGER CARD DETAILS / RECOVERY PROGRESS SUMMARY */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Passenger Info Details Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-left">
            <h4 className="font-display font-bold text-slate-800 text-sm uppercase tracking-wider mb-4 border-b border-slate-100 pb-3">
              Booking Details
            </h4>
            
            <div className="space-y-3.5 text-sm text-slate-600">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">First Name</span>
                <strong className="text-slate-800 font-semibold">{user.firstName}</strong>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Last Name</span>
                <strong className="text-slate-800 font-semibold">{user.lastName}</strong>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Email</span>
                <strong className="text-slate-800 font-semibold">{user.email}</strong>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Carrier</span>
                <strong className="text-slate-800 font-semibold">SkyJet International</strong>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Fare Category</span>
                <strong className="text-slate-800 font-semibold">{user.fareCategory || 'Premium Economy (Refundable)'}</strong>
              </div>
              {user.seat && (
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Seat</span>
                  <strong className="text-slate-800 font-semibold">{user.seat}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Recovery Assistance Guide */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-left">
            <h4 className="font-display font-bold text-slate-800 text-sm uppercase tracking-wider mb-4 border-b border-slate-100 pb-3">
              Recovery Action Plan
            </h4>

            {flight?.status === 'Cancelled' ? (
              <div className="space-y-3 text-xs leading-relaxed text-slate-500">
                <p>Because your flight has been cancelled, our <strong>Smart Recovery Engine</strong> is active.</p>
                <ul className="list-disc pl-4 space-y-1.5">
                  <li>Choose another flight tonight or tomorrow at no charge.</li>
                  <li>Alternatively, receive a full credit card refund.</li>
                  <li>Use the AI Assistant in the bottom right to complete actions via chat.</li>
                  <li>Download your cancellation receipt for records.</li>
                </ul>
              </div>
            ) : flight?.status === 'Delayed' ? (
              <div className="space-y-3 text-xs leading-relaxed text-slate-500">
                <p>Your flight is experiencing a delay. <strong>Vouchers are activated</strong>.</p>
                <ul className="list-disc pl-4 space-y-1.5">
                  <li>Redeem meal vouchers at airport outlets.</li>
                  <li>If delay exceeds 6 hours, hotel accommodation is arranged.</li>
                  <li>You may also rebook to an earlier available flight at no cost.</li>
                </ul>
              </div>
            ) : flight?.status === 'Refund Processed' ? (
              <div className="text-center py-4">
                <CheckCircle2 className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <h5 className="font-bold text-slate-700 text-sm">Refund Claim Submitted</h5>
                <p className="text-xs text-slate-400 mt-1">Funds will credit back within 3-5 business days.</p>
                <button
                  onClick={handleDownloadCancellationReceipt}
                  className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Receipt
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-xs leading-relaxed text-slate-500">
                <p>No disruptions detected. Your flight status is currently <strong>{flight?.status}</strong>.</p>
                <p>Keep this tab open. If anything changes, we will alert you immediately via notifications.</p>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
