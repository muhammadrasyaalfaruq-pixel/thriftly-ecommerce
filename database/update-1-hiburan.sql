-- Tambahan data: kategori Hiburan dan dua barang contoh.
USE thriftly;

INSERT INTO categories (parent_id, name, slug) VALUES (NULL, 'Hiburan', 'hiburan');
SET @hiburan = LAST_INSERT_ID();
INSERT INTO categories (parent_id, name, slug) VALUES
  (@hiburan, 'Kaset dan Piringan Hitam', 'kaset-vinyl'),
  (@hiburan, 'Merchandise Band', 'merch-band');

INSERT INTO products (store_id, category_id, brand_id, name, description, price, size, condition_label, stock, is_negotiable) VALUES
  (1, (SELECT id FROM categories WHERE slug = 'kaset-vinyl'), NULL, 'Kaset Pita Album 90an',
   'Kaset pita original, masih berfungsi, cover ada sedikit lecet.', 65000, '-', 'good', 1, 1),
  (1, (SELECT id FROM categories WHERE slug = 'merch-band'), NULL, 'Kaos Band Vintage',
   'Kaos band tur lama, sablon masih jelas.', 175000, 'L', 'good', 1, 1);

INSERT INTO product_images (product_id, image_url, is_primary)
  SELECT id, 'https://placehold.co/600x800?text=Kaset+90an', 1 FROM products WHERE name = 'Kaset Pita Album 90an';
INSERT INTO product_images (product_id, image_url, is_primary)
  SELECT id, 'https://placehold.co/600x800?text=Kaos+Band', 1 FROM products WHERE name = 'Kaos Band Vintage';