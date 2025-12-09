-- ============================================================================
-- PPG SORONG - IMPORT DATA LENGKAP
-- Jalankan di Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- BAGIAN 1: WILAYAH (Daerah, Desa, Kelompok)
-- ============================================================================

-- Hapus data wilayah lama (jika ada)
DELETE FROM wilayah WHERE kode LIKE 'daerah_%' OR kode LIKE 'desa_%' OR kode LIKE 'kel_%';

-- 1A. INSERT DAERAH
INSERT INTO wilayah (kode, nama, tingkat, parent_id, is_aktif) VALUES
('daerah_sorong_kota', 'Sorong Kota', 'daerah', NULL, TRUE),
('daerah_sorong_kab', 'Sorong Kabupaten', 'daerah', NULL, TRUE),
('daerah_kaimana', 'Kaimana', 'daerah', NULL, TRUE),
('daerah_fakfak', 'Fak-Fak', 'daerah', NULL, TRUE)
ON CONFLICT (kode) DO UPDATE SET nama = EXCLUDED.nama, is_aktif = TRUE;

-- 1B. INSERT DESA
INSERT INTO wilayah (kode, nama, tingkat, parent_id, is_aktif) VALUES
('desa_sorong_kota', 'Desa Sorong Kota', 'desa', 
    (SELECT id FROM wilayah WHERE kode = 'daerah_sorong_kota'), TRUE),
('desa_aimas', 'Desa Aimas', 'desa', 
    (SELECT id FROM wilayah WHERE kode = 'daerah_sorong_kab'), TRUE),
('desa_kaimana', 'Desa Kaimana', 'desa', 
    (SELECT id FROM wilayah WHERE kode = 'daerah_kaimana'), TRUE),
('desa_fakfak', 'Desa Fak-Fak', 'desa', 
    (SELECT id FROM wilayah WHERE kode = 'daerah_fakfak'), TRUE)
ON CONFLICT (kode) DO UPDATE SET nama = EXCLUDED.nama, is_aktif = TRUE;

-- 1C. INSERT KELOMPOK
INSERT INTO wilayah (kode, nama, tingkat, parent_id, is_aktif) VALUES
-- Sorong Kota
('kel_klasaman', 'Klasaman', 'kelompok', 
    (SELECT id FROM wilayah WHERE kode = 'desa_sorong_kota'), TRUE),
('kel_remu', 'Remu', 'kelompok', 
    (SELECT id FROM wilayah WHERE kode = 'desa_sorong_kota'), TRUE),
('kel_kampung_baru', 'Kampung Baru', 'kelompok', 
    (SELECT id FROM wilayah WHERE kode = 'desa_sorong_kota'), TRUE),
-- Sorong Kabupaten (Aimas)
('kel_aimas_jalur_a', 'Aimas Jalur A', 'kelompok', 
    (SELECT id FROM wilayah WHERE kode = 'desa_aimas'), TRUE),
('kel_aimas_jalur_c', 'Aimas Jalur C', 'kelompok', 
    (SELECT id FROM wilayah WHERE kode = 'desa_aimas'), TRUE),
-- Kaimana
('kel_kota_kaimana', 'KOTA', 'kelompok', 
    (SELECT id FROM wilayah WHERE kode = 'desa_kaimana'), TRUE),
('kel_bantemi', 'BANTEMI', 'kelompok', 
    (SELECT id FROM wilayah WHERE kode = 'desa_kaimana'), TRUE)
ON CONFLICT (kode) DO UPDATE SET nama = EXCLUDED.nama, is_aktif = TRUE;

-- Verifikasi Wilayah
SELECT w.id, w.kode, w.nama, w.tingkat, p.nama as parent 
FROM wilayah w 
LEFT JOIN wilayah p ON w.parent_id = p.id 
ORDER BY w.tingkat, w.nama;

-- ============================================================================
-- BAGIAN 2: JENJANG (Pastikan ada data)
-- ============================================================================

