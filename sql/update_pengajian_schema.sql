-- ============================================================================
-- PPG SORONG - UPDATE SKEMA PENGAJIAN
-- ============================================================================

-- ============================================================================
-- 1. UPDATE TABEL PENGAJIAN
-- ============================================================================

-- Tambah kolom baru ke tabel pengajian (jika belum ada)
ALTER TABLE pengajian ADD COLUMN IF NOT EXISTS jenjang_id INTEGER REFERENCES jenjang(id);
ALTER TABLE pengajian ADD COLUMN IF NOT EXISTS jadwal_tipe VARCHAR(20) DEFAULT 'sekali'; -- sekali, harian, mingguan, bulanan, 3bulanan
ALTER TABLE pengajian ADD COLUMN IF NOT EXISTS jadwal_hari INTEGER; -- 0=Minggu, 1=Senin, dst (untuk mingguan)
ALTER TABLE pengajian ADD COLUMN IF NOT EXISTS jadwal_tanggal INTEGER; -- 1-31 (untuk bulanan)
ALTER TABLE pengajian ADD COLUMN IF NOT EXISTS jadwal_bulan INTEGER; -- 1-12 (untuk 3 bulanan)
ALTER TABLE pengajian ADD COLUMN IF NOT EXISTS jam_mulai TIME;
ALTER TABLE pengajian ADD COLUMN IF NOT EXISTS jam_selesai TIME;
ALTER TABLE pengajian ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE pengajian ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES pengajian(id); -- untuk recurring instances

-- Update constraint mubaligh (nullable, hanya wajib jika di kelompok)
-- mubaligh_id sudah nullable by default

