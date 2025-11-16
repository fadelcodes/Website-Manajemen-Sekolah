// fixAuthSystem.js
const { createClient } = require('@supabase/supabase-js');

// ==================== KONFIGURASI ====================
const SUPABASE_URL = 'https://yzucirmexfijgvjkbzpz.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6dWNpcm1leGZpamd2amtienB6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzI1MTE3NSwiZXhwIjoyMDc4ODI3MTc1fQ.ZxcKwbo33QtITNHatClNb1clyCuCzGVeOB18Bn7hr8A';
// =====================================================

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function setupAuthSystem() {
  try {
    console.log('🔧 Setup Sistem Authentication...\n');

    // 1. Buat admin user melalui Auth system Supabase
    console.log('1. Membuat admin user melalui Auth...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@sekolah.sch.id',
      password: 'Admin123!',
      email_confirm: true,
      user_metadata: {
        role: 'admin'
      }
    });

    if (authError) {
      if (authError.message.includes('already exists')) {
        console.log('⚠️ Admin user sudah ada di Auth system');
      } else {
        throw authError;
      }
    } else {
      console.log('✅ Admin user created in Auth:', authData.user.email);
    }

    // 2. Sync dengan tabel users custom
    console.log('\n2. Sync dengan tabel users custom...');
    
    // Dapatkan user dari Auth
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const adminUser = users.find(user => user.email === 'admin@sekolah.sch.id');
    
    if (adminUser) {
      // Insert atau update ke tabel users custom
      const { data: customUser, error: customError } = await supabase
        .from('users')
        .upsert({
          id: adminUser.id,
          email: adminUser.email,
          password: 'hash_tidak_dibutuhkan', // Password dihandle oleh Auth
          role: 'admin',
          status: 'active',
          created_at: adminUser.created_at,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (customError) {
        if (customError.code === '42P01') {
          console.log('❌ Tabel users belum ada, jalankan SQL schema terlebih dahulu');
          return;
        }
        throw customError;
      }

      console.log('✅ Custom user record created/updated');
    }

    console.log('\n🎉 Setup berhasil!');
    console.log('📧 Email: admin@sekolah.sch.id');
    console.log('🔑 Password: Admin123!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

setupAuthSystem();