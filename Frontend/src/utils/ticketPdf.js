import { jsPDF } from 'jspdf';

const getAirportCode = (value, fallback) => value?.match(/\(([^)]+)\)/)?.[1] || fallback;

export function downloadTicketPdf(user, flight) {
  const doc = new jsPDF();

  doc.setFillColor(15, 82, 186);
  doc.rect(0, 0, 210, 45, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('SkyJet Airways', 20, 22);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('BOARDING PASS', 20, 32);
  doc.setFontSize(9);
  doc.text(`Booking Reference: ${user.bookingId || user.booking_id}`, 20, 40);

  doc.setFillColor(248, 250, 252);
  doc.rect(0, 48, 210, 30, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text(getAirportCode(flight?.origin, 'SIN'), 20, 70);
  doc.text('->', 80, 70);
  doc.text(getAirportCode(flight?.destination, 'HND'), 100, 70);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(flight?.origin || '', 20, 76);
  doc.text(flight?.destination || '', 100, 76);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(15, 82, 195, 82);

  const fields = [
    ['PASSENGER NAME', `${user.firstName || user.first_name} ${user.lastName || user.last_name}`],
    ['FLIGHT NUMBER', flight?.flightNumber || flight?.flight_number || 'SJ-412'],
    ['GATE', flight?.gate || 'TBD'],
    ['DEPARTURE', flight?.scheduledTime || flight?.scheduled_time || ''],
    ['SEAT', user.seat || 'Assigned at Gate'],
    ['FARE CLASS', user.fareCategory || user.fare_category || 'Premium Economy'],
    ['STATUS', flight?.status || 'On Time'],
    ['BOOKING DATE', user.bookingDate || user.booking_date || new Date().toLocaleDateString()],
  ];

  let yPos = 95;
  let col = 0;
  fields.forEach(([label, value]) => {
    const xPos = col === 0 ? 20 : 110;
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'bold');
    doc.text(label, xPos, yPos);
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(String(value), xPos, yPos + 7);

    col = col === 0 ? 1 : 0;
    if (col === 0) yPos += 20;
  });

  yPos += 15;
  doc.setFillColor(15, 82, 186);
  doc.rect(0, yPos, 210, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('SkyJet Airways - Smart Recovery Portal - skyjet.aero', 20, yPos + 11);

  doc.save(`SkyJet-Ticket-${user.bookingId || user.booking_id}.pdf`);
}
