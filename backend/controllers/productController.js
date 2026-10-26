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
    if (req.query.branded) where.push('p.brand_id IS NOT NULL');   // menu Branded: hanya barang yang punya brand
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

// Detail satu produk. Contoh: /api/products/1
exports.detail = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'ID produk tidak valid' });

    const [rows] = await db.query(
      `SELECT p.id, p.name, p.description, p.price, p.size, p.condition_label,
              p.stock, p.is_negotiable, p.status, p.created_at,
              b.name AS brand, c.name AS category, c.slug AS category_slug,
              s.id AS store_id, s.name AS store_name, s.slug AS store_slug, s.city AS store_city,
              (SELECT COUNT(*) FROM wishlists w WHERE w.product_id = p.id) AS wishlist_count
       FROM products p
       JOIN categories c ON c.id = p.category_id
       LEFT JOIN brands b ON b.id = p.brand_id
       JOIN stores s ON s.id = p.store_id
       WHERE p.id = ?`,
      [id]
    );
    const p = rows[0];
    // Produk yang disembunyikan penjual dianggap tidak ada
    if (!p || p.status === 'hidden') {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    const [images] = await db.query(
      'SELECT id, image_url, is_primary FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, id',
      [id]
    );
    // Rating toko dihitung dari semua ulasan untuk toko itu
    const [[rating]] = await db.query(
      'SELECT COUNT(*) AS review_count, ROUND(AVG(rating), 1) AS rating_avg FROM reviews WHERE store_id = ?',
      [p.store_id]
    );

    res.json({
      id: p.id, name: p.name, description: p.description, price: p.price,
      size: p.size, condition_label: p.condition_label, stock: p.stock,
      is_negotiable: p.is_negotiable, status: p.status, created_at: p.created_at,
      brand: p.brand, category: p.category, category_slug: p.category_slug,
      wishlist_count: p.wishlist_count,
      images,
      store: {
        id: p.store_id, name: p.store_name, slug: p.store_slug, city: p.store_city,
        rating_avg: rating.rating_avg, review_count: rating.review_count,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};