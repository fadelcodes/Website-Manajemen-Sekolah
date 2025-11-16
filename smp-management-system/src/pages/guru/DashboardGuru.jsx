import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, BookOpen, Calendar, TrendingUp, Clock } from 'lucide-react'
import { supabase } from '../../supabase/supabaseClient'
import { useAuthStore } from '../../store/authStore'
import StatCard from '../../components/StatCard'
import RealtimeAnnouncements from '../../components/RealtimeAnnouncements'
import TodaySchedule from '../../components/TodaySchedule'

const DashboardGuru = () => {
  const { profile } = useAuthStore()
  const [stats, setStats] = useState({
    totalKelas: 0,
    totalSiswa: 0,
    averageGrade: 0,
    lastAttendance: '-'
  })

  useEffect(() => {
    fetchGuruStats()
  }, [profile])

  const fetchGuruStats = async () => {
    if (!profile?.id) return

    try {
      // Get total classes taught by this guru
      const { count: classCount } = await supabase
        .from('subjects')
        .select('*', { count: 'exact', head: true })
        .eq('guru_id', profile.id)

      // Get total students in those classes
      const { count: studentCount } = await supabase
        .from('siswas')
        .select('*', { count: 'exact', head: true })
        .in('class_id', 
          (await supabase.from('subjects').select('class_id').eq('guru_id', profile.id)).data?.map(s => s.class_id) || []
        )

      // Get average grade
      const { data: grades } = await supabase
        .from('grades')
        .select('value')
        .eq('guru_id', profile.id)

      const average = grades?.length ? 
        grades.reduce((acc, grade) => acc + grade.value, 0) / grades.length : 0

      // Get last attendance date
      const { data: lastAttendance } = await supabase
        .from('attendance')
        .select('date')
        .eq('guru_id', profile.id)
        .order('date', { ascending: false })
        .limit(1)
        .single()

      setStats({
        totalKelas: classCount || 0,
        totalSiswa: studentCount || 0,
        averageGrade: Math.round(average * 100) / 100,
        lastAttendance: lastAttendance ? 
          new Date(lastAttendance.date).toLocaleDateString('id-ID') : '-'
      })
    } catch (error) {
      console.error('Error fetching guru stats:', error)
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Guru</h1>
          <p className="text-gray-600 mt-2">
            Selamat datang, {profile?.first_name} {profile?.last_name}!
          </p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatCard
          title="Total Kelas"
          value={stats.totalKelas}
          icon={BookOpen}
          color="blue"
        />
        <StatCard
          title="Total Siswa"
          value={stats.totalSiswa}
          icon={Users}
          color="green"
        />
        <StatCard
          title="Rata-rata Nilai"
          value={stats.averageGrade}
          icon={TrendingUp}
          color="purple"
        />
        <StatCard
          title="Absensi Terakhir"
          value={stats.lastAttendance}
          icon={Clock}
          color="orange"
        />
      </motion.div>

      {/* Today's Schedule and Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Jadwal Hari Ini</h2>
            <Calendar className="text-gray-400" size={20} />
          </div>
          <TodaySchedule guruId={profile?.id} />
        </motion.div>

        {/* Realtime Announcements */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Pengumuman Terbaru</h2>
          </div>
          <RealtimeAnnouncements />
        </motion.div>
      </div>
    </div>
  )
}

export default DashboardGuru