INSERT INTO jenjang (kode, nama, usia_mulai, usia_sampai, urutan, is_aktif) VALUES
('paud', 'PAUD', 3, 6, 1, TRUE),
('caberawit', 'Caberawit', 7, 9, 2, TRUE),
('praremaja', 'Praremaja', 10, 12, 3, TRUE),
('remaja', 'Remaja', 13, 15, 4, TRUE),
('pra_nikah', 'Pra Nikah', 16, 25, 5, TRUE),
('dewasa', 'Dewasa', 26, 99, 6, TRUE)
ON CONFLICT (kode) DO UPDATE SET 
    nama = EXCLUDED.nama, 
    usia_mulai = EXCLUDED.usia_mulai, 
    usia_sampai = EXCLUDED.usia_sampai,
    urutan = EXCLUDED.urutan,
    is_aktif = TRUE;

-- Verifikasi Jenjang
SELECT * FROM jenjang ORDER BY urutan;

-- ============================================================================
-- BAGIAN 3: TAHUN AJARAN (Pastikan ada)
-- ============================================================================

INSERT INTO tahun_ajaran (kode, tanggal_mulai, tanggal_selesai, is_aktif) VALUES
('2024/2025', '2024-07-01', '2025-06-30', TRUE)
ON CONFLICT (kode) DO UPDATE SET is_aktif = TRUE;

-- ============================================================================
-- BAGIAN 4: SANTRI
-- ============================================================================

-- Mapping kelompok lama ke kode baru:
-- 1 = Klasaman -> kel_klasaman
-- 2 = Remu -> kel_remu
-- 3 = Kampung Baru -> kel_kampung_baru
-- 6 = KOTA -> kel_kota_kaimana
-- 7 = BANTEMI -> kel_bantemi

