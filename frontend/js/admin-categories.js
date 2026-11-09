// THRIFTLY - admin-categories.js : Kelola kategori (Admin)

if (renderPanel('admin', 'kategori')) {
  let editingId = null;
  let allCategories = [];

  // Muat daftar kategori dari API
  async function loadCategories() {
    try {
      allCategories = await api('/admin/categories');
      renderTable();
      renderParentOptions();
    } catch (err) {
      toast('Error: ' + err.message);
    }
  }

  // Render tabel kategori
  function renderTable() {
    const tbody = document.getElementById('tbl-body');
    if (allCategories.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#999;">Tidak ada kategori</td></tr>';
      return;
    }

    tbody.innerHTML = allCategories.map(cat => `
      <tr>
        <td>${cat.id}</td>
        <td><strong>${esc(cat.name)}</strong></td>
        <td><code>${cat.slug}</code></td>
        <td>${cat.parent_name ? esc(cat.parent_name) : '-'}</td>
        <td>
          <div class="aksi-btn">
            <button class="btn btn-edit" data-edit="${cat.id}">Edit</button>
            <button class="btn btn-hapus" data-hapus="${cat.id}">Hapus</button>
          </div>
        </td>
      </tr>
    `).join('');

    // Listener tombol Edit & Hapus
    document.querySelectorAll('[data-edit]').forEach(btn => {
      btn.onclick = () => editCategory(Number(btn.dataset.edit));
    });
    document.querySelectorAll('[data-hapus]').forEach(btn => {
      btn.onclick = () => deleteCategory(Number(btn.dataset.hapus), esc(allCategories.find(c => c.id === Number(btn.dataset.hapus))?.name || 'Kategori'));
    });
  }

  // Render pilihan kategori induk di dropdown
  function renderParentOptions() {
    const parentSelect = document.getElementById('input-parent');
    const categoryOptions = allCategories
      .filter(c => !editingId || c.id !== editingId) // jangan tampilkan diri sendiri
      .map(c => `<option value="${c.id}">${esc(c.name)}</option>`)
      .join('');

    parentSelect.innerHTML = '<option value="">-- Tidak ada (kategori utama) --</option>' + categoryOptions;
  }

  // Reset form untuk tambah baru
  function resetForm() {
    editingId = null;
    document.getElementById('form-judul').textContent = 'Tambah Kategori Baru';
    document.getElementById('form-kategori').reset();
    document.getElementById('btn-batal').style.display = 'none';
    document.getElementById('form-error').textContent = '';
    document.getElementById('induk-info').textContent = '';
  }

  // Edit kategori: isi form dengan data yang ada
  function editCategory(id) {
    const cat = allCategories.find(c => c.id === id);
    if (!cat) return;

    editingId = id;
    document.getElementById('form-judul').textContent = `Edit Kategori: ${esc(cat.name)}`;
    document.getElementById('input-nama').value = cat.name;
    document.getElementById('input-parent').value = cat.parent_id || '';
    document.getElementById('btn-batal').style.display = 'inline-block';

    if (cat.parent_name) {
      document.getElementById('induk-info').textContent = `Induk saat ini: ${esc(cat.parent_name)}`;
    }

    // Scroll ke form
    document.getElementById('form-card').scrollIntoView({ behavior: 'smooth' });
  }

  // Simpan kategori (tambah atau edit)
  document.getElementById('form-kategori').onsubmit = async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('form-error');
    errEl.textContent = '';

    const name = document.getElementById('input-nama').value.trim();
    const parentId = document.getElementById('input-parent').value;

    if (!name) {
      errEl.textContent = 'Nama kategori wajib diisi';
      return;
    }

    try {
      const body = { name };
      if (parentId) body.parent_id = Number(parentId);

      if (editingId) {
        // Edit
        await api(`/admin/categories/${editingId}`, { method: 'PUT', body });
        toast('Kategori berhasil diperbarui');
      } else {
        // Tambah baru
        await api('/admin/categories', { method: 'POST', body });
        toast('Kategori berhasil ditambahkan');
      }

      resetForm();
      loadCategories();
    } catch (err) {
      errEl.textContent = err.message;
    }
  };

  // Tombol Batal
  document.getElementById('btn-batal').onclick = () => resetForm();

  // Hapus kategori
  async function deleteCategory(id, nama) {
    if (!confirm(`Yakin hapus kategori "${nama}"?`)) return;

    try {
      await api(`/admin/categories/${id}`, { method: 'DELETE' });
      toast('Kategori berhasil dihapus');
      loadCategories();
    } catch (err) {
      toast('Error: ' + err.message);
    }
  }

  // Muat saat halaman dibuka
  loadCategories();
}
