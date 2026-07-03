import React, { useState, useEffect } from 'react';
import { Search, Plane, ShieldCheck, CheckCircle2, Armchair } from 'lucide-react';

export default function BookFlight({ user, addToast, onBookingComplete, onNavigateToRetrieve }) {
  const [origins, setOrigins] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [routeType, setRouteType] = useState('');
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  
  // Booking flow steps
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [passengerDetails, setPassengerDetails] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });
  const [selectedSeat, setSelectedSeat] = useState('');
  const [step, setStep] = useState('search'); // 'search', 'passenger', 'checkout', 'success'
  const [newBookingId, setNewBookingId] = useState('');
  const [occupiedSeats, setOccupiedSeats] = useState([]);
  const [seatLoading, setSeatLoading] = useState(false);

  // Sync user details if logged in
  useEffect(() => {
    if (user) {
      setPassengerDetails({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchOrigins = async () => {
      try {
        const res = await fetch('/api/routes/origins');
        if (!res.ok) return;
        const data = await res.json();
        setOrigins(data);
        if (data.length > 0 && !origin) {
          setOrigin(data[0].city);
        }
      } catch {
        // Form remains usable if routes cannot be loaded yet.
      }
    };
    fetchOrigins();
  }, []);

  useEffect(() => {
    if (!origin) return;
    const fetchDestinations = async () => {
      try {
        const res = await fetch(`/api/routes/destinations?origin=${encodeURIComponent(origin)}`);
        if (!res.ok) return;
        const data = await res.json();
        setDestinations(data);
        if (data.length > 0) {
          const stillValid = data.some((d) => d.city === destination);
          if (!stillValid) {
            setDestination(data[0].city);
            setRouteType(data[0].flightType || '');
          }
        } else {
          setDestination('');
          setRouteType('');
        }
      } catch {
        setDestinations([]);
      }
    };
    fetchDestinations();
  }, [origin]);

  useEffect(() => {
    const match = destinations.find((d) => d.city === destination);
    setRouteType(match?.flightType || '');
  }, [destination, destinations]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!origin || !destination) {
      addToast('Please select origin and destination.', 'warning');
      return;
    }
    if (origin === destination) {
      addToast('Origin and Destination cannot be the same.', 'warning');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/available-flights?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`);
      const data = await res.json();
      if (res.ok) {
        setFlights(data);
        setSearched(true);
      } else {
        addToast(data.error || 'Failed to fetch flights.', 'warning');
        setFlights([]);
        setSearched(true);
      }
    } catch {
      addToast('Error communicating with server.', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const startBooking = (flight) => {
    setSelectedFlight(flight);
    setOccupiedSeats([]);
    setSelectedSeat('');
    setStep('passenger');
  };

  useEffect(() => {
    const fetchSeatAvailability = async () => {
      if (step !== 'passenger' || !selectedFlight?.flight_id) {
        return;
      }

      setSeatLoading(true);
      try {
        const res = await fetch(`/api/flight-seats/${selectedFlight.flight_id}`);
        const data = await res.json();
        if (!res.ok) {
          addToast(data.error || 'Could not load seat availability.', 'warning');
          return;
        }

        const bookedSeats = data.occupied_seats || [];
        setOccupiedSeats(bookedSeats);

        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
        let nextSeat = '';
        for (let row = 1; row <= 7 && !nextSeat; row += 1) {
          for (const letter of letters) {
            const seatId = `${row}${letter}`;
            if (!bookedSeats.includes(seatId)) {
              nextSeat = seatId;
              break;
            }
          }
        }
        setSelectedSeat(nextSeat);
      } catch {
        addToast('Could not load seat availability.', 'warning');
      } finally {
        setSeatLoading(false);
      }
    };

    fetchSeatAvailability();
  }, [step, selectedFlight, addToast]);

  const handleSeatClick = (seat) => {
    if (occupiedSeats.includes(seat)) return;
    setSelectedSeat(seat);
  };

  const handlePassengerSubmit = (e) => {
    e.preventDefault();
    if (!passengerDetails.firstName || !passengerDetails.lastName || !passengerDetails.email) {
      addToast('Please fill in all passenger fields.', 'warning');
      return;
    }
    if (!selectedSeat) {
      addToast('Please choose an available seat before continuing.', 'warning');
      return;
    }
    setStep('checkout');
  };

  const handleConfirmBooking = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/book-flight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flight_id: selectedFlight.flight_id,
          firstName: passengerDetails.firstName,
          lastName: passengerDetails.lastName,
          email: passengerDetails.email,
          userEmail: user?.email || '',
          seat: selectedSeat,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewBookingId(data.booking_id);
        addToast(`Ticket booked! PNR: ${data.booking_id}`, 'success');
        setStep('success');
        if (onBookingComplete) {
          onBookingComplete(data.booking);
        }
      } else {
        addToast(data.error || 'Failed to book flight.', 'warning');
      }
    } catch {
      addToast('Server error during checkout.', 'warning');
    } finally {
      setLoading(false);
    }
  };

  // Renders a simple seat map
  const renderSeatMap = () => {
    const rows = [1, 2, 3, 4, 5, 6, 7];
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    return (
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200/60 max-w-sm mx-auto">
        <h5 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-4 text-center">Select Your Seat</h5>
        <div className="mb-4 flex flex-wrap justify-center gap-2 text-[10px] font-semibold">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            Available
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-red-700">
            <span className="h-2 w-2 rounded-full bg-red-500"></span>
            Already booked
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-brand-blue">
            <span className="h-2 w-2 rounded-full bg-brand-blue"></span>
            Your selection
          </span>
        </div>
        <p className="mb-4 text-[11px] leading-relaxed text-slate-500">
          This helps passengers avoid choosing a seat that has already been taken and makes seat selection faster at checkout.
        </p>
        {seatLoading && (
          <div className="mb-4 rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-[11px] font-semibold text-slate-500">
            Loading real-time seat availability...
          </div>
        )}
        <div className="grid gap-2">
          {rows.map((row) => (
            <div key={row} className="flex justify-between items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 w-4">{row}</span>
              <div className="flex gap-1.5">
                {letters.slice(0, 3).map((l) => {
                  const id = `${row}${l}`;
                  const isSelected = selectedSeat === id;
                  const isBooked = occupiedSeats.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleSeatClick(id)}
                      disabled={isBooked}
                      className={`h-7 w-7 rounded-sm flex items-center justify-center text-[10px] font-semibold transition-all cursor-pointer ${
                        isBooked
                          ? 'bg-red-50 border border-red-200 text-red-400 cursor-not-allowed'
                          : isSelected 
                          ? 'bg-brand-blue text-white shadow-xs' 
                          : 'bg-emerald-50 border border-emerald-200 hover:border-emerald-400 text-emerald-700'
                      }`}
                      title={isBooked ? `Seat ${id} is already booked` : `Choose seat ${id}`}
                    >
                      {l}
                    </button>
                  );
                })}
              </div>
              <div className="w-4"></div> {/* Aisle */}
              <div className="flex gap-1.5">
                {letters.slice(3).map((l) => {
                  const id = `${row}${l}`;
                  const isSelected = selectedSeat === id;
                  const isBooked = occupiedSeats.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleSeatClick(id)}
                      disabled={isBooked}
                      className={`h-7 w-7 rounded-sm flex items-center justify-center text-[10px] font-semibold transition-all cursor-pointer ${
                        isBooked
                          ? 'bg-red-50 border border-red-200 text-red-400 cursor-not-allowed'
                          : isSelected 
                          ? 'bg-brand-blue text-white shadow-xs' 
                          : 'bg-emerald-50 border border-emerald-200 hover:border-emerald-400 text-emerald-700'
                      }`}
                      title={isBooked ? `Seat ${id} is already booked` : `Choose seat ${id}`}
                    >
                      {l}
                    </button>
                  );
                })}
              </div>
              <span className="text-[10px] font-bold text-slate-400 w-4 text-right">{row}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 md:px-8 text-left">
      
      {/* SEARCH / FLIGHT SELECTION STEP */}
      {step === 'search' && (
        <div className="space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="font-display text-3xl font-extrabold text-brand-blue-dark">Book Your Next Journey</h2>
            <p className="text-sm text-slate-400">Search premium flights across SkyJet's networks in Asia.</p>
          </div>

          {/* Search Form Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md md:p-8">
            <form onSubmit={handleSearch} className="grid gap-6 md:grid-cols-3 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Origin City</label>
                <select 
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  disabled={origins.length === 0}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm focus:border-brand-blue focus:bg-white focus:outline-hidden transition-all"
                >
                  {origins.map((airport) => <option key={airport.city} value={airport.city}>{airport.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Destination City</label>
                <select 
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  disabled={destinations.length === 0}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm focus:border-brand-blue focus:bg-white focus:outline-hidden transition-all"
                >
                  {destinations.map((airport) => <option key={airport.city} value={airport.city}>{airport.label}</option>)}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-brand-blue hover:bg-blue-700 text-white font-semibold py-3 px-6 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                <Search className="w-4 h-4" />
                <span>Search Flights</span>
              </button>
            </form>

            {routeType === 'International' && (
              <div className="mt-4 space-y-2 rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-xs text-slate-600">
                <p className="font-semibold text-brand-blue">International flight reminders</p>
                <p>Please carry a valid passport.</p>
                <p>Visa requirements depend on destination.</p>
                <p>Some itinerary changes may require airline approval.</p>
              </div>
            )}
            {routeType === 'Domestic' && (
              <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-xs text-slate-600">
                <p className="font-semibold text-emerald-700">Domestic flight</p>
                <p>Use the domestic terminal. Faster boarding applies on this route.</p>
              </div>
            )}
          </div>

          {/* Search Results */}
          {searched && (
            <div className="space-y-4">
              <h3 className="font-display text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">
                Available Departures ({origin} → {destination})
              </h3>
              
              {flights.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200 border-dashed text-slate-400">
                  <Plane className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No flights found between the selected cities. Try Delhi → Mumbai or Singapore → Tokyo.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {flights.map((flight) => (
                    <div 
                      key={flight.flight_id}
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 rounded-2xl border border-slate-200 bg-white hover:border-brand-blue hover:shadow-xs transition-all gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center font-bold text-sm">
                          {flight.flight_number}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{flight.scheduled_time}</h4>
                          <p className="text-xs text-slate-400">
                            Gate: {flight.gate} | {flight.flightType || routeType} | Route: {flight.origin} → {flight.destination}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                        <div className="text-right">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            flight.status === 'Cancelled'
                              ? 'bg-red-50 text-red-600 border border-red-100'
                              : 'bg-emerald-50 text-brand-green border border-emerald-100'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${flight.status === 'Cancelled' ? 'bg-red-500' : 'bg-brand-green'}`}></span>
                            {flight.status}
                          </span>
                          <span className="block text-[10px] text-slate-400 mt-1 font-semibold">{flight.seats_left} seats remaining</span>
                        </div>

                        <button
                          onClick={() => startBooking(flight)}
                          disabled={flight.seats_left <= 0 || flight.status === 'Cancelled'}
                          className="px-5 py-2.5 bg-brand-green hover:bg-emerald-600 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
                        >
                          Book Flight
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* PASSENGER DETAILS STEP */}
      {step === 'passenger' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <button 
            onClick={() => setStep('search')}
            className="text-xs font-bold text-slate-400 hover:text-brand-blue flex items-center gap-1 transition-colors cursor-pointer"
          >
            ← Back to Flights
          </button>

          <h2 className="font-display text-2xl font-extrabold text-brand-blue-dark">Passenger Details</h2>

          <div className="grid gap-6 md:grid-cols-12 items-start">
            <div className="md:col-span-7">
              <form onSubmit={handlePassengerSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      value={passengerDetails.firstName}
                      onChange={(e) => setPassengerDetails({ ...passengerDetails, firstName: e.target.value })}
                      placeholder="Sid"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm focus:border-brand-blue focus:bg-white focus:outline-hidden transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Last Name</label>
                    <input
                      type="text"
                      required
                      value={passengerDetails.lastName}
                      onChange={(e) => setPassengerDetails({ ...passengerDetails, lastName: e.target.value })}
                      placeholder="Patel"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm focus:border-brand-blue focus:bg-white focus:outline-hidden transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={passengerDetails.email}
                    onChange={(e) => setPassengerDetails({ ...passengerDetails, email: e.target.value })}
                    placeholder="sid.patel@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm focus:border-brand-blue focus:bg-white focus:outline-hidden transition-all"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100 flex gap-4">
                  <div className="flex items-center gap-2 bg-slate-50 py-2 px-3 rounded-lg text-slate-500 w-full text-xs">
                    <Armchair className="w-4 h-4 text-brand-blue" />
                    <span>Selected Seat: <strong>{selectedSeat}</strong></span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-brand-blue py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition-all duration-200 cursor-pointer"
                >
                  Continue to Review
                </button>
              </form>
            </div>

            <div className="md:col-span-5">
              {renderSeatMap()}
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT STEP */}
      {step === 'checkout' && (
        <div className="max-w-xl mx-auto space-y-6">
          <button 
            onClick={() => setStep('passenger')}
            className="text-xs font-bold text-slate-400 hover:text-brand-blue flex items-center gap-1 transition-colors cursor-pointer"
          >
            ← Back to Details
          </button>

          <h2 className="font-display text-2xl font-extrabold text-brand-blue-dark text-center">Review Itinerary</h2>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md space-y-6">
            
            {/* Flight info summary */}
            <div className="bg-slate-50 p-4 rounded-xl space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Itinerary</span>
              <div className="flex justify-between items-center">
                <strong className="text-slate-800 text-base">{selectedFlight.origin.split(' ')[0]}</strong>
                <span className="w-12 border-t border-dotted border-slate-400"></span>
                <strong className="text-slate-800 text-base">{selectedFlight.destination.split(' ')[0]}</strong>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>Flight: <strong>{selectedFlight.flight_number}</strong></span>
                <span>Gate: <strong>{selectedFlight.gate}</strong></span>
                <span>Seat: <strong>{selectedSeat}</strong></span>
              </div>
              <div className="text-xs text-brand-blue font-semibold pt-1">
                Departure: {selectedFlight.scheduled_time}
              </div>
            </div>

            {/* Passenger summary */}
            <div className="space-y-2 text-sm text-slate-600">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Passenger</span>
              <div>Name: <strong className="text-slate-800">{passengerDetails.firstName} {passengerDetails.lastName}</strong></div>
              <div>Email: <strong className="text-slate-800">{passengerDetails.email}</strong></div>
            </div>

            {/* Total Fare info */}
            <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
              <div>
                <span className="text-xs text-slate-400">Fare Class: Premium Economy</span>
                <span className="block text-[10px] text-emerald-600 font-bold">100% Refundable Ticket</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Total Price</span>
                <strong className="text-slate-800 text-xl">$540.00</strong>
              </div>
            </div>

            <button
              onClick={handleConfirmBooking}
              disabled={loading}
              className="w-full rounded-xl bg-brand-green py-3.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              Confirm &amp; Purchase Ticket
            </button>

          </div>
        </div>
      )}

      {/* SUCCESS CONFIRMATION STEP */}
      {step === 'success' && (
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-brand-green">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          
          <div>
            <h2 className="font-display text-2xl font-extrabold text-slate-800">Booking Confirmed!</h2>
            <p className="text-sm text-slate-500 mt-2">Your flight has been booked successfully. A ticket itinerary has been emailed to you.</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 h-12 w-12 bg-emerald-50 rounded-bl-full flex items-start justify-end p-2 text-brand-green">
              <ShieldCheck className="w-5 h-5" />
            </div>

            <div className="space-y-4">
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Booking Reference (PNR)</span>
                <strong className="text-lg font-mono text-brand-blue uppercase font-bold tracking-widest">{newBookingId}</strong>
              </div>
              
              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <div>
                  <span>Flight</span>
                  <strong className="block text-slate-700 text-sm mt-0.5">{selectedFlight.flight_number}</strong>
                </div>
                <div>
                  <span>Seat Assignment</span>
                  <strong className="block text-slate-700 text-sm mt-0.5">{selectedSeat}</strong>
                </div>
              </div>

              <div className="text-xs text-slate-400 leading-relaxed bg-blue-50/50 p-3 rounded-lg border border-blue-100/50">
                ⚠️ **Disruption Simulator Note:** You can test disruption scenarios for this booking. Click **Demo Simulator Panel** in the menu to cancel or delay this flight, then return to **Manage Booking** and lookup `Booking ID: ${newBookingId}` and `Last Name: ${passengerDetails.lastName}`.
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => onNavigateToRetrieve(newBookingId, passengerDetails.lastName)}
              className="w-full py-3.5 bg-brand-blue hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all cursor-pointer"
            >
              Go to Disruption Recovery Portal
            </button>
            
            <button
              onClick={() => {
                setStep('search');
                setSelectedFlight(null);
                setSearched(false);
              }}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              Book Another Flight
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
