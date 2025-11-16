import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, BookOpen, Calendar, Bell, TrendingUp } from 'lucide-react'
import { supabase } from '../../supabase/supabaseClient'
import StatCard from '../../components/StatCard'
import RealtimeAnnouncements from '../../components/RealtimeAnnouncements'
import GradeChart from '../../components/GradeChart'

const DashboardAdmin = () => {
  const [stats, setStats] = useState({
    totalSiswa: 0,
    totalGuru: 0,
    totalKelas: 0,
    activeEvents: 0
  })
  const [recentActivity, setRecentActivity] = useState([])

  useEffect(() => {
    fetchStats()
    fetchRecentActivity()
    
    // Subscribe to realtime changes
    const subscription = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchStats()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchStats = async () => {
    try {
      // Get total siswa
      const { count: siswaCount } = await supabase
        .from('siswas')
        .select('*', { count: 'exact', head: true })

      // Get total guru
      const { count: guruCount } = await supabase
        .from('gurus')
        .select('*', { count: 'exact', head: true })

      // Get total kelas
      const { count: kelasCount } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true })

      setStats({
        totalSiswa: siswaCount || 0,
        totalGuru: guruCount || 0,
        totalKelas: kelasCount || 0,
        activeEvents: 3 // Placeholder
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchRecentActivity = async () => {
    const { data } = await supabase
      .from('activity_logs')
      .select(`
        *,
        users:user_id(email)
      `)
      .order('created_at', { ascending: false })
      .limit(10)
    
    setRecentActivity(data || [])
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
          <p className="text-gray-600 mt-2">Selamat datang di sistem manajemen sekolah</p>
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
          title="Total Siswa"
          value={stats.totalSiswa}
          icon={Users}
          color="blue"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Total Guru"
          value={stats.totalGuru}
          icon={Users}
          color="green"
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard
          title="Total Kelas"
          value={stats.totalKelas}
          icon={BookOpen}
          color="purple"
          trend={{ value: 2, isPositive: true }}
        />
        <StatCard
          title="Event Aktif"
          value={stats.activeEvents}
          icon={Calendar}
          color="orange"
        />
      </motion.div>

      {/* Charts and Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Rata-rata Nilai per Kelas</h2>
            <TrendingUp className="text-gray-400" size={20} />
          </div>
          <GradeChart />
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
            <Bell className="text-gray-400" size={20} />
          </div>
          <RealtimeAnnouncements />
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Riwayat Aktivitas</h2>
        <div className="space-y-4">
          {recentActivity.map((activity, index) => (
            <div key={activity.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500">{activity.users?.email}</p>
                </div>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(activity.created_at).toLocaleString('id-ID')}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export default DashboardAdmin