-- Insert Santri
INSERT INTO santri (nama, nama_panggilan, jenis_kelamin, tanggal_lahir, alamat, phone, status) VALUES
('Fathur Rahman Tokan', 'Fathur', 'L', '2007-10-20', NULL, '85244737588', 'aktif'),
('Putri Suryaningsih', 'Putri', 'P', '2002-09-09', NULL, '82119047257', 'aktif'),
('Siti Khorija', 'Siti Khorija', 'P', '2009-07-07', NULL, '85254070410', 'aktif'),
('Fahrunnisa Husnul Khotimah', 'Fahrunisa Husnul Khotimah', 'P', '2007-04-27', NULL, '85281847115', 'aktif'),
('ANDI UWAIS ALHAFITZ', 'UWAIS', 'L', NULL, NULL, NULL, 'aktif'),
('Idris Binsa', 'Idris Binsa', 'L', '2000-05-04', NULL, '85145168419', 'aktif'),
('AINUN R.', 'AINUN', 'P', NULL, NULL, NULL, 'aktif'),
('Hisyam Mahendra', 'Hisam', 'L', '2004-06-28', NULL, '81245927791', 'aktif'),
('Rojul Fadli', 'Rojul', 'L', '1998-09-20', NULL, '85711146130', 'aktif'),
('Devi Rizdi Nur Falaq', 'Devi', 'P', '2007-09-30', NULL, '8124762415', 'aktif'),
('Deva Adi prasetya', 'Deva', 'L', '2001-01-22', NULL, '81248117368', 'aktif'),
('Siti Maisaroh', 'saroh', 'P', '1993-02-21', NULL, '82248806996', 'aktif'),
('Ahmad Arif Rishaky Rizki. m', 'Ahmad Arif Rishaky Rizki. m', 'L', '2007-12-06', NULL, '852484010', 'aktif'),
('FADLI ANWAR', 'FADLI', 'L', '2010-10-31', NULL, NULL, 'aktif'),
('Ahmad Aisyah Avicenna', 'Ahmad Aisyah Avicenna', 'P', '2011-10-28', NULL, '81248740354', 'aktif'),
('Khofifa R Mayalibit', 'Khofifa R Mayalibit', 'P', '2008-12-27', NULL, '85243284010', 'aktif'),
('Putri Nurul Sakinah', 'Putri Nurul Sakinah', 'P', '2006-07-03', NULL, '81343375088', 'aktif'),
('Kasih Aprilia', 'Kasih Aprilia', 'P', '2009-04-15', NULL, NULL, 'aktif'),
('Zulfah Nur Komariah', 'Zulfah Nur Komariah', 'P', '2001-09-11', NULL, '82343268609', 'aktif'),
('Amir Nur Hasim Al Ubaidah', 'Amir Nur Hasim Al Ubaidah', 'L', '2002-05-21', NULL, '85719244021', 'aktif'),
('Linda Rianti', 'Linda Rianti', 'P', '2001-04-07', NULL, '82312243604', 'aktif'),
('Rifki Abdullah', 'Rifki Abdullah', 'L', '1999-10-11', NULL, '82331450976', 'aktif'),
('Lulu Auliyana Adillah', 'Lulu', 'P', '2000-05-24', NULL, '81232823127', 'aktif'),
('MUH. DHILAN', 'DHILAN', 'L', NULL, NULL, NULL, 'aktif'),
('Faza Rizky Nafiah A', 'Anti', 'P', '2005-08-23', NULL, '85344076143', 'aktif'),
('NUR FADILLAH', 'NUR FADILLAH', 'P', NULL, NULL, NULL, 'aktif'),
('Arsmul saflin', 'Arsmul', 'L', '2004-08-30', NULL, NULL, 'aktif'),
('Khusnuyain Arvan M', 'Afan', 'L', '2008-05-14', NULL, '82250595438', 'aktif'),
('Rangga Bustami', 'Rangga', 'L', '2005-07-11', NULL, '82197618295', 'aktif'),
('Fitriani Puji Astuti', 'Fitriani Puji Astuti', 'P', '1997-10-10', NULL, '81233249138', 'aktif'),
('Aura Zahrotussyita', 'Aura Zahrotussyita', 'P', '2008-01-01', NULL, '82399769123', 'aktif'),
('Muhammad Fazar', 'Muhammad Fazar', 'L', '2008-07-14', NULL, '82398042010', 'aktif'),
('ZAIN ABDULLOH', 'ZAIN ABDULLOH', 'L', NULL, NULL, NULL, 'aktif'),
('Fitroh Maulana', 'Fitroh Maulana', 'L', '1999-02-28', NULL, '85247260764', 'aktif'),
('Achmad Azhar lauini', 'Tole', 'L', '1999-07-04', NULL, '81344475044', 'aktif'),
('Muhammad Arya Bimantara', 'Arya', 'L', '2007-09-28', NULL, '85159533682', 'aktif'),
('Muhammad Lafifan Anugrah Dabamona', 'Afif', 'L', '2007-11-08', NULL, NULL, 'aktif'),
('Risma Amalia Agata', 'Risma', 'P', '2000-12-01', NULL, '81248768501', 'aktif'),
('AZIZ SYAPUTRA', 'Azis', 'L', NULL, NULL, NULL, 'aktif'),
('Ubed Setyadi', 'Ubed', 'L', '1996-10-14', NULL, NULL, 'aktif'),
('Nayla Rahmadhani', 'Sisil', 'P', '2006-09-28', NULL, '85338845221', 'aktif'),
('Rizqi Maratul Linta (ulin)', 'ulin', 'P', '2003-08-08', NULL, '82232460926', 'aktif'),
('Ahmad haqy', 'Haqi', 'L', '2003-04-23', NULL, '81214944589', 'aktif'),
('Endah Azharini', 'Endah', 'P', '1997-01-20', NULL, '82197679761', 'aktif'),
('Naya Nurin Puspitasari', 'Naya', 'P', '2003-12-26', NULL, '82339334889', 'aktif'),
('Alfianita Dwi Yanti A', 'nita', 'P', '1998-10-19', NULL, '81225654232', 'aktif'),
('Nur Aflaha', 'Afla', 'P', '2003-02-25', NULL, '82245190421', 'aktif'),
('CINTARSIH SUKMA AVRINA', 'CINTARSIH SUKMA AVRINA', 'P', '2005-04-27', NULL, '82261363627', 'aktif'),
('Ratu Maharuni Cadar Ayu (uni)', 'Uni', 'P', '2005-07-10', NULL, '85242081808', 'aktif'),
('SAROH QURROTA AYYUN', 'SAROH QURROTA AYYUN', 'P', NULL, NULL, NULL, 'aktif'),
('Abdul Iraman S', 'Abdul Iraman S', 'L', '2006-10-29', NULL, '82198190290', 'aktif'),
('Afgan Maulana', 'Afgan', 'L', '2008-12-10', NULL, '82119047206', 'aktif'),
('ARSYILA QONITA', 'ARSYILA QONITA', 'P', NULL, NULL, NULL, 'aktif'),
('Alan Maulana', 'Alan', 'L', '2000-06-28', NULL, '82116697374', 'aktif'),
('ANANDA Aulia Wulan Mei', 'ANANDA Aulia Wulan Mei', 'P', '2004-05-13', NULL, '85341976097', 'aktif'),
('HADID A.F.', 'HADID', 'L', NULL, NULL, NULL, 'aktif'),
('Sapnalya . J M', 'Sapnalya . J M', 'P', '2005-07-12', NULL, '81240942577', 'aktif'),
('ROIHANUN N.', 'ainun', 'P', NULL, NULL, NULL, 'aktif'),
('Bayu KA', 'Bayu', 'L', '1995-11-25', NULL, NULL, 'aktif'),
('Syifa Maulida Azzahra', 'Syifa Maulida Azzahra', 'P', '2009-03-21', NULL, '85253129448', 'aktif'),
('RAFKA ZABDAN', 'RAFKA ZABDAN', 'L', NULL, NULL, NULL, 'aktif'),
('Dela ahya Ulta Nisa', 'Dela', 'P', '2007-09-30', NULL, '81247622431', 'aktif'),
('Wahyu saifullah', 'Wahyu saifullah', 'L', '1995-05-23', NULL, '85281877666', 'aktif'),
('ARYA KHOIRUL', 'ARYA KHOIRUL', 'L', NULL, NULL, NULL, 'aktif'),
('Syafaqoh Afifa Azzahra', 'Syafaqoh Afifa Azzahra', 'P', '2006-02-20', NULL, '81226440490', 'aktif'),
('Hanun', 'Hanun', 'P', NULL, NULL, NULL, 'aktif'),
('Lutfi', 'Lutfi', 'L', NULL, NULL, NULL, 'aktif'),
('Rachel', 'Ael', 'P', NULL, NULL, NULL, 'aktif'),
('Okta Hery', 'Okta', 'L', NULL, NULL, NULL, 'aktif'),
('ARDIANTI ZULFA ISLAMI', 'ARDIANTI', 'L', NULL, NULL, NULL, 'aktif'),
('ARIEF MUSTAKIM', 'ARIEF', 'L', NULL, NULL, NULL, 'aktif'),
('ALFIN K.G.F', 'ALFIN', 'L', NULL, NULL, NULL, 'aktif'),
('ALFAN K.G.F', 'ALFAN', 'L', NULL, NULL, NULL, 'aktif'),
('SATRIA WIDO RIAN', 'SATRIA', 'L', NULL, NULL, NULL, 'aktif'),
('FAHIM ABDILLAH', 'FAHIM', 'L', NULL, NULL, NULL, 'aktif'),
('HAFIS NURDIN', 'HAFIS', 'L', NULL, NULL, NULL, 'aktif'),
('YOHAN SASEBA. K', 'YOHAN', 'L', NULL, NULL, NULL, 'aktif'),
('NABILA ZULFA.H', 'NABILA', 'P', NULL, NULL, NULL, 'aktif'),
('FATHIR ALHANAN', 'FATHIR', 'L', NULL, NULL, NULL, 'aktif'),
('FADEL', 'FADEL', 'L', NULL, NULL, NULL, 'aktif'),
('FAHMI', 'FAHMI', 'L', NULL, NULL, NULL, 'aktif'),
('RIZAL', 'RIZAL', 'L', NULL, NULL, NULL, 'aktif'),
('FAUZAN', 'FAUZAN', 'L', NULL, NULL, NULL, 'aktif'),
('BILQIS', 'BILQIS', 'P', NULL, NULL, NULL, 'aktif'),
('FAIZ', 'FAIZ', 'L', NULL, NULL, NULL, 'aktif'),
('ADAM', 'ADAM', 'L', NULL, NULL, NULL, 'aktif'),
('SITI', 'SITI', 'P', NULL, NULL, NULL, 'aktif'),
('ASNIAR', 'ASNIAR', 'P', NULL, NULL, NULL, 'aktif'),
('M. SULAIMAN', 'SULAIMAN', 'L', NULL, NULL, NULL, 'aktif'),
('YUSUF ALI SUSANTO', 'YUSUF', 'L', NULL, NULL, NULL, 'aktif'),
('NAMIRA LATIFA', 'NAMIRA', 'P', NULL, NULL, NULL, 'aktif'),
('SALSA AJENG FAUZIA', 'SALSA', 'P', NULL, NULL, NULL, 'aktif'),
('NADIRA', 'NADIRA', 'P', NULL, NULL, NULL, 'aktif'),
('ARIF MUSTAKIM', 'ARIF', 'L', NULL, NULL, NULL, 'aktif'),
('BAGUS', 'BAGUS', 'L', NULL, NULL, NULL, 'aktif'),
('EMAN', 'EMAN', 'L', NULL, NULL, NULL, 'aktif'),
('FANI', 'FANI', 'P', NULL, NULL, NULL, 'aktif'),
('INTAN', 'INTAN', 'P', NULL, NULL, NULL, 'aktif'),
('ABU YAZID', 'YAZID', 'L', NULL, NULL, NULL, 'aktif'),
('YONO', 'YONO', 'L', NULL, NULL, NULL, 'aktif'),
('BIMA PUTRA JAYA', 'BIMA', 'L', NULL, NULL, NULL, 'aktif'),
('SALMAN', 'SALMAN', 'L', NULL, NULL, NULL, 'aktif'),
('SATRIO', 'SATRIO', 'L', NULL, NULL, NULL, 'aktif'),
('TASYA', 'TASYA', 'P', NULL, NULL, NULL, 'aktif'),
('AYLA', 'AYLA', 'P', NULL, NULL, NULL, 'aktif'),
('AIZIL', 'AIZIL', 'L', NULL, NULL, NULL, 'aktif'),
('NABILA', 'NABILA', 'P', NULL, NULL, NULL, 'aktif'),
('INAYAH', 'INAYAH', 'P', NULL, NULL, NULL, 'aktif'),
('YUSUF', 'YUSUF', 'L', NULL, NULL, NULL, 'aktif'),
('NAILA', 'NAILA', 'P', NULL, NULL, NULL, 'aktif'),
('VIORA', 'VIORA', 'P', NULL, NULL, NULL, 'aktif'),
('MANDAIS', 'MANDAIS', 'L', NULL, NULL, NULL, 'aktif'),
('M. FADLI', 'M. FADLI', 'L', NULL, NULL, NULL, 'aktif'),
('HARIS', 'HARIS', 'L', NULL, NULL, NULL, 'aktif'),
('NURMA', 'NURMA', 'P', NULL, NULL, NULL, 'aktif'),
('YUSRIL', 'YUSRIL', 'L', NULL, NULL, NULL, 'aktif'),
('MILA', 'MILA', 'P', NULL, NULL, NULL, 'aktif'),
('AULIA', 'AULIA', 'P', NULL, NULL, NULL, 'aktif'),
('SOFI', 'SOFI', 'P', NULL, NULL, NULL, 'aktif'),
('CHERRYL', 'CHERRYL', 'P', NULL, NULL, NULL, 'aktif'),
('AZKA ANDINI', 'AZKA ANDINI', 'P', NULL, NULL, NULL, 'aktif'),
('INTI JUMANAH', 'INTI JUMANAH', 'P', NULL, NULL, NULL, 'aktif'),
('DITA NOFITASARI', 'DITA NOFITASARI', 'P', NULL, NULL, NULL, 'aktif'),
('TEGUH S.M.P', 'TEGUH S.M.P', 'L', NULL, NULL, NULL, 'aktif'),
('GALIH SEPTIAN ABDI MULIA', 'GALIH SEPTIAN ABDI MULIA', 'L', NULL, NULL, NULL, 'aktif'),
('GINA', 'GINA', 'P', NULL, NULL, NULL, 'aktif'),
('AJI NURKOLIS', 'AJI NURKOLIS', 'L', NULL, NULL, NULL, 'aktif');

