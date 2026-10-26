const db = require('../config/db');

// Daftar wishlist milik user yang login. Bentuk datanya sama dengan daftar produk,
// jadi bisa langsung dipakai productCard() di halaman
exports.list = async (req, res) => {
  try {
    const [items] = await db.query(
      `SELECT p.id, p.name, p.price, p.size, p.condition_label, p.is_negotiable, p.status,
              b.name AS brand,
              (SELECT image_url FROM product_images WHERE product_id = p.id
                 ORDER BY is_primary DESC, id LIMIT 1) AS image,
              (SELECT COUNT(*) FROM wishlists x WHERE x.product_id = p.id) AS wishlist_count
       FROM wishlists w
       JOIN products p ON p.id = w.product_id
       LEFT JOIN brands b ON b.id = p.brand_id
       WHERE w.user_id = ? AND p.status <> 'hidden'
       ORDER BY w.id DESC`,
      [req.user.id]
    );
    res.json({ items, count: items.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Tambah ke wishlist. Body: { "product_id": 1 }
exports.add = async (req, res) => {
  try {
    const productId = Number(req.body.product_id);
    if (!productId) return res.status(400).json({ message: 'product_id wajib diisi' });

    const [cek] = await db.query("SELECT id FROM products WHERE id = ? AND status <> 'hidden'", [productId]);
    if (!cek[0]) return res.status(404).json({ message: 'Produk tidak ditemukan' });

    // INSERT IGNORE: kalau sudah ada, tidak error dan tidak dobel
    const [hasil] = await db.query(
      'INSERT IGNORE INTO wishlists (user_id, product_id) VALUES (?, ?)', [req.user.id, productId]
    );
    if (hasil.affectedRows === 0) return res.json({ message: 'Sudah ada di wishlist' });
    res.status(201).json({ message: 'Ditambahkan ke wishlist' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Hapus dari wishlist
exports.remove = async (req, res) => {
  try {
    const [hasil] = await db.query(
      'DELETE FROM wishlists WHERE user_id = ? AND product_id = ?',
      [req.user.id, Number(req.params.productId)]
    );
    if (hasil.affectedRows === 0) return res.status(404).json({ message: 'Barang tidak ada di wishlist' });
    res.json({ message: 'Dihapus dari wishlist' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};