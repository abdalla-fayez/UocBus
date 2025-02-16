const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('./models/dbconnection'); // adjust the path if needed

// Serve the admin login page
router.get('/login', (req, res) => {
  // This will serve the login page at /api/admin/login
  res.redirect('https://busticketing.uofcanada.edu.eg/admin/adminLogin.html');
});

// Process login using plain-text password comparison
router.post('/login', express.urlencoded({ extended: true }), async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.query("SELECT * FROM admin_users WHERE username = ?", [username]);
    const adminUser = rows[0]; // extract first result
    if (adminUser && password === adminUser.password) {
      // Set session for authenticated admin user
      req.session.adminUser = {
        id: adminUser.id,
        username: adminUser.username
      };
      // Redirect to the dashboard page (use the absolute URL as needed)
      return res.redirect('https://busticketing.uofcanada.edu.eg/admin/admindashboard.html');
    } else {
      return res.status(401).send('Invalid username or password.');
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send('Internal Server Error');
  }
});

// Logout route
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) console.error(err);
    // Relative redirect: sends the user to /api/admin/login
    res.redirect('login');
  });
});

// Endpoint to check if an admin user is authenticated
router.get('/check-auth', (req, res) => {
    if (req.session && req.session.adminUser) {
      res.status(200).json({ authenticated: true });
    } else {
      res.status(401).json({ authenticated: false });
    }
  });

module.exports = router;
