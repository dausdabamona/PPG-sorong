// ============================================================================
// KONFIGURASI SUPABASE - PPG SORONG
// ============================================================================

const SUPABASE_URL = 'https://xkbauqrykzxgpoflujji.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrYmF1cXJ5a3p4Z3BvZmx1amppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MzQxMjcsImV4cCI6MjA4MDUxMDEyN30.QI3Xx2v04-sxjRGwqyjQri9D6FALAMdqgNTmPGWP4uc';

// Inisialisasi Supabase Client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export untuk digunakan di file lain
window.db = supabaseClient;
