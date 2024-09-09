require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Set EJS as templating engine
app.set('view engine', 'ejs');

// MySQL Database Connection
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Helper function to authenticate using JWT
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ message: 'Access Denied' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid Token' });
    req.user = user;
    next();
  });
};

// User Registration Route
app.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 8);

  try {
    const query = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)';
    await db.execute(query, [username, email, hashedPassword, role]);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ message: 'Error registering user' });
  }
});

// User Login Route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [results] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (results.length === 0) return res.status(404).json({ message: 'No user found' });

    const user = results[0];
    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) return res.status(401).json({ message: 'Invalid password' });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.status(200).json({ auth: true, token });
  } catch (err) {
    console.error('Error on server:', err);
    res.status(500).json({ message: 'Error on the server' });
  }
});

// Get All Products Route
app.get('/products', async (req, res) => {
  try {
    const [results] = await db.execute('SELECT * FROM products');
    res.status(200).json(results);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// Add to Cart Route
app.post('/cart/add', authenticateToken, async (req, res) => {
  const { product_id, quantity } = req.body;
  const user_id = req.user.id;

  try {
    const query = 'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)';
    await db.execute(query, [user_id, product_id, quantity]);
    res.status(201).json({ message: 'Item added to cart' });
  } catch (err) {
    console.error('Error adding to cart:', err);
    res.status(500).json({ message: 'Error adding to cart' });
  }
});

// Get Cart Items Route
app.get('/cart', authenticateToken, async (req, res) => {
  const user_id = req.user.id;

  try {
    const [results] = await db.execute('SELECT c.*, p.name, p.price, p.image FROM cart c JOIN products p ON c.product_id = p.id WHERE c.user_id = ?', [user_id]);
    res.status(200).json(results);
  } catch (err) {
    console.error('Error fetching cart items:', err);
    res.status(500).json({ message: 'Error fetching cart items' });
  }
});

// Remove from Cart Route
app.delete('/cart/remove/:item_id', authenticateToken, async (req, res) => {
  const { item_id } = req.params;
  const user_id = req.user.id;

  try {
    const query = 'DELETE FROM cart WHERE id = ? AND user_id = ?';
    await db.execute(query, [item_id, user_id]);
    res.status(200).json({ message: 'Item removed from cart' });
  } catch (err) {
    console.error('Error removing from cart:', err);
    res.status(500).json({ message: 'Error removing from cart' });
  }
});

// Checkout Route
app.post('/checkout', authenticateToken, async (req, res) => {
  const { payment_method } = req.body;
  const user_id = req.user.id;

  try {
    // Fetch cart items
    const [cartItems] = await db.execute('SELECT * FROM cart WHERE user_id = ?', [user_id]);

    if (cartItems.length === 0) return res.status(400).json({ message: 'Cart is empty' });

    // Calculate total amount
    let totalAmount = 0;
    for (const item of cartItems) {
      const [product] = await db.execute('SELECT price FROM products WHERE id = ?', [item.product_id]);
      totalAmount += product[0].price * item.quantity;
    }

    // Handle payment (Placeholder logic)
    if (payment_method === 'mpesa') {
      // Integrate M-Pesa payment gateway here
    } else if (payment_method === 'debit-card') {
      // Integrate debit card payment gateway here
    } else {
      return res.status(400).json({ message: 'Invalid payment method' });
    }

    // Clear the cart after successful checkout
    await db.execute('DELETE FROM cart WHERE user_id = ?', [user_id]);

    res.status(200).json({ message: 'Checkout successful', totalAmount });
  } catch (err) {
    console.error('Error during checkout:', err);
    res.status(500).json({ message: 'Error during checkout' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
