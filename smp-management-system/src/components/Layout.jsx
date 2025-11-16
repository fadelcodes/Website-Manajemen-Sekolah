import React from 'react'
import { Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Header from './Header'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'

const Layout = () => {
  const { role, profile } = useAuthStore()

  // Redirect to onboarding if needed
  if ((role === 'guru' || role === 'siswa') && profile?.status === 'belum_lengkap') {
    return <Outlet />
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar for desktop */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto p-4 pb-20 lg:pb-4">
          <Outlet />
        </main>
        
        {/* Bottom navigation for mobile */}
        <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-gray-200">
          <BottomNav />
        </div>
      </div>
    </div>
  )
}

export default Layout