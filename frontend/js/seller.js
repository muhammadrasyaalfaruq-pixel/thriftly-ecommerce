// THRIFTLY - seller.js : dashboard penjual dan form produk (tampilan)

const halaman = document.body.dataset.halaman;        // 'dashboard' atau 'produk', diisi di <body>

// renderPanel (milik Rasya) menggambar sidebar dan memeriksa izin masuk
if (renderPanel('seller', halaman)) {
  if (halaman === 'dashboard') {
    document.getElementById('sapa').textContent = 'Halo, ' + Auth.user.name.split(' ')[0];
  } else {
    isiForm();
  }
}

async function isiForm() {
  try {
    // Pilihan kategori dan brand diambil dari backend
    const [kat, brand] = await Promise.all([api('/categories'), api('/brands')]);
    const induk = new Set(kat.map((k) => k.parent_id));                  // kategori yang punya anak
    document.getElementById('kategori').innerHTML = '<option value="">Pilih kategori</option>' +
      kat.filter((k) => !induk.has(k.id))                                // hanya kategori paling bawah
         .map((k) => `<option value="${k.id}">${esc(k.name)}</option>`).join('');
    document.getElementById('brand').innerHTML = '<option value="">Tanpa brand</option>' +
      brand.map((b) => `<option value="${b.id}">${esc(b.name)}</option>`).join('');
  } catch (err) { toast(err.message); }

  document.getElementById('form-produk').onsubmit = (e) => {
    e.preventDefault();                                                  // belum dikirim ke server
    toast('Simpan produk menyusul setelah UTS');
  };
}