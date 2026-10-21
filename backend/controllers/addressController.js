const db = require('../config/db');

// Daftar alamat milik user yang login (alamat utama di atas)
exports.list = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, recipient_name, phone, street, city, province, postal_code, is_default
       FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Tambah alamat baru
exports.add = async (req, res) => {
  try {
    const { recipient_name, phone, street, city, province, postal_code } = req.body;
    if (!recipient_name || !phone || !street || !city || !province || !postal_code) {
      return res.status(400).json({ message: 'Semua kolom alamat wajib diisi' });
    }
    const [[{ total }]] = await db.query(
      'SELECT COUNT(*) AS total FROM addresses WHERE user_id = ?', [req.user.id]
    );
    // Alamat pertama otomatis jadi alamat utama
    const jadiUtama = total === 0 || req.body.is_default ? 1 : 0;
    if (jadiUtama) await db.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);

    const [hasil] = await db.query(
      `INSERT INTO addresses (user_id, recipient_name, phone, street, city, province, postal_code, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, recipient_name, phone, street, city, province, postal_code, jadiUtama]
    );
    res.status(201).json({ message: 'Alamat disimpan', id: hasil.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Jadikan satu alamat sebagai alamat utama
exports.setDefault = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [cek] = await db.query('SELECT id FROM addresses WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!cek[0]) return res.status(404).json({ message: 'Alamat tidak ditemukan' });
    await db.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    await db.query('UPDATE addresses SET is_default = 1 WHERE id = ?', [id]);
    res.json({ message: 'Alamat utama diganti' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Hapus alamat
exports.remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [cek] = await db.query(
      'SELECT is_default FROM addresses WHERE id = ? AND user_id = ?', [id, req.user.id]
    );
    if (!cek[0]) return res.status(404).json({ message: 'Alamat tidak ditemukan' });

    try {
      await db.query('DELETE FROM addresses WHERE id = ?', [id]);
    } catch (e) {
      // Alamat yang pernah dipakai pesanan tidak boleh dihapus
      if (e.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(400).json({ message: 'Alamat ini dipakai pesanan, tidak bisa dihapus' });
      }
      throw e;
    }
    // Kalau yang dihapus alamat utama, alamat terbaru yang tersisa jadi utama
    if (cek[0].is_default) {
      await db.query(
        'UPDATE addresses SET is_default = 1 WHERE user_id = ? ORDER BY id DESC LIMIT 1', [req.user.id]
      );
    }
    res.json({ message: 'Alamat dihapus' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};