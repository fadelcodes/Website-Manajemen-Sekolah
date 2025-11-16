// quickFix.js - Cepat test login
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://yzucirmexfijgvjkbzpz.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6dWNpcm1leGZpamd2amtienB6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzI1MTE3NSwiZXhwIjoyMDc4ODI3MTc1fQ.ZxcKwbo33QtITNHatClNb1clyCuCzGVeOB18Bn7hr8A'; // Dari Settings → API

async function quickTest() {
  console.log('🔍 Quick Test Login\n');
  
  const supabase = createClient(SUPABASE_URL, ANON_KEY);

  // Test 1: Coba login dengan credentials
  console.log('1. Testing login...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@sekolah.sch.id',
    password: 'Admin123!'
  });

  if (error) {
    console.log('❌ Login error:', error.message);
    
    // Test 2: Coba sign up baru
    console.log('\n2. Trying to sign up...');
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: 'admin@sekolah.sch.id',
      password: 'Admin123!',
      options: {
        data: {
          role: 'admin'
        }
      }
    });

    if (signupError) {
      console.log('❌ Signup error:', signupError.message);
    } else {
      console.log('✅ Signup success!');
      console.log('   User:', signupData.user?.email);
      console.log('   Need confirmation:', signupData.user?.email_confirmed_at ? 'No' : 'Yes');
    }
  } else {
    console.log('✅ Login success!');
    console.log('   User:', data.user.email);
    console.log('   ID:', data.user.id);
  }
}

quickTest();