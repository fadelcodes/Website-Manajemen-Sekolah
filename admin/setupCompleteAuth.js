// setupCompleteAuth.js
const { createClient } = require('@supabase/supabase-js');

// ==================== KONFIGURASI ====================
const SUPABASE_URL = 'https://yzucirmexfijgvjkbzpz.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6dWNpcm1leGZpamd2amtienB6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzI1MTE3NSwiZXhwIjoyMDc4ODI3MTc1fQ.ZxcKwbo33QtITNHatClNb1clyCuCzGVeOB18Bn7hr8A';
// =====================================================

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function setupCompleteSystem() {
  console.log('🚀 SETUP SISTEM LENGKAP DENGAN AUTH\n');

  try {
    // Step 1: Buat admin user di Auth system
    console.log('1. 📧 Membuat admin di Auth system...');
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@sekolah.sch.id',
      password: 'Admin123!',
      email_confirm: true,
      user_metadata: { role: 'admin' }
    });

    if (authError && !authError.message.includes('already exists')) {
      throw authError;
    }

    const adminId = authError ? await getExistingAdminId() : authUser.user.id;
    console.log('✅ Admin Auth ID:', adminId);

    // Step 2: Buat record di tabel users
    console.log('\n2. 👥 Sync dengan tabel users...');
    await syncUserTable(adminId);

    // Step 3: Test login
    console.log('\n3. 🔐 Testing login...');
    await testLogin();

    console.log('\n🎉 SETUP BERHASIL!');
    console.log('================');
    console.log('📧 Email: admin@sekolah.sch.id');
    console.log('🔑 Password: Admin123!');
    console.log('👤 Role: admin');

  } catch (error) {
    console.error('❌ Setup gagal:', error.message);
  }
}

async function getExistingAdminId() {
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const admin = users.find(u => u.email === 'admin@sekolah.sch.id');
  return admin ? admin.id : null;
}

async function syncUserTable(adminId) {
  const { error } = await supabase
    .from('users')
    .upsert({
      id: adminId,
      email: 'admin@sekolah.sch.id',
      password: 'managed_by_auth', // Tidak perlu hash, dihandle Auth
      role: 'admin',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

  if (error) {
    if (error.code === '42P01') {
      console.log('❌ Tabel users tidak ditemukan');
      console.log('💡 Jalankan SQL schema terlebih dahulu');
      return;
    }
    throw error;
  }
  console.log('✅ Tabel users disinkronisasi');
}

async function testLogin() {
  // Test dengan client anon (seperti di frontend)
  const anonClient = createClient(SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  
  const { data, error } = await anonClient.auth.signInWithPassword({
    email: 'admin@sekolah.sch.id',
    password: 'Admin123!'
  });

  if (error) {
    console.log('❌ Login test failed:', error.message);
    console.log('💡 Kemungkinan masalah:');
    console.log('   - Email confirmation required');
    console.log('   - Password policy');
    console.log('   - Auth settings di Supabase');
  } else {
    console.log('✅ Login test successful!');
    console.log('   User ID:', data.user.id);
    console.log('   Email:', data.user.email);
  }
}

setupCompleteSystem();