// THRIFTLY - wishlist.js : halaman wishlist

const isi = document.getElementById('isi');

async function muat() {
  if (!Auth.token) {
    isi.innerHTML = '<div class="kosong"><p>Masuk dulu untuk melihat wishlist. Setelah login, muat ulang halaman (F5).</p><button class="btn" id="btn-masuk">Log in</button></div>';
    document.getElementById('btn-masuk').onclick = () => openAuth('login');
    return;
  }
  try {
    const data = await api('/wishlist');                    // ambil wishlist dari backend
    document.getElementById('jumlah').textContent = data.count ? data.count + ' barang' : '';
    if (!data.items.length) {
      isi.innerHTML = `<div class="kosong"><p>Wishlist-mu masih kosong.</p><a class="btn" href="${ROOT}pages/products.html">Cari barang</a></div>`;
      return;
    }
    // Tiap barang dibungkus supaya ada tombol Hapus di bawah kartunya
    isi.innerHTML = '<div class="grid5">' + data.items.map((p) => `
      <div class="wl-item">
        ${p.status === 'sold' ? '<span class="tag-terjual">Terjual</span>' : ''}
        ${productCard(p)}
        <button class="hapus" data-id="${p.id}">Hapus dari wishlist</button>
      </div>`).join('') + '</div>';

    isi.querySelectorAll('.hapus').forEach((b) => {
      b.onclick = async () => {
        try {
          await api('/wishlist/' + b.dataset.id, { method: 'DELETE' });
          toast('Dihapus dari wishlist');
          muat();                                           // gambar ulang daftar
        } catch (err) { toast(err.message); }
      };
    });
  } catch (err) {
    isi.innerHTML = `<div class="kosong"><p>${esc(err.message)}</p></div>`;
  }
}

muat();