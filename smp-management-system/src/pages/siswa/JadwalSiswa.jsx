import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, MapPin, BookOpen, Users } from 'lucide-react'
import { supabase } from '../../supabase/supabaseClient'
import { useAuthStore } from '../../store/authStore'
import { formatTime } from '../../utils/formatDate'

const JadwalSiswa = () => {
  const { profile } = useAuthStore()
  const [schedules, setSchedules] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState(new Date().getDay() || 1)

  const daysOfWeek = [
    { value: 1, label: 'Senin' },
    { value: 2, label: 'Selasa' },
    { value: 3, label: 'Rabu' },
    { value: 4, label: 'Kamis' },
    { value: 5, label: 'Jumat' },
    { value: 6, label: 'Sabtu' },
    { value: 7, label: 'Minggu' }
  ]

  useEffect(() => {
    if (profile?.class_id) {
      fetchSchedules()
    }
  }, [profile, selectedDay])

  const fetchSchedules = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          classes(name),
          subjects(name),
          gurus(first_name, last_name)
        `)
        .eq('class_id', profile.class_id)
        .eq('day_of_week', selectedDay)
        .order('start_time')

      if (error) throw error
      setSchedules(data || [])
    } catch (error) {
      console.error('Error fetching schedules:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTodaySchedule = () => {
    const today = new Date().getDay()
    return today === 0 ? 7 : today // Convert Sunday (0) to 7
  }

  const isCurrentClass = (startTime, endTime) => {
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 8)
    return currentTime >= startTime && currentTime <= endTime
  }

  const getTotalClassHours = () => {
    return schedules.reduce((total, schedule) => {
      const start = new Date(`2000-01-01T${schedule.start_time}`)
      const end = new Date(`2000-01-01T${schedule.end_time}`)
      const diff = (end - start) / (1000 * 60 * 60) // Convert to hours
      return total + diff
    }, 0)
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
          <h1 className="text-3xl font-bold text-gray-900">Jadwal Pelajaran</h1>
          <p className="text-gray-600 mt-2">Jadwal pelajaran kelas Anda</p>
        </div>
        
        <div className="flex items-center space-x-2 text-gray-600">
          <Calendar size={24} />
          <span className="text-sm">
            {schedules.length} Pelajaran • {getTotalClassHours().toFixed(1)} Jam
          </span>
        </div>
      </motion.div>

      {/* Day Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pilih Hari</h3>
        <div className="flex flex-wrap gap-2">
          {daysOfWeek.map(day => (
            <button
              key={day.value}
              onClick={() => setSelectedDay(day.value)}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                selectedDay === day.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
              } ${
                day.value === getTodaySchedule() ? 'ring-2 ring-blue-200' : ''
              }`}
            >
              {day.label}
              {day.value === getTodaySchedule() && ' (Hari Ini)'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Schedule Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <BookOpen className="text-blue-600" size={24} />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pelajaran</p>
              <p className="text-2xl font-bold text-gray-900">{schedules.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <Clock className="text-green-600" size={24} />
            <div>
              <p className="text-sm font-medium text-gray-600">Jam Pelajaran</p>
              <p className="text-2xl font-bold text-gray-900">
                {getTotalClassHours().toFixed(1)}h
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <Users className="text-purple-600" size={24} />
            <div>
              <p className="text-sm font-medium text-gray-600">Guru Berbeda</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(schedules.map(s => s.guru_id)).size}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <MapPin className="text-orange-600" size={24} />
            <div>
              <p className="text-sm font-medium text-gray-600">Ruangan Berbeda</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(schedules.map(s => s.room).filter(Boolean)).size}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Schedule List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        {schedules.length > 0 ? (
          schedules.map((schedule, index) => (
            <motion.div
              key={schedule.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white rounded-xl shadow-sm p-6 border-2 transition-all ${
                isCurrentClass(schedule.start_time, schedule.end_time)
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-100 hover:border-blue-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {schedule.subjects.name}
                    </h3>
                    {isCurrentClass(schedule.start_time, schedule.end_time) && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Sedang Berlangsung
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Users className="text-gray-400" size={16} />
                      <div>
                        <span className="text-gray-600">Guru:</span>
                        <span className="font-medium ml-1">
                          {schedule.gurus.first_name} {schedule.gurus.last_name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Clock className="text-gray-400" size={16} />
                      <div>
                        <span className="text-gray-600">Waktu:</span>
                        <span className="font-medium ml-1">
                          {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                        </span>
                      </div>
                    </div>

                    {schedule.room && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="text-gray-400" size={16} />
                        <div>
                          <span className="text-gray-600">Ruangan:</span>
                          <span className="font-medium ml-1">{schedule.room}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <BookOpen className="text-gray-400" size={16} />
                      <div>
                        <span className="text-gray-600">Kelas:</span>
                        <span className="font-medium ml-1">{schedule.classes.name}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress bar for current class */}
              {isCurrentClass(schedule.start_time, schedule.end_time) && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-1000"
                      style={{
                        width: `${calculateProgress(schedule.start_time, schedule.end_time)}%`
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 text-right">
                    {calculateProgress(schedule.start_time, schedule.end_time)}% selesai
                  </p>
                </div>
              )}
            </motion.div>
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 bg-white rounded-xl shadow-sm"
          >
            <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Tidak ada jadwal pelajaran
            </h3>
            <p className="text-gray-600">
              {selectedDay === getTodaySchedule() 
                ? "Tidak ada jadwal pelajaran hari ini"
                : `Tidak ada jadwal pelajaran pada ${daysOfWeek.find(d => d.value === selectedDay)?.label}`
              }
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Weekly Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan Mingguan</h3>
        <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
          {daysOfWeek.map(day => (
            <div
              key={day.value}
              className={`p-3 rounded-lg text-center ${
                day.value === selectedDay
                  ? 'bg-blue-100 border-2 border-blue-500'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="text-sm font-medium text-gray-900">{day.label.slice(0, 3)}</div>
              <div className="text-xs text-gray-600 mt-1">
                {schedules.filter(s => s.day_of_week === day.value).length} pelajaran
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

// Helper function to calculate class progress
const calculateProgress = (startTime, endTime) => {
  const now = new Date()
  const start = new Date(`2000-01-01T${startTime}`)
  const end = new Date(`2000-01-01T${endTime}`)
  const current = new Date(`2000-01-01T${now.toTimeString().slice(0, 8)}`)
  
  const totalDuration = end - start
  const elapsed = current - start
  
  if (elapsed < 0) return 0
  if (elapsed > totalDuration) return 100
  
  return Math.round((elapsed / totalDuration) * 100)
}

export default JadwalSiswa