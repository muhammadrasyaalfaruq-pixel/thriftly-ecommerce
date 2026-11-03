# Thriftly – Marketplace Thrift Lite

Web marketplace thrift klasik ala Preloved.  
Stack: HTML + CSS + JS (vanilla), Node.js + Express, MySQL (XAMPP).  
Kelompok 5, Semester 3 – Tugas Akhir E-Commerce.

## Fitur

- **Autentikasi** (register, login, role admin/user)  
- **Katalog Produk** (filter kategori, brand, harga, pencarian)  
- **Wishlist** (tanda hati, simpan & hapus)  
- **Keranjang** (tambah, ubah kuantitas, checkout)  
- **Checkout** (pilih alamat, kurir, otomatis lock stok)  
- **Manajemen Toko** (penjual dapat buka toko, tambah/ubah/hapus produk)  
- **Admin Panel** (kelola user, kategori, brand, konfirmasi pembayaran)  
- **Responsive UI** (mobile-first, font *Syne*-*Inter*, tombol hitam bulat, logo hati merah)

## Anggota Kelompok

| Nama | Modul | Branch |
|---|---|---|
| Rasya (Ketua) | Fondasi, Login/Daftar, Admin master | feature/database-rasya |
| Adit | Katalog dan Nego | feature/adit |
| Apip | Penjual dan Produk | feature/apip |
| Dandi | Keranjang dan Alamat | feature/dandi |
| Fandi | Pesanan, Checkout, Pembayaran | feature/Fandi |

## Cara Menjalankan

1. **Persiapan database**  
   - Jalankan XAMPP, aktifkan MySQL.  
   - Buka phpMyAdmin → buat database `thriftly`.  
   - Import file `database/thriftly.sql` dan `database/update-1-hiburan.sql`.

2. **Variabel lingkungan**  
   - Buat file `.env` di dalam folder `backend/` berdasarkan `backend/.env.example`:
     ```bash
     cp backend/.env.example backend/.env
     ```
   - Sesuaikan konfigurasi database dan `JWT_SECRET` bila perlu.

3. **Instal dependensi**  
   ```bash
   cd backend
   npm install
   ```

4. **Jalankan server**  
   ```bash
   npm start
   ```
   Server tersedia di `http://localhost:3000`.

5. **Akses aplikasi**  
   - Buka browser → `http://localhost:3000`  
   - Frontend dilayani langsung sebagai file statis oleh backend.

## Akun Contoh

| Peran | Email | Password |
|---|---|---|
| Admin | admin@thriftly.test | admin123 |
| User (penjual) | user@thriftly.test | user12345 |

## Struktur Folder

```
thriftly-ecommerce/
│
├─ backend/               # Node + Express, API
│   ├─ config/            # Koneksi database (db.js)
│   ├─ controllers/       # Logika bisnis
│   ├─ middleware/        # auth.js, isAdmin.js
│   ├─ routes/            # Route API tiap anggota
│   └─ server.js          # Entry point backend
│
├─ frontend/              # HTML, CSS, JS (vanilla)
│   ├─ css/               # Stylesheet
│   ├─ js/                # Script client (main.js dsb.)
│   ├─ pages/             # Halaman publik (cart, checkout, dll.)
│   ├─ seller/            # Panel penjual
│   └─ admin/             # Panel admin
│
├─ database/              # File SQL skema dan migrasi
│   ├─ thriftly.sql
│   └─ update-1-hiburan.sql
│
└─ docs/                  # Dokumentasi dan diagram ERD
```

## Lisensi

Tugas Akhir E-Commerce Semester 3 - Kelompok 5.
