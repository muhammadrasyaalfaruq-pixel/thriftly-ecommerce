const router = require('express').Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

// Semua route admin wajib Login dan wajib ber-role Admin
router.use('/admin', auth, isAdmin);

// 1. READ: Ambil semua kategori beserta nama induknya (parent)
router.get('/categories', async (req, res) => {
  try {
    const query = `
      SELECT c.id, c.parent_id, c.name, c.slug, p.name AS parent_name
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.id
      ORDER BY c.id DESC
    `;
    const [rows] = await db.query(query);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. CREATE: Tambah kategori baru
router.post('/categories', async (req, res) => {
  try {
    const { name, parent_id } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Nama kategori wajib diisi' });
    }

    // Buat slug otomatis dari nama (contoh: "Jaket Pria" -> "jaket-pria")
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const parentId = parent_id ? Number(parent_id) : null;

    const [result] = await db.query(
      'INSERT INTO categories (name, slug, parent_id) VALUES (?, ?, ?)',
      [name.trim(), slug, parentId]
    );

    res.status(201).json({
      message: 'Kategori berhasil ditambahkan',
      id: result.insertId
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. UPDATE: Edit nama atau induk kategori
router.put('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, parent_id } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Nama kategori wajib diisi' });
    }

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const parentId = parent_id ? Number(parent_id) : null;

    // Jangan izinkan parent_id mengarah ke diri sendiri
    if (parentId && parentId === Number(id)) {
      return res.status(400).json({ message: 'Kategori tidak bisa menjadi induk untuk dirinya sendiri' });
    }

    const [result] = await db.query(
      'UPDATE categories SET name = ?, slug = ?, parent_id = ? WHERE id = ?',
      [name.trim(), slug, parentId, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Kategori tidak ditemukan' });
    }

    res.json({ message: 'Kategori berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. DELETE: Hapus kategori
router.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Cek apakah ada sub-kategori yang bergantung ke kategori ini
    const [sub] = await db.query('SELECT id FROM categories WHERE parent_id = ? LIMIT 1', [id]);
    if (sub.length > 0) {
      return res.status(400).json({ message: 'Tidak bisa menghapus kategori yang masih memiliki sub-kategori' });
    }

    // Cek apakah ada produk yang memakai kategori ini
    const [prod] = await db.query('SELECT id FROM products WHERE category_id = ? LIMIT 1', [id]);
    if (prod.length > 0) {
      return res.status(400).json({ message: 'Tidak bisa menghapus kategori yang masih memiliki produk' });
    }

    const [result] = await db.query('DELETE FROM categories WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Kategori tidak ditemukan' });
    }

    res.json({ message: 'Kategori berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// === CRUD BRANDS (Tugas Dandi) ===

// 1. READ: Ambil semua brand
router.get('/brands', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, slug FROM brands ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. CREATE: Tambah brand baru
router.post('/brands', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Nama brand wajib diisi' });

    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const [result] = await db.query('INSERT INTO brands (name, slug) VALUES (?, ?)', [name.trim(), slug]);

    res.status(201).json({ message: 'Brand berhasil ditambahkan', id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. UPDATE: Edit brand
router.put('/brands/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Nama brand wajib diisi' });

    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const [result] = await db.query('UPDATE brands SET name = ?, slug = ? WHERE id = ?', [name.trim(), slug, id]);

    if (result.affectedRows === 0) return res.status(404).json({ message: 'Brand tidak ditemukan' });
    res.json({ message: 'Brand berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. DELETE: Hapus brand
router.delete('/brands/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Cek apakah ada produk yang memakai brand ini
    const [prod] = await db.query('SELECT id FROM products WHERE brand_id = ? LIMIT 1', [id]);
    if (prod.length > 0) return res.status(400).json({ message: 'Tidak bisa menghapus brand yang masih memiliki produk' });

    const [result] = await db.query('DELETE FROM brands WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Brand tidak ditemukan' });
    res.json({ message: 'Brand berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
