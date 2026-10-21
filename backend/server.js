require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./config/db');

const app = express();
app.use(cors());          
app.use(express.json());  

// File statis: foto upload dan seluruh folder frontend
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Rute tes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API Thriftly jalan' });
});

app.get('/api/db-test', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT COUNT(*) AS total FROM users');
    res.json({ status: 'ok', total_users: rows[0].total });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Muat otomatis semua file di folder routes yang berakhiran .routes.js
const routesDir = path.join(__dirname, 'routes');
fs.readdirSync(routesDir)
  .filter((f) => f.endsWith('.routes.js'))
  .forEach((f) => {
    app.use('/api', require(path.join(routesDir, f)));
    console.log('Route dimuat:', f);
  });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server jalan di http://localhost:${PORT}`));