/**
 * ============================================================================
 * QUICK-TESTING.JS - Quick Testing System for Mubaligh
 * ============================================================================
 * 
 * Fitur:
 * - Auto-detect kelompok mubaligh
 * - Load jamaah di kelompok tersebut
 * - Quick input presensi + nilai
 * - Bulk actions (semua hadir, simpan semua)
 */

// ============================================================================
// GLOBAL VARIABLES
// ============================================================================

let currentMubaligh = null;
let currentWilayahId = null;
let jamaahList = [];
let testingData = {};

// ============================================================================
// INIT
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    // Set tanggal hari ini
    document.getElementById('tanggalTesting').valueAsDate = new Date();
    
    // Check if role has been selected (dev mode)
    const roleSelected = localStorage.getItem('dev_role_selected');
    if (!roleSelected) {
        // Redirect to role switcher if no role selected
        alert('Silakan pilih kelompok terlebih dahulu');
        window.location.href = 'index-quick-login.html';
        return;
    }
    
    // Check auth & load mubaligh info
    await checkAuth();
    await loadCurrentMubaligh();
    await loadBidang();
});

// ============================================================================
// CHANGE KELOMPOK (Back to Role Switcher)
// ============================================================================

function changeKelompok() {
    if (confirm('Ganti kelompok? Data yang belum disimpan akan hilang.')) {
        // Clear role selection
        localStorage.removeItem('dev_role_selected');
        
        // Redirect to role switcher
        window.location.href = 'index-quick-login.html';
    }
}

// ============================================================================
// LOAD CURRENT MUBALIGH INFO
// ============================================================================

async function loadCurrentMubaligh() {
    try {
        // Get current user
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        if (!user) {
            window.location.href = 'index.html';
            return;
        }
        
        // DEVELOPMENT MODE: Check if kelompok was selected from role switcher
        const devKelompokKode = localStorage.getItem('dev_selected_kelompok');
        const devKelompokNama = localStorage.getItem('dev_selected_kelompok_nama');
        
        if (devKelompokKode) {
            // Development mode: Use selected kelompok
            console.log('🔧 DEVELOPMENT MODE');
            console.log('Selected kelompok:', devKelompokNama);
            
            // Get wilayah info
            const { data: wilayah, error: wilayahError } = await db
                .from('wilayah')
                .select(`
                    id,
                    nama,
                    kode,
                    tingkat,
                    parent:wilayah!parent_id(nama)
                `)
                .eq('kode', devKelompokKode)
                .single();
            
            if (wilayahError || !wilayah) {
                showAlert('Kelompok tidak ditemukan: ' + devKelompokKode, 'error');
                return;
            }
            
            currentWilayahId = wilayah.id;
            
            // Mock mubaligh data
            currentMubaligh = {
                wilayah_id: wilayah.id,
                wilayah: wilayah,
                role: { nama: 'Mubaligh Desa (Dev Mode)' },
                jamaah: { nama: user.email.split('@')[0] }
            };
            
            // Update UI
            document.getElementById('userName').textContent = user.email;
            document.getElementById('userRole').textContent = `Mubaligh ${devKelompokNama}`;
            document.getElementById('sidebarUserName').textContent = user.email;
            document.getElementById('sidebarUserRole').textContent = `Mubaligh ${devKelompokNama} (Dev)`;
            
            return;
        }
        
        // PRODUCTION MODE: Get mubaligh role assignment from database
        const { data: userRole, error } = await db
            .from('user_role')
            .select(`
                *,
                role(kode, nama),
                wilayah(
                    id,
                    nama,
                    tingkat,
                    kode,
                    parent:wilayah!parent_id(nama)
                ),
                jamaah(nama)
            `)
            .eq('user_id', user.id)
            .eq('is_aktif', true)
            .in('role.kode', ['MUBALIGH_DESA', 'MUBALIGH', 'PJP'])
            .limit(1)
            .single();
        
        if (error || !userRole) {
            showAlert('Anda tidak memiliki akses sebagai Mubaligh', 'error');
            setTimeout(() => window.location.href = 'dashboard.html', 2000);
            return;
        }
        
        currentMubaligh = userRole;
        currentWilayahId = userRole.wilayah_id;
        
        // Update UI
        const wilayahInfo = userRole.wilayah;
        document.getElementById('userName').textContent = userRole.jamaah?.nama || user.email;
        document.getElementById('userRole').textContent = userRole.role.nama;
        document.getElementById('sidebarUserName').textContent = userRole.jamaah?.nama || user.email;
        document.getElementById('sidebarUserRole').textContent = `${userRole.role.nama} - ${wilayahInfo.nama}`;
        
        console.log('Mubaligh loaded:', currentMubaligh);
    } catch (error) {
        console.error('Error loading mubaligh:', error);
        showAlert('Error: ' + error.message, 'error');
    }
}

