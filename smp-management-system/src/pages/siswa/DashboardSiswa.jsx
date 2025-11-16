import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Calendar, Clock, FileText } from 'lucide-react'
import { supabase } from '../../supabase/supabaseClient'
import { useAuthStore } from '../../store/authStore'
import StatCard from '../../components/StatCard'
import RealtimeAnnouncements from '../../components/RealtimeAnnouncements'
import TodaySchedule from '../../components/TodaySchedule'
import GradeChartSiswa from '../../components/GradeChartSiswa'

const DashboardSiswa = () => {
  const { profile } = useAuthStore()
  const [stats, setStats] = useState({
    averageGrade: 0,
    attendance: 0,
    pendingAssignments: 0,
    totalSubjects: 0
  })

  useEffect(() => {
    if (profile?.id) {
      fetchSiswaStats()
    }
  }, [profile])

  const fetchSiswaStats = async () => {
    try {
      // Calculate average grade
      const { data: grades } = await supabase
        .from('grades')
        .select('value')
        .eq('siswa_id', profile.id)

      const average = grades?.length ? 
        grades.reduce((acc, grade) => acc + grade.value, 0) / grades.length : 0

      // Calculate attendance percentage (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: attendance, count: totalClasses } = await supabase
        .from('attendance')
        .select('*', { count: 'exact' })
        .eq('siswa_id', profile.id)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])

      const presentCount = attendance?.filter(a => a.status === 'hadir').length || 0
      const attendancePercentage = totalClasses ? Math.round((presentCount / totalClasses) * 100) : 0

      // Get pending assignments (placeholder)
      const pendingAssignments = 3

      // Get total subjects
      const { count: subjectCount } = await supabase
        .from('subjects')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', profile.class_id)

      setStats({
        averageGrade: Math.round(average * 100) / 100,
        attendance: attendancePercentage,
        pendingAssignments,
        totalSubjects: subjectCount || 0
      })
    } catch (error) {
      console.error('Error fetching siswa stats:', error)
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Siswa</h1>
          <p className="text-gray-600 mt-2">
            Selamat belajar, {profile?.first_name} {profile?.last_name}!
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
          title="Rata-rata Nilai"
          value={stats.averageGrade}
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Kehadiran"
          value={`${stats.attendance}%`}
          icon={Clock}
          color="green"
        />
        <StatCard
          title="Tugas Tertunda"
          value={stats.pendingAssignments}
          icon={FileText}
          color="orange"
        />
        <StatCard
          title="Total Mapel"
          value={stats.totalSubjects}
          icon={Calendar}
          color="purple"
        />
      </motion.div>

      {/* Charts and Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Grafik Nilai</h2>
            <TrendingUp className="text-gray-400" size={20} />
          </div>
          <GradeChartSiswa siswaId={profile?.id} />
        </motion.div>

        {/* Today's Schedule */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Jadwal Hari Ini</h2>
            <Calendar className="text-gray-400" size={20} />
          </div>
          <TodaySchedule siswaId={profile?.id} />
        </motion.div>
      </div>

      {/* Announcements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Pengumuman Terbaru</h2>
        <RealtimeAnnouncements />
      </motion.div>
    </div>
  )
}

export default DashboardSiswa