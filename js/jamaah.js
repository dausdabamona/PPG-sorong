/**
 * ============================================================================
 * JAMAAH.JS - Updated for New Database Schema
 * ============================================================================
 * 
 * Perubahan utama:
 * - santri → jamaah
 * - orang_tua → relasi_keluarga
 * - jenjang langsung → enrollment → jenjang
 * - Tambah fase_kehidupan
 */

// ============================================================================
// GLOBAL VARIABLES
// ============================================================================

let allJamaah = [];
let filteredJamaah = [];
let currentPage = 1;
const itemsPerPage = 20;

// ============================================================================
// LOAD DATA
// ============================================================================

async function loadJamaah() {
  try {
    showLoading(true);
    
    // Get filter values
    const filterStatus = document.getElementById('filterStatus').value;
    const filterDesa = document.getElementById('filterDesa').value;
    const filterKelompok = document.getElementById('filterKelompok').value;
    const filterJenjang = document.getElementById('filterJenjang').value;
    const filterFase = document.getElementById('filterFase').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    // Build query
    let query = db
      .from('jamaah')
      .select(`
        *,
        fase_kehidupan!inner(
          fase,
          is_fase_aktif,
          tanggal_mulai,
          detail_fase
        ),
        enrollment(
          id,
          status,
          jenjang(id, nama, kode),
          wilayah(
            id,
            nama,
            tingkat,
            kode,
            parent:wilayah!parent_id(nama, tingkat)
          )
        )
      `)
      .eq('fase_kehidupan.is_fase_aktif', true)
      .order('nama', { ascending: true });
    
    // Apply filters
    if (filterStatus) {
      query = query.eq('status_aktif', filterStatus);
    }
    
    if (filterFase) {
      query = query.eq('fase_kehidupan.fase', filterFase);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Process data
    allJamaah = data.map(j => {
      // Get active enrollment
      const enrollment = j.enrollment?.find(e => e.status === 'aktif') || null;
      const fase = j.fase_kehidupan?.[0] || null;
      
      return {
        ...j,
        currentFase: fase?.fase || '-',
        currentJenjang: enrollment?.jenjang?.nama || '-',
        currentJenjangId: enrollment?.jenjang?.id || null,
        currentWilayah: enrollment?.wilayah?.nama || '-',
        currentWilayahId: enrollment?.wilayah?.id || null,
        currentWilayahTingkat: enrollment?.wilayah?.tingkat || null,
        parentWilayah: enrollment?.wilayah?.parent?.nama || '-',
        umur: calculateAge(j.tanggal_lahir)
      };
    });
    
    // Apply client-side filters
    filteredJamaah = allJamaah.filter(j => {
      // Filter desa
      if (filterDesa && j.currentWilayahTingkat === 'desa' && j.currentWilayahId != filterDesa) {
        return false;
      }
      if (filterDesa && j.currentWilayahTingkat === 'kelompok' && j.enrollment[0]?.wilayah?.parent_id != filterDesa) {
        return false;
      }
      
      // Filter kelompok
      if (filterKelompok && j.currentWilayahId != filterKelompok) {
        return false;
      }
      
      // Filter jenjang
      if (filterJenjang && j.currentJenjangId != filterJenjang) {
        return false;
      }
      
      // Search
      if (searchTerm) {
        const searchableText = `${j.nama} ${j.nomor_induk} ${j.phone || ''}`.toLowerCase();
        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }
      
      return true;
    });
    
    // Update stats
    updateStats();
    
    // Render table
    renderTable();
    
  } catch (error) {
    console.error('Error loading jamaah:', error);
    showAlert('Error loading data: ' + error.message, 'error');
  } finally {
    showLoading(false);
  }
}

// ============================================================================
// RENDER TABLE
// ============================================================================

function renderTable() {
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageData = filteredJamaah.slice(start, end);
  
  const tbody = document.getElementById('tableBody');
  
  if (pageData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align: center; padding: 2rem;">
          <div style="color: #64748b;">
            <div style="font-size: 3rem;">📭</div>
            <div style="margin-top: 1rem;">Tidak ada data jamaah</div>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = pageData.map((j, idx) => `
    <tr>
      <td>${start + idx + 1}</td>
      <td>
        <span style="font-family: monospace; font-size: 0.85rem; color: #64748b;">
          ${j.nomor_induk || '-'}
        </span>
      </td>
      <td><strong>${j.nama}</strong></td>
      <td>
        <span style="display: flex; align-items: center; gap: 0.5rem;">
          ${j.jenis_kelamin === 'L' ? '👦' : '👧'}
          ${j.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
        </span>
      </td>
      <td>${j.umur} tahun</td>
      <td>
        <span class="badge badge-${getBadgeFase(j.currentFase)}">
          ${j.currentFase}
        </span>
      </td>
      <td>${j.currentJenjang}</td>
      <td>
        <div style="font-size: 0.85rem;">
          ${j.currentWilayah}
          ${j.parentWilayah !== '-' ? `<br><small style="color: #64748b;">${j.parentWilayah}</small>` : ''}
        </div>
      </td>
      <td>${j.phone || '-'}</td>
      <td>
        <div style="display: flex; gap: 0.25rem;">
          <button class="btn btn-sm btn-outline" onclick="viewDetail(${j.id})" title="Lihat Detail">
            👁️
          </button>
          <button class="btn btn-sm btn-primary" onclick="editJamaah(${j.id})" title="Edit">
            ✏️
          </button>
          <button class="btn btn-sm btn-danger" onclick="confirmDelete(${j.id})" title="Hapus">
            🗑️
          </button>
        </div>
      </td>
    </tr>
  `).join('');
  
  // Render pagination
  renderPagination();
}

// ============================================================================
// BADGE HELPER
// ============================================================================

function getBadgeFase(fase) {
  const badgeMap = {
    'paud': 'primary',
    'caberawit': 'info',
    'praremaja': 'warning',
    'remaja': 'success',
    'pranikah': 'secondary',
    'nikah': 'danger',
    'orangtua': 'dark',
    'lansia': 'light'
  };
  return badgeMap[fase] || 'secondary';
}

// ============================================================================
// CALCULATE AGE
// ============================================================================

function calculateAge(birthDate) {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// ============================================================================
// LOAD FILTERS (CASCADING)
// ============================================================================

async function loadDaerah() {
  try {
    const { data, error } = await db
      .from('wilayah')
      .select('id, nama, kode')
      .eq('tingkat', 'daerah')
      .eq('is_aktif', true)
      .order('nama');
    
    if (error) throw error;
    
    const select = document.getElementById('filterDaerah');
    select.innerHTML = '<option value="">Semua Daerah</option>' +
      data.map(d => `<option value="${d.id}">${d.nama}</option>`).join('');
  } catch (error) {
    console.error('Error loading daerah:', error);
  }
}

async function loadDesa(daerahId) {
  try {
    const selectDesa = document.getElementById('filterDesa');
    const selectKelompok = document.getElementById('filterKelompok');
    
    if (!daerahId) {
      selectDesa.innerHTML = '<option value="">Semua Desa</option>';
      selectDesa.disabled = true;
      selectKelompok.innerHTML = '<option value="">Semua Kelompok</option>';
      selectKelompok.disabled = true;
      return;
    }
    
    const { data, error } = await db
      .from('wilayah')
      .select('id, nama, kode')
      .eq('tingkat', 'desa')
      .eq('parent_id', daerahId)
      .eq('is_aktif', true)
      .order('nama');
    
    if (error) throw error;
    
    selectDesa.innerHTML = '<option value="">Semua Desa</option>' +
      data.map(d => `<option value="${d.id}">${d.nama}</option>`).join('');
    selectDesa.disabled = false;
    
    selectKelompok.innerHTML = '<option value="">Semua Kelompok</option>';
    selectKelompok.disabled = true;
  } catch (error) {
    console.error('Error loading desa:', error);
  }
}

async function loadKelompok(desaId) {
  try {
    const selectKelompok = document.getElementById('filterKelompok');
    
    if (!desaId) {
      selectKelompok.innerHTML = '<option value="">Semua Kelompok</option>';
      selectKelompok.disabled = true;
      return;
    }
    
    const { data, error } = await db
      .from('wilayah')
      .select('id, nama, kode')
      .eq('tingkat', 'kelompok')
      .eq('parent_id', desaId)
      .eq('is_aktif', true)
      .order('nama');
    
    if (error) throw error;
    
    selectKelompok.innerHTML = '<option value="">Semua Kelompok</option>' +
      data.map(k => `<option value="${k.id}">${k.nama}</option>`).join('');
    selectKelompok.disabled = data.length === 0;
  } catch (error) {
    console.error('Error loading kelompok:', error);
  }
}

async function loadJenjang() {
  try {
    const { data, error } = await db
      .from('jenjang')
      .select('id, nama, kode')
      .eq('is_aktif', true)
      .order('urutan');
    
    if (error) throw error;
    
    const select = document.getElementById('filterJenjang');
    select.innerHTML = '<option value="">Semua Jenjang</option>' +
      data.map(j => `<option value="${j.id}">${j.nama}</option>`).join('');
  } catch (error) {
    console.error('Error loading jenjang:', error);
  }
}

// ============================================================================
// FILTER EVENT HANDLERS
// ============================================================================

document.getElementById('filterDaerah')?.addEventListener('change', async (e) => {
  await loadDesa(e.target.value);
  loadJamaah();
});

document.getElementById('filterDesa')?.addEventListener('change', async (e) => {
  await loadKelompok(e.target.value);
  loadJamaah();
});

document.getElementById('filterKelompok')?.addEventListener('change', () => {
  loadJamaah();
});

document.getElementById('filterJenjang')?.addEventListener('change', () => {
  loadJamaah();
});

document.getElementById('filterFase')?.addEventListener('change', () => {
  loadJamaah();
});

document.getElementById('filterStatus')?.addEventListener('change', () => {
  loadJamaah();
});

// ============================================================================
// SEARCH DEBOUNCE
// ============================================================================

let searchTimeout;
function debounceSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage = 1;
    renderTable();
  }, 500);
}

