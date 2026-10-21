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

// 9. Notifikasi kecil di bawah layar
function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

// 10. Modal login / daftar. openAuth('login') atau openAuth('register')
function openAuth(mode) {
  const isLogin = mode === 'login';
  const box = document.createElement('div');
  box.className = 'overlay';
  box.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <button class="close" aria-label="Tutup">&times;</button>
      <h2>${isLogin ? 'Masuk akun Thriftly<br>buat jual, beli &amp; nego' : 'Bikin akun di Thriftly,<br>langsung bisa jual &amp; beli'}</h2>
      <div class="sub">${isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'} <a id="ganti">${isLogin ? 'Daftar' : 'Masuk'}</a></div>
      <form id="form-auth">
        ${isLogin ? '' : '<input class="field" name="name" placeholder="Nama lengkap" required>'}
        <input class="field" name="email" type="email" placeholder="Email" required>
        <input class="field" name="password" type="password" placeholder="Password (min. 6 karakter)" required>
        <div class="form-error" id="err"></div>
        <button class="btn btn-block">${isLogin ? 'Masuk' : 'Daftar'}</button>
      </form>
    </div>`;
  document.body.appendChild(box);

  const tutup = () => box.remove();
  box.querySelector('.close').onclick = tutup;
  box.onclick = (e) => { if (e.target === box) tutup(); };           // klik area gelap = tutup
  box.querySelector('#ganti').onclick = () => { tutup(); openAuth(isLogin ? 'register' : 'login'); };

  box.querySelector('#form-auth').onsubmit = async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target));          // ambil isi form
    try {
      const data = await api(isLogin ? '/auth/login' : '/auth/register', { method: 'POST', body });
      Auth.save(data.token, data.user);                               // simpan status login
      tutup();
      renderNavbar();                                                 // navbar berubah jadi tampilan login
      toast(data.message);
    } catch (err) {
      box.querySelector('#err').textContent = err.message;            // tampilkan pesan error dari backend
    }
  };
}

// 11. Kartu produk yang sama untuk SEMUA halaman. Pakai: productCard(p)
// p = { id, name, brand, size, condition_label, price, image, wishlist_count, is_negotiable }
const KONDISI = { like_new: 'Sangat baik', good: 'Baik', fair: 'Cukup' };

function productCard(p) {
  const foto = p.image || 'https://placehold.co/600x800?text=Thriftly';
  return `
    <a class="pcard" href="${ROOT}pages/product-detail.html?id=${p.id}">
      <div class="thumb">
        <img src="${esc(foto)}" alt="${esc(p.name)}" loading="lazy">
        ${p.is_negotiable ? '<span class="nego">Bisa nego</span>' : ''}
        <span class="heart">&#9825; ${p.wishlist_count || 0}</span>
      </div>
      <div class="brand">${esc(p.brand || 'Vintage')}</div>
      <div class="detail">${esc(p.size || '-')} &middot; ${KONDISI[p.condition_label] || ''}</div>
      <div class="price">${rupiah(p.price)}</div>
    </a>`;
}