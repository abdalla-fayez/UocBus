const express = require('express');
const router = express.Router();
const db = require('./models/dbconnection'); // DB connection module
const { logAdminAction } = require('./adminLogger');

/* ============
   BUSES CRUD
   ============ */

// Get all buses (read-only, no logging)
router.get('/buses', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM buses');
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new bus
router.post('/buses', async (req, res) => {
  try {
    const { name, vacant_seats, driver_mobile } = req.body;
    const sql = 'INSERT INTO buses (name, vacant_seats, driver_mobile) VALUES (?, ?, ?)';
    const [result] = await db.query(sql, [name, vacant_seats, driver_mobile]);
    const newBus = { id: result.insertId, name, vacant_seats, driver_mobile };
    logAdminAction(req.session.adminUser, 'CREATE BUS', newBus);
    res.json(newBus);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a bus
router.put('/buses/:id', async (req, res) => {
  try {
    const { name, vacant_seats, driver_mobile } = req.body;
    const sql = 'UPDATE buses SET name=?, vacant_seats=?, driver_mobile=? WHERE id=?';
    await db.query(sql, [name, vacant_seats, driver_mobile, req.params.id]);
    const updatedBus = { id: req.params.id, name, vacant_seats, driver_mobile };
    logAdminAction(req.session.adminUser, 'UPDATE BUS', updatedBus);
    res.json({ message: 'Bus updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a bus
router.delete('/buses/:id', async (req, res) => {
  try {
    // Optionally fetch the bus before deleting for logging purposes
    const [busRows] = await db.query('SELECT * FROM buses WHERE id=?', [req.params.id]);
    await db.query('DELETE FROM buses WHERE id=?', [req.params.id]);
    const deletedBus = busRows[0] || { id: req.params.id };
    logAdminAction(req.session.adminUser, 'DELETE BUS', deletedBus);
    res.json({ message: 'Bus deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============
    ROUTES CRUD
    ============ */

// Get all routes (read-only, no logging)
router.get('/routes', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM routes');
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new route  
router.post('/routes', async (req, res) => {
  try {
    const { price, trip_type, bus_id, route_name, time, status } = req.body;
    const sql = 'INSERT INTO routes (price, trip_type, bus_id, route_name, time, status) VALUES (?, ?, ?, ?, ?, ?)';
    const [result] = await db.query(sql, [price, trip_type, bus_id, route_name, time, status || 'Active']);
    const newRoute = { id: result.insertId, price, trip_type, bus_id, route_name, time, status: status || 'Active' };
    logAdminAction(req.session.adminUser, 'CREATE ROUTE', newRoute);
    res.json(newRoute);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a route
router.put('/routes/:id', async (req, res) => {
  try {
    const { price, trip_type, bus_id, route_name, time, status } = req.body;
    const sql = 'UPDATE routes SET price=?, trip_type=?, bus_id=?, route_name=?, time=?, status=? WHERE id=?';
    await db.query(sql, [price, trip_type, bus_id, route_name, time, status, req.params.id]);
    const updatedRoute = { id: req.params.id, price, trip_type, bus_id, route_name, time, status };
    logAdminAction(req.session.adminUser, 'UPDATE ROUTE', updatedRoute);
    res.json({ message: 'Route updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a route
router.delete('/routes/:id', async (req, res) => {
  try {
    const [routeRows] = await db.query('SELECT * FROM routes WHERE id=?', [req.params.id]);
    await db.query('DELETE FROM routes WHERE id=?', [req.params.id]);
    const deletedRoute = routeRows[0] || { id: req.params.id };
    logAdminAction(req.session.adminUser, 'DELETE ROUTE', deletedRoute);
    res.json({ message: 'Route deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =======================
    PICKUP POINTS CRUD
    ======================= */

// Get all pickup points (read-only)
router.get('/pickup_points', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM pickup_points');
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new pickup point
router.post('/pickup_points', async (req, res) => {
  try {
    const { route_id, name, time, route_name, trip_type } = req.body;
    const sql = 'INSERT INTO pickup_points (route_id, name, time, route_name, trip_type) VALUES (?, ?, ?, ?, ?)';
    const [result] = await db.query(sql, [route_id, name, time, route_name, trip_type]);
    const newPickupPoint = { id: result.insertId, route_id, name, time, route_name, trip_type };
    logAdminAction(req.session.adminUser, 'CREATE PICKUP POINT', newPickupPoint);
    res.json(newPickupPoint);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a pickup point
router.put('/pickup_points/:id', async (req, res) => {
  try {
    const { route_id, name, time, route_name, trip_type } = req.body;
    const sql = 'UPDATE pickup_points SET route_id=?, name=?, time=?, route_name=?, trip_type=? WHERE id=?';
    await db.query(sql, [route_id, name, time, route_name, trip_type, req.params.id]);
    const updatedPickupPoint = { id: req.params.id, route_id, name, time, route_name, trip_type };
    logAdminAction(req.session.adminUser, 'UPDATE PICKUP POINT', updatedPickupPoint);
    res.json({ message: 'Pickup point updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a pickup point
router.delete('/pickup_points/:id', async (req, res) => {
  try {
    const [pickupRows] = await db.query('SELECT * FROM pickup_points WHERE id=?', [req.params.id]);
    await db.query('DELETE FROM pickup_points WHERE id=?', [req.params.id]);
    const deletedPickupPoint = pickupRows[0] || { id: req.params.id };
    logAdminAction(req.session.adminUser, 'DELETE PICKUP POINT', deletedPickupPoint);
    res.json({ message: 'Pickup point deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =======================
    DASHBOARD VIEWS (Read-Only)
    ======================= */

// Get all bookings with extra info from payments and trips
router.get('/dashboard/bookings', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        b.id,
        b.student_name,
        b.student_id,
        b.student_email,
        b.order_id,
        b.created_at,
        p.status AS payment_status,
        p.seats_booked,
        COALESCE(DATE_FORMAT(t.trip_date, '%Y-%m-%d'), 'N/A') AS trip_date,
        COALESCE(t.route_name, 'N/A') AS route_name,
        COALESCE(t.trip_type, 'N/A') AS trip_type
      FROM bookings b
      LEFT JOIN payments p ON b.order_id = p.order_id
      LEFT JOIN trips t ON p.trip_id = t.id;
    `);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
  
// Dashboard: Get upcoming trips (only trips that have not yet passed)
router.get('/dashboard/trips', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT * FROM trips
      WHERE (trip_date > CURDATE())
         OR (trip_date = CURDATE() AND trip_time > CURTIME())
    `);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
  
// Get the current status of the Trip_Automation event
router.get('/other/trip-automation-status', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT STATUS 
      FROM information_schema.EVENTS 
      WHERE EVENT_NAME = 'Trip_Automation'
        AND EVENT_SCHEMA = 'bus_ticketing'
    `);
    
    if (rows.length > 0) {
      const status = rows[0].STATUS;
      const enabled = status === 'ENABLED';
      res.json({ enabled });
    } else {
      res.status(404).json({ error: "Trip_Automation event not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
  
// Toggle the Trip_Automation event (enable if disabled, disable if enabled)
router.post('/other/toggle-trip-automation', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT STATUS 
      FROM information_schema.EVENTS 
      WHERE EVENT_NAME = 'Trip_Automation'
        AND EVENT_SCHEMA = 'bus_ticketing'
    `);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: "Trip_Automation event not found" });
    }
    
    const currentStatus = rows[0].STATUS;
    let newStatus;
    
    if (currentStatus === 'ENABLED') {
      await db.query(`ALTER EVENT Trip_Automation DISABLE;`);
      newStatus = false;
    } else {
      await db.query(`ALTER EVENT Trip_Automation ENABLE;`);
      newStatus = true;
    }
    
    // Log the toggle action with detailed information
    logAdminAction(
      req.session.adminUser,
      'TOGGLE TRIP AUTOMATION',
      { previousStatus: currentStatus, newStatus: newStatus ? 'ENABLED' : 'DISABLED' }
    );
    
    res.json({ enabled: newStatus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
  
module.exports = router;
