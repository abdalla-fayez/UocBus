const mysql = require('mysql2');
const schedule = require('node-schedule');

// Database connection setup
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Your database username
    password: '', // Your database password
    database: 'bus_ticketing', // Your database name
});

// Function to archive past trips then delete them
const archiveTrips = (callback) => {
    const archiveQuery = `
        INSERT INTO archived_trips (bus_id, route_id, trip_date, available_seats)
        SELECT bus_id, route_id, trip_date, available_seats FROM trips WHERE trip_date < CURDATE();
    `;
    const deleteQuery = `DELETE FROM trips WHERE trip_date < CURDATE();`;

    db.query(archiveQuery, (err) => {
        if (err) {
            console.error('Failed to archive trips:', err);
            callback(err);
        } else {
            console.log('Past trips archived successfully.');
            db.query(deleteQuery, (delErr) => {
                if (delErr) {
                    console.error('Failed to delete past trips:', delErr);
                    callback(delErr);
                } else {
                    console.log('Past trips deleted successfully.');
                    callback(null);
                }
            });
        }
    });
};

// Function to generate trips for the next 30 days
const generateTrips = (callback) => {
    // Create the temporary table
    db.query(
        `CREATE TEMPORARY TABLE IF NOT EXISTS temp_days (day INT);`,
        (err) => {
            if (err) {
                console.error('Failed to create temporary table:', err);
                callback(err);
                return;
            }

            console.log('Temporary table created.');

            // Insert values into the temporary table
            db.query(
                `INSERT INTO temp_days (day)
                 VALUES (0), (1), (2), (3), (4), (5), (6), (7), (8), (9),
                        (10), (11), (12), (13), (14), (15), (16), (17), (18), (19),
                        (20), (21), (22), (23), (24), (25), (26), (27), (28), (29);`,
                (insertErr) => {
                    if (insertErr) {
                        console.error('Failed to insert into temporary table:', insertErr);
                        callback(insertErr);
                        return;
                    }

                    console.log('Values inserted into temporary table.');

                    // Generate trips using the temporary table
                    db.query(
                        `INSERT INTO trips (bus_id, route_id, trip_date, available_seats, name)
                         SELECT routes.bus_id, routes.id, DATE_ADD(CURDATE(), INTERVAL CAST(temp_days.day AS UNSIGNED) DAY) AS trip_date,
                                buses.capacity, routes.name
                         FROM routes
                         JOIN buses ON routes.bus_id = buses.id
                         JOIN temp_days
                         WHERE DAYOFWEEK(DATE_ADD(CURDATE(), INTERVAL CAST(temp_days.day AS UNSIGNED) DAY)) NOT IN (6, 7)
                         AND routes.trip_type IN ('morning', 'afternoon');`,
                        (insertTripsErr) => {
                            if (insertTripsErr) {
                                console.error('Failed to generate trips:', insertTripsErr);
                                callback(insertTripsErr);
                                return;
                            }
                    
                            console.log('Trips generated successfully.');
                            // Drop the temporary table
                            db.query(`DROP TEMPORARY TABLE IF EXISTS temp_days;`, (dropErr) => {
                                if (dropErr) {
                                    console.error('Failed to drop temporary table:', dropErr);
                                    callback(dropErr);
                                    return;
                                }
                    
                                console.log('Temporary table dropped.');
                                callback(null); // Success
                            });
                        }
                    );                                        
                }
            );
        }
    );
};


// Automate trip generation and archiving
const automateTrips = () => {
    archiveTrips((err) => {
        if (!err) {
            generateTrips((genErr) => {
                if (genErr) {
                    console.error('Automation failed during trip generation.');
                } else {
                    console.log('Automation completed successfully.');
                }
                db.end(); // Close the connection only after all operations
            });
        } else {
            console.error('Automation failed during archiving.');
            db.end(); // Close the connection even if archiving fails
        }
    });
};

// Schedule the automation to run daily at midnight
schedule.scheduleJob('0 0 * * *', () => {
    console.log('Running daily trip automation...');
    automateTrips();
});

// Run the automation once for immediate testing
automateTrips();
