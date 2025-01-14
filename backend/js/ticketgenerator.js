const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const logger = require(`${__basedir}/backend/logger`);

// ../../frontend/assets/TicketLogo.png

async function generateTicket(details, filePath) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const maroon = '#8b2004';

            // Pipe the PDF into a file
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Add University Logo
            const logoPath = 'C:/xampp/htdocs/UocBus/frontend/assets/TicketLogo.png';
            doc.image(logoPath, 50, 20, { width: 100 });
            logger.info('Resolved logo path:', logoPath);
            
            // Title
            doc.fillColor(maroon).fontSize(22).text('Bus Ticket', { align: 'center' });
            doc.moveDown(2);

            // Passenger Details Section
            doc.rect(50, 100, 500, 150).stroke(maroon);
            doc.fillColor(maroon).fontSize(14).text('Passenger Details', 50, 110, { align: 'center' });
            doc.moveTo(60, 125).lineTo(540, 125).stroke(); // Underline

            // Content within Passenger Details Section
            const passengerDetails = [
                ['Name:', details.student_name],
                ['Student ID:', details.student_id],
                ['Email:', details.student_email],
                ['Mobile:', details.student_mobile_no],
            ];

            doc.moveDown(0.5).fillColor('black').fontSize(12);
            passengerDetails.forEach(([label, value], index) => {
                doc.text(label, 60, 140 + index * 25, { continued: true }).text(` ${value}`);
            });

            // Trip Details Section
            const tripDetailsHeight = 220; // Height of the section
            const paddingBelowLine = 20; // Padding below the red line
            const tripSectionYStart = 270;

            doc.rect(50, tripSectionYStart, 500, tripDetailsHeight + paddingBelowLine).stroke(maroon); // Extend height dynamically
            doc.fillColor(maroon).fontSize(14).text('Trip Details', 50, tripSectionYStart + 10, { align: 'center' });
            doc.moveTo(60, tripSectionYStart + 25).lineTo(540, tripSectionYStart + 25).stroke(); // Underline

            // Content within Trip Details Section
            const tripDetails = [
                ['Route:', details.route_name],
                ['Trip Time:', details.trip_type],
                ['Date:', new Intl.DateTimeFormat('en-GB', { dateStyle: 'short' }).format(new Date(details.trip_date))],
                ['Seats Booked:', details.seats_booked],
                ['Price per Seat:', `${details.price_per_seat} EGP`],
                ['Total Amount:', `${details.total_amount} EGP`],
                ['Ticket Number:', details.order_id],
                ['Driver Mobile:', details.driver_mobile || 'N/A'],
            ];

            doc.moveDown(0.5).fillColor('black').fontSize(12);
            let yPosition = tripSectionYStart + 40;
            tripDetails.forEach(([label, value]) => {
                doc.text(label, 60, yPosition, { continued: true }).text(` ${value}`);
                yPosition += 25; // Increment position to prevent overlap
            });

            // Footer
            doc.moveDown(4);
            doc.fillColor(maroon).fontSize(10).text(
                'Thank you for booking with us!',
                { align: 'center', baseline: 'bottom' }
            );
            doc.fontSize(10).fillColor('black').text(
                'For support, contact us at XXXXXX@XXXX.XXX or 01XXXXXXXX',
                { align: 'center' }
            );

            // Finalize the PDF
            doc.end();

            stream.on('finish', () => resolve(filePath));
            stream.on('error', error => {
                doc.end();
                reject(error);
            });
        } catch (error) {
            reject(error);
        }
    });
}

router.get('/tickets/:orderId', (req, res) => {
    const { orderId } = req.params;
    const ticketPath = path.join(__dirname, '../../frontend/assets/tickets', `${orderId}.pdf`);

    if (fs.existsSync(ticketPath)) {
        res.download(ticketPath); // Offer the file as a download
    } else {
        res.status(404).json({ message: 'Ticket not found' });
    }
});



module.exports = router;
module.exports.generateTicket = generateTicket;