const db = require('../config/db');

// Tarif ongkir tetap per kurir (sementara)
const KURIR = {
  jne: { nama: 'JNE Reguler', ongkir: 18000 },
  jnt: { nama: 'J&T Express', ongkir: 17000 },
  sicepat: { nama: 'SiCepat Reguler', ongkir: 16000 },
};

// Ringkasan checkout satu toko: barang tersedia di keranjang + pilihan kurir
exports.preview = async (req, res) => {
  try {
    const storeId = Number(req.params.storeId);
    const [toko] = await db.query('SELECT id, name, slug FROM stores WHERE id = ?', [storeId]);
    if (!toko[0]) return res.status(404).json({ message: 'Toko tidak ditemukan' });

    const [items] = await db.query(
      `SELECT p.id AS product_id, p.name, p.price, p.size, p.condition_label, b.name AS brand,
              (SELECT image_url FROM product_images WHERE product_id = p.id
                 ORDER BY is_primary DESC, id LIMIT 1) AS image
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       LEFT JOIN brands b ON b.id = p.brand_id
       WHERE ci.user_id = ? AND p.store_id = ? AND p.status = 'active' AND p.stock > 0`,
      [req.user.id, storeId]
    );
    const subtotal = items.reduce((jumlah, i) => jumlah + i.price, 0);
    const couriers = Object.entries(KURIR).map(([kode, k]) => ({ kode, nama: k.nama, ongkir: k.ongkir }));
    res.json({ store: toko[0], items, subtotal, couriers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Buat pesanan. Body: { "store_id": 1, "address_id": 5, "courier": "jne" }
exports.create = async (req, res) => {
  const conn = await db.getConnection();     // satu koneksi khusus supaya bisa memakai transaksi
  try {
    const storeId = Number(req.body.store_id);
    const addressId = Number(req.body.address_id);
    const kurir = KURIR[req.body.courier];
    if (!storeId || !addressId || !kurir) {
      return res.status(400).json({ message: 'Toko, alamat, dan kurir wajib dipilih' });
    }
    const [alamat] = await conn.query(
      'SELECT id FROM addresses WHERE id = ? AND user_id = ?', [addressId, req.user.id]
    );
    if (!alamat[0]) return res.status(400).json({ message: 'Alamat tidak valid' });

    await conn.beginTransaction();           // semua langkah di bawah berhasil bersama, atau batal bersama
    const [items] = await conn.query(
      `SELECT p.id, p.price FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = ? AND p.store_id = ? AND p.status = 'active' AND p.stock > 0
       FOR UPDATE`,                          // kunci barisnya supaya tidak dibeli dua orang bersamaan
      [req.user.id, storeId]
    );
    if (items.length === 0) {
      await conn.rollback();
      return res.status(400).json({ message: 'Tidak ada barang tersedia untuk toko ini' });
    }

    const subtotal = items.reduce((jumlah, i) => jumlah + i.price, 0);
    const kode = 'TH-' + Date.now().toString().slice(-8) + Math.floor(10 + Math.random() * 90);
    const [order] = await conn.query(
      `INSERT INTO orders (order_code, buyer_id, store_id, address_id, courier, shipping_cost, total_price)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [kode, req.user.id, storeId, addressId, kurir.nama, kurir.ongkir, subtotal + kurir.ongkir]
    );
    for (const it of items) {
      // Harga disimpan saat beli, lalu barang dikunci supaya tidak bisa dibeli orang lain
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, price_at_purchase, qty) VALUES (?, ?, ?, 1)',
        [order.insertId, it.id, it.price]
      );
      await conn.query("UPDATE products SET stock = 0, status = 'sold' WHERE id = ?", [it.id]);
    }
    await conn.query(
      'DELETE FROM cart_items WHERE user_id = ? AND product_id IN (?)',
      [req.user.id, items.map((i) => i.id)]
    );
    await conn.commit();

    res.status(201).json({
      message: 'Pesanan dibuat',
      order: { id: order.insertId, order_code: kode, total_price: subtotal + kurir.ongkir, status: 'pending_payment' },
    });
  } catch (err) {
    try { await conn.rollback(); } catch (e) { /* belum ada transaksi */ }
    res.status(500).json({ message: err.message });
  } finally {
    conn.release();                          // kembalikan koneksi ke pool
  }
};

// Daftar pesanan milik user yang login (terbaru di atas)
exports.list = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT o.id, o.order_code, o.status, o.total_price, o.created_at,
              s.name AS store_name,
              (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS item_count,
              (SELECT pi.image_url FROM order_items oi
                 JOIN product_images pi ON pi.product_id = oi.product_id
                 WHERE oi.order_id = o.id ORDER BY pi.is_primary DESC, pi.id LIMIT 1) AS image
       FROM orders o JOIN stores s ON s.id = o.store_id
       WHERE o.buyer_id = ? ORDER BY o.id DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Detail satu pesanan (hanya boleh dilihat pembelinya)
exports.detail = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [orders] = await db.query(
      `SELECT o.id, o.order_code, o.status, o.courier, o.tracking_number,
              o.shipping_cost, o.total_price, o.created_at,
              s.id AS store_id, s.name AS store_name, s.slug AS store_slug,
              a.recipient_name, a.phone, a.street, a.city, a.province, a.postal_code
       FROM orders o
       JOIN stores s ON s.id = o.store_id
       JOIN addresses a ON a.id = o.address_id
       WHERE o.id = ? AND o.buyer_id = ?`,
      [id, req.user.id]
    );
    const o = orders[0];
    if (!o) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });

    const [items] = await db.query(
      `SELECT oi.id AS order_item_id, p.id AS product_id, p.name, p.size, p.condition_label,
              b.name AS brand, oi.price_at_purchase AS price,
              (SELECT image_url FROM product_images WHERE product_id = p.id
                 ORDER BY is_primary DESC, id LIMIT 1) AS image
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       LEFT JOIN brands b ON b.id = p.brand_id
       WHERE oi.order_id = ?`,
      [id]
    );
    const [pay] = await db.query(
      'SELECT method, amount, status, proof_image, paid_at FROM payments WHERE order_id = ?', [id]
    );
    res.json({ ...o, subtotal: o.total_price - o.shipping_cost, items, payment: pay[0] || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Batalkan pesanan yang belum dibayar. Barangnya jadi tersedia lagi
exports.cancel = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const id = Number(req.params.id);
    await conn.beginTransaction();
    const [rows] = await conn.query(
      'SELECT id, status FROM orders WHERE id = ? AND buyer_id = ? FOR UPDATE', [id, req.user.id]
    );
    if (!rows[0]) {
      await conn.rollback();
      return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
    }
    if (rows[0].status !== 'pending_payment') {
      await conn.rollback();
      return res.status(400).json({ message: 'Hanya pesanan yang belum dibayar yang bisa dibatalkan' });
    }
    await conn.query("UPDATE orders SET status = 'cancelled' WHERE id = ?", [id]);
    await conn.query(
      "UPDATE products SET stock = 1, status = 'active' WHERE id IN (SELECT product_id FROM order_items WHERE order_id = ?)",
      [id]
    );
    await conn.commit();
    res.json({ message: 'Pesanan dibatalkan' });
  } catch (err) {
    try { await conn.rollback(); } catch (e) { /* belum ada transaksi */ }
    res.status(500).json({ message: err.message });
  } finally {
    conn.release();
  }
};