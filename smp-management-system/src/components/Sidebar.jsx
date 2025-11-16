import React from 'react'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Calendar,
  FileText,
  Bell,
  Settings,
  LogOut,
  User,
  TrendingUp
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useNavigate, useLocation } from 'react-router-dom'

const Sidebar = () => {
  const { role, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = {
    admin: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
      { icon: Users, label: 'Manajemen Guru', path: '/admin/guru' },
      { icon: Users, label: 'Manajemen Siswa', path: '/admin/siswa' },
      { icon: BookOpen, label: 'Manajemen Kelas', path: '/admin/kelas' },
      { icon: Calendar, label: 'Jadwal', path: '/admin/jadwal' },
      { icon: FileText, label: 'Nilai & Absensi', path: '/admin/nilai' },
      { icon: Bell, label: 'Pengumuman', path: '/admin/pengumuman' },
    ],
    guru: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/guru' },
      { icon: Users, label: 'Kelas & Siswa', path: '/guru/kelas' },
      { icon: FileText, label: 'Input Nilai', path: '/guru/nilai' },
      { icon: Calendar, label: 'Absensi', path: '/guru/absensi' },
      { icon: Calendar, label: 'Jadwal Mengajar', path: '/guru/jadwal' },
      { icon: Bell, label: 'Pengumuman', path: '/guru/pengumuman' },
    ],
    siswa: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/siswa' },
      { icon: Calendar, label: 'Jadwal Pelajaran', path: '/siswa/jadwal' },
      { icon: TrendingUp, label: 'Nilai Pribadi', path: '/siswa/nilai' },
      { icon: Calendar, label: 'Absensi', path: '/siswa/absensi' },
      { icon: Bell, label: 'Pengumuman', path: '/siswa/pengumuman' },
    ],
    ortu: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/ortu' },
      { icon: TrendingUp, label: 'Nilai Anak', path: '/ortu/nilai' },
      { icon: Calendar, label: 'Absensi Anak', path: '/ortu/absensi' },
      { icon: Bell, label: 'Pengumuman', path: '/ortu/pengumuman' },
    ]
  }

  const currentMenu = menuItems[role] || []

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-64 bg-white border-r border-gray-200 h-full flex flex-col"
    >
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Sistem Sekolah</h1>
        <p className="text-sm text-gray-600 capitalize">{role}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {currentMenu.map((item, index) => {
            const isActive = location.pathname === item.path
            return (
              <li key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Keluar</span>
        </button>
      </div>
    </motion.div>
  )
}

export default Sidebar