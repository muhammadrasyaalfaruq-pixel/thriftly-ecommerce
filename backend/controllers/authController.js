const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

function buatToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nama, email, dan password wajib diisi' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password minimal 6 karakter' });
    }
    const [cek] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (cek.length > 0) return res.status(409).json({ message: 'Email sudah terdaftar' });

    const hash = await bcrypt.hash(password, 10); // password diacak, tidak disimpan asli
    const [hasil] = await db.query(
      'INSERT INTO users (name, email, password_hash, phone) VALUES (?, ?, ?, ?)',
      [name, email, hash, phone || null]
    );
    const user = { id: hasil.insertId, name, email, role: 'user' };
    res.status(201).json({ message: 'Daftar berhasil', token: buatToken(user), user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan password wajib diisi' });
    }
    const [rows] = await db.query('SELECT * FROM users WHERE email = ? AND is_active = 1', [email]);
    const user = rows[0];
    const cocok = user && (await bcrypt.compare(password, user.password_hash));
    if (!cocok) return res.status(401).json({ message: 'Email atau password salah' });

    res.json({
      message: 'Login berhasil',
      token: buatToken(user),
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.me = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, phone, role FROM users WHERE id = ?', [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'User tidak ditemukan' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};