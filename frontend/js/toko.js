// THRIFTLY - toko.js : profil publik satu toko

const slug = new URLSearchParams(location.search).get('slug');   // dari alamat ?slug=rasya-vintage
const isi = document.getElementById('isi');

async function muat() {
  if (!slug) {
    isi.innerHTML = `<div class="kosong"><p>Toko tidak dipilih.</p><a class="btn" href="${ROOT}index.html">Ke beranda</a></div>`;
    return;
  }
  try {
    const data = await api('/stores/' + encodeURIComponent(slug));   // data toko dan barangnya dari backend
    const s = data.store;
    document.title = s.name + ' - Thriftly';

    const tersedia = data.items.filter((i) => i.status === 'active');
    const terjual = data.items.filter((i) => i.status !== 'active');
    const rating = s.review_count
      ? `&#9733; ${s.rating_avg} (${s.review_count} ulasan)` : 'Belum ada ulasan';
    const gabung = new Date(s.created_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    isi.innerHTML = `
      <div class="store-head">
        <div class="store-avatar">${esc(s.name.slice(0, 2).toUpperCase())}</div>
        <div class="store-info">
          <h1>${esc(s.name)}</h1>
          <div class="muted">${esc(s.city || '')} &middot; ${rating} &middot; Bergabung ${gabung}</div>
          <p>${esc(s.bio || 'Penjual ini belum menulis bio.')}</p>
        </div>
        <div class="store-stat"><b>${data.active_count}</b><span class="muted">barang tersedia</span></div>
      </div>

      <div class="section-title"><h2>Barang tersedia</h2></div>
      ${tersedia.length
        ? `<div class="grid5">${tersedia.map(productCard).join('')}</div>`
        : '<p class="muted">Belum ada barang tersedia.</p>'}

      ${terjual.length
        ? `<div class="section-title"><h2>Sudah terjual</h2></div>
           <div class="grid5 pudar">${terjual.map(productCard).join('')}</div>`
        : ''}`;
  } catch (err) {
    isi.innerHTML = `<div class="kosong"><p>${esc(err.message)}</p><a class="btn" href="${ROOT}index.html">Ke beranda</a></div>`;
  }
}

muat();