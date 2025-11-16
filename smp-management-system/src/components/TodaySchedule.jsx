import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, MapPin } from 'lucide-react'
import { supabase } from '../supabase/supabaseClient'
import { formatTime } from '../utils/formatDate'

const TodaySchedule = ({ guruId, siswaId }) => {
  const [schedule, setSchedule] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTodaySchedule()
  }, [guruId, siswaId])

  const fetchTodaySchedule = async () => {
    try {
      setIsLoading(true)
      const today = new Date().getDay() // 0 = Sunday, 1 = Monday, etc.
      const dayOfWeek = today === 0 ? 7 : today // Convert to 1-7 (Monday-Sunday)

      let query = supabase
        .from('schedules')
        .select(`
          *,
          classes(name),
          subjects(name),
          gurus(first_name, last_name)
        `)
        .eq('day_of_week', dayOfWeek)
        .order('start_time')

      if (guruId) {
        query = query.eq('guru_id', guruId)
      }

      const { data, error } = await query

      if (error) throw error
      setSchedule(data || [])
    } catch (error) {
      console.error('Error fetching schedule:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    )
  }

  if (schedule.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Tidak ada jadwal untuk hari ini</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {schedule.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm mb-1">
                {item.subjects?.name}
              </h3>
              <p className="text-gray-600 text-sm mb-2">
                {item.classes?.name} {guruId ? '' : `- ${item.gurus?.first_name} ${item.gurus?.last_name}`}
              </p>
              
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <Clock size={14} />
                  <span>{formatTime(item.start_time)} - {formatTime(item.end_time)}</span>
                </div>
                {item.room && (
                  <div className="flex items-center space-x-1">
                    <MapPin size={14} />
                    <span>{item.room}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Current class indicator */}
            {isCurrentClass(item.start_time, item.end_time) && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                Sedang Berlangsung
              </span>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// Helper function to check if current time is within class time
const isCurrentClass = (startTime, endTime) => {
  const now = new Date()
  const currentTime = now.toTimeString().slice(0, 8) // HH:MM:SS
  
  return currentTime >= startTime && currentTime <= endTime
}

export default TodaySchedule