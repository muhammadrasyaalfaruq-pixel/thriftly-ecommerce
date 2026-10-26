// THRIFTLY - produk.js : halaman daftar produk dengan cari dan filter

const params = new URLSearchParams(location.search);   // isi alamat setelah tanda ?
const grid = document.getElementById('grid');
const form = document.getElementById('filter');
const tombolLagi = document.getElementById('lagi');
const PER_HALAMAN = 15;
let halaman = 1;

// 1. Isi pilihan kategori dan brand dari backend, lalu pilih sesuai alamat
async function isiFilter() {
  const [kat, brand] = await Promise.all([api('/categories'), api('/brands')]);
  form.category.innerHTML = '<option value="">Semua kategori</option>' +
    kat.map((k) => `<option value="${esc(k.slug)}">${k.parent_id ? '— ' : ''}${esc(k.name)}</option>`).join('');
  form.brand.innerHTML = '<option value="">Semua brand</option>' +
    brand.map((b) => `<option value="${esc(b.slug)}">${esc(b.name)}</option>`).join('');

  // Kembalikan pilihan dari alamat ke kotak filter
  for (const nama of ['q', 'category', 'brand', 'condition', 'min', 'max', 'sort']) {
    if (params.get(nama)) form[nama].value = params.get(nama);
  }
  // Judul halaman: hasil pencarian atau nama kategori
  const dipilih = kat.find((k) => k.slug === params.get('category'));
  document.getElementById('judul').textContent = params.get('q')
    ? `Hasil untuk "${params.get('q')}"` : dipilih ? dipilih.name : 'Semua barang';
      if (params.get('branded')) document.getElementById('judul').textContent = 'Branded';
}

// 2. Ambil produk dari backend. Halaman pertama mengganti isi, halaman berikutnya menambah
async function muat() {
  const q = new URLSearchParams(params);
  q.set('page', halaman);
  q.set('limit', PER_HALAMAN);
  try {
    const data = await api('/products?' + q);
    document.getElementById('jumlah').textContent = data.total + ' barang';
    if (halaman === 1 && data.items.length === 0) {
      grid.innerHTML = '<p class="muted">Tidak ada barang yang cocok. Coba ubah filter.</p>';
    } else {
      grid.insertAdjacentHTML('beforeend', data.items.map(productCard).join(''));
    }
    tombolLagi.hidden = halaman * PER_HALAMAN >= data.total;   // sembunyikan kalau sudah habis
  } catch (err) {
    grid.innerHTML = `<p class="muted">Gagal memuat produk: ${esc(err.message)}</p>`;
  }
}

// 3. Tombol "Terapkan": pindah ke alamat baru membawa filter yang dipilih
form.onsubmit = (e) => {
  e.preventDefault();
  const baru = new URLSearchParams();
  for (const [nama, nilai] of new FormData(form)) if (nilai) baru.set(nama, nilai);
  if (params.get('branded')) baru.set('branded', '1');     // jangan hilang saat tombol Terapkan ditekan
  location.search = baru.toString();
};

// 4. Tombol "Lihat lebih banyak"
tombolLagi.onclick = () => { halaman++; muat(); };

isiFilter().then(muat);