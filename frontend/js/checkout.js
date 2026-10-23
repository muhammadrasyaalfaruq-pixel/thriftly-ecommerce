// THRIFTLY - checkout.js : halaman checkout satu toko

const idToko = new URLSearchParams(location.search).get('store');   // dari alamat ?store=1
const isi = document.getElementById('isi');

function pesan(teks, tombol, tujuan) {
  isi.innerHTML = `<div class="kosong"><p>${teks}</p><a class="btn" href="${tujuan}">${tombol}</a></div>`;
}

async function muat() {
  if (!Auth.token) {
    isi.innerHTML = '<div class="kosong"><p>Masuk dulu untuk checkout. Setelah login, muat ulang halaman (F5).</p><button class="btn" id="btn-masuk">Log in</button></div>';
    document.getElementById('btn-masuk').onclick = () => openAuth('login');
    return;
  }
  if (!idToko) return pesan('Pilih toko dari keranjang dulu.', 'Ke keranjang', ROOT + 'pages/cart.html');
  try {
    // Dua data diminta bersamaan: ringkasan checkout toko, dan daftar alamat user
    const [co, alamat] = await Promise.all([api('/checkout/' + idToko), api('/addresses')]);
    if (!co.items.length) {
      return pesan('Tidak ada barang tersedia dari toko ini di keranjangmu.', 'Ke keranjang', ROOT + 'pages/cart.html');
    }
    tampil(co, alamat);
  } catch (err) {
    isi.innerHTML = `<div class="kosong"><p>${esc(err.message)}</p></div>`;
  }
}

function tampil(co, alamat) {
  let kurirDipilih = co.couriers[0].kode;                                   // kurir pertama jadi pilihan awal
  let alamatDipilih = (alamat.find((a) => a.is_default) || alamat[0] || {}).id;   // alamat utama jadi pilihan awal

  isi.innerHTML = `
    <div class="co-grid">
      <div>
        <div class="co-card">
          <h3>Alamat pengiriman</h3>
          ${alamat.length
            ? alamat.map((a) => `
                <label class="pilihan">
                  <input type="radio" name="alamat" value="${a.id}" ${a.id === alamatDipilih ? 'checked' : ''}>
                  <b>${esc(a.recipient_name)}</b>${a.is_default ? ' (utama)' : ''}
                  <div class="muted">${esc(a.phone)} &middot; ${esc(a.street)}, ${esc(a.city)}, ${esc(a.province)} ${esc(a.postal_code)}</div>
                </label>`).join('')
            : '<p class="muted">Kamu belum punya alamat pengiriman.</p>'}
          <a class="link" href="${ROOT}pages/addresses.html">${alamat.length ? 'Kelola alamat' : 'Tambah alamat dulu'}</a>
        </div>

        <div class="co-card">
          <h3>Pesanan dari ${esc(co.store.name)}</h3>
          ${co.items.map((i) => `
            <div class="co-item">
              <img src="${esc(i.image || 'https://placehold.co/128x164?text=Thriftly')}" alt="${esc(i.name)}">
              <div class="info">
                <div><b>${esc(i.name)}</b></div>
                <div class="muted">${esc(i.brand || 'Vintage')} &middot; ${esc(i.size || '-')} &middot; ${KONDISI[i.condition_label] || ''}</div>
              </div>
              <b>${rupiah(i.price)}</b>
            </div>`).join('')}
        </div>

        <div class="co-card">
          <h3>Kurir</h3>
          ${co.couriers.map((k) => `
            <label class="pilihan">
              <input type="radio" name="kurir" value="${k.kode}" ${k.kode === kurirDipilih ? 'checked' : ''}>
              <b>${esc(k.nama)}</b> &middot; ${rupiah(k.ongkir)}
            </label>`).join('')}
        </div>

        <div class="co-card">
          <h3>Pembayaran</h3>
          <p class="muted">Pembayaran dikerjakan di tahap berikutnya. Setelah pesanan dibuat, statusnya <b>Menunggu pembayaran</b>.
          Barang langsung dikunci untukmu, dan pesanan yang belum dibayar bisa dibatalkan.</p>
        </div>
      </div>

      <div class="co-sum">
        <b>Ringkasan</b>
        <div class="baris"><span>Subtotal (${co.items.length} barang)</span><span>${rupiah(co.subtotal)}</span></div>
        <div class="baris"><span>Ongkir</span><span id="ongkir"></span></div>
        <div class="baris total"><span>Total</span><span id="total"></span></div>
        <button class="btn btn-block" id="btn-pesan" ${alamat.length ? '' : 'disabled'}>Buat pesanan</button>
      </div>
    </div>`;

  // Hitung ongkir dan total sesuai kurir, lalu tandai pilihan yang aktif
  function sinkron() {
    const k = co.couriers.find((x) => x.kode === kurirDipilih);
    document.getElementById('ongkir').textContent = rupiah(k.ongkir);
    document.getElementById('total').textContent = rupiah(co.subtotal + k.ongkir);
    isi.querySelectorAll('.pilihan').forEach((l) => l.classList.toggle('on', l.querySelector('input').checked));
  }
  isi.onchange = (e) => {
    if (e.target.name === 'kurir') kurirDipilih = e.target.value;
    if (e.target.name === 'alamat') alamatDipilih = Number(e.target.value);
    sinkron();
  };
  sinkron();

  // Tombol Buat pesanan
  document.getElementById('btn-pesan').onclick = async (e) => {
    const tombol = e.target;
    tombol.disabled = true;                                  // cegah klik ganda
    try {
      const data = await api('/orders', {
        method: 'POST',
        body: { store_id: Number(idToko), address_id: alamatDipilih, courier: kurirDipilih },
      });
      isi.innerHTML = `
        <div class="co-ok">
          <h2>Pesanan dibuat</h2>
          <p class="muted">Kode pesanan</p>
          <div class="kode">${esc(data.order.order_code)}</div>
          <p>Total ${rupiah(data.order.total_price)} &middot; Status: Menunggu pembayaran</p>
          <a class="btn" href="${ROOT}pages/orders.html">Lihat pesanan saya</a>
          <a class="btn btn-outline" href="${ROOT}index.html">Lanjut belanja</a>
        </div>`;
    } catch (err) {
      toast(err.message);                                    // contoh: "Alamat tidak valid"
      tombol.disabled = false;
    }
  };
}

muat();