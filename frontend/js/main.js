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