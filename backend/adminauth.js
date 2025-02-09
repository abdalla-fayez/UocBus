const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('./models/dbconnection'); // adjust the path if needed


// Render a simple login page for admin (assuming you serve HTML from here)
router.get('/admin/login', (req, res) => {
  // You can render a view or send HTML directly; for now, we'll send simple HTML:
  res.send(`
    <form method="POST" action="/admin/login">
      <input name="username" placeholder="Username" required/>
      <input name="password" type="password" placeholder="Password" required/>
      <button type="submit">Login</button>
    </form>
  `);
});

// Process login
router.post('/admin/login', express.urlencoded({ extended: true }), async (req, res) => {
  const { username, password } = req.body;
  try {
    const [adminUser] = await db.query("SELECT * FROM admin_users WHERE username = ?", [username]);
    
    // Check if a user was found and if the password matches
    if (adminUser && await bcrypt.compare(password, adminUser.password_hash)) {
      // Set session
      req.session.adminUser = {
        id: adminUser.id,
        username: adminUser.username
      };
      return res.redirect('/api/admin/dashboard');
    } else {
      return res.send('Invalid username or password.');
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send('Internal Server Error');
  }
});

// Middleware to protect admin routes
function adminAuthMiddleware(req, res, next) {
  if (req.session && req.session.adminUser) {
    next();
  } else {
    res.redirect('/api/admin/login');
  }
}

// Example of a protected route (admin dashboard)
router.get('/admin/dashboard', adminAuthMiddleware, (req, res) => {
  res.send(`Welcome, ${req.session.adminUser.username}. This is the admin dashboard.`);
});

// Logout route
router.get('/api/admin/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error(err);
    }
    res.redirect('/api/admin/login');
  });
});

module.exports = router;