-- ============================================================================
-- 2. TABEL JADWAL PENGAJIAN (Template untuk recurring)
-- ============================================================================
CREATE TABLE IF NOT EXISTS jadwal_pengajian (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(200) NOT NULL,
    jenjang_id INTEGER REFERENCES jenjang(id),
    wilayah_id INTEGER NOT NULL REFERENCES wilayah(id),
    mubaligh_id INTEGER REFERENCES users(id),
    jadwal_tipe VARCHAR(20) NOT NULL DEFAULT 'mingguan', -- harian, mingguan, bulanan, 3bulanan
    jadwal_hari INTEGER, -- 0-6 untuk mingguan
    jadwal_tanggal INTEGER, -- 1-31 untuk bulanan
    jadwal_bulan INTEGER, -- 1,4,7,10 untuk 3 bulanan
    jam_mulai TIME,
    jam_selesai TIME,
    lokasi_detail TEXT,
    is_aktif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_jadwal_pengajian_wilayah ON jadwal_pengajian(wilayah_id);
CREATE INDEX IF NOT EXISTS idx_jadwal_pengajian_jenjang ON jadwal_pengajian(jenjang_id);

-- ============================================================================
-- 3. VIEW UNTUK PESERTA OTOMATIS
-- ============================================================================
CREATE OR REPLACE VIEW v_peserta_pengajian AS
SELECT 
    p.id as pengajian_id,
    s.id as santri_id,
    s.nama as santri_nama,
    e.jenjang_id,
    j.nama as jenjang_nama,
    e.wilayah_id as kelompok_id,
    w_kel.nama as kelompok_nama,
    w_desa.id as desa_id,
    w_desa.nama as desa_nama,
    w_daerah.id as daerah_id,
    w_daerah.nama as daerah_nama
FROM pengajian p
JOIN enrollment e ON e.status = 'aktif'
JOIN santri s ON e.santri_id = s.id AND s.status = 'aktif'
JOIN jenjang j ON e.jenjang_id = j.id
JOIN wilayah w_kel ON e.wilayah_id = w_kel.id
LEFT JOIN wilayah w_desa ON w_kel.parent_id = w_desa.id
LEFT JOIN wilayah w_daerah ON w_desa.parent_id = w_daerah.id
JOIN tahun_ajaran ta ON e.tahun_ajaran_id = ta.id AND ta.is_aktif = TRUE
WHERE 
    -- Filter jenjang (jika pengajian punya jenjang tertentu)
    (p.jenjang_id IS NULL OR e.jenjang_id = p.jenjang_id)
    AND
    -- Filter wilayah (peserta dalam wilayah pengajian atau child-nya)
    (
        e.wilayah_id = p.wilayah_id  -- Pengajian di kelompok
        OR w_desa.id = p.wilayah_id  -- Pengajian di desa
        OR w_daerah.id = p.wilayah_id -- Pengajian di daerah
    );

-- ============================================================================
-- 4. FUNCTION UNTUK HITUNG PESERTA
-- ============================================================================
CREATE OR REPLACE FUNCTION get_peserta_count(
    p_wilayah_id INTEGER,
    p_jenjang_id INTEGER DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
    v_tingkat VARCHAR(20);
BEGIN
    -- Get tingkat wilayah
    SELECT tingkat INTO v_tingkat FROM wilayah WHERE id = p_wilayah_id;
    
    IF v_tingkat = 'kelompok' THEN
        -- Peserta di kelompok ini
        SELECT COUNT(*) INTO v_count
        FROM enrollment e
        JOIN santri s ON e.santri_id = s.id
        JOIN tahun_ajaran ta ON e.tahun_ajaran_id = ta.id
        WHERE e.wilayah_id = p_wilayah_id
        AND e.status = 'aktif'
        AND s.status = 'aktif'
        AND ta.is_aktif = TRUE
        AND (p_jenjang_id IS NULL OR e.jenjang_id = p_jenjang_id);
        
    ELSIF v_tingkat = 'desa' THEN
        -- Peserta di semua kelompok dalam desa ini
        SELECT COUNT(*) INTO v_count
        FROM enrollment e
        JOIN santri s ON e.santri_id = s.id
        JOIN wilayah w ON e.wilayah_id = w.id
        JOIN tahun_ajaran ta ON e.tahun_ajaran_id = ta.id
        WHERE w.parent_id = p_wilayah_id
        AND e.status = 'aktif'
        AND s.status = 'aktif'
        AND ta.is_aktif = TRUE
        AND (p_jenjang_id IS NULL OR e.jenjang_id = p_jenjang_id);
        
    ELSIF v_tingkat = 'daerah' THEN
        -- Peserta di semua kelompok dalam daerah ini
        SELECT COUNT(*) INTO v_count
        FROM enrollment e
        JOIN santri s ON e.santri_id = s.id
        JOIN wilayah w_kel ON e.wilayah_id = w_kel.id
        JOIN wilayah w_desa ON w_kel.parent_id = w_desa.id
        JOIN tahun_ajaran ta ON e.tahun_ajaran_id = ta.id
        WHERE w_desa.parent_id = p_wilayah_id
        AND e.status = 'aktif'
        AND s.status = 'aktif'
        AND ta.is_aktif = TRUE
        AND (p_jenjang_id IS NULL OR e.jenjang_id = p_jenjang_id);
    ELSE
        v_count := 0;
    END IF;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. FUNCTION UNTUK GET PESERTA LIST
-- ============================================================================
CREATE OR REPLACE FUNCTION get_peserta_list(
    p_wilayah_id INTEGER,
    p_jenjang_id INTEGER DEFAULT NULL
) RETURNS TABLE (
    santri_id INTEGER,
    santri_nama VARCHAR,
    jenjang_nama VARCHAR,
    kelompok_nama VARCHAR
) AS $$
DECLARE
    v_tingkat VARCHAR(20);
BEGIN
    SELECT tingkat INTO v_tingkat FROM wilayah WHERE id = p_wilayah_id;
    
    IF v_tingkat = 'kelompok' THEN
        RETURN QUERY
        SELECT s.id, s.nama, j.nama, w.nama
        FROM enrollment e
        JOIN santri s ON e.santri_id = s.id
        JOIN jenjang j ON e.jenjang_id = j.id
        JOIN wilayah w ON e.wilayah_id = w.id
        JOIN tahun_ajaran ta ON e.tahun_ajaran_id = ta.id
        WHERE e.wilayah_id = p_wilayah_id
        AND e.status = 'aktif' AND s.status = 'aktif' AND ta.is_aktif = TRUE
        AND (p_jenjang_id IS NULL OR e.jenjang_id = p_jenjang_id)
        ORDER BY s.nama;
        
    ELSIF v_tingkat = 'desa' THEN
        RETURN QUERY
        SELECT s.id, s.nama, j.nama, w.nama
        FROM enrollment e
        JOIN santri s ON e.santri_id = s.id
        JOIN jenjang j ON e.jenjang_id = j.id
        JOIN wilayah w ON e.wilayah_id = w.id
        JOIN tahun_ajaran ta ON e.tahun_ajaran_id = ta.id
        WHERE w.parent_id = p_wilayah_id
        AND e.status = 'aktif' AND s.status = 'aktif' AND ta.is_aktif = TRUE
        AND (p_jenjang_id IS NULL OR e.jenjang_id = p_jenjang_id)
        ORDER BY w.nama, s.nama;
        
    ELSIF v_tingkat = 'daerah' THEN
        RETURN QUERY
        SELECT s.id, s.nama, j.nama, w_kel.nama
        FROM enrollment e
        JOIN santri s ON e.santri_id = s.id
        JOIN jenjang j ON e.jenjang_id = j.id
        JOIN wilayah w_kel ON e.wilayah_id = w_kel.id
        JOIN wilayah w_desa ON w_kel.parent_id = w_desa.id
        JOIN tahun_ajaran ta ON e.tahun_ajaran_id = ta.id
        WHERE w_desa.parent_id = p_wilayah_id
        AND e.status = 'aktif' AND s.status = 'aktif' AND ta.is_aktif = TRUE
        AND (p_jenjang_id IS NULL OR e.jenjang_id = p_jenjang_id)
        ORDER BY w_kel.nama, s.nama;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. VERIFIKASI
-- ============================================================================
SELECT 'Skema pengajian berhasil diupdate!' as status;

-- Test function
SELECT get_peserta_count(
    (SELECT id FROM wilayah WHERE kode = 'kel_klasaman'),
    NULL
) as peserta_klasaman;
