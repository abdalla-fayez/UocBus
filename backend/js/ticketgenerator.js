const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');


async function generateTicket(details, filePath) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument();

            // Pipe the PDF into a file
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Add ticket content
            doc.fontSize(20).text('Bus Ticket', { align: 'center' });
            doc.moveDown();

            doc.fontSize(14).text(`Name: ${details.student_name}`);
            doc.text(`Student ID: ${details.student_id}`);
            doc.text(`Email: ${details.student_email}`);
            doc.text(`Mobile: ${details.student_mobile_no}`);
            doc.moveDown();

            doc.text(`From: ${details.from}`);
            doc.text(`To: ${details.to}`);
            doc.text(`Date: ${new Intl.DateTimeFormat('en-GB', { dateStyle: 'short' }).format(new Date(details.trip_date))}`);
            doc.text(`Seats Booked: ${details.seats_booked}`);
            doc.text(`Price per Seat: ${details.price_per_seat} EGP`);
            doc.text(`Total Amount: ${details.total_amount} EGP`);
            doc.text(`Ticket Number: ${details.order_id}`);
            doc.moveDown();

            doc.text('Thank you for booking with us!', { align: 'center' });

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