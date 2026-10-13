-- =====================================================
--  THRIFTLY - Online Thrift Store (Marketplace-lite)
--  Database : thriftly   |   Engine: MySQL / MariaDB (Laragon)
-- =====================================================

CREATE DATABASE IF NOT EXISTS thriftly
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE thriftly;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS reviews, payments, order_items, orders, offers,
  wishlists, cart_items, product_images, products, brands, categories,
  addresses, stores, users;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. USERS : akun pembeli/penjual (role user) dan admin
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone         VARCHAR(20),
  avatar_url    VARCHAR(255),
  role          ENUM('user','admin') NOT NULL DEFAULT 'user',
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. STORES : toko penjual (1 user maksimal 1 toko)
CREATE TABLE stores (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(120) NOT NULL UNIQUE,
  bio         TEXT,
  logo_url    VARCHAR(255),
  city        VARCHAR(100),
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. ADDRESSES : alamat pengiriman pembeli
CREATE TABLE addresses (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT NOT NULL,
  recipient_name VARCHAR(100) NOT NULL,
  phone          VARCHAR(20) NOT NULL,
  street         VARCHAR(255) NOT NULL,
  city           VARCHAR(100) NOT NULL,
  province       VARCHAR(100) NOT NULL,
  postal_code    VARCHAR(10) NOT NULL,
  is_default     TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. CATEGORIES : bertingkat (Wanita > Atasan). parent_id NULL = kategori utama
CREATE TABLE categories (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  parent_id  INT NULL,
  name       VARCHAR(80) NOT NULL,
  slug       VARCHAR(100) NOT NULL UNIQUE,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 5. BRANDS
CREATE TABLE brands (
  id    INT AUTO_INCREMENT PRIMARY KEY,
  name  VARCHAR(80) NOT NULL UNIQUE,
  slug  VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- 6. PRODUCTS : barang thrift (umumnya stok 1)
CREATE TABLE products (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  store_id         INT NOT NULL,
  category_id      INT NOT NULL,
  brand_id         INT NULL,
  name             VARCHAR(200) NOT NULL,
  description      TEXT,
  price            INT NOT NULL,
  size             VARCHAR(20),
  condition_label  ENUM('like_new','good','fair') NOT NULL DEFAULT 'good',
  stock            INT NOT NULL DEFAULT 1,
  is_negotiable    TINYINT(1) NOT NULL DEFAULT 0,
  status           ENUM('active','sold','hidden') NOT NULL DEFAULT 'active',
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (store_id)    REFERENCES stores(id)     ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (brand_id)    REFERENCES brands(id)     ON DELETE SET NULL
) ENGINE=InnoDB;

-- 7. PRODUCT_IMAGES
CREATE TABLE product_images (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  product_id  INT NOT NULL,
  image_url   VARCHAR(255) NOT NULL,
  is_primary  TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. CART_ITEMS
CREATE TABLE cart_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  product_id  INT NOT NULL,
  qty         INT NOT NULL DEFAULT 1,
  UNIQUE KEY uq_cart (user_id, product_id),
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 9. WISHLISTS
CREATE TABLE wishlists (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  product_id  INT NOT NULL,
  UNIQUE KEY uq_wish (user_id, product_id),
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 10. OFFERS : fitur "Bisa nego"
CREATE TABLE offers (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  product_id   INT NOT NULL,
  buyer_id     INT NOT NULL,
  offer_price  INT NOT NULL,
  status       ENUM('pending','accepted','rejected','expired') NOT NULL DEFAULT 'pending',
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (buyer_id)   REFERENCES users(id)    ON DELETE CASCADE
) ENGINE=InnoDB;

-- 11. ORDERS : 1 pesanan = 1 toko (checkout banyak toko dipecah jadi beberapa order)
CREATE TABLE orders (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  order_code       VARCHAR(30) NOT NULL UNIQUE,
  buyer_id         INT NOT NULL,
  store_id         INT NOT NULL,
  address_id       INT NOT NULL,
  courier          VARCHAR(50),
  tracking_number  VARCHAR(80),
  shipping_cost    INT NOT NULL DEFAULT 0,
  total_price      INT NOT NULL,
  status           ENUM('pending_payment','paid','shipped','completed','cancelled')
                   NOT NULL DEFAULT 'pending_payment',
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (buyer_id)   REFERENCES users(id),
  FOREIGN KEY (store_id)   REFERENCES stores(id),
  FOREIGN KEY (address_id) REFERENCES addresses(id)
) ENGINE=InnoDB;

-- 12. ORDER_ITEMS : harga disimpan saat beli (price_at_purchase)
CREATE TABLE order_items (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  order_id           INT NOT NULL,
  product_id         INT NOT NULL,
  price_at_purchase  INT NOT NULL,
  qty                INT NOT NULL DEFAULT 1,
  FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

-- 13. PAYMENTS : konsep rekber (uang ditahan sampai pesanan selesai)
CREATE TABLE payments (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  order_id     INT NOT NULL UNIQUE,
  method       VARCHAR(50) NOT NULL,
  amount       INT NOT NULL,
  status       ENUM('pending','held','released','refunded') NOT NULL DEFAULT 'pending',
  proof_image  VARCHAR(255),
  paid_at      DATETIME NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 14. REVIEWS : hanya untuk item dari pesanan yang selesai (terverifikasi)
CREATE TABLE reviews (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  order_item_id  INT NOT NULL UNIQUE,
  user_id        INT NOT NULL,
  store_id       INT NOT NULL,
  rating         TINYINT NOT NULL,
  comment        TEXT,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (rating BETWEEN 1 AND 5),
  FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)       REFERENCES users(id)       ON DELETE CASCADE,
  FOREIGN KEY (store_id)      REFERENCES stores(id)      ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================
--  DATA CONTOH (seed)
--  Login admin : admin@thriftly.test / admin123
--  Login user  : user@thriftly.test  / user12345  (punya toko "Rasya Vintage")
--  Hanya untuk development. Ganti sebelum dipakai sungguhan.
-- =====================================================
INSERT INTO users (id, name, email, password_hash, phone, role) VALUES
(1, 'Admin Thriftly', 'admin@thriftly.test', '$2a$10$ALajmVy0UYQ1zUYAnOkpgeNQXEdaOXS/cb611lCAQsXIc99nFvmj.', '081200000001', 'admin'),
(2, 'Rasya Seller',   'user@thriftly.test',  '$2a$10$D0TDnfNmG.SwYv.F30G6IuwAvap.N1ePKVzRvrnDWVEqTZdO10PLe', '081200000002', 'user');

INSERT INTO stores (id, user_id, name, slug, bio, city) VALUES
(1, 2, 'Rasya Vintage', 'rasya-vintage', 'Thrift pilihan: jaket, kemeja, dan jersey vintage.', 'Tangerang');

INSERT INTO addresses (user_id, recipient_name, phone, street, city, province, postal_code, is_default) VALUES
(2, 'Rasya Seller', '081200000002', 'Jl. Contoh No. 1', 'Tangerang', 'Banten', '15111', 1);

INSERT INTO categories (id, parent_id, name, slug) VALUES
(1, NULL, 'Wanita', 'wanita'),
(2, NULL, 'Pria', 'pria'),
(3, NULL, 'Anak', 'anak'),
(4, NULL, 'Aksesoris', 'aksesoris'),
(5, 1, 'Atasan Wanita', 'atasan-wanita'),
(6, 1, 'Bawahan Wanita', 'bawahan-wanita'),
(7, 2, 'Kemeja Pria', 'kemeja-pria'),
(8, 2, 'Jaket Pria', 'jaket-pria'),
(9, 2, 'Celana Pria', 'celana-pria'),
(10, 4, 'Topi', 'topi'),
(11, 4, 'Tas', 'tas');

INSERT INTO brands (id, name, slug) VALUES
(1, 'Nike', 'nike'), (2, 'Adidas', 'adidas'), (3, 'Uniqlo', 'uniqlo'),
(4, 'Champion', 'champion'), (5, 'Levi''s', 'levis'), (6, 'Stussy', 'stussy');

INSERT INTO products (id, store_id, category_id, brand_id, name, description, price, size, condition_label, stock, is_negotiable) VALUES
(1, 1, 8, 4, 'Champion Track Jacket Vintage 90s', 'Jaket track warna navy, resleting normal, tanpa noda.', 185000, 'L', 'good', 1, 1),
(2, 1, 7, 3, 'Uniqlo Flannel Shirt Kotak', 'Kemeja flanel tebal, nyaman dipakai harian.', 95000, 'M', 'like_new', 1, 0),
(3, 1, 9, 5, 'Levi''s 501 Baggy Jeans', 'Celana jeans baggy fit, warna light blue.', 220000, '32', 'good', 1, 1),
(4, 1, 8, 2, 'Adidas Jersey Retro 2018', 'Jersey original, ada sedikit pudar di logo.', 150000, 'XL', 'fair', 1, 1),
(5, 1, 10, 1, 'Nike Cap Strapback Black', 'Topi hitam logo kecil, strap masih kencang.', 70000, 'All size', 'like_new', 1, 0),
(6, 1, 5, 3, 'Uniqlo Knit Cardigan Cream', 'Cardigan rajut warna krem, lembut.', 110000, 'S', 'good', 1, 1);

INSERT INTO product_images (product_id, image_url, is_primary) VALUES
(1, 'https://placehold.co/600x800?text=Champion+Jacket', 1),
(2, 'https://placehold.co/600x800?text=Flannel+Shirt', 1),
(3, 'https://placehold.co/600x800?text=Levis+501', 1),
(4, 'https://placehold.co/600x800?text=Adidas+Jersey', 1),
(5, 'https://placehold.co/600x800?text=Nike+Cap', 1),
(6, 'https://placehold.co/600x800?text=Cardigan', 1);