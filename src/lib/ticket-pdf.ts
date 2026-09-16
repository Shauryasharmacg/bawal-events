import { jsPDF } from 'jspdf';
import { Ticket } from '../types/index.js';

export function downloadTicketPdf(ticket: Ticket) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [105, 210], // Sleek VIP pass / festival badge dimension (105mm x 210mm)
  });

  // Dark background (#02040D)
  doc.setFillColor(2, 4, 13);
  doc.rect(0, 0, 105, 210, 'F');

  // Electric blue accent bar at top
  doc.setFillColor(0, 56, 255); // #0038FF
  doc.rect(0, 0, 105, 6, 'F');

  // BAWAL Logo / Header
  doc.setTextColor(56, 136, 255); // #3888FF
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text('BAWAL', 52.5, 20, { align: 'center' });

  doc.setTextColor(180, 195, 220);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('WEEKENDS HIT DIFFERENT', 52.5, 26, { align: 'center' });

  // Divider
  doc.setDrawColor(20, 36, 85);
  doc.line(10, 30, 95, 30);

  // Event Number & Title
  doc.setTextColor(96, 165, 250); // #60A5FA
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(ticket.eventNumber.toUpperCase(), 52.5, 37, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(ticket.eventTitle, 52.5, 45, { align: 'center' });

  // Pass Tier Badge
  doc.setFillColor(11, 21, 56);
  doc.roundedRect(22, 51, 61, 8, 2, 2, 'F');
  doc.setTextColor(56, 136, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(ticket.ticketTypeName.toUpperCase(), 52.5, 56.5, { align: 'center' });

  // Registration ID Box
  doc.setFillColor(8, 14, 40);
  doc.setDrawColor(25, 45, 110);
  doc.roundedRect(12, 65, 81, 22, 3, 3, 'FD');

  doc.setTextColor(140, 160, 190);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('OFFICIAL REGISTRATION ID', 52.5, 72, { align: 'center' });

  doc.setTextColor(96, 165, 250);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(ticket.registrationCode, 52.5, 81, { align: 'center' });

  // Attendee Info Section
  const startY = 94;
  doc.setTextColor(140, 140, 150);
  doc.setFontSize(8);
  doc.text('ATTENDEE NAME', 15, startY);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(ticket.attendeeName, 15, startY + 6);

  doc.setTextColor(140, 140, 150);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('DATE & TIME', 15, startY + 15);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`${ticket.eventDate}  |  ${ticket.eventTime}`, 15, startY + 21);

  doc.setTextColor(140, 140, 150);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('VENUE', 15, startY + 30);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(ticket.eventVenue, 15, startY + 36);

  // Status Badge
  doc.setTextColor(140, 140, 150);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('ENTRY STATUS', 15, startY + 45);

  const statusColor = ticket.status === 'USED' ? [150, 150, 150] : [34, 197, 94];
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(ticket.status === 'USED' ? 'ALREADY CHECKED IN' : 'CONFIRMED PASS', 15, startY + 51);

  // QR Code Image
  if (ticket.qrDataUrl) {
    try {
      // White container for clean QR scan contrast
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(26.5, 153, 52, 42, 3, 3, 'F');
      doc.addImage(ticket.qrDataUrl, 'PNG', 32.5, 155, 40, 38);
    } catch (e) {
      console.error('Failed to add QR image to PDF:', e);
    }
  }

  // Footer Instructions
  doc.setTextColor(120, 120, 130);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Present this digital QR pass at the entrance desk for check-in.', 52.5, 201, { align: 'center' });
  doc.text('@bawal.social  •  Strictly 18+  •  Socks Mandatory', 52.5, 205, { align: 'center' });

  // Save the PDF
  doc.save(`BAWAL_Ticket_${ticket.registrationCode}.pdf`);
}
