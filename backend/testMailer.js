// testMailer.js
const fs = require('fs').promises;
const path = require('path');
const { sendTicketEmail } = require('./mailer'); // Adjust path if needed

async function testSendEmails() {
  try {
    // Update the following path to point to your test PDF file.
    const pdfPath = path.join(__dirname, 'js/ticket.pdf');
    const pdfBuffer = await fs.readFile(pdfPath);

    // Email options for the student
    const studentEmailOptions = {
      to: 'development.team@uofcanada.edu.eg', // Replace with a test student email address
      subject: 'Bus Booking Email Test - Student',
      text: `Dear X,

Thank you for your booking. Please find attached your bus ticket for your upcoming trip on "DATE".

For support, please contact us at 01008470311.

Safe travels!

Universities of Canada in Egypt`,
      pdfBuffer,
      pdfFilename: 'test_ticket_student.pdf'
    };

    // Email options for the fleet manager
    const fleetEmailOptions = {
      to: 'development.team@uofcanada.edu.eg', // Replace with the fleet manager's test email address
      subject: 'Bus Booking Email Test - Fleet Manager',
      text: `Ticket Details:
---------------
Student Name: Lorum Ipsum
Student ID: TEST12345
Trip Date: 2025-03-10
Route: Test Route
Trip Type: Test Trip
Seats Booked: 2
Total Amount: 9999 EGP
Driver Mobile: 0123456789

Ticket Number: TICK-1010101010101010

The PDF ticket is attached.`,
      pdfBuffer,
      pdfFilename: 'test_ticket_fleet.pdf'
    };

    // Send both emails concurrently
    await Promise.all([
      sendTicketEmail(studentEmailOptions),
      sendTicketEmail(fleetEmailOptions)
    ]);

    console.log('Test emails sent successfully.');
  } catch (error) {
    console.error('Error sending test emails:', error);
  }
}

testSendEmails();
