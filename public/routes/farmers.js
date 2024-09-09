const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const authenticateToken = require('../middleware/authenticateToken'); // Assuming you have a separate middleware file for authentication

// MySQL Database Connection
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Route to Get Farmer's Listings
router.get('/my-listings', authenticateToken, async (req, res) => {
  if (req.user.role !== 'farmer') return res.status(403).send('Access denied');

  try {
    const [listings] = await db.query('SELECT * FROM products WHERE farmer_id = ?', [req.user.id]);
    res.status(200).json(listings);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching your listings');
  }
});

// Route to Add a New Listing
router.post('/add-listing', authenticateToken, async (req, res) => {
  if (req.user.role !== 'farmer') return res.status(403).send('Access denied');

  const { name, description, category, price, location, image, grade } = req.body;
  try {
    const query = 'INSERT INTO products (farmer_id, name, description, category, price, location, image, grade) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    await db.query(query, [req.user.id, name, description, category, price, location, image, grade]);
    res.status(201).send('Listing added successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error adding the listing');
  }
});

// Route to Get Farmer's Sales Data
router.get('/sales', authenticateToken, async (req, res) => {
  if (req.user.role !== 'farmer') return res.status(403).send('Access denied');

  try {
    const [sales] = await db.query(
      'SELECT orders.id, orders.product_id, orders.quantity, orders.total_price, orders.status, products.name AS product_name FROM orders INNER JOIN products ON orders.product_id = products.id WHERE products.farmer_id = ?',
      [req.user.id]
    );
    res.status(200).json(sales);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching sales data');
  }
});

// Route to Get Impending Orders
router.get('/impending-orders', authenticateToken, async (req, res) => {
  if (req.user.role !== 'farmer') return res.status(403).send('Access denied');

  try {
    const [orders] = await db.query(
      'SELECT orders.id, orders.product_id, orders.quantity, orders.total_price, orders.status, products.name AS product_name FROM orders INNER JOIN products ON orders.product_id = products.id WHERE products.farmer_id = ? AND orders.status = "pending"',
      [req.user.id]
    );
    res.status(200).json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching impending orders');
  }
});

// Route to Get Farmer's Wallet Data
router.get('/wallet', authenticateToken, async (req, res) => {
  if (req.user.role !== 'farmer') return res.status(403).send('Access denied');

  try {
    const [wallet] = await db.query(
      'SELECT SUM(orders.total_price) AS balance FROM orders INNER JOIN products ON orders.product_id = products.id WHERE products.farmer_id = ? AND orders.status = "completed"',
      [req.user.id]
    );
    res.status(200).json(wallet[0]); // Assuming only one row is returned
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching wallet data');
  }
});

module.exports = router;
