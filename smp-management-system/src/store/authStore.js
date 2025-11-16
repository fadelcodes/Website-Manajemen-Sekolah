import { create } from 'zustand'
import { supabase } from '../supabase/supabaseClient'

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  role: null,
  isLoading: true,

  login: async (identifier, password, loginMethod) => {
    try {
      let email = identifier
      
      // Determine email based on login method
      if (loginMethod === 'nip') {
        // Find guru by NIP
        const { data: guru } = await supabase
          .from('gurus')
          .select('email')
          .eq('nip', identifier)
          .single()
        if (guru) email = guru.email
      } else if (loginMethod === 'nisn') {
        // Find siswa by NISN
        const { data: siswa } = await supabase
          .from('siswas')
          .select('email')
          .eq('nisn', identifier)
          .single()
        if (siswa) email = siswa.email
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      if (data.user) {
        // Get user role and profile
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (userData) {
          let profile = null
          
          switch (userData.role) {
            case 'guru':
              profile = await supabase
                .from('gurus')
                .select('*')
                .eq('user_id', data.user.id)
                .single()
              break
            case 'siswa':
              profile = await supabase
                .from('siswas')
                .select('*')
                .eq('user_id', data.user.id)
                .single()
              break
            case 'ortu':
              profile = await supabase
                .from('ortu')
                .select('*')
                .eq('user_id', data.user.id)
                .single()
              break
          }

          set({
            user: data.user,
            profile: profile?.data,
            role: userData.role
          })

          // Log activity
          await supabase.from('activity_logs').insert({
            user_id: data.user.id,
            action: 'login',
            description: `User logged in as ${userData.role}`
          })

          return { success: true, needsOnboarding: profile?.data?.status === 'belum_lengkap' }
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: error.message }
    }
  },

  registerOrtu: async (formData) => {
    try {
      // Check if siswa exists with provided NISN
      const { data: siswa } = await supabase
        .from('siswas')
        .select('id')
        .eq('nisn', formData.nisnAnak)
        .single()

      if (!siswa) {
        throw new Error('Siswa dengan NISN tersebut tidak ditemukan')
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) throw authError

      // Create user record
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: formData.email,
          password: formData.password, // Note: In production, hash this properly
          role: 'ortu',
          status: 'active'
        })

      if (userError) throw userError

      // Create ortu profile
      const { error: ortuError } = await supabase
        .from('ortu')
        .insert({
          user_id: authData.user.id,
          siswa_id: siswa.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address
        })

      if (ortuError) throw ortuError

      return { success: true }
    } catch (error) {
      console.error('Register error:', error)
      return { success: false, error: error.message }
    }
  },

  logout: async () => {
    const { user } = get()
    if (user) {
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'logout',
        description: 'User logged out'
      })
    }
    
    await supabase.auth.signOut()
    set({ user: null, profile: null, role: null })
  },

  checkAuth: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (userData) {
          let profile = null
          
          switch (userData.role) {
            case 'guru':
              profile = await supabase
                .from('gurus')
                .select('*')
                .eq('user_id', session.user.id)
                .single()
              break
            case 'siswa':
              profile = await supabase
                .from('siswas')
                .select('*')
                .eq('user_id', session.user.id)
                .single()
              break
            case 'ortu':
              profile = await supabase
                .from('ortu')
                .select('*')
                .eq('user_id', session.user.id)
                .single()
              break
          }

          set({
            user: session.user,
            profile: profile?.data,
            role: userData.role
          })
        }
      }
    } catch (error) {
      console.error('Auth check error:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  completeOnboarding: async (formData) => {
    const { role, user } = get()
    try {
      if (role === 'guru') {
        const { error } = await supabase
          .from('gurus')
          .update({
            ...formData,
            status: 'aktif'
          })
          .eq('user_id', user.id)

        if (error) throw error
      } else if (role === 'siswa') {
        const { error } = await supabase
          .from('siswas')
          .update({
            ...formData,
            status: 'aktif'
          })
          .eq('user_id', user.id)

        if (error) throw error
      }

      // Update user status
      await supabase
        .from('users')
        .update({ status: 'active' })
        .eq('id', user.id)

      set({ profile: { ...get().profile, ...formData, status: 'aktif' } })
      return { success: true }
    } catch (error) {
      console.error('Onboarding error:', error)
      return { success: false, error: error.message }
    }
  }
}))