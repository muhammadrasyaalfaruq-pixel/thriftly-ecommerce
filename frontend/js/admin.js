// THRIFTLY - admin.js : dashboard admin (tampilan)

// renderPanel('admin', ...) hanya meloloskan akun dengan role admin
if (renderPanel('admin', 'dashboard')) {
  // Satu angka asli: jumlah produk aktif dari API
  api('/products?limit=1')
    .then((d) => { document.getElementById('stat-produk').textContent = d.total; })
    .catch(() => {});

  // Tombol yang fiturnya belum dibuat
  document.querySelectorAll('[data-menyusul]').forEach((b) => {
    b.onclick = () => toast('Fitur ini menyusul setelah UTS');
  });
}