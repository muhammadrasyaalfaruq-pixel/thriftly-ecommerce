// THRIFTLY - pesanan-detail.js : detail satu pesanan

const STATUS = {
  pending_payment: 'Menunggu pembayaran',
  paid: 'Sudah dibayar',
  shipped: 'Dikirim',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};
const idPesanan = new URLSearchParams(location.search).get('id');   // dari alamat ?id=3
const isi = document.getElementById('isi');
const tanggal = (t) => new Date(t).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

async function muat() {
  if (!Auth.token) {
    isi.innerHTML = '<div class="kosong"><p>Masuk dulu untuk melihat pesananmu. Setelah login, muat ulang halaman (F5).</p><button class="btn" id="btn-masuk">Log in</button></div>';
    document.getElementById('btn-masuk').onclick = () => openAuth('login');
    return;
  }
  try {
    const o = await api('/orders/' + idPesanan);           // detail satu pesanan dari backend
    document.title = o.order_code + ' - Thriftly';
    const bisaBatal = o.status === 'pending_payment';

    isi.innerHTML = `
      <div class="ord-head" style="margin-top:24px">
        <div>
          <h1>${esc(o.order_code)}</h1>
          <div class="muted">${tanggal(o.created_at)} &middot; <a href="${ROOT}pages/store.html?slug=${esc(o.store_slug)}">${esc(o.store_name)}</a></div>
        </div>
        <span class="badge ${esc(o.status)}">${STATUS[o.status] || esc(o.status)}</span>
      </div>

      <div class="ord-det">
        <div>
          <div class="co-card">
            <h3>Barang</h3>
            ${o.items.map((i) => `
              <div class="co-item">
                <img src="${esc(i.image || 'https://placehold.co/128x164?text=Thriftly')}" alt="${esc(i.name)}">
                <div class="info">
                  <a href="${ROOT}pages/product-detail.html?id=${i.product_id}"><b>${esc(i.name)}</b></a>
                  <div class="muted">${esc(i.brand || 'Vintage')} &middot; ${esc(i.size || '-')} &middot; ${KONDISI[i.condition_label] || ''}</div>
                </div>
                <b>${rupiah(i.price)}</b>
              </div>`).join('')}
          </div>

          <div class="co-card ord-info">
            <h3>Pengiriman</h3>
            <p><b>${esc(o.recipient_name)}</b> &middot; ${esc(o.phone)}</p>
            <p class="muted">${esc(o.street)}, ${esc(o.city)}, ${esc(o.province)} ${esc(o.postal_code)}</p>
            <p>Kurir: ${esc(o.courier || '-')}</p>
            <p>Nomor resi: ${o.tracking_number ? '<b>' + esc(o.tracking_number) + '</b>' : '<span class="muted">belum ada</span>'}</p>
          </div>
        </div>

        <div class="co-sum">
          <b>Ringkasan</b>
          <div class="baris"><span>Subtotal</span><span>${rupiah(o.subtotal)}</span></div>
          <div class="baris"><span>Ongkir</span><span>${rupiah(o.shipping_cost)}</span></div>
          <div class="baris total"><span>Total</span><span>${rupiah(o.total_price)}</span></div>
          <p class="muted" style="margin-top:14px">${
            o.payment
              ? 'Pembayaran: ' + esc(o.payment.method) + ' (' + esc(o.payment.status) + ')'
              : o.status === 'cancelled' ? 'Pesanan dibatalkan.' : 'Belum ada pembayaran. Fitur pembayaran menyusul.'
          }</p>
          ${bisaBatal ? '<button class="btn btn-block btn-outline" id="btn-batal">Batalkan pesanan</button>' : ''}
          <a class="btn btn-block" style="margin-top:10px" href="${ROOT}pages/orders.html">Kembali ke pesanan</a>
        </div>
      </div>`;

    const batal = document.getElementById('btn-batal');
    if (batal) {
      batal.onclick = async () => {
        if (!confirm('Batalkan pesanan ini? Barangnya akan tersedia lagi untuk orang lain.')) return;
        try {
          const data = await api(`/orders/${o.id}/cancel`, { method: 'POST' });
          toast(data.message);
          muat();                                            // gambar ulang dengan status baru
        } catch (err) { toast(err.message); }
      };
    }
  } catch (err) {
    isi.innerHTML = `<div class="kosong"><p>${esc(err.message)}</p><a class="btn" href="${ROOT}pages/orders.html">Kembali ke pesanan</a></div>`;
  }
}

muat();