-- ============================================================================
-- BAGIAN 5: ENROLLMENT (Hubungkan Santri ke Kelompok & Jenjang)
-- ============================================================================

-- Fungsi untuk menentukan jenjang berdasarkan umur
CREATE OR REPLACE FUNCTION get_jenjang_by_age(tgl_lahir DATE) RETURNS INTEGER AS $$
DECLARE
    umur INTEGER;
    jenjang_id INTEGER;
BEGIN
    IF tgl_lahir IS NULL THEN
        -- Default ke Dewasa jika tidak ada tanggal lahir
        SELECT id INTO jenjang_id FROM jenjang WHERE kode = 'dewasa' LIMIT 1;
        RETURN jenjang_id;
    END IF;
    
    umur := EXTRACT(YEAR FROM age(CURRENT_DATE, tgl_lahir));
    
    SELECT id INTO jenjang_id FROM jenjang 
    WHERE umur >= COALESCE(usia_mulai, 0) AND umur <= COALESCE(usia_sampai, 99)
    ORDER BY urutan LIMIT 1;
    
    IF jenjang_id IS NULL THEN
        SELECT id INTO jenjang_id FROM jenjang WHERE kode = 'dewasa' LIMIT 1;
    END IF;
    
    RETURN jenjang_id;
END;
$$ LANGUAGE plpgsql;

