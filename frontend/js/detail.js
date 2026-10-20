// THRIFTLY - detail.js : halaman detail satu produk

const idProduk = new URLSearchParams(location.search).get('id');   // dari alamat ?id=3
const isi = document.getElementById('isi');

// Tombol yang modulnya belum dibuat: minta login dulu, lalu beri tahu "segera hadir"
function belumAda(nama) {
  if (!Auth.token) return openAuth('login');
  toast(nama + ' segera hadir');
}

async function muat() {
  try {
    const p = await api('/products/' + idProduk);                  // minta data produk ke backend
    document.title = p.name + ' - Thriftly';

    const foto = p.images.length ? p.images : [{ image_url: 'https://placehold.co/600x800?text=Thriftly' }];
    const terjual = p.status === 'sold' || p.stock < 1;
    const rating = p.store.review_count
      ? `&#9733; ${p.store.rating_avg} (${p.store.review_count} ulasan)` : 'Belum ada ulasan';

    isi.innerHTML = `
      <div class="detail">
        <div class="gallery">
          <div class="main"><img id="foto-utama" src="${esc(foto[0].image_url)}" alt="${esc(p.name)}"></div>
          <div class="thumbs">
            ${foto.map((f, i) => `<img src="${esc(f.image_url)}" alt="Foto ${i + 1}" class="${i === 0 ? 'on' : ''}">`).join('')}
          </div>
        </div>
        <div>
          <div class="muted">${esc(p.category)}${p.brand ? ' &rsaquo; ' + esc(p.brand) : ''}</div>
          <h1>${esc(p.name)}</h1>
          <div class="price">${rupiah(p.price)}</div>
          ${terjual ? '<span class="sold">Terjual</span>' : ''}
          <div class="chips">
            <span class="chip">Ukuran ${esc(p.size || '-')}</span>
            <span class="chip">Kondisi: ${KONDISI[p.condition_label] || '-'}</span>
            ${p.is_negotiable ? '<span class="chip">Bisa nego</span>' : ''}
            <span class="chip">&#9825; ${p.wishlist_count}</span>
          </div>
          <p class="desc">${esc(p.description || 'Belum ada deskripsi.')}</p>
          <div class="actions">
            <button class="btn btn-block" id="btn-beli" ${terjual ? 'disabled style="opacity:.4"' : ''}>Beli sekarang</button>
            <div class="baris">
              <button class="btn btn-outline" id="btn-cart" ${terjual ? 'disabled style="opacity:.4"' : ''}>+ Keranjang</button>
              ${p.is_negotiable ? '<button class="btn btn-outline" id="btn-nego">Ajukan nego</button>' : ''}
              <button class="btn btn-outline" id="btn-wish" style="flex:0 0 auto">&#9825;</button>
            </div>
          </div>
          <a class="store-card" href="${ROOT}pages/store.html?slug=${esc(p.store.slug)}">
            <div class="avatar">${esc(p.store.name.slice(0, 2).toUpperCase())}</div>
            <div class="info">
              <b>${esc(p.store.name)}</b>
              <div class="muted">${esc(p.store.city || '')} &middot; ${rating}</div>
            </div>
            <span class="btn btn-outline">Kunjungi toko</span>
          </a>
          <div class="note"><b>Garansi Thriftly</b><br>Pembayaran ditahan sampai kamu konfirmasi barang diterima.</div>
        </div>
      </div>`;

    // Klik thumbnail = ganti foto utama
    isi.querySelectorAll('.thumbs img').forEach((t) => {
      t.onclick = () => {
        document.getElementById('foto-utama').src = t.src;
        isi.querySelectorAll('.thumbs img').forEach((x) => x.classList.remove('on'));
        t.classList.add('on');
      };
    });
    document.getElementById('btn-beli').onclick = () => belumAda('Checkout');
    document.getElementById('btn-cart').onclick = () => belumAda('Keranjang');
    document.getElementById('btn-wish').onclick = () => belumAda('Wishlist');
    const nego = document.getElementById('btn-nego');
    if (nego) nego.onclick = () => belumAda('Nego');
  } catch (err) {
    isi.innerHTML = `<p class="muted" style="padding:28px 0">${esc(err.message)}</p>`;
  }
}

muat();