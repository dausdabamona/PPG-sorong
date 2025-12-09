// ============================================================================
// SIDEBAR COMPONENT - PPG SORONG
// ============================================================================

// Sidebar HTML Template
function getSidebarHTML(activePage = '') {
    return `
        <aside class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <div class="sidebar-logo">PPG</div>
                <div class="sidebar-brand">
                    <div class="sidebar-title">PPG Sorong</div>
                    <div class="sidebar-subtitle">Pembinaan Generasi Penerus</div>
                </div>
                <button class="sidebar-close" onclick="toggleSidebar()" title="Tutup Menu">✕</button>
            </div>
            
            <nav class="sidebar-nav">
                <div class="nav-section">MENU UTAMA</div>
                <a href="dashboard.html" class="nav-item ${activePage === 'dashboard' ? 'active' : ''}">
                    <span class="nav-icon">📊</span>
                    <span class="nav-text">Dashboard</span>
                </a>
                <a href="santri.html" class="nav-item ${activePage === 'santri' ? 'active' : ''}">
                    <span class="nav-icon">👥</span>
                    <span class="nav-text">Data Santri</span>
                </a>
                <a href="pengajian.html" class="nav-item ${activePage === 'pengajian' ? 'active' : ''}">
                    <span class="nav-icon">📖</span>
                    <span class="nav-text">Pengajian</span>
                </a>
                <a href="presensi.html" class="nav-item ${activePage === 'presensi' ? 'active' : ''}">
                    <span class="nav-icon">✅</span>
                    <span class="nav-text">Presensi</span>
                </a>
                <a href="progress.html" class="nav-item ${activePage === 'progress' ? 'active' : ''}">
                    <span class="nav-icon">📈</span>
                    <span class="nav-text">Progress Hafalan</span>
                </a>
                
                <div class="nav-section">LAPORAN</div>
                <a href="rapor.html" class="nav-item ${activePage === 'rapor' ? 'active' : ''}">
                    <span class="nav-icon">📋</span>
                    <span class="nav-text">Rapor</span>
                </a>
                
                <div class="nav-section">PENGATURAN</div>
                <a href="wilayah.html" class="nav-item ${activePage === 'wilayah' ? 'active' : ''}">
                    <span class="nav-icon">🗺️</span>
                    <span class="nav-text">Wilayah</span>
                </a>
                <a href="kurikulum.html" class="nav-item ${activePage === 'kurikulum' ? 'active' : ''}">
                    <span class="nav-icon">📚</span>
                    <span class="nav-text">Kurikulum</span>
                </a>
                <a href="users.html" class="nav-item ${activePage === 'users' ? 'active' : ''}">
                    <span class="nav-icon">👤</span>
                    <span class="nav-text">Manajemen User</span>
                </a>
            </nav>
            
            <div class="sidebar-footer">
                <div class="sidebar-user">
                    <div class="sidebar-user-avatar" id="sidebarUserAvatar">?</div>
                    <div class="sidebar-user-info">
                        <div class="sidebar-user-name" id="sidebarUserName">Loading...</div>
                        <div class="sidebar-user-role" id="sidebarUserRole">-</div>
                    </div>
                </div>
                <button class="btn btn-sm btn-outline w-100" onclick="logout()">🚪 Keluar</button>
            </div>
        </aside>
        
        <!-- Overlay for mobile -->
        <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleSidebar()"></div>
    `;
}

// Header HTML Template
function getHeaderHTML(pageTitle = '') {
    return `
        <header class="header">
            <div class="header-left">
                <button class="btn-menu" onclick="toggleSidebar()" title="Toggle Menu">
                    <span class="menu-icon">☰</span>
                </button>
                <h1 class="header-title">${pageTitle}</h1>
            </div>
            <div class="header-right">
                <div class="header-user">
                    <div class="user-avatar" id="userAvatar">?</div>
                    <div class="user-info">
                        <div class="user-name" id="userName">Loading...</div>
                        <div class="user-role" id="userRole">-</div>
                    </div>
                </div>
            </div>
        </header>
    `;
}

// Toggle Sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const mainContent = document.querySelector('.main-content');
    
    sidebar.classList.toggle('collapsed');
    
    if (overlay) {
        overlay.classList.toggle('show');
    }
    
    // Save state to localStorage
    const isCollapsed = sidebar.classList.contains('collapsed');
    localStorage.setItem('sidebarCollapsed', isCollapsed);
}

// Initialize Sidebar State
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    
    // On mobile, always start collapsed
    if (window.innerWidth <= 992) {
        sidebar.classList.add('collapsed');
    } else if (isCollapsed) {
        sidebar.classList.add('collapsed');
    }
}

// Update User Info in Sidebar and Header
function updateSidebarUserInfo() {
    if (currentUserData) {
        const name = currentUserData.nama || currentUserData.email || 'User';
        const initial = name.charAt(0).toUpperCase();
        const role = userRoles.length > 0 ? userRoles[0].role?.nama : '-';
        
        // Update sidebar
        const sidebarAvatar = document.getElementById('sidebarUserAvatar');
        const sidebarName = document.getElementById('sidebarUserName');
        const sidebarRole = document.getElementById('sidebarUserRole');
        
        if (sidebarAvatar) sidebarAvatar.textContent = initial;
        if (sidebarName) sidebarName.textContent = name;
        if (sidebarRole) sidebarRole.textContent = role;
        
        // Update header
        const headerAvatar = document.getElementById('userAvatar');
        const headerName = document.getElementById('userName');
        const headerRole = document.getElementById('userRole');
        
        if (headerAvatar) headerAvatar.textContent = initial;
        if (headerName) headerName.textContent = name;
        if (headerRole) headerRole.textContent = role;
    }
}

// Handle window resize
window.addEventListener('resize', () => {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (window.innerWidth > 992) {
        // On desktop, remove mobile classes
        if (overlay) overlay.classList.remove('show');
    }
});
