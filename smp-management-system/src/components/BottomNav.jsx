import React from 'react'
import { LayoutDashboard, Users, FileText, Calendar, Bell, TrendingUp } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useNavigate, useLocation } from 'react-router-dom'

const BottomNav = () => {
  const { role } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = {
    guru: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/guru' },
      { icon: Users, label: 'Kelas', path: '/guru/kelas' },
      { icon: FileText, label: 'Nilai', path: '/guru/nilai' },
      { icon: Calendar, label: 'Absensi', path: '/guru/absensi' },
      { icon: Bell, label: 'Info', path: '/guru/pengumuman' },
    ],
    siswa: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/siswa' },
      { icon: Calendar, label: 'Jadwal', path: '/siswa/jadwal' },
      { icon: TrendingUp, label: 'Nilai', path: '/siswa/nilai' },
      { icon: Calendar, label: 'Absensi', path: '/siswa/absensi' },
      { icon: Bell, label: 'Info', path: '/siswa/pengumuman' },
    ],
    ortu: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/ortu' },
      { icon: TrendingUp, label: 'Nilai', path: '/ortu/nilai' },
      { icon: Calendar, label: 'Absensi', path: '/ortu/absensi' },
      { icon: Bell, label: 'Info', path: '/ortu/pengumuman' },
    ]
  }

  const currentNav = navItems[role] || []

  if (role === 'admin') {
    return null // Admin doesn't need bottom nav on desktop
  }

  return (
    <div className="flex items-center justify-around py-3 bg-white border-t border-gray-200">
      {currentNav.map((item) => {
        const isActive = location.pathname === item.path
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors min-w-[60px] ${
              isActive ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            <item.icon size={20} />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default BottomNav