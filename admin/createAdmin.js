// createAdmin.js
const { createClient } = require('@supabase/supabase-js');

// Konfigurasi Supabase - GUNAKAN SERVICE ROLE KEY
const supabaseUrl = 'https://yzucirmexfijgvjkbzpz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6dWNpcm1leGZpamd2amtienB6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzI1MTE3NSwiZXhwIjoyMDc4ODI3MTc1fQ.ZxcKwbo33QtITNHatClNb1clyCuCzGVeOB18Bn7hr8A';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminAccount() {
  try {
    const adminData = {
      email: 'admin@pgri35.sch.id',
      password: 'admin123',
      role: 'admin',
      status: 'active'
    };

    console.log('🚀 MEMBUAT AKUN ADMIN...');
    console.log(`📧 Email: ${adminData.email}`);
    console.log(`🔑 Password: ${adminData.password}`);

    // 1. Buat user di Supabase Auth
    console.log('📝 Membuat user di Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminData.email,
      password: adminData.password,
      email_confirm: true, // Auto-confirm email agar langsung bisa login
      user_metadata: {
        role: adminData.role
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('⚠️  User sudah terdaftar di Auth, melanjutkan...');
        // Dapatkan user ID dari email yang sudah ada
        const { data: existingUser } = await supabase.auth.admin.listUsers();
        const user = existingUser.users.find(u => u.email === adminData.email);
        if (!user) {
          throw new Error('User tidak ditemukan di Auth');
        }
        var userId = user.id;
      } else {
        throw authError;
      }
    } else {
      var userId = authData.user.id;
      console.log('✅ User Auth berhasil dibuat');
    }

    // 2. Cek apakah user sudah ada di table users
    console.log('🔍 Mengecek tabel users...');
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    let result;

    if (checkError && checkError.code === 'PGRST116') {
      // User belum ada, insert baru
      console.log('➕ Insert user baru ke tabel users...');
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([
          {
            id: userId,
            email: adminData.email,
            role: adminData.role,
            status: adminData.status,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (insertError) throw insertError;
      result = newUser;
      console.log('✅ User berhasil dimasukkan ke tabel users');

    } else if (existingUser) {
      // User sudah ada, update role
      console.log('🔄 User sudah ada, mengupdate role...');
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          role: adminData.role,
          status: adminData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) throw updateError;
      result = updatedUser;
      console.log('✅ Role user berhasil diupdate');
    }

    // 3. Verifikasi final
    console.log('🔎 Verifikasi akhir...');
    const { data: finalUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    console.log('\n🎉 AKUN ADMIN BERHASIL DIBUAT!');
    console.log('=' .repeat(40));
    console.log(`📧 Email: ${finalUser.email}`);
    console.log(`🔑 Password: ${adminData.password}`);
    console.log(`👤 Role: ${finalUser.role}`);
    console.log(`📊 Status: ${finalUser.status}`);
    console.log(`🆔 User ID: ${finalUser.id}`);
    console.log('=' .repeat(40));
    console.log('\n💡 SEKARANG ANDA BISA LOGIN DENGAN:');
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Password: ${adminData.password}`);
    console.log('\n📍 Login di: http://localhost:5173/login');

    return finalUser;

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    
    // Error handling spesifik
    if (error.message.includes('JWT')) {
      console.log('🔐 Pastikan SERVICE ROLE KEY benar dan memiliki akses admin');
    }
    if (error.message.includes('duplicate key')) {
      console.log('📧 Email sudah terdaftar di database');
    }
    if (error.message.includes('role')) {
      console.log('👤 Pastikan kolom "role" ada di tabel users');
    }
    
    throw error;
  }
}

// Jalankan script
createAdminAccount()
  .then(() => {
    console.log('\n✅ Script selesai dengan sukses!');
  })
  .catch((error) => {
    console.log('\n💥 Script gagal!');
    process.exit(1);
  });