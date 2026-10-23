// THRIFTLY - pesanan.js : daftar pesanan milik user

const STATUS = {
  pending_payment: 'Menunggu pembayaran',
  paid: 'Sudah dibayar',
  shipped: 'Dikirim',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};
const isi = document.getElementById('isi');
const tanggal = (t) => new Date(t).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

async function muat() {
  if (!Auth.token) {
    isi.innerHTML = '<div class="kosong"><p>Masuk dulu untuk melihat pesananmu. Setelah login, muat ulang halaman (F5).</p><button class="btn" id="btn-masuk">Log in</button></div>';
    document.getElementById('btn-masuk').onclick = () => openAuth('login');
    return;
  }
  try {
    const rows = await api('/orders');                     // ambil semua pesanan dari backend
    if (!rows.length) {
      isi.innerHTML = `<div class="kosong"><p>Kamu belum punya pesanan.</p><a class="btn" href="${ROOT}pages/products.html">Mulai belanja</a></div>`;
      return;
    }
    isi.innerHTML = rows.map((o) => `
      <a class="ord-card" href="${ROOT}pages/order-detail.html?id=${o.id}">
        <img src="${esc(o.image || 'https://placehold.co/128x164?text=Thriftly')}" alt="">
        <div class="info">
          <b>${esc(o.order_code)}</b>
          <div class="muted">${esc(o.store_name)} &middot; ${o.item_count} barang &middot; ${tanggal(o.created_at)}</div>
        </div>
        <div class="kanan">
          <span class="badge ${esc(o.status)}">${STATUS[o.status] || esc(o.status)}</span>
          <div><b>${rupiah(o.total_price)}</b></div>
        </div>
      </a>`).join('');
  } catch (err) {
    isi.innerHTML = `<div class="kosong"><p>${esc(err.message)}</p></div>`;
  }
}

muat();