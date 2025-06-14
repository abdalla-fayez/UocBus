const express = require('express');
const router = express.Router();
const db = require('./models/dbconnection'); // DB connection module
const { logAdminAction } = require('./adminLogger');
const { Parser } = require('json2csv');
const checkPermission = require('./middleware/checkPermission');

/* ============
   BUSES CRUD
   ============ */

// Get all buses (read-only, no logging)
router.get('/buses', checkPermission(['manage_buses', 'view_buses', 'manage_routes']), async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM buses ORDER BY name');
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new bus
router.post('/buses', checkPermission('manage_buses'), async (req, res) => {
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
router.put('/buses/:id', checkPermission('manage_buses'), async (req, res) => {
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
router.delete('/buses/:id', checkPermission('manage_buses'), async (req, res) => {
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
router.get('/routes', checkPermission(['manage_routes', 'view_routes', 'manage_pickup_points']), async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT r.*, b.name as bus_name 
      FROM routes r
      LEFT JOIN buses b ON r.bus_id = b.id 
      ORDER BY r.route_name
    `);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new route  
router.post('/routes', checkPermission('manage_routes'), async (req, res) => {
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
router.put('/routes/:id', checkPermission('manage_routes'), async (req, res) => {
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
router.delete('/routes/:id', checkPermission('manage_routes'), async (req, res) => {
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
router.get('/pickup_points', checkPermission(['manage_pickup_points', 'view_pickup_points', ]), async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM pickup_points ORDER BY time');
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new pickup point
router.post('/pickup_points', checkPermission('manage_pickup_points'), async (req, res) => {
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
router.put('/pickup_points/:id', checkPermission('manage_pickup_points'), async (req, res) => {
  try {
    const { route_id, name, time, route_name, trip_type } = req.body;
    const [existingPoint] = await db.query('SELECT * FROM pickup_points WHERE id = ?', [req.params.id]);
    if (!existingPoint || existingPoint.length === 0) {
      return res.status(404).json({ error: 'Pickup point not found' });
    }
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
router.delete('/pickup_points/:id', checkPermission('manage_pickup_points'), async (req, res) => {
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
router.get('/dashboard/bookings', checkPermission('view_bookings'), async (req, res) => {
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
router.get('/dashboard/trips', checkPermission('view_bookings'), async (req, res) => {
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
router.get('/other/trip-automation-status', checkPermission('manage_automation'), async (req, res) => {
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
router.post('/other/toggle-trip-automation', checkPermission('manage_automation'), async (req, res) => {
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
      { previousStatus: currentStatus, newStatus: newStatus ? 'ENABLED' : 'DISABLED' },
      { timestamp: new Date().toISOString() }
    );
    
    res.json({ enabled: newStatus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Manually trigger trip generation
router.post('/other/manual-trip-generation', checkPermission('manage_automation'), async (req, res) => {
  try {
    // Call the Trip_Creation stored procedure
    await db.query('CALL Trip_Creation()');
    
    // Log the manual trip generation action
    logAdminAction(
      req.session.adminUser,
      'MANUAL TRIP GENERATION',
      { timestamp: new Date().toISOString() }
    );
    
    res.json({ success: true, message: 'Trip generation completed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get ticket allowance config
router.get('/config/ticket-allowance', checkPermission('manage_system_config'), async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT config_value FROM system_config WHERE config_key = ?', 
      ['max_ticket_allowance']
    );
    
    if (rows.length > 0) {
      res.json({ value: parseInt(rows[0].config_value) });
    } else {
      res.status(404).json({ error: "Configuration not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update ticket allowance config
router.put('/config/ticket-allowance', checkPermission('manage_system_config'), async (req, res) => {
  try {
    const { value } = req.body;
    
    if (!Number.isInteger(value) || value < 1) {
      return res.status(400).json({ error: "Value must be a positive integer" });
    }

    await db.query(
      'UPDATE system_config SET config_value = ? WHERE config_key = ?',
      [value.toString(), 'max_ticket_allowance']
    );

    logAdminAction(
      req.session.adminUser,
      'UPDATE TICKET ALLOWANCE',
      { old_value: (await db.query('SELECT config_value FROM system_config WHERE config_key = ?', ['max_ticket_allowance']))[0][0]?.config_value, new_value: value.toString() },
      { timestamp: new Date().toISOString() }
    );

    res.json({ message: 'Ticket allowance updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset bookings counter for all users
router.post('/config/reset-bookings-counter', checkPermission('manage_system_config'), async (req, res) => {
  try {
    // Call the Reset_Bookings_Counter stored procedure
    await db.query('CALL Reset_Bookings_Counter()');
    
    // Log the reset action
    logAdminAction(
      req.session.adminUser,
      'RESET BOOKINGS COUNTER',
      { timestamp: new Date().toISOString() }
    );
    
    res.json({ message: 'Bookings counter reset successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* =======================
    REPORTS GENERATION
    ======================= */

// Generate payments report
router.get('/dailypaymentsreport', checkPermission('generate_reports_finance'), async (req, res) => {
  try {
    const fromDate = req.query.fromDate;
    const toDate = req.query.toDate;
    
    if (!fromDate || !toDate) {
      return res.status(400).json({ error: 'Both fromDate and toDate parameters are required (format: YYYY-MM-DD)' });
    }
    
    const [results] = await db.query(`
      SELECT 
        b.student_email AS Student_Email,
        b.student_id AS Student_ID,
        b.student_name AS Student_Name,
        COALESCE(DATE_FORMAT(b.created_at, '%Y-%m-%d'), 'N/A') AS Payment_Date,
        p.amount AS Total_Amount,
        p.status AS Payment_Status,
        b.order_id AS Ticket_ID,
        p.seats_booked AS Seats_Booked,
        COALESCE(t.route_name, 'N/A') AS Route_Name,
        COALESCE(t.trip_type, 'N/A') AS Trip_Type,
        COALESCE(DATE_FORMAT(t.trip_date, '%Y-%m-%d'), 'N/A') AS Trip_Date
      FROM bookings b
      LEFT JOIN payments p ON b.order_id = p.order_id
      LEFT JOIN trips t ON p.trip_id = t.id      WHERE 
      p.status = 'SUCCESS' 
      AND
      DATE(b.created_at) BETWEEN ? AND ?
      ORDER BY b.created_at ASC
    `, [fromDate, toDate]);
    
    // Check if there are no results
    if (results.length === 0) {
      return res.status(200).json({ message: "There are no payments for this date." });
    }
      // Generate CSV if data is available
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(results);
    
    res.header('Content-Type', 'text/csv');
    res.attachment(`payments-report-${fromDate}-to-${toDate}.csv`);
    return res.send(csv);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Generate bookings report
router.get('/dailybookingsreport', checkPermission('generate_reports_fleet'), async (req, res) => {
  try {
    const fromDate = req.query.fromDate;
    const toDate = req.query.toDate;
    
    if (!fromDate || !toDate) {
      return res.status(400).json({ error: 'Both fromDate and toDate parameters are required (format: YYYY-MM-DD)' });
    }
    
    const [results] = await db.query(`
      SELECT 
        b.student_email AS Student_Email,
        b.student_id AS Student_ID,
        b.student_name AS Student_Name,
        COALESCE(DATE_FORMAT(b.created_at, '%Y-%m-%d'), 'N/A') AS Payment_Date,
        p.amount AS Total_Amount,
        p.status AS Payment_Status,
        b.order_id AS Ticket_ID,
        p.seats_booked AS Seats_Booked,
        COALESCE(t.route_name, 'N/A') AS Route_Name,
        COALESCE(t.trip_type, 'N/A') AS Trip_Type,
        COALESCE(DATE_FORMAT(t.trip_date, '%Y-%m-%d'), 'N/A') AS Trip_Date
      FROM bookings b
      LEFT JOIN payments p ON b.order_id = p.order_id
      LEFT JOIN trips t ON p.trip_id = t.id      WHERE 
      p.status = 'SUCCESS' 
      AND
      DATE(t.trip_date) BETWEEN ? AND ?
      ORDER BY t.trip_date ASC, t.route_name ASC
    `, [fromDate, toDate]);
    
    // Check if there are no results
    if (results.length === 0) {
      return res.status(200).json({ message: "There are no bookings for this date." });
    }
      // Generate CSV if data is available
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(results);
    
    res.header('Content-Type', 'text/csv');
    res.attachment(`bookings-report-${fromDate}-to-${toDate}.csv`);
    return res.send(csv);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/* =======================
    PICKUP POINTS CRUD
    ======================= */

// Export pickup points as CSV template
router.get('/pickup_points/export', checkPermission('manage_pickup_points'), async (req, res) => {
  try {
    // Get pickup points with reordered columns
    const [results] = await db.query(`
      SELECT pp.name, r.trip_type, pp.time, r.route_name
      FROM pickup_points pp
      JOIN routes r ON pp.route_id = r.id
      WHERE r.status = 'Active'
      ORDER BY r.route_name, r.trip_type, pp.time`);
    
    // Get unique route names first
    const routeNames = [...new Set(results.map(r => r.route_name))].sort();
    
    // Group the results
    const grouped = results.reduce((acc, curr) => {
      const key = `${curr.route_name}-${curr.trip_type}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(curr);
      return acc;
    }, {});
    
    // Create CSV with new column order
    let csvContent = '"name","trip_type","time","route_name"\n\n';
    
    routeNames.forEach(routeName => {
      // First add "To Campus" points
      const toKey = `${routeName}-To Campus`;
      if (grouped[toKey]) {
        csvContent += `"# ${routeName} - To Campus"\n`;
        grouped[toKey].forEach(point => {
          csvContent += `${point.name},${point.trip_type},${point.time},${point.route_name}\n`;
        });
        csvContent += '\n';
      }

      // Then add "From Campus" points
      const fromKey = `${routeName}-From Campus`;
      if (grouped[fromKey]) {
        csvContent += `"# ${routeName} - From Campus"\n`;
        grouped[fromKey].forEach(point => {
          csvContent += `${point.name},${point.trip_type},${point.time},${point.route_name}\n`;
        });
        csvContent += '\n';
      }

      csvContent += '\n';
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('pickup-points-template.csv');
    return res.send(csvContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Import pickup points from CSV
router.post('/pickup_points/import', checkPermission('manage_pickup_points'), async (req, res) => {
  try {
    if (!req.files) {
      return res.status(400).json({ error: 'No file was uploaded' });
    }
    
    const csvFile = req.files.csv;
    if (!csvFile) {
      return res.status(400).json({ error: 'CSV file is required. Please select a file named "csv"' });
    }

    if (!csvFile.name.endsWith('.csv')) {
      return res.status(400).json({ error: 'Uploaded file must be a CSV file' });
    }

    const fileContent = csvFile.data.toString('utf8');
    // Split by newlines and filter out empty lines and comments
    const rows = fileContent.split('\n')
      .map(row => row.trim())
      .filter(row => row && !row.startsWith('#'))  // Remove empty lines and comments
      .map(row => row.split(','));

    const headers = rows[0];
    const data = rows.slice(1);

    // Start transaction
    await db.query('START TRANSACTION');

    // Track changes for logging
    const changes = { 
      added: [], 
      updated: [], 
      deleted: [],
      unchanged: 0  // Track points that didn't need updating
    };
    const processedPoints = new Set();

    // First, get all routes for quick lookup
    const [routes] = await db.query('SELECT id, route_name, trip_type FROM routes');
    const routeMap = new Map(routes.map(r => [`${r.route_name}-${r.trip_type}`, r.id]));

    for (const row of data) {
      if (row.length < headers.length) continue;

      const pointName = row[0].trim();
      const tripType = row[1].trim();
      const time = row[2].trim();
      const routeName = row[3].trim();

      const routeId = routeMap.get(`${routeName}-${tripType}`);
      if (!routeId) {
        console.warn(`Route not found: ${routeName} (${tripType})`);
        continue;
      }

      const pointKey = `${routeId}-${pointName}`;
      processedPoints.add(pointKey);

      // Check if point exists
      const [existing] = await db.query(
        'SELECT * FROM pickup_points WHERE route_id = ? AND name = ?', 
        [routeId, pointName]
      );

      if (existing.length > 0) {
        // Normalize times to HH:mm:ss format for comparison
        const normalizeTime = (time) => {
          // Handle both HH:mm and H:mm formats
          const [hours, minutes] = time.split(':').map(n => parseInt(n));
          return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
        };

        const existingTime = normalizeTime(existing[0].time);
        const newTime = normalizeTime(time);

        if (existingTime !== newTime) {
          await db.query(
            'UPDATE pickup_points SET time = ? WHERE route_id = ? AND name = ?',
            [newTime, routeId, pointName]
          );
          changes.updated.push({ 
            route_name: routeName, 
            trip_type: tripType, 
            name: pointName, 
            old_time: existingTime,
            new_time: newTime 
          });
        } else {
          changes.unchanged++;
        }
      } else {
        // Add new point
        const normalizedTime = time.split(':')
          .map(n => parseInt(n).toString().padStart(2, '0'))
          .join(':') + ':00';

        await db.query(
          'INSERT INTO pickup_points (route_id, name, time, route_name, trip_type) VALUES (?, ?, ?, ?, ?)',
          [routeId, pointName, time, routeName, tripType]
        );
        changes.added.push({ route_name: routeName, trip_type: tripType, name: pointName, time });
      }
    }

    // Delete points that weren't in the CSV
    const [allPoints] = await db.query('SELECT * FROM pickup_points');
    for (const point of allPoints) {
      const pointKey = `${point.route_id}-${point.name}`;
      if (!processedPoints.has(pointKey)) {
        await db.query('DELETE FROM pickup_points WHERE route_id = ? AND name = ?', 
          [point.route_id, point.name]);
        changes.deleted.push(point);
      }
    }

    await db.query('COMMIT');
    logAdminAction(req.session.adminUser, 'BULK UPDATE PICKUP POINTS', changes);
    
    res.json({
      message: 'Import completed successfully',
      summary: {
        added: changes.added.length,
        updated: changes.updated.length,
        unchanged: changes.unchanged,
        deleted: changes.deleted.length
      }
    });
  } catch (err) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// Get user permissions endpoint
router.get('/permissions', async (req, res) => {
    try {
        if (!req.session.adminUser) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const [permissions] = await db.query(`
            SELECT 
                r.role_name,
                GROUP_CONCAT(p.permission_name) as permissions
            FROM admin_users u
            JOIN admin_roles r ON u.role_id = r.id
            JOIN role_permissions rp ON r.id = rp.role_id
            JOIN admin_permissions p ON rp.permission_id = p.id
            WHERE u.id = ?
            GROUP BY r.role_name
        `, [req.session.adminUser.id]);

        res.json({
            role: permissions[0]?.role_name,
            permissions: permissions[0]?.permissions.split(',') || []
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Export the router
module.exports = router;
