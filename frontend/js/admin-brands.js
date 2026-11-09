// THRIFTLY - admin-brands.js : Kelola merek/brand (Admin)

if (renderPanel('admin', 'merek')) {
  let editingId = null;
  let allBrands = [];

  // Muat daftar brand dari API
  async function loadBrands() {
    try {
      allBrands = await api('/admin/brands');
      renderTable();
    } catch (err) {
      toast('Error: ' + err.message);
    }
  }

  // Render tabel brand
  function renderTable() {
    const tbody = document.getElementById('tbl-body');
    if (allBrands.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#999;">Tidak ada merek</td></tr>';
      return;
    }

    tbody.innerHTML = allBrands.map(b => `
      <tr>
        <td>${b.id}</td>
        <td><strong>${esc(b.name)}</strong></td>
        <td><code>${b.slug}</code></td>
        <td>
          <div class="aksi-btn">
            <button class="btn btn-edit" data-edit="${b.id}">Edit</button>
            <button class="btn btn-hapus" data-hapus="${b.id}">Hapus</button>
          </div>
        </td>
      </tr>
    `).join('');

    // Listener tombol Edit & Hapus
    document.querySelectorAll('[data-edit]').forEach(btn => {
      btn.onclick = () => editBrand(Number(btn.dataset.edit));
    });
    document.querySelectorAll('[data-hapus]').forEach(btn => {
      btn.onclick = () => deleteBrand(Number(btn.dataset.hapus), esc(allBrands.find(b => b.id === Number(btn.dataset.hapus))?.name || 'Merek'));
    });
  }

  // Reset form untuk tambah baru
  function resetForm() {
    editingId = null;
    document.getElementById('form-judul').textContent = 'Tambah Merek Baru';
    document.getElementById('form-brand').reset();
    document.getElementById('btn-batal').style.display = 'none';
    document.getElementById('form-error').textContent = '';
  }

  // Edit brand: isi form dengan data yang ada
  function editBrand(id) {
    const brand = allBrands.find(b => b.id === id);
    if (!brand) return;

    editingId = id;
    document.getElementById('form-judul').textContent = `Edit Merek: ${esc(brand.name)}`;
    document.getElementById('input-nama').value = brand.name;
    document.getElementById('btn-batal').style.display = 'inline-block';

    // Scroll ke form
    document.getElementById('form-card').scrollIntoView({ behavior: 'smooth' });
  }

  // Simpan brand (tambah atau edit)
  document.getElementById('form-brand').onsubmit = async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('form-error');
    errEl.textContent = '';

    const name = document.getElementById('input-nama').value.trim();

    if (!name) {
      errEl.textContent = 'Nama merek wajib diisi';
      return;
    }

    try {
      const body = { name };

      if (editingId) {
        // Edit
        await api(`/admin/brands/${editingId}`, { method: 'PUT', body });
        toast('Merek berhasil diperbarui');
      } else {
        // Tambah baru
        await api('/admin/brands', { method: 'POST', body });
        toast('Merek berhasil ditambahkan');
      }

      resetForm();
      loadBrands();
    } catch (err) {
      errEl.textContent = err.message;
    }
  };

  // Tombol Batal
  document.getElementById('btn-batal').onclick = () => resetForm();

  // Hapus brand
  async function deleteBrand(id, nama) {
    if (!confirm(`Yakin hapus merek "${nama}"?`)) return;

    try {
      await api(`/admin/brands/${id}`, { method: 'DELETE' });
      toast('Merek berhasil dihapus');
      loadBrands();
    } catch (err) {
      toast('Error: ' + err.message);
    }
  }

  // Muat saat halaman dibuka
  loadBrands();
}
