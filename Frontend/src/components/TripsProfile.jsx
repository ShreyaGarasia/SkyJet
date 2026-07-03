import React, { useState } from 'react';
import { Ticket, Plane, AlertTriangle, ChevronRight, Download, XCircle } from 'lucide-react';
import { downloadTicketPdf } from '../utils/ticketPdf';

function cityName(location) {
  if (!location) return '';
  return location.split('(')[0].trim();
}

export default function TripsProfile({ user, bookings, tripsData, onSelectBooking, onTripsRefresh, addToast }) {
  const [cancellingId, setCancellingId] = useState(null);

  const upcoming = tripsData?.upcoming?.length ? tripsData.upcoming : bookings.filter((b) => {
    const fs = b.flight?.status;
    return b.status === 'Confirmed' && fs !== 'Cancelled' && fs !== 'Refund Processed';
  });
  const completed = tripsData?.completed?.length ? tripsData.completed : [];
  const cancelled = tripsData?.cancelled?.length ? tripsData.cancelled : bookings.filter((b) => {
    const fs = b.flight?.status;
    return b.status === 'Cancelled' || b.status === 'Refund Processed' || fs === 'Cancelled';
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'On Time':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Boarding':
        return 'bg-blue-50 text-brand-blue border-blue-100 animate-pulse';
      case 'Delayed':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Cancelled':
        return 'bg-red-50 text-red-700 border-red-100';
      case 'Refund Processed':
        return 'bg-slate-50 text-slate-500 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const handleCancel = async (bookingId) => {
    setCancellingId(bookingId);
    try {
      const res = await fetch('/api/cancel-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId }),
      });
      const data = await res.json();
      if (res.ok) {
        addToast(data.message || 'Booking cancelled.', 'success');
        if (onTripsRefresh) onTripsRefresh();
      } else {
        addToast(data.error || 'Could not cancel booking.', 'warning');
      }
    } catch {
      addToast('Server error while cancelling.', 'warning');
    } finally {
      setCancellingId(null);
    }
  };

  const renderBookingCard = (booking) => {
    const flight = booking.flight || {};
    const displayStatus = flight.status || booking.status || 'On Time';
    const isDisrupted = displayStatus === 'Cancelled' || displayStatus === 'Delayed';
    const canCancel = booking.status === 'Confirmed' && displayStatus !== 'Cancelled';

    return (
      <div 
        key={booking.booking_id}
        className={`rounded-2xl border bg-white p-5 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-2xs hover:shadow-xs ${
          isDisrupted 
            ? 'border-red-200/80 bg-gradient-to-r from-white to-red-50/10' 
            : 'border-slate-200/80'
        }`}
      >
        <div className="space-y-3 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-md font-mono text-xs font-bold bg-slate-100 text-slate-700 uppercase">
              PNR: {booking.booking_id}
            </span>
            <span className="text-xs text-slate-400 font-semibold">Seat: {booking.seat}</span>
            {flight.flightType && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-blue">{flight.flightType}</span>
            )}
          </div>

          <div className="flex items-center gap-4 text-slate-800">
            <div className="text-left">
              <strong className="text-lg font-extrabold text-brand-blue-dark block leading-tight">
                {cityName(flight.origin) || '—'}
              </strong>
              <span className="text-[10px] text-slate-400 font-medium">{cityName(flight.origin)}</span>
            </div>
            
            <div className="flex-1 flex items-center justify-center max-w-[80px] relative">
              <div className="w-full border-t border-slate-300 border-dotted"></div>
              <Plane className="w-3.5 h-3.5 text-brand-blue absolute rotate-45" />
            </div>

            <div className="text-left">
              <strong className="text-lg font-extrabold text-brand-blue-dark block leading-tight">
                {cityName(flight.destination) || '—'}
              </strong>
              <span className="text-[10px] text-slate-400 font-medium">{cityName(flight.destination)}</span>
            </div>
          </div>

          <div className="text-xs font-semibold text-brand-blue">
            Departure: {flight.scheduled_time || '10:30 PM (Tonight)'}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end justify-between md:justify-center gap-4 w-full md:w-auto border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
          <div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold ${getStatusBadgeClass(displayStatus)}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${displayStatus === 'Cancelled' ? 'bg-red-500' : 'bg-brand-green'}`}></span>
              {displayStatus}
            </span>
          </div>

          {isDisrupted ? (
            <button
              onClick={() => onSelectBooking(booking.booking_id, booking.last_name || user.lastName)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-md hover:shadow-lg animate-pulse"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Self-Service Recovery</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          ) : (
            <button
              onClick={() => onSelectBooking(booking.booking_id, booking.last_name || user.lastName)}
              className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-3xs cursor-pointer"
            >
              <span>View Ticket</span>
            </button>
          )}
          <button
            onClick={() => {
              downloadTicketPdf(
                {
                  bookingId: booking.booking_id,
                  firstName: booking.first_name,
                  lastName: booking.last_name,
                  seat: booking.seat,
                  fareCategory: booking.fare_category,
                  bookingDate: booking.booking_date
                },
                {
                  flightNumber: flight.flight_number || flight.flightNumber,
                  origin: flight.origin,
                  destination: flight.destination,
                  gate: flight.gate,
                  scheduledTime: flight.scheduled_time || flight.scheduledTime,
                  status: displayStatus,
                  flightType: flight.flightType,
                }
              );
              addToast('Ticket PDF downloaded successfully.', 'success');
            }}
            className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-3xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>
          {canCancel && (
            <button
              onClick={() => handleCancel(booking.booking_id)}
              disabled={cancellingId === booking.booking_id}
              className="px-4 py-2 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-3xs cursor-pointer disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>{cancellingId === booking.booking_id ? 'Cancelling...' : 'Cancel Booking'}</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderSection = (title, items) => (
    <div className="space-y-4">
      <h3 className="font-display text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">
        {title} ({items.length})
      </h3>
      {items.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
          No {title.toLowerCase()}.
        </div>
      ) : (
        <div className="grid gap-4">{items.map(renderBookingCard)}</div>
      )}
    </div>
  );

  const totalCount = bookings.length;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 md:px-8 text-left">
      
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-brand-blue font-bold text-xl uppercase">
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div>
            <h2 className="font-display text-2xl font-extrabold text-brand-blue-dark">{user.firstName} {user.lastName}</h2>
            <p className="text-sm text-slate-400 mt-0.5">{user.email}</p>
          </div>
        </div>
        
        <div className="bg-slate-50 py-2.5 px-4 rounded-xl border border-slate-100 text-center sm:text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Registered Member</span>
          <span className="text-xs text-slate-600 font-bold">SkyJet Elite Frequent Flyer</span>
        </div>
      </div>

      <div className="space-y-10">
        {totalCount === 0 ? (
          <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-400">
            <Ticket className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <h4 className="font-bold text-slate-700 text-sm">No bookings found</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              You haven't booked any flights under this profile yet. Go to the Book Flight tab to schedule a trip!
            </p>
          </div>
        ) : (
          <>
            {renderSection('Upcoming Trips', upcoming)}
            {renderSection('Completed Trips', completed)}
            {renderSection('Cancelled Trips', cancelled)}
          </>
        )}
      </div>

    </div>
  );
}
