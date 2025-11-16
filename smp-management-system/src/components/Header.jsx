import React from 'react'
import { motion } from 'framer-motion'
import { Bell, LogOut, User } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const Header = () => {
  const { user, profile, role, logout } = useAuthStore()

  const getDisplayName = () => {
    if (role === 'guru' || role === 'siswa') {
      return `${profile?.first_name} ${profile?.last_name}`
    }
    return user?.email
  }

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white border-b border-gray-200 px-4 py-3 lg:px-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 capitalize">
            {role} Dashboard
          </h1>
          <p className="text-sm text-gray-600">Selamat datang, {getDisplayName()}!</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="relative p-2 text-gray-600 hover:text-gray-900">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <span className="hidden sm:block text-sm font-medium text-gray-700">
              {getDisplayName()}
            </span>
          </div>
          
          <button
            onClick={logout}
            className="p-2 text-gray-600 hover:text-red-600 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </motion.header>
  )
}

export default Header