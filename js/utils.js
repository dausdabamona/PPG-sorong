// ============================================================================
// UTILITY FUNCTIONS - PPG SORONG
// ============================================================================

// ============================================================================
// FORMAT FUNCTIONS
// ============================================================================

// Format tanggal ke Indonesia
function formatTanggal(dateString) {
    if (!dateString) return '-';
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

// Format tanggal singkat
function formatTanggalSingkat(dateString) {
    if (!dateString) return '-';
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

// Format waktu
function formatWaktu(timeString) {
    if (!timeString) return '-';
    return timeString.substring(0, 5);
}

// Hitung umur dari tanggal lahir
function hitungUmur(tanggalLahir) {
    if (!tanggalLahir) return '-';
    const today = new Date();
    const birthDate = new Date(tanggalLahir);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

// Format angka dengan separator
function formatAngka(num) {
    if (num === null || num === undefined) return '-';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Format persentase
function formatPersen(num) {
    if (num === null || num === undefined) return '-';
    return parseFloat(num).toFixed(1) + '%';
}

// ============================================================================
// DOM HELPERS
// ============================================================================

// Get element by ID
function $(id) {
    return document.getElementById(id);
}

// Query selector
function $$(selector) {
    return document.querySelector(selector);
}

// Query selector all
function $$$(selector) {
    return document.querySelectorAll(selector);
}

// Create element dengan attributes
function createElement(tag, attributes = {}, innerHTML = '') {
    const el = document.createElement(tag);
    Object.keys(attributes).forEach(key => {
        if (key === 'className') {
            el.className = attributes[key];
        } else if (key === 'dataset') {
            Object.keys(attributes[key]).forEach(dataKey => {
                el.dataset[dataKey] = attributes[key][dataKey];
            });
        } else {
            el.setAttribute(key, attributes[key]);
        }
    });
    el.innerHTML = innerHTML;
    return el;
}

// ============================================================================
// TOAST NOTIFICATION
// ============================================================================

function showToast(message, type = 'info', duration = 3000) {
    // Remove existing toast
    const existingToast = $$('.toast');
    if (existingToast) existingToast.remove();
    
    // Create toast
    const toast = createElement('div', {
        className: `toast toast-${type}`
    }, `
        <div class="toast-content">
            <span class="toast-icon">${getToastIcon(type)}</span>
            <span class="toast-message">${message}</span>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `);
    
    document.body.appendChild(toast);
    
    // Auto remove
    setTimeout(() => {
        toast.classList.add('toast-hide');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function getToastIcon(type) {
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    return icons[type] || icons.info;
}

// ============================================================================
// LOADING INDICATOR
// ============================================================================

function showLoading(container = document.body) {
    const loader = createElement('div', {
        className: 'loading-overlay',
        id: 'loadingOverlay'
    }, `
        <div class="loading-spinner"></div>
        <p>Memuat...</p>
    `);
    container.appendChild(loader);
}

function hideLoading() {
    const loader = $('loadingOverlay');
    if (loader) loader.remove();
}

// ============================================================================
// MODAL HELPERS
// ============================================================================

function showModal(modalId) {
    const modal = $(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function hideModal(modalId) {
    const modal = $(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

function hideAllModals() {
    $$$('.modal.show').forEach(modal => {
        modal.classList.remove('show');
    });
    document.body.style.overflow = '';
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        hideAllModals();
    }
});

// ============================================================================
// CONFIRM DIALOG
// ============================================================================

function confirmDialog(message, title = 'Konfirmasi') {
    return new Promise((resolve) => {
        const modal = createElement('div', {
            className: 'modal show',
            id: 'confirmModal'
        }, `
            <div class="modal-content modal-sm">
                <div class="modal-header">
                    <h3>${title}</h3>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="confirmNo">Batal</button>
                    <button class="btn btn-danger" id="confirmYes">Ya, Lanjutkan</button>
                </div>
            </div>
        `);
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        $('confirmYes').onclick = () => {
            modal.remove();
            document.body.style.overflow = '';
            resolve(true);
        };
        
        $('confirmNo').onclick = () => {
            modal.remove();
            document.body.style.overflow = '';
            resolve(false);
        };
    });
}

// ============================================================================
// FORM HELPERS
// ============================================================================

// Get form data as object
function getFormData(formId) {
    const form = $(formId);
    const formData = new FormData(form);
    const data = {};
    
    formData.forEach((value, key) => {
        // Handle empty strings
        if (value === '') {
            data[key] = null;
        } else {
            data[key] = value;
        }
    });
    
    return data;
}

// Set form data from object
function setFormData(formId, data) {
    const form = $(formId);
    if (!form) return;
    
    Object.keys(data).forEach(key => {
        const input = form.querySelector(`[name="${key}"]`);
        if (input) {
            if (input.type === 'checkbox') {
                input.checked = data[key];
            } else if (input.type === 'date' && data[key]) {
                input.value = data[key].substring(0, 10);
            } else {
                input.value = data[key] || '';
            }
        }
    });
}

// Reset form
function resetForm(formId) {
    const form = $(formId);
    if (form) form.reset();
}

// Validate form (basic)
function validateForm(formId) {
    const form = $(formId);
    if (!form) return false;
    
    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('is-invalid');
            isValid = false;
        } else {
            field.classList.remove('is-invalid');
        }
    });
    
    return isValid;
}

// ============================================================================
// TABLE HELPERS
// ============================================================================

// Render table body
function renderTableBody(tableId, data, rowRenderer) {
    const tbody = $$(tableId + ' tbody');
    if (!tbody) return;
    
    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="100" class="text-center text-muted py-4">
                    Tidak ada data
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = data.map((item, index) => rowRenderer(item, index)).join('');
}

// ============================================================================
// SELECT/DROPDOWN HELPERS
// ============================================================================

// Populate select options
async function populateSelect(selectId, options, valueKey = 'id', textKey = 'nama', placeholder = '-- Pilih --') {
    const select = $(selectId);
    if (!select) return;
    
    select.innerHTML = `<option value="">${placeholder}</option>`;
    
    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt[valueKey];
        option.textContent = typeof textKey === 'function' ? textKey(opt) : opt[textKey];
        select.appendChild(option);
    });
}

// Load and populate select from Supabase
async function loadSelect(selectId, tableName, valueKey = 'id', textKey = 'nama', orderBy = 'nama', filters = {}) {
    try {
        let query = db.from(tableName).select('*');
        
        // Apply filters
        Object.keys(filters).forEach(key => {
            query = query.eq(key, filters[key]);
        });
        
        // Order
        if (orderBy) {
            query = query.order(orderBy);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        await populateSelect(selectId, data, valueKey, textKey);
    } catch (error) {
        console.error(`Error loading select ${selectId}:`, error);
    }
}

// ============================================================================
// URL HELPERS
// ============================================================================

// Get URL parameter
function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Set URL parameter
function setUrlParam(param, value) {
    const url = new URL(window.location);
    url.searchParams.set(param, value);
    window.history.pushState({}, '', url);
}

// ============================================================================
// DEBOUNCE
// ============================================================================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================================================
// LOCAL STORAGE HELPERS
// ============================================================================

function saveToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function getFromStorage(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

function removeFromStorage(key) {
    localStorage.removeItem(key);
}
