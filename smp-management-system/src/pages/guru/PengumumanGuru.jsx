import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, Calendar, User } from 'lucide-react'
import { supabase } from '../../supabase/supabaseClient'
import { useAuthStore } from '../../store/authStore'
import { formatDate } from '../../utils/formatDate'

const PengumumanGuru = () => {
  const { profile } = useAuthStore()
  const [announcements, setAnnouncements] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAnnouncements()
    
    // Subscribe to realtime updates
    const subscription = supabase
      .channel('announcements-guru')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'announcements' },
        (payload) => {
          if (shouldShowAnnouncement(payload.new)) {
            setAnnouncements(prev => [payload.new, ...prev])
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const shouldShowAnnouncement = (announcement) => {
    return announcement.is_published && (
      !announcement.target_roles || 
      announcement.target_roles.length === 0 ||
      announcement.target_roles.includes('guru')
    )
  }

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          users:author_id(email)
        `)
        .eq('is_published', true)
        .or('target_roles.cs.{guru},target_roles.is.null')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAnnouncements(data || [])
    } catch (error) {
      console.error('Error fetching announcements:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-white rounded-xl shadow-sm p-6">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pengumuman</h1>
          <p className="text-gray-600 mt-2">Informasi terbaru dari sekolah</p>
        </div>
        <div className="flex items-center space-x-2 text-gray-600">
          <Bell size={24} />
          <span className="text-sm">{announcements.length} Pengumuman</span>
        </div>
      </motion.div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map((announcement, index) => (
          <motion.div
            key={announcement.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:border-blue-200 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {announcement.title}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                  <div className="flex items-center space-x-1">
                    <User size={16} />
                    <span>Admin</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar size={16} />
                    <span>{formatDate(announcement.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-line">
                {announcement.content}
              </p>
            </div>

            {announcement.target_roles && announcement.target_roles.length > 0 && (
              <div className="mt-4 flex items-center space-x-2">
                <span className="text-xs text-gray-500">Untuk:</span>
                <div className="flex space-x-1">
                  {announcement.target_roles.map(role => (
                    <span
                      key={role}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {announcements.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 bg-white rounded-xl shadow-sm"
        >
          <Bell className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum ada pengumuman</h3>
          <p className="text-gray-600">Pengumuman dari sekolah akan muncul di sini</p>
        </motion.div>
      )}
    </div>
  )
}

export default PengumumanGuru