-- Mapping data: santri_nama -> kelompok_kode
-- Berdasarkan data Excel:
-- Kelompok 1 (Klasaman): Fathur tidak, dia di 3
-- Kelompok 2 (Remu)
-- Kelompok 3 (Kampung Baru)
-- Kelompok 6 (KOTA Kaimana)
-- Kelompok 7 (BANTEMI)

-- Insert enrollment berdasarkan mapping kelompok dari Excel
DO $$
DECLARE
    ta_id INTEGER;
    r RECORD;
    kel_id INTEGER;
    jen_id INTEGER;
BEGIN
    -- Get tahun ajaran aktif
    SELECT id INTO ta_id FROM tahun_ajaran WHERE is_aktif = TRUE LIMIT 1;
    
    -- Mapping santri ke kelompok berdasarkan data Excel
    -- Kelompok 1 = Klasaman
    FOR r IN (SELECT id, nama, tanggal_lahir FROM santri WHERE nama IN (
        'ANDI UWAIS ALHAFITZ', 'Idris Binsa', 'AINUN R.', 'Hisyam Mahendra', 
        'Deva Adi prasetya', 'FADLI ANWAR', 'Zulfah Nur Komariah', 'MUH. DHILAN',
        'Faza Rizky Nafiah A', 'NUR FADILLAH', 'Arsmul saflin', 'Khusnuyain Arvan M',
        'Rangga Bustami', 'ZAIN ABDULLOH', 'Achmad Azhar lauini', 'Muhammad Arya Bimantara',
        'Muhammad Lafifan Anugrah Dabamona', 'Risma Amalia Agata', 'AZIZ SYAPUTRA',
        'Nayla Rahmadhani', 'Rizqi Maratul Linta (ulin)', 'Ahmad haqy', 'Alfianita Dwi Yanti A',
        'Ratu Maharuni Cadar Ayu (uni)', 'SAROH QURROTA AYYUN', 'ARSYILA QONITA',
        'HADID A.F.', 'ROIHANUN N.', 'Bayu KA', 'RAFKA ZABDAN', 'ARYA KHOIRUL',
        'Hanun', 'Lutfi', 'Rachel', 'Okta Hery'
    )) LOOP
        SELECT id INTO kel_id FROM wilayah WHERE kode = 'kel_klasaman';
        jen_id := get_jenjang_by_age(r.tanggal_lahir);
        INSERT INTO enrollment (santri_id, wilayah_id, jenjang_id, tahun_ajaran_id, status)
        VALUES (r.id, kel_id, jen_id, ta_id, 'aktif')
        ON CONFLICT (santri_id, wilayah_id, jenjang_id, tahun_ajaran_id) DO NOTHING;
    END LOOP;
    
    -- Kelompok 2 = Remu
    FOR r IN (SELECT id, nama, tanggal_lahir FROM santri WHERE nama IN (
        'Putri Suryaningsih', 'Rojul Fadli', 'Devi Rizdi Nur Falaq', 'Siti Maisaroh',
        'Linda Rianti', 'Rifki Abdullah', 'Lulu Auliyana Adillah', 'Aura Zahrotussyita',
        'Fitroh Maulana', 'Ubed Setyadi', 'Endah Azharini', 'Naya Nurin Puspitasari',
        'Afgan Maulana', 'Alan Maulana', 'Dela ahya Ulta Nisa', 'Wahyu saifullah',
        'Syafaqoh Afifa Azzahra'
    )) LOOP
        SELECT id INTO kel_id FROM wilayah WHERE kode = 'kel_remu';
        jen_id := get_jenjang_by_age(r.tanggal_lahir);
        INSERT INTO enrollment (santri_id, wilayah_id, jenjang_id, tahun_ajaran_id, status)
        VALUES (r.id, kel_id, jen_id, ta_id, 'aktif')
        ON CONFLICT (santri_id, wilayah_id, jenjang_id, tahun_ajaran_id) DO NOTHING;
    END LOOP;
    
    -- Kelompok 3 = Kampung Baru
    FOR r IN (SELECT id, nama, tanggal_lahir FROM santri WHERE nama IN (
        'Fathur Rahman Tokan', 'Siti Khorija', 'Fahrunnisa Husnul Khotimah',
        'Ahmad Arif Rishaky Rizki. m', 'Ahmad Aisyah Avicenna', 'Khofifa R Mayalibit',
        'Putri Nurul Sakinah', 'Kasih Aprilia', 'Amir Nur Hasim Al Ubaidah',
        'Fitriani Puji Astuti', 'Muhammad Fazar', 'Nur Aflaha', 'CINTARSIH SUKMA AVRINA',
        'Abdul Iraman S', 'ANANDA Aulia Wulan Mei', 'Sapnalya . J M',
        'Syifa Maulida Azzahra'
    )) LOOP
        SELECT id INTO kel_id FROM wilayah WHERE kode = 'kel_kampung_baru';
        jen_id := get_jenjang_by_age(r.tanggal_lahir);
        INSERT INTO enrollment (santri_id, wilayah_id, jenjang_id, tahun_ajaran_id, status)
        VALUES (r.id, kel_id, jen_id, ta_id, 'aktif')
        ON CONFLICT (santri_id, wilayah_id, jenjang_id, tahun_ajaran_id) DO NOTHING;
    END LOOP;
    
    -- Kelompok 6 = KOTA (Kaimana)
    FOR r IN (SELECT id, nama, tanggal_lahir FROM santri WHERE nama IN (
        'SALMAN', 'SATRIO', 'TASYA', 'AYLA', 'AIZIL', 'NABILA', 'INAYAH', 'YUSUF',
        'NAILA', 'VIORA', 'MANDAIS', 'M. FADLI', 'HARIS', 'NURMA', 'YUSRIL', 'MILA',
        'AULIA', 'SOFI', 'CHERRYL', 'AZKA ANDINI', 'INTI JUMANAH', 'DITA NOFITASARI',
        'TEGUH S.M.P', 'GALIH SEPTIAN ABDI MULIA', 'GINA', 'AJI NURKOLIS'
    )) LOOP
        SELECT id INTO kel_id FROM wilayah WHERE kode = 'kel_kota_kaimana';
        jen_id := get_jenjang_by_age(r.tanggal_lahir);
        INSERT INTO enrollment (santri_id, wilayah_id, jenjang_id, tahun_ajaran_id, status)
        VALUES (r.id, kel_id, jen_id, ta_id, 'aktif')
        ON CONFLICT (santri_id, wilayah_id, jenjang_id, tahun_ajaran_id) DO NOTHING;
    END LOOP;
    
    -- Kelompok 7 = BANTEMI
    FOR r IN (SELECT id, nama, tanggal_lahir FROM santri WHERE nama IN (
        'ARDIANTI ZULFA ISLAMI', 'ARIEF MUSTAKIM', 'ALFIN K.G.F', 'ALFAN K.G.F',
        'SATRIA WIDO RIAN', 'FAHIM ABDILLAH', 'HAFIS NURDIN', 'YOHAN SASEBA. K',
        'NABILA ZULFA.H', 'FATHIR ALHANAN', 'FADEL', 'FAHMI', 'RIZAL', 'FAUZAN',
        'BILQIS', 'FAIZ', 'ADAM', 'SITI', 'ASNIAR', 'M. SULAIMAN', 'YUSUF ALI SUSANTO',
        'NAMIRA LATIFA', 'SALSA AJENG FAUZIA', 'NADIRA', 'ARIF MUSTAKIM', 'BAGUS',
        'EMAN', 'FANI', 'INTAN', 'ABU YAZID', 'YONO', 'BIMA PUTRA JAYA'
    )) LOOP
        SELECT id INTO kel_id FROM wilayah WHERE kode = 'kel_bantemi';
        jen_id := get_jenjang_by_age(r.tanggal_lahir);
        INSERT INTO enrollment (santri_id, wilayah_id, jenjang_id, tahun_ajaran_id, status)
        VALUES (r.id, kel_id, jen_id, ta_id, 'aktif')
        ON CONFLICT (santri_id, wilayah_id, jenjang_id, tahun_ajaran_id) DO NOTHING;
    END LOOP;
    
    RAISE NOTICE 'Enrollment selesai!';
END $$;

-- Drop fungsi sementara
DROP FUNCTION IF EXISTS get_jenjang_by_age(DATE);

-- ============================================================================
-- VERIFIKASI HASIL
-- ============================================================================

-- Hitung total
SELECT 'Wilayah' as tabel, COUNT(*) as jumlah FROM wilayah
UNION ALL
SELECT 'Santri', COUNT(*) FROM santri
UNION ALL
SELECT 'Enrollment', COUNT(*) FROM enrollment
UNION ALL
SELECT 'Jenjang', COUNT(*) FROM jenjang;

-- Santri per kelompok
SELECT w.nama as kelompok, COUNT(e.id) as jumlah_santri
FROM wilayah w
LEFT JOIN enrollment e ON w.id = e.wilayah_id
WHERE w.tingkat = 'kelompok'
GROUP BY w.id, w.nama
ORDER BY w.nama;

-- Santri per jenjang
SELECT j.nama as jenjang, COUNT(e.id) as jumlah_santri
FROM jenjang j
LEFT JOIN enrollment e ON j.id = e.jenjang_id
GROUP BY j.id, j.nama
ORDER BY j.urutan;