// ============================================================================
// LOAD BIDANG, KATEGORI, MATERI (CASCADING)
// ============================================================================

async function loadBidang() {
    try {
        const { data, error } = await db
            .from('bidang')
            .select('id, nama')
            .eq('is_aktif', true)
            .order('nama');
        
        if (error) throw error;
        
        const select = document.getElementById('filterBidang');
        select.innerHTML = '<option value="">Pilih Bidang...</option>' +
            data.map(b => `<option value="${b.id}">${b.nama}</option>`).join('');
    } catch (error) {
        console.error('Error loading bidang:', error);
    }
}

async function loadKategori() {
    try {
        const bidangId = document.getElementById('filterBidang').value;
        const selectKategori = document.getElementById('filterKategori');
        const selectMateri = document.getElementById('filterMateri');
        
        if (!bidangId) {
            selectKategori.innerHTML = '<option value="">Pilih Kategori...</option>';
            selectKategori.disabled = true;
            selectMateri.innerHTML = '<option value="">Pilih Materi...</option>';
            selectMateri.disabled = true;
            return;
        }
        
        const { data, error } = await db
            .from('kategori_materi')
            .select('id, nama')
            .eq('bidang_id', bidangId)
            .eq('is_aktif', true)
            .order('nama');
        
        if (error) throw error;
        
        selectKategori.innerHTML = '<option value="">Pilih Kategori...</option>' +
            data.map(k => `<option value="${k.id}">${k.nama}</option>`).join('');
        selectKategori.disabled = false;
        
        selectMateri.innerHTML = '<option value="">Pilih Materi...</option>';
        selectMateri.disabled = true;
    } catch (error) {
        console.error('Error loading kategori:', error);
    }
}

async function loadMateri() {
    try {
        const kategoriId = document.getElementById('filterKategori').value;
        const selectMateri = document.getElementById('filterMateri');
        
        if (!kategoriId) {
            selectMateri.innerHTML = '<option value="">Pilih Materi...</option>';
            selectMateri.disabled = true;
            return;
        }
        
        const { data, error } = await db
            .from('materi_item')
            .select('id, nama, kode')
            .eq('kategori_id', kategoriId)
            .eq('is_aktif', true)
            .order('nama');
        
        if (error) throw error;
        
        selectMateri.innerHTML = '<option value="">Pilih Materi...</option>' +
            data.map(m => `<option value="${m.id}">${m.nama} (${m.kode})</option>`).join('');
        selectMateri.disabled = false;
    } catch (error) {
        console.error('Error loading materi:', error);
    }
}

// ============================================================================
// LOAD JAMAAH FOR TESTING
// ============================================================================

