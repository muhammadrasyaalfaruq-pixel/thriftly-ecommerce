// THRIFTLY - alamat.js : halaman alamat pengiriman

const daftar = document.getElementById('daftar');
const form = document.getElementById('form-alamat');

async function muat() {
  if (!Auth.token) {
    daftar.innerHTML = '<p class="muted">Masuk dulu untuk mengelola alamat. Setelah login, muat ulang halaman (F5).</p><button class="btn" id="btn-masuk">Log in</button>';
    document.getElementById('btn-masuk').onclick = () => openAuth('login');
    return;
  }
  try {
    const rows = await api('/addresses');                  // ambil daftar alamat dari backend
    daftar.innerHTML = rows.length
      ? rows.map((a) => `
          <div class="addr-card ${a.is_default ? 'utama' : ''}">
            <b>${esc(a.recipient_name)}</b>${a.is_default ? '<span class="tag">Utama</span>' : ''}
            <div>${esc(a.phone)}</div>
            <div class="muted">${esc(a.street)}, ${esc(a.city)}, ${esc(a.province)} ${esc(a.postal_code)}</div>
            <div class="aksi">
              ${a.is_default ? '' : `<button data-utama="${a.id}">Jadikan utama</button>`}
              <button data-hapus="${a.id}">Hapus</button>
            </div>
          </div>`).join('')
      : '<p class="muted">Belum ada alamat. Tambahkan lewat formulir.</p>';
  } catch (err) {
    daftar.innerHTML = `<p class="muted">${esc(err.message)}</p>`;
  }
}

// Klik tombol "Jadikan utama" atau "Hapus" (satu penangkap klik untuk seluruh daftar)
daftar.onclick = async (e) => {
  const utama = e.target.dataset.utama;
  const hapus = e.target.dataset.hapus;
  try {
    if (utama) {
      await api(`/addresses/${utama}/default`, { method: 'PATCH' });
      toast('Alamat utama diganti');
    } else if (hapus) {
      await api('/addresses/' + hapus, { method: 'DELETE' });
      toast('Alamat dihapus');
    } else return;
    muat();                                                // gambar ulang daftar
  } catch (err) { toast(err.message); }
};

// Kirim formulir alamat baru
form.onsubmit = async (e) => {
  e.preventDefault();
  if (!Auth.token) return openAuth('login');
  const body = Object.fromEntries(new FormData(form));
  body.is_default = form.is_default.checked;               // kotak centang jadi true/false
  try {
    const data = await api('/addresses', { method: 'POST', body });
    toast(data.message);
    form.reset();
    document.getElementById('err').textContent = '';
    muat();
  } catch (err) {
    document.getElementById('err').textContent = err.message;
  }
};

muat();