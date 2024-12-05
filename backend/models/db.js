const mysql = require('mysql2');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

let connection;

// Function to establish a MySQL connection
function handleDisconnect() {
    connection = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
    });

    // Handle connection errors
    connection.connect(err => {
        if (err) {
            console.error('Error connecting to MySQL:', err);
            setTimeout(handleDisconnect, 2000); // Retry after 2 seconds
        } else {
            console.log('Connected to MySQL!');
        }
    });

    // Re-establish connection on disconnect
    connection.on('error', err => {
        console.error('MySQL error:', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect(); // Reconnect on connection loss
        } else {
            throw err;
        }
    });
}

// Initialize the connection
handleDisconnect();

module.exports = connection;
