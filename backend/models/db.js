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
    }).promise(); // Wrap in promise interface

    connection.on('error', (err) => {
        console.error('Database error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect(); // Reconnect on disconnection
        }
    });

    console.log('Database connected');
}

handleDisconnect();

module.exports = connection;
