const path = require('path');
const { generateTicket } = require('./ticketgenerator.js'); // Adjust path as needed
const logger = require(`${__basedir}/backend/logger`);

// Sample data for testing
const sampleDetails = {
    student_name: "John Doe",
    student_id: "123456",
    student_email: "johndoe@example.com",
    student_mobile_no: "0123456789",
    from: "New Cairo Campus",
    to: "Giza Campus",
    trip_date: "2024-01-15",
    seats_booked: 2,
    price_per_seat: 50,
    total_amount: 100,
    order_id: "TICK12345",
    driver_mobile: "0100000000",
};

// File path where the ticket will be saved
const outputFilePath = path.join(__dirname, 'ticket.pdf');

// Run the function
generateTicket(sampleDetails, outputFilePath)
    .then((filePath) => {
        logger.info(`Ticket generated successfully! File saved at: ${filePath}`);
    })
    .catch((error) => {
        console.error("Error generating ticket:", error);
    });
