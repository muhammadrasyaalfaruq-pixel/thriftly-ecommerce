const db = require('../config/db');

// Daftar kategori (Wanita, Pria, Anak, Aksesoris + sub-kategorinya)
exports.categories = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, parent_id, name, slug FROM categories ORDER BY id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Daftar brand, urut abjad
exports.brands = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, slug FROM brands ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Daftar produk. Contoh: /api/products?q=nike&category=pria&sort=price_asc&page=1
exports.list = async (req, res) => {
  try {
    const { q, category, brand, size, condition, min, max, sort } = req.query;
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const page = Math.max(Number(req.query.page) || 1, 1);

    // Syarat pencarian disusun satu per satu. Tanda ? diisi dari params (aman dari injeksi SQL)
    const where = ["p.status = 'active'"];
    const params = [];

    if (q) {
      where.push('(p.name LIKE ? OR b.name LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }
    if (category) {
      // Kategori utama (misalnya "pria") ikut menampilkan semua sub-kategorinya
      where.push('(c.slug = ? OR c.parent_id = (SELECT id FROM categories WHERE slug = ?))');
      params.push(category, category);
    }
    if (brand) { where.push('b.slug = ?'); params.push(brand); }
    if (size) { where.push('p.size = ?'); params.push(size); }
    if (condition) { where.push('p.condition_label = ?'); params.push(condition); }
    if (min) { where.push('p.price >= ?'); params.push(Number(min)); }
    if (max) { where.push('p.price <= ?'); params.push(Number(max)); }

    // Urutan hanya boleh dari daftar ini
    const urutan = {
      newest: 'p.created_at DESC',
      price_asc: 'p.price ASC',
      price_desc: 'p.price DESC',
    }[sort] || 'p.created_at DESC';

    const dari = `FROM products p
      JOIN categories c ON c.id = p.category_id
      LEFT JOIN brands b ON b.id = p.brand_id
      WHERE ${where.join(' AND ')}`;

    const [items] = await db.query(
      `SELECT p.id, p.name, p.price, p.size, p.condition_label, p.is_negotiable,
              b.name AS brand,
              (SELECT image_url FROM product_images WHERE product_id = p.id
                 ORDER BY is_primary DESC, id LIMIT 1) AS image,
              (SELECT COUNT(*) FROM wishlists w WHERE w.product_id = p.id) AS wishlist_count
       ${dari} ORDER BY ${urutan} LIMIT ? OFFSET ?`,
      [...params, limit, (page - 1) * limit]
    );
    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total ${dari}`, params);

    res.json({ total, page, limit, items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};