async function loadJamaahForTesting() {
    try {
        const tanggal = document.getElementById('tanggalTesting').value;
        const materiId = document.getElementById('filterMateri').value;
        
        if (!tanggal) {
            showAlert('Pilih tanggal testing!', 'warning');
            return;
        }
        
        if (!materiId) {
            showAlert('Pilih materi yang akan di-test!', 'warning');
            return;
        }
        
        showLoading(true);
        
        // Load jamaah di wilayah mubaligh
        const { data, error } = await db
            .from('enrollment')
            .select(`
                id,
                jamaah_id,
                jamaah(
                    id,
                    nomor_induk,
                    nama,
                    jenis_kelamin,
                    tanggal_lahir
                ),
                jenjang(nama),
                wilayah(nama)
            `)
            .eq('wilayah_id', currentWilayahId)
            .eq('status', 'aktif')
            .order('jamaah(nama)');
        
        if (error) throw error;
        
        jamaahList = data;
        testingData = {};
        
        // Initialize testing data
        jamaahList.forEach(item => {
            testingData[item.id] = {
                enrollment_id: item.id,
                jamaah_id: item.jamaah_id,
                materi_id: materiId,
                tanggal_testing: tanggal,
                status_kehadiran: null,
                nilai: null
            };
        });
        
        // Render
        renderJamaahList();
        updateStats();
        
        document.getElementById('actionButtons').style.display = 'block';
        
    } catch (error) {
        console.error('Error loading jamaah:', error);
        showAlert('Error: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// ============================================================================
// RENDER JAMAAH LIST
// ============================================================================

function renderJamaahList() {
    const container = document.getElementById('jamaahList');
    
    if (jamaahList.length === 0) {
        container.innerHTML = `
            <div class="card">
                <div class="card-body" style="text-align: center; padding: 3rem;">
                    <div style="font-size: 4rem; opacity: 0.3;">📭</div>
                    <h3 style="margin-top: 1rem; color: #64748b;">Tidak ada jamaah</h3>
                    <p style="color: #94a3b8;">Belum ada jamaah terdaftar di kelompok ini</p>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = jamaahList.map((item, index) => {
        const jamaah = item.jamaah;
        const enrollmentId = item.id;
        const initial = jamaah.nama.charAt(0).toUpperCase();
        const umur = calculateAge(jamaah.tanggal_lahir);
        
        const currentStatus = testingData[enrollmentId]?.status_kehadiran;
        
        return `
            <div class="testing-card">
                <div class="jamaah-item">
                    <div class="jamaah-info">
                        <div class="jamaah-avatar" style="background: ${getAvatarColor(index)};">
                            ${initial}
                        </div>
                        <div class="jamaah-details">
                            <h4>${jamaah.nama}</h4>
                            <p>
                                ${jamaah.nomor_induk || '-'} • 
                                ${jamaah.jenis_kelamin === 'L' ? '👦 Laki-laki' : '👧 Perempuan'} • 
                                ${umur} tahun • 
                                ${item.jenjang?.nama || '-'}
                            </p>
                        </div>
                    </div>
                    <div class="score-input">
                        <button 
                            class="score-btn hadir ${currentStatus === 'hadir' ? 'active' : ''}" 
                            onclick="setStatus(${enrollmentId}, 'hadir')"
                            title="Hadir">
                            ✓
                        </button>
                        <button 
                            class="score-btn izin ${currentStatus === 'izin' ? 'active' : ''}" 
                            onclick="setStatus(${enrollmentId}, 'izin')"
                            title="Izin">
                            I
                        </button>
                        <button 
                            class="score-btn alfa ${currentStatus === 'alfa' ? 'active' : ''}" 
                            onclick="setStatus(${enrollmentId}, 'alfa')"
                            title="Alfa">
                            A
                        </button>
                        <input 
                            type="number" 
                            class="form-control" 
                            placeholder="Nilai"
                            min="0"
                            max="100"
                            value="${testingData[enrollmentId]?.nilai || ''}"
                            onchange="setNilai(${enrollmentId}, this.value)"
                            style="width: 100px; margin-left: 0.5rem;"
                            ${currentStatus !== 'hadir' ? 'disabled' : ''}
                        />
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================================================
// SET STATUS & NILAI
// ============================================================================

function setStatus(enrollmentId, status) {
    if (!testingData[enrollmentId]) return;
    
    testingData[enrollmentId].status_kehadiran = status;
    
    // Jika tidak hadir, reset nilai
    if (status !== 'hadir') {
        testingData[enrollmentId].nilai = null;
    }
    
    renderJamaahList();
    updateStats();
}

function setNilai(enrollmentId, nilai) {
    if (!testingData[enrollmentId]) return;
    
    const nilaiNum = parseInt(nilai);
    if (isNaN(nilaiNum) || nilaiNum < 0 || nilaiNum > 100) {
        testingData[enrollmentId].nilai = null;
    } else {
        testingData[enrollmentId].nilai = nilaiNum;
    }
    
    updateStats();
}

// ============================================================================
// BULK ACTIONS
// ============================================================================

function markAllHadir() {
    Object.keys(testingData).forEach(key => {
        testingData[key].status_kehadiran = 'hadir';
    });
    renderJamaahList();
    updateStats();
    showAlert('Semua jamaah ditandai HADIR', 'success');
}

function resetAll() {
    if (!confirm('Reset semua data testing? Data yang sudah diinput akan hilang.')) {
        return;
    }
    
    Object.keys(testingData).forEach(key => {
        testingData[key].status_kehadiran = null;
        testingData[key].nilai = null;
    });
    
    renderJamaahList();
    updateStats();
    showAlert('Data berhasil di-reset', 'info');
}

// ============================================================================
// SAVE TESTING
// ============================================================================

async function saveAllTesting() {
    try {
        // Validate
        const testingArray = Object.values(testingData);
        const incomplete = testingArray.filter(t => !t.status_kehadiran);
        
        if (incomplete.length > 0) {
            if (!confirm(`Ada ${incomplete.length} jamaah yang belum diisi statusnya. Lanjutkan simpan?`)) {
                return;
            }
        }
        
        showLoading(true);
        
        // Prepare data for keaktifan_pengajian (presensi)
        const presensiData = testingArray
            .filter(t => t.status_kehadiran)
            .map(t => ({
                enrollment_id: t.enrollment_id,
                pengajian_id: null, // TODO: link to pengajian if needed
                tanggal: t.tanggal_testing,
                status_kehadiran: t.status_kehadiran
            }));
        
        // Prepare data for progress_jamaah (nilai)
        const progressData = testingArray
            .filter(t => t.status_kehadiran === 'hadir' && t.nilai !== null)
            .map(t => ({
                enrollment_id: t.enrollment_id,
                materi_id: t.materi_id,
                tanggal_selesai: t.tanggal_testing,
                nilai: t.nilai,
                status_progress: 'selesai',
                keterangan: 'Quick Testing'
            }));
        
        // Insert presensi
        if (presensiData.length > 0) {
            const { error: errorPresensi } = await db
                .from('keaktifan_pengajian')
                .insert(presensiData);
            
            if (errorPresensi) throw errorPresensi;
        }
        
        // Insert progress
        if (progressData.length > 0) {
            const { error: errorProgress } = await db
                .from('progress_jamaah')
                .insert(progressData);
            
            if (errorProgress) throw errorProgress;
        }
        
        showAlert(
            `Berhasil menyimpan ${presensiData.length} presensi dan ${progressData.length} nilai!`,
            'success'
        );
        
        // Reset
        setTimeout(() => {
            testingData = {};
            jamaahList = [];
            document.getElementById('jamaahList').innerHTML = '';
            document.getElementById('actionButtons').style.display = 'none';
            updateStats();
        }, 1500);
        
    } catch (error) {
        console.error('Error saving testing:', error);
        showAlert('Error: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// ============================================================================
// UPDATE STATS
// ============================================================================

function updateStats() {
    const total = Object.keys(testingData).length;
    const hadir = Object.values(testingData).filter(t => t.status_kehadiran === 'hadir').length;
    const izin = Object.values(testingData).filter(t => t.status_kehadiran === 'izin').length;
    const alfa = Object.values(testingData).filter(t => t.status_kehadiran === 'alfa').length;
    
    document.getElementById('statTotalJamaah').textContent = total;
    document.getElementById('statHadir').textContent = hadir;
    document.getElementById('statIzin').textContent = izin;
    document.getElementById('statAlfa').textContent = alfa;
}

// ============================================================================
// HELPERS
// ============================================================================

function getAvatarColor(index) {
    const colors = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
    ];
    return colors[index % colors.length];
}

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

function showLoading(show) {
    document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
}

function showAlert(message, type = 'info') {
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    
    const alertDiv = document.createElement('div');
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    alertDiv.textContent = message;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => alertDiv.remove(), 300);
    }, 3000);
}

// Export functions for global access
window.loadJamaahForTesting = loadJamaahForTesting;
window.setStatus = setStatus;
window.setNilai = setNilai;
window.markAllHadir = markAllHadir;
window.resetAll = resetAll;
window.saveAllTesting = saveAllTesting;
window.changeKelompok = changeKelompok;