// ============================================================================
// INIT
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  // Check auth
  await checkAuth();
  
  // Load filters
  await Promise.all([
    loadDaerah(),
    loadJenjang()
  ]);
  
  // Load jamaah
  await loadJamaah();
});

// ============================================================================
// TAMBAH JAMAAH USING STORED PROCEDURE
// ============================================================================

async function saveJamaahWithProcedure() {
  try {
    const nama = document.getElementById('nama').value;
    const jenisKelamin = document.getElementById('jenis_kelamin').value;
    const tanggalLahir = document.getElementById('tanggal_lahir').value;
    const alamat = document.getElementById('alamat_lengkap').value;
    const phone = document.getElementById('phone').value || null;
    
    // Call stored procedure
    const { data, error } = await db.rpc('sp_daftar_jamaah_baru', {
      p_nama: nama,
      p_jenis_kelamin: jenisKelamin,
      p_tanggal_lahir: tanggalLahir,
      p_alamat: alamat,
      p_phone: phone,
      p_created_by: null
    });
    
    if (error) throw error;
    
    showAlert('Jamaah berhasil ditambahkan! ID: ' + data, 'success');
    closeModal();
    await loadJamaah();
  } catch (error) {
    console.error('Error:', error);
    showAlert('Error: ' + error.message, 'error');
  }
}

// Export functions for global access
window.loadJamaah = loadJamaah;
window.viewDetail = viewDetail;
window.editJamaah = editJamaah;
window.confirmDelete = confirmDelete;
window.debounceSearch = debounceSearch;
