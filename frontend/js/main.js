/* THRIFTLY - main.js (milik Rasya, dipakai SEMUA halaman)
   Anggota lain: pakai fungsi di sini, jangan diedit. */

// 1. Alamat dasar
// ROOT = jalan balik ke folder frontend. Diisi di tiap halaman: <body data-root="../">
const ROOT = document.body.dataset.root || './';
// API = alamat backend. Kalau dibuka lewat localhost:3000 cukup '/api'
const API = location.port === '3000' ? '/api' : 'http://localhost:3000/api';

// 2. Status login (disimpan di browser lewat localStorage)
const Auth = {
  get token() { return localStorage.getItem('thriftly_token'); },
  get user() {
    try { return JSON.parse(localStorage.getItem('thriftly_user')); }
    catch { return null; }
  },
  save(token, user) {
    localStorage.setItem('thriftly_token', token);
    localStorage.setItem('thriftly_user', JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem('thriftly_token');
    localStorage.removeItem('thriftly_user');
  },
};

// 3. Pemanggil API. Contoh: api('/products') atau api('/cart', { method: 'POST', body: { ... } })
async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (Auth.token) headers.Authorization = 'Bearer ' + Auth.token;
  const res = await fetch(API + path, {
    ...opts,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Terjadi kesalahan');
  return data;
}

// 4. Format harga: 185000 menjadi "Rp 185.000"
const rupiah = (n) => 'Rp ' + Number(n).toLocaleString('id-ID');

// 5. Pembersih teks supaya nama user tidak bisa menyisipkan kode
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// 6. Navbar (mirip Preloved). Tampilan beda untuk tamu dan user yang sudah login
function renderNavbar() {
  const u = Auth.user;
  const kanan = u
    ? `<a class="link" href="${ROOT}seller/dashboard.html">Jual</a>
       <a class="link" href="${ROOT}pages/wishlist.html">Wishlist</a>
       <a class="link" href="${ROOT}pages/cart.html">Keranjang</a>
       ${u.role === 'admin' ? `<a class="link" href="${ROOT}admin/dashboard.html">Admin</a>` : ''}
       <a class="link" href="${ROOT}pages/orders.html">${esc(u.name.split(' ')[0])}</a>
       <button class="link" id="btn-logout">Keluar</button>`
    : `<button class="link" id="btn-login">Log in</button>
       <button class="btn" id="btn-daftar">Daftar</button>`;

  const kategori = ['Wanita', 'Pria', 'Branded', 'Anak', 'Hiburan']
    .map((c) => `<a href="${ROOT}pages/products.html?category=${c.toLowerCase()}">${c}</a>`).join('');

  document.getElementById('navbar').innerHTML = `
    <div class="container">
      <div class="nav-top">
        <a class="logo" href="${ROOT}index.html"><i>&hearts;</i> thriftly</a>
        <form class="search" id="form-cari">
          <input id="q" placeholder="Cari jaket, jersey, Nike..." aria-label="Cari produk">
        </form>
        <div class="nav-actions">${kanan}</div>
      </div>
      <nav class="nav-cats">${kategori}<a class="sale" href="${ROOT}pages/products.html?sale=1">Sale</a></nav>
    </div>`;

  // Cari: pindah ke halaman daftar produk membawa kata kunci
  document.getElementById('form-cari').onsubmit = (e) => {
    e.preventDefault();
    location.href = `${ROOT}pages/products.html?q=${encodeURIComponent(document.getElementById('q').value)}`;
  };
  if (u) {
    document.getElementById('btn-logout').onclick = () => { Auth.clear(); location.href = ROOT + 'index.html'; };
  } else {
    document.getElementById('btn-login').onclick = () => openAuth('login');     // dibuat di langkah 3
    document.getElementById('btn-daftar').onclick = () => openAuth('register'); // dibuat di langkah 3
  }
}

// 7. Footer
function renderFooter() {
  document.getElementById('footer').innerHTML =
    '<div class="container"><span>Thriftly &middot; Tugas Akhir E-Commerce Semester 3</span><span>Belanja aman, bayar lewat rekber</span></div>';
}

// 8. Pasang navbar dan footer otomatis di setiap halaman yang punya <div id="navbar"> dan <div id="footer">
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('navbar')) renderNavbar();
  if (document.getElementById('footer')) renderFooter();
});