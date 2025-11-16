import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import LoadingSpinner from './components/LoadingSpinner'

// Auth Pages
const Login = React.lazy(() => import('./pages/auth/Login'))
const Register = React.lazy(() => import('./pages/auth/Register'))
const Onboarding = React.lazy(() => import('./pages/onboarding/Onboarding'))

// Admin Pages
const DashboardAdmin = React.lazy(() => import('./pages/admin/DashboardAdmin'))
const ManajemenGuru = React.lazy(() => import('./pages/admin/ManajemenGuru'))
const ManajemenSiswa = React.lazy(() => import('./pages/admin/ManajemenSiswa'))
const ManajemenKelas = React.lazy(() => import('./pages/admin/ManajemenKelas'))
const JadwalAdmin = React.lazy(() => import('./pages/admin/JadwalAdmin'))
const NilaiAbsensiAdmin = React.lazy(() => import('./pages/admin/NilaiAbsensiAdmin'))
const PengumumanAdmin = React.lazy(() => import('./pages/admin/PengumumanAdmin'))

// Guru Pages
const DashboardGuru = React.lazy(() => import('./pages/guru/DashboardGuru'))
const KelasSiswa = React.lazy(() => import('./pages/guru/KelasSiswa'))
const InputNilai = React.lazy(() => import('./pages/guru/InputNilai'))
const Absensi = React.lazy(() => import('./pages/guru/Absensi'))
const JadwalMengajar = React.lazy(() => import('./pages/guru/JadwalMengajar'))
const PengumumanGuru = React.lazy(() => import('./pages/guru/PengumumanGuru'))

// Siswa Pages
const DashboardSiswa = React.lazy(() => import('./pages/siswa/DashboardSiswa'))
const JadwalSiswa = React.lazy(() => import('./pages/siswa/JadwalSiswa'))
const NilaiSiswa = React.lazy(() => import('./pages/siswa/NilaiSiswa'))
const AbsensiSiswa = React.lazy(() => import('./pages/siswa/AbsensiSiswa'))
const PengumumanSiswa = React.lazy(() => import('./pages/siswa/PengumumanSiswa'))

// Orang Tua Pages
const DashboardOrtu = React.lazy(() => import('./pages/ortu/DashboardOrtu'))
const NilaiAnak = React.lazy(() => import('./pages/ortu/NilaiAnak'))
const AbsensiAnak = React.lazy(() => import('./pages/ortu/AbsensiAnak'))
const PengumumanOrtu = React.lazy(() => import('./pages/ortu/PengumumanOrtu'))

function App() {
  const { checkAuth, user, role, profile, isLoading } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={!user ? <Login /> : <Navigate to={`/${role}`} />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to={`/${role}`} />} />
        
        {/* Protected Routes */}
        <Route path="/" element={user ? <Layout /> : <Navigate to="/login" />}>
          {/* Onboarding Route */}
          <Route path="onboarding" element={
            (role === 'guru' || role === 'siswa') && profile?.status === 'belum_lengkap' ? (
              <Onboarding />
            ) : (
              <Navigate to={`/${role}`} />
            )
          } />
          
          {/* Admin Routes */}
          <Route path="admin" element={role === 'admin' ? <DashboardAdmin /> : <Navigate to="/login" />} />
          <Route path="admin/guru" element={role === 'admin' ? <ManajemenGuru /> : <Navigate to="/login" />} />
          <Route path="admin/siswa" element={role === 'admin' ? <ManajemenSiswa /> : <Navigate to="/login" />} />
          <Route path="admin/kelas" element={role === 'admin' ? <ManajemenKelas /> : <Navigate to="/login" />} />
          <Route path="admin/jadwal" element={role === 'admin' ? <JadwalAdmin /> : <Navigate to="/login" />} />
          <Route path="admin/nilai" element={role === 'admin' ? <NilaiAbsensiAdmin /> : <Navigate to="/login" />} />
          <Route path="admin/pengumuman" element={role === 'admin' ? <PengumumanAdmin /> : <Navigate to="/login" />} />
          
          {/* Guru Routes */}
          <Route path="guru" element={role === 'guru' ? <DashboardGuru /> : <Navigate to="/login" />} />
          <Route path="guru/kelas" element={role === 'guru' ? <KelasSiswa /> : <Navigate to="/login" />} />
          <Route path="guru/nilai" element={role === 'guru' ? <InputNilai /> : <Navigate to="/login" />} />
          <Route path="guru/absensi" element={role === 'guru' ? <Absensi /> : <Navigate to="/login" />} />
          <Route path="guru/jadwal" element={role === 'guru' ? <JadwalMengajar /> : <Navigate to="/login" />} />
          <Route path="guru/pengumuman" element={role === 'guru' ? <PengumumanGuru /> : <Navigate to="/login" />} />
          
          {/* Siswa Routes */}
          <Route path="siswa" element={role === 'siswa' ? <DashboardSiswa /> : <Navigate to="/login" />} />
          <Route path="siswa/jadwal" element={role === 'siswa' ? <JadwalSiswa /> : <Navigate to="/login" />} />
          <Route path="siswa/nilai" element={role === 'siswa' ? <NilaiSiswa /> : <Navigate to="/login" />} />
          <Route path="siswa/absensi" element={role === 'siswa' ? <AbsensiSiswa /> : <Navigate to="/login" />} />
          <Route path="siswa/pengumuman" element={role === 'siswa' ? <PengumumanSiswa /> : <Navigate to="/login" />} />
          
          {/* Orang Tua Routes */}
          <Route path="ortu" element={role === 'ortu' ? <DashboardOrtu /> : <Navigate to="/login" />} />
          <Route path="ortu/nilai" element={role === 'ortu' ? <NilaiAnak /> : <Navigate to="/login" />} />
          <Route path="ortu/absensi" element={role === 'ortu' ? <AbsensiAnak /> : <Navigate to="/login" />} />
          <Route path="ortu/pengumuman" element={role === 'ortu' ? <PengumumanOrtu /> : <Navigate to="/login" />} />
          
          {/* Default Redirect */}
          <Route index element={<Navigate to={user ? `/${role}` : '/login'} />} />
        </Route>
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to={user ? `/${role}` : '/login'} />} />
      </Routes>
      
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            theme: {
              primary: 'green',
              secondary: 'black',
            },
          },
        }}
      />
    </>
  )
}

export default App