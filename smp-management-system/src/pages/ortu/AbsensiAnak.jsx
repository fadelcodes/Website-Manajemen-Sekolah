import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, CheckCircle, XCircle, MinusCircle, Heart, User, TrendingUp } from 'lucide-react'
import { supabase } from '../../supabase/supabaseClient'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

const AbsensiAnak = () => {
  const { profile } = useAuthStore()
  const [anak, setAnak] = useState(null)
  const [attendance, setAttendance] = useState([])
  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [isLoading, setIsLoading] = useState(true)

  const attendanceStatus = {
    hadir: { icon: CheckCircle, color: 'text-green-600 bg-green-50', label: 'Hadir' },
    izin: { icon: MinusCircle, color: 'text-blue-600 bg-blue-50', label: 'Izin' },
    sakit: { icon: Heart, color: 'text-orange-600 bg-orange-50', label: 'Sakit' },
    alpha: { icon: XCircle, color: 'text-red-600 bg-red-50', label: 'Alpha' }
  }

  useEffect(() => {
    if (profile?.siswa_id) {
      fetchAnakData()
      fetchAttendance()
      fetchSubjects()
    }
  }, [profile, selectedMonth])

  useEffect(() => {
    filterAttendance()
  }, [selectedSubject, selectedMonth])

  const fetchAnakData = async () => {
    try {
      const { data, error } = await supabase
        .from('siswas')
        .select(`
          *,
          classes(name)
        `)
        .eq('id', profile.siswa_id)
        .single()

      if (error) throw error
      setAnak(data)
    } catch (error) {
      console.error('Error fetching anak data:', error)
      toast.error('Gagal memuat data anak')
    }
  }

  const fetchAttendance = async () => {
    try {
      setIsLoading(true)
      const startDate = new Date(selectedMonth + '-01')
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)

      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          subjects(name),
          gurus(first_name, last_name)
        `)
        .eq('siswa_id', profile.siswa_id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: false })

      if (error) throw error
      setAttendance(data || [])
    } catch (error) {
      console.error('Error fetching attendance:', error)
      toast.error('Gagal memuat data absensi')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSubjects = async () => {
    const { data } = await supabase
      .from('subjects')
      .select('*')
      .order('name')
    setSubjects(data || [])
  }

  const filterAttendance = () => {
    let filtered = attendance

    if (selectedSubject !== 'all') {
      filtered = filtered.filter(record => record.subject_id === selectedSubject)
    }

    return filtered
  }

  const getAttendanceStats = () => {
    const stats = {
      hadir: 0,
      izin: 0,
      sakit: 0,
      alpha: 0,
      total: attendance.length
    }

    attendance.forEach(record => {
      if (stats.hasOwnProperty(record.status)) {
        stats[record.status]++
      }
    })

    return stats
  }

  const getMonthlyStats = () => {
    const currentMonth = new Date().toISOString().slice(0, 7)
    const isCurrentMonth = selectedMonth === currentMonth
    
    const monthAttendance = isCurrentMonth ? attendance : 
      attendance.filter(record => record.date.startsWith(selectedMonth))

    const presentCount = monthAttendance.filter(record => record.status === 'hadir').length
    const totalCount = monthAttendance.length
    
    return {
      presentCount,
      totalCount,
      percentage: totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0,
      isCurrentMonth
    }
  }

  const getSubjectStats = () => {
    const subjectMap = {}
    
    attendance.forEach(record => {
      const subjectName = record.subjects.name
      if (!subjectMap[subjectName]) {
        subjectMap[subjectName] = {
          subject: subjectName,
          hadir: 0,
          total: 0
        }
      }
      subjectMap[subjectName].total++
      if (record.status === 'hadir') {
        subjectMap[subjectName].hadir++
      }
    })

    return Object.values(subjectMap).map(item => ({
      ...item,
      percentage: Math.round((item.hadir / item.total) * 100)
    }))
  }

  const filteredAttendance = filterAttendance()
  const stats = getAttendanceStats()
  const monthlyStats = getMonthlyStats()
  const subjectStats = getSubjectStats()

  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    return {
      value: date.toISOString().slice(0, 7),
      label: date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })
    }
  }).reverse()

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
          <h1 className="text-3xl font-bold text-gray-900">Absensi Anak</h1>
          <p className="text-gray-600 mt-2">
            Memantau kehadiran {anak ? `${anak.first_name} ${anak.last_name}` : 'anak'} di sekolah
          </p>
        </div>
        
        <div className="flex items-center space-x-2 text-gray-600">
          <Calendar size={24} />
          <span className="text-sm">{attendance.length} Catatan</span>
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
              <p className="text-gray-600">
                NISN: {anak.nisn} | Kelas: {anak.classes?.name} | 
                Kehadiran: {monthlyStats.presentCount}/{monthlyStats.totalCount} ({monthlyStats.percentage}%)
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Monthly Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-5 gap-6"
      >
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Kehadiran Bulan Ini</p>
              <p className="text-2xl font-bold text-gray-900">
                {monthlyStats.presentCount}/{monthlyStats.totalCount}
              </p>
              <p className="text-xs text-gray-500">{monthlyStats.percentage}%</p>
            </div>
            <TrendingUp className="text-green-600" size={24} />
          </div>
        </div>

        {Object.entries(attendanceStatus).map(([status, config]) => {
          const Icon = config.icon
          return (
            <div key={status} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{config.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats[status]}</p>
                  <p className="text-xs text-gray-500">
                    {stats.total > 0 ? Math.round((stats[status] / stats.total) * 100) : 0}%
                  </p>
                </div>
                <Icon className={config.color.replace('text-', '').split(' ')[0]} size={24} />
              </div>
            </div>
          )
        })}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bulan
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {months.map(month => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mata Pelajaran
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Semua Mata Pelajaran</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              Menampilkan {filteredAttendance.length} dari {attendance.length} catatan
            </div>
          </div>
        </div>
      </motion.div>

      {/* Subject Stats */}
      {subjectStats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Statistik Kehadiran per Mata Pelajaran
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjectStats.map((subject, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{subject.subject}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    subject.percentage >= 90 ? 'bg-green-100 text-green-800' :
                    subject.percentage >= 80 ? 'bg-blue-100 text-blue-800' :
                    subject.percentage >= 70 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {subject.percentage}%
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-600">
                  <span>{subject.hadir} hadir</span>
                  <span>•</span>
                  <span>{subject.total} total</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      subject.percentage >= 90 ? 'bg-green-600' :
                      subject.percentage >= 80 ? 'bg-blue-600' :
                      subject.percentage >= 70 ? 'bg-yellow-600' :
                      'bg-red-600'
                    }`}
                    style={{ width: `${subject.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Attendance List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl shadow-sm overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Riwayat Absensi ({filteredAttendance.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredAttendance.map((record, index) => {
            const StatusIcon = attendanceStatus[record.status].icon
            const statusConfig = attendanceStatus[record.status]
            
            return (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {record.subjects.name}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar size={14} />
                        <span>
                          {new Date(record.date).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock size={14} />
                        <span>Oleh: {record.gurus.first_name} {record.gurus.last_name}</span>
                      </div>
                    </div>

                    {record.notes && (
                      <p className="text-sm text-gray-600 mt-2">
                        <strong>Catatan Guru:</strong> {record.notes}
                      </p>
                    )}
                  </div>
                  
                  <div className="ml-4">
                    <StatusIcon 
                      className={statusConfig.color.split(' ')[0]} 
                      size={24} 
                    />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {filteredAttendance.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-lg font-semibold mb-2">Belum ada data absensi</h3>
            <p>Tidak ada catatan absensi yang sesuai dengan filter yang dipilih</p>
          </div>
        )}
      </motion.div>

      {/* Attendance Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan Kehadiran</h3>
        <div className="space-y-3">
          {Object.entries(attendanceStatus).map(([status, config]) => (
            <div key={status} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <config.icon className={config.color.split(' ')[0]} size={16} />
                <span className="text-sm text-gray-700">{config.label}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">{stats[status]}</span>
                <span className="text-xs text-gray-500">
                  ({stats.total > 0 ? Math.round((stats[status] / stats.total) * 100) : 0}%)
                </span>
              </div>
            </div>
          ))}
          <div className="border-t pt-3">
            <div className="flex items-center justify-between font-semibold">
              <span>Total</span>
              <span>{stats.total}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default AbsensiAnak