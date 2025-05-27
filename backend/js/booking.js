const dotenv = require('dotenv');
const express = require('express');
const router = express.Router();
const db = require('../models/dbconnection'); //Database connection
dotenv.config();
const logger = require(`${__basedir}/backend/logger`);

// Get active route names
router.get('/routes/active', async (req, res) => {
    try {
        // Fetch distinct route names where status is 'Active', sorted alphabetically
        const [routes] = await db.query(`
            SELECT DISTINCT route_name 
            FROM routes 
            WHERE status = 'Active'
            ORDER BY route_name ASC
        `);

        const routeNames = routes.map(row => row.route_name);

        res.json({
            routes: routeNames
        });
    } catch (error) {
        logger.error('Error fetching active route names:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get trip types for a specific route
router.get('/routes/trip-types', async (req, res) => {
    try {
          const { routeName } = req.query; // Get the selected route name from query params

        // Fetch trip types for the selected route where status is 'Active'
        const [tripTypes] = await db.query(`
            SELECT DISTINCT trip_type 
            FROM routes 
            WHERE route_name = ? 
              AND status = 'Active'
        `, [routeName]);

        const tripTypesList = tripTypes.map(row => row.trip_type);

        res.json({
            tripTypes: tripTypesList
        });
    } catch (error) {
        logger.error('Error fetching trip types for route:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Fetch available trips with unified list of stops
router.get('/trips/available', async (req, res) => {
  const { route, tripType, date } = req.query;
  if (!route || !tripType || !date) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    // 1) Fetch all trips for this route+type+date
    const [tripRows] = await db.query(`
      SELECT
        t.id           AS tripId,
        t.trip_date,
        t.trip_time,
        t.available_seats,
        r.id           AS routeId,
        r.route_name,
        r.price,
        r.trip_type
      FROM trips AS t
      JOIN routes AS r
        ON t.route_id = r.id
      WHERE
        ((t.trip_date = CURDATE() AND t.trip_time >= CURTIME())
         OR (t.trip_date > CURDATE()))
        AND r.route_name      = ?
        AND r.trip_type       = ?
        AND t.trip_date       = ?
        AND t.available_seats > 0
        AND r.status          = 'Active'
      ORDER BY t.trip_date, t.trip_time
    `, [ route, tripType, date ]);

    if (tripRows.length === 0) {
      return res.json([]);
    }

    // 2) If From Campus, fetch its assigned stop + the To Campus stops
    let assignedStop = null;
    let toCampusStops = [];

    if (tripType === 'From Campus') {
      // a) assigned stop for this specific From-Campus route
      const [[{ name: asn, time: ast }]] = await db.query(`
        SELECT pp.name, pp.time
          FROM pickup_points pp
          WHERE pp.route_id = ?
            AND pp.name = 'U of Canada'
        LIMIT 1
      `, [ tripRows[0].routeId ]);
      assignedStop = { name: asn, time: ast };

      // b) all stops for the To Campus variant of this same route_name, excluding U of Canada
      const [tcRows] = await db.query(`
        SELECT pp.name, pp.time
          FROM routes r2
          JOIN pickup_points pp
            ON pp.route_id = r2.id
         WHERE r2.route_name = ?
           AND r2.trip_type  = 'To Campus'
           AND pp.name <> 'U of Canada'
      `, [ route ]);

      toCampusStops = tcRows
        .map(r => ({ name: r.name, time: r.time }))
        .sort((a, b) => b.time.localeCompare(a.time));  // descending
    }

    // 3) Now build each trip’s pickup_points
    const trips = tripRows.map(r => {
      const p = {
        id:              r.tripId,
        trip_date:       r.trip_date,
        trip_time:       r.trip_time,
        available_seats: r.available_seats,
        route_name:      r.route_name,
        price:           r.price,
        trip_type:       r.trip_type,
        pickup_points:   []
      };

      if (r.trip_type === 'From Campus') {
        // assigned first, then the sorted To-Campus stops
        if (assignedStop)     p.pickup_points.push(assignedStop);
        p.pickup_points.push(...toCampusStops);
      } else {
        // To Campus: fetch and sort that route’s stops ascending
        // (we could optimize by caching if many trips per day)
        p.pickup_points = [];  
      }

      return p;
    });

    // 4) For To Campus, fill in stops (one query per unique routeId)
    if (tripType === 'To Campus') {
      // grab all stops for this routeId, sorted ASC
      const routeId = tripRows[0].routeId;
      const [allStops] = await db.query(`
        SELECT name, time
          FROM pickup_points
         WHERE route_id = ?
         ORDER BY time ASC
      `, [ routeId ]);

      trips.forEach(t => {
        t.pickup_points = allStops.map(r => ({
          name: r.name,
          time: r.time
        }));
      });
    }

    res.json(trips);

  } catch (err) {
    logger.error('Error fetching trips:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/bookings/create', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: "User not authenticated" });
    }
    // Get user data from session
    const { displayName, email, jobTitle } = req.session.user;

    try {
        // Insert only student info and timestamp into the bookings table
        const [result] = await db.query(
            `INSERT INTO bookings (student_name, student_id, student_email, created_at)
             VALUES (?, ?, ?, NOW())`,
            [displayName, jobTitle, email]
        );

        // Save the booking ID in the session for further processing (e.g., linking order_id later)
        req.session.bookingId = result.insertId;

        logger.info(`Booking entry created with ID: ${result.insertId}`);

        res.json({ message: 'Booking details stored successfully.', bookingId: result.insertId });
    } catch (error) {
        logger.error('Error storing booking details:', error);
        res.status(500).json({ message: 'An error occurred while storing booking details.' });
    }
});

router.get('/bookings/details', async (req, res) => {
    const { orderId } = req.query;

    if (!orderId) {
        return res.status(400).json({ message: 'Missing orderId' });
    }

    try {
        const [details] = await db.query(`
            SELECT 
                b.student_name,
                b.student_email,
                b.student_id,
                r.route_name,
                r.trip_type,
                t.trip_date, 
                p.seats_booked, 
                p.amount AS total_amount, 
                p.order_id
            FROM bookings b
            JOIN payments p ON b.order_id = p.order_id
            JOIN trips t ON p.trip_id = t.id
            JOIN routes r ON t.route_id = r.id
            WHERE p.order_id = ?
        `, [orderId]);

        if (!details.length) {
            return res.status(404).json({ message: 'Booking details not found' });
        }

        res.json(details[0]);
    } catch (error) {
        logger.error('Error fetching booking details:', error);
        res.status(500).json({ message: 'Server error while fetching booking details' });
    }
});

router.get('/user/ticketsbooked', async (req, res) => {
    if (!req.session.user || !req.session.user.email) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const [rows] = await db.query(
        `SELECT tickets_booked FROM users WHERE student_email = ?`, 
        [req.session.user.email]
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ ticketsBooked: rows[0].tickets_booked });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});

router.get('/system/maxTicketAllowance', async (req, res) => {
    try {
      const [rows] = await db.query(
        "SELECT config_value FROM system_config WHERE config_key = 'max_ticket_allowance'"
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: "Global ticket allowance not set." });
      }
      // Convert the config_value to a number
      const maxTicketAllowance = Number(rows[0].config_value);
      res.json({ maxTicketAllowance });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});

module.exports = router;
