import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Calendar, User, BookOpen } from 'lucide-react'
import { supabase } from '../../supabase/supabaseClient'
import { useAuthStore } from '../../store/authStore'
import StatCard from '../../components/StatCard'
import RealtimeAnnouncements from '../../components/RealtimeAnnouncements'
import GradeChartOrtu from '../../components/GradeChartOrtu'

const DashboardOrtu = () => {
  const { profile } = useAuthStore()
  const [anak, setAnak] = useState(null)
  const [stats, setStats] = useState({
    averageGrade: 0,
    attendance: 0,
    totalSubjects: 0,
    class: '-'
  })

  useEffect(() => {
    if (profile?.id) {
      fetchAnakData()
    }
  }, [profile])

  const fetchAnakData = async () => {
    try {
      // Get anak data
      const { data: anakData } = await supabase
        .from('siswas')
        .select('*')
        .eq('id', profile.siswa_id)
        .single()

      setAnak(anakData)

      if (anakData) {
        // Calculate average grade
        const { data: grades } = await supabase
          .from('grades')
          .select('value')
          .eq('siswa_id', anakData.id)

        const average = grades?.length ? 
          grades.reduce((acc, grade) => acc + grade.value, 0) / grades.length : 0

        // Calculate attendance percentage (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { data: attendance, count: totalClasses } = await supabase
          .from('attendance')
          .select('*', { count: 'exact' })
          .eq('siswa_id', anakData.id)
          .gte('date', thirtyDaysAgo.toISOString().split('T')[0])

        const presentCount = attendance?.filter(a => a.status === 'hadir').length || 0
        const attendancePercentage = totalClasses ? Math.round((presentCount / totalClasses) * 100) : 0

        // Get class name
        const { data: classData } = await supabase
          .from('classes')
          .select('name')
          .eq('id', anakData.class_id)
          .single()

        // Get total subjects
        const { count: subjectCount } = await supabase
          .from('subjects')
          .select('*', { count: 'exact', head: true })
          .eq('class_id', anakData.class_id)

        setStats({
          averageGrade: Math.round(average * 100) / 100,
          attendance: attendancePercentage,
          totalSubjects: subjectCount || 0,
          class: classData?.name || '-'
        })
      }
    } catch (error) {
      console.error('Error fetching anak data:', error)
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Orang Tua</h1>
          <p className="text-gray-600 mt-2">
            Memantau perkembangan {anak ? `${anak.first_name} ${anak.last_name}` : 'anak'}
          </p>
        </div>
      </motion.div>

      {/* Anak Info */}
      {anak && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
              <User className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {anak.first_name} {anak.last_name}
              </h2>
              <p className="text-gray-600">NISN: {anak.nisn} | Kelas: {stats.class}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
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
          icon={Calendar}
          color="green"
        />
        <StatCard
          title="Total Mapel"
          value={stats.totalSubjects}
          icon={BookOpen}
          color="purple"
        />
        <StatCard
          title="Kelas"
          value={stats.class}
          icon={User}
          color="orange"
        />
      </motion.div>

      {/* Grade Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Grafik Nilai {anak ? `${anak.first_name}` : 'Anak'}
        </h2>
        <GradeChartOrtu siswaId={profile?.siswa_id} />
      </motion.div>

      {/* Announcements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Pengumuman Sekolah</h2>
        <RealtimeAnnouncements />
      </motion.div>
    </div>
  )
}

export default DashboardOrtu