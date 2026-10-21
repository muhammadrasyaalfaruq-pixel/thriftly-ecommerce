// THRIFTLY - catalog.js : isi halaman katalog dengan data dari API

// Mengisi kotak "Baru masuk" di beranda dengan produk terbaru
async function muatBeranda() {
  const grid = document.getElementById('grid');
  grid.innerHTML = '<p class="muted">Memuat produk...</p>';
  try {
    const data = await api('/products?limit=10');   // minta 10 produk terbaru ke backend
    grid.innerHTML = data.items.length
      ? data.items.map(productCard).join('')         // ubah tiap produk jadi kartu
      : '<p class="muted">Belum ada produk.</p>';
  } catch (err) {
    grid.innerHTML = `<p class="muted">Gagal memuat produk: ${esc(err.message)}</p>`;
  }
}

muatBeranda();