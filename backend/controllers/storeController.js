const db = require('../config/db');

// Profil publik satu toko. Contoh: /api/stores/rasya-vintage
exports.profile = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT s.id, s.name, s.slug, s.bio, s.city, s.logo_url, s.created_at,
              (SELECT COUNT(*) FROM reviews r WHERE r.store_id = s.id) AS review_count,
              (SELECT ROUND(AVG(r.rating), 1) FROM reviews r WHERE r.store_id = s.id) AS rating_avg
       FROM stores s WHERE s.slug = ?`,
      [req.params.slug]
    );
    const store = rows[0];
    if (!store) return res.status(404).json({ message: 'Toko tidak ditemukan' });

    // Produk toko: yang masih tersedia di atas, yang sudah terjual di bawah
    const [items] = await db.query(
      `SELECT p.id, p.name, p.price, p.size, p.condition_label, p.is_negotiable, p.status,
              b.name AS brand,
              (SELECT image_url FROM product_images WHERE product_id = p.id
                 ORDER BY is_primary DESC, id LIMIT 1) AS image,
              (SELECT COUNT(*) FROM wishlists w WHERE w.product_id = p.id) AS wishlist_count
       FROM products p LEFT JOIN brands b ON b.id = p.brand_id
       WHERE p.store_id = ? AND p.status <> 'hidden'
       ORDER BY (p.status = 'sold'), p.created_at DESC`,
      [store.id]
    );
    res.json({ store, items, active_count: items.filter((i) => i.status === 'active').length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};