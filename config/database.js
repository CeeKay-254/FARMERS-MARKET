// database.js
const mysql = require('mysql2');
require('dotenv').config(); // Ensure environment variables are loaded

// Create a connection to the database
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    process.exit(1); // Exit the process if unable to connect
  }
  console.log('Connected to the database');
});

module.exports = connection;
