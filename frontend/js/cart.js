// THRIFTLY - cart.js : halaman keranjang belanja

const isi = document.getElementById('isi');

function pesanKosong(teks, tombol, tujuan) {
  isi.innerHTML = `<div class="kosong"><p>${teks}</p><a class="btn" href="${tujuan}">${tombol}</a></div>`;
}

async function muat() {
  // Keranjang hanya untuk user yang sudah login
  if (!Auth.token) {
    isi.innerHTML = '<div class="kosong"><p>Masuk dulu untuk melihat keranjangmu. Setelah login, muat ulang halaman (F5).</p><button class="btn" id="btn-masuk">Log in</button></div>';
    document.getElementById('btn-masuk').onclick = () => openAuth('login');
    return;
  }
  try {
    const data = await api('/cart');                       // ambil isi keranjang dari backend
    document.getElementById('jumlah').textContent = data.count ? data.count + ' barang' : '';
    if (!data.items.length) {
      return pesanKosong('Keranjangmu masih kosong.', 'Belanja sekarang', ROOT + 'pages/products.html');
    }

    // Kelompokkan barang per toko
    const toko = {};
    data.items.forEach((i) => {
      (toko[i.store_id] = toko[i.store_id] || { nama: i.store_name, slug: i.store_slug, items: [] }).items.push(i);
    });

    const kartuToko = Object.entries(toko).map(([id, t]) => {
      const tersedia = t.items.filter((i) => i.status === 'active' && i.stock > 0);
      const subtotal = tersedia.reduce((jumlah, i) => jumlah + i.price, 0);
      const baris = t.items.map((i) => {
        const habis = !(i.status === 'active' && i.stock > 0);
        return `<div class="cart-row ${habis ? 'habis' : ''}">
          <img src="${esc(i.image || 'https://placehold.co/144x184?text=Thriftly')}" alt="${esc(i.name)}">
          <div class="info">
            <a class="nama" href="${ROOT}pages/product-detail.html?id=${i.product_id}">${esc(i.name)}</a>
            <div class="muted">${esc(i.brand || 'Vintage')} &middot; ${esc(i.size || '-')} &middot; ${KONDISI[i.condition_label] || ''}${habis ? ' &middot; <b>Terjual</b>' : ''}</div>
          </div>
          <b>${rupiah(i.price)}</b>
          <button class="hapus" data-id="${i.product_id}">Hapus</button>
        </div>`;
      }).join('');
      return `<div class="cart-store">
        <h3><a href="${ROOT}pages/store.html?slug=${esc(t.slug)}">${esc(t.nama)}</a></h3>
        ${baris}
        <div class="cart-foot">
          <span>Subtotal toko: <b>${rupiah(subtotal)}</b></span>
          ${tersedia.length
            ? `<a class="btn" href="${ROOT}pages/checkout.html?store=${id}">Checkout toko ini</a>`
            : '<span class="muted">Tidak ada barang tersedia</span>'}
        </div>
      </div>`;
    }).join('');

    isi.innerHTML = `<div class="cart-grid">
      <div>${kartuToko}</div>
      <div class="summary">
        <b>Ringkasan</b>
        <div class="baris"><span>Total barang tersedia</span><span>${rupiah(data.subtotal)}</span></div>
        <div class="baris muted"><span>Ongkir</span><span>dihitung saat checkout</span></div>
        <div class="baris total"><span>Total</span><span>${rupiah(data.subtotal)}</span></div>
        <p class="muted" style="margin-top:14px">Checkout dilakukan per toko. Barang thrift hanya 1 buah, jadi jumlah tidak bisa ditambah.</p>
      </div>
    </div>`;

    // Tombol Hapus
    isi.querySelectorAll('.hapus').forEach((b) => {
      b.onclick = async () => {
        try {
          await api('/cart/' + b.dataset.id, { method: 'DELETE' });
          toast('Dihapus dari keranjang');
          muat();                                          // gambar ulang keranjang
        } catch (err) { toast(err.message); }
      };
    });
  } catch (err) {
    isi.innerHTML = `<div class="kosong"><p>${esc(err.message)}</p></div>`;
  }
}

muat();