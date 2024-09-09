require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2');
const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Set EJS as templating engine
app.set('view engine', 'ejs');

// MySQL Database Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the database');
});

// Helper function to authenticate using JWT
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).send('Access Denied');

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send('Invalid Token');
    req.user = user;
    next();
  });
};

// User Registration Route
app.post('/register', (req, res) => {
  const { username, email, password, role } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 8);

  const query = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)';
  db.query(query, [username, email, hashedPassword, role], (err, result) => {
    if (err) return res.status(500).send('Error registering user');
    res.status(201).send('User registered successfully');
  });
});

// User Login Route
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const query = 'SELECT * FROM users WHERE email = ?';
  
  db.query(query, [email], (err, results) => {
    if (err) return res.status(500).send('Error on the server');
    if (results.length === 0) return res.status(404).send('No user found');
    
    const user = results[0];
    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) return res.status(401).send('Invalid password');

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: 86400 });
    res.status(200).send({ auth: true, token: token });
  });
});

// Get All Products Route
app.get('/products', (req, res) => {
  const query = 'SELECT * FROM products';
  db.query(query, (err, results) => {
    if (err) return res.status(500).send('Error fetching products');
    res.status(200).json(results);
  });
});

// Cart Routes
app.post('/cart/add', authenticateToken, (req, res) => {
  const { product_id, quantity } = req.body;
  const query = 'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)';
  
  db.query(query, [req.user.id, product_id, quantity], (err, result) => {
    if (err) return res.status(500).send('Error adding to cart');
    res.status(201).send('Item added to cart');
  });
});

app.get('/cart', authenticateToken, (req, res) => {
  const query = 'SELECT * FROM cart WHERE user_id = ?';
  
  db.query(query, [req.user.id], (err, results) => {
    if (err) return res.status(500).send('Error fetching cart items');
    res.status(200).json(results);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
