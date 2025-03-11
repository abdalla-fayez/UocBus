const path = require('path');
const { generateTicket } = require('./ticketgenerator.js'); // Adjust path as needed
// const logger = require(`${__basedir}/backend/logger`);

// Sample data for testing
const sampleDetails = {
    student_name: "V",
    student_id: "202477777",
    student_email: "V@uofcanada.edu.eg",
    route_name: "Night City",
    trip_type: "High Noon",
    trip_date: "2077-01-10",
    seats_booked: 1,
    price_per_seat: 50,
    total_amount: 100,
    order_id: "77-77777",
    driver_mobile: "0177777777",
};

// File path where the ticket will be saved
const outputFilePath = path.join(__dirname, 'ticket.pdf');

// Run the function
generateTicket(sampleDetails, outputFilePath)
    .then((filePath) => {
        console.log(`Test ticket generated successfully! File saved at: ${filePath}`);
    })
    .catch((error) => {
        console.error("Error generating ticket:", error);
    });
