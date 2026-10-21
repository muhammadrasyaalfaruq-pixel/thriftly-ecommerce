const db = require('../config/db');

// Lihat isi keranjang milik user yang login
exports.list = async (req, res) => {
  try {
    const [items] = await db.query(
      `SELECT ci.id, p.id AS product_id, p.name, p.price, p.size, p.condition_label,
              p.status, p.stock, b.name AS brand,
              (SELECT image_url FROM product_images WHERE product_id = p.id
                 ORDER BY is_primary DESC, id LIMIT 1) AS image,
              s.id AS store_id, s.name AS store_name, s.slug AS store_slug
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       JOIN stores s ON s.id = p.store_id
       LEFT JOIN brands b ON b.id = p.brand_id
       WHERE ci.user_id = ?
       ORDER BY s.id, ci.id`,
      [req.user.id]
    );
    // Subtotal hanya menghitung barang yang masih tersedia
    const subtotal = items
      .filter((i) => i.status === 'active' && i.stock > 0)
      .reduce((total, i) => total + i.price, 0);
    res.json({ items, count: items.length, subtotal });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Tambah barang ke keranjang. Body: { "product_id": 1 }
exports.add = async (req, res) => {
  try {
    const productId = Number(req.body.product_id);
    if (!productId) return res.status(400).json({ message: 'product_id wajib diisi' });

    const [rows] = await db.query(
      `SELECT p.id, p.status, p.stock, s.user_id AS owner_id
       FROM products p JOIN stores s ON s.id = p.store_id WHERE p.id = ?`,
      [productId]
    );
    const p = rows[0];
    if (!p || p.status === 'hidden') return res.status(404).json({ message: 'Produk tidak ditemukan' });
    if (p.owner_id === req.user.id) {
      return res.status(400).json({ message: 'Kamu tidak bisa membeli barangmu sendiri' });
    }
    if (p.status !== 'active' || p.stock < 1) {
      return res.status(400).json({ message: 'Barang ini sudah terjual' });
    }

    const [cek] = await db.query(
      'SELECT id FROM cart_items WHERE user_id = ? AND product_id = ?',
      [req.user.id, productId]
    );
    if (cek.length > 0) return res.json({ message: 'Barang sudah ada di keranjang' });

    await db.query('INSERT INTO cart_items (user_id, product_id, qty) VALUES (?, ?, 1)', [req.user.id, productId]);
    res.status(201).json({ message: 'Ditambahkan ke keranjang' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Hapus barang dari keranjang
exports.remove = async (req, res) => {
  try {
    const [hasil] = await db.query(
      'DELETE FROM cart_items WHERE user_id = ? AND product_id = ?',
      [req.user.id, Number(req.params.productId)]
    );
    if (hasil.affectedRows === 0) return res.status(404).json({ message: 'Barang tidak ada di keranjang' });
    res.json({ message: 'Dihapus dari keranjang' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};