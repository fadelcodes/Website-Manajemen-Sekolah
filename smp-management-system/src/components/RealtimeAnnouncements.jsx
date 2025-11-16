import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../supabase/supabaseClient'

const RealtimeAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([])

  useEffect(() => {
    fetchAnnouncements()

    const subscription = supabase
      .channel('announcements')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'announcements' },
        (payload) => {
          setAnnouncements(prev => [payload.new, ...prev.slice(0, 4)])
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(5)
    
    setAnnouncements(data || [])
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {announcements.map((announcement, index) => (
          <motion.div
            key={announcement.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm mb-1">
                  {announcement.title}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-2">
                  {announcement.content}
                </p>
              </div>
              <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                {new Date(announcement.created_at).toLocaleDateString('id-ID')}
              </span>
            </div>
            <div className="flex items-center mt-2">
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                {announcement.target_roles?.join(', ')}
              </span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {announcements.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Tidak ada pengumuman</p>
        </div>
      )}
    </div>
  )
}

export default RealtimeAnnouncements