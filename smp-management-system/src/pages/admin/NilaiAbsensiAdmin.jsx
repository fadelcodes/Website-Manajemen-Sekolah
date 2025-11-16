import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, Download, Eye, TrendingUp, Users } from 'lucide-react'
import { supabase } from '../../supabase/supabaseClient'
import toast from 'react-hot-toast'

const NilaiAbsensiAdmin = () => {
  const [selectedTab, setSelectedTab] = useState('nilai')
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [grades, setGrades] = useState([])
  const [attendance, setAttendance] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchClasses()
    fetchSubjects()
  }, [])

  useEffect(() => {
    if (selectedClass && selectedTab === 'nilai') {
      fetchGrades()
    }
    if (selectedClass && selectedTab === 'absensi') {
      fetchAttendance()
    }
  }, [selectedClass, selectedSubject, selectedTab])

  const fetchClasses = async () => {
    const { data } = await supabase
      .from('classes')
      .select('*')
      .order('name')
    setClasses(data || [])
  }

  const fetchSubjects = async () => {
    const { data } = await supabase
      .from('subjects')
      .select('*')
      .order('name')
    setSubjects(data || [])
  }

  const fetchGrades = async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from('grades')
        .select(`
          *,
          siswas(first_name, last_name, nisn),
          subjects(name),
          gurus(first_name, last_name)
        `)
        .in('siswa_id', 
          (await supabase.from('siswas').select('id').eq('class_id', selectedClass)).data?.map(s => s.id) || []
        )

      if (selectedSubject) {
        query = query.eq('subject_id', selectedSubject)
      }

      const { data, error } = await query

      if (error) throw error
      setGrades(data || [])
    } catch (error) {
      console.error('Error fetching grades:', error)
      toast.error('Gagal memuat data nilai')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAttendance = async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from('attendance')
        .select(`
          *,
          siswas(first_name, last_name, nisn),
          subjects(name),
          gurus(first_name, last_name)
        `)
        .in('siswa_id', 
          (await supabase.from('siswas').select('id').eq('class_id', selectedClass)).data?.map(s => s.id) || []
        )

      if (selectedSubject) {
        query = query.eq('subject_id', selectedSubject)
      }

      const { data, error } = await query

      if (error) throw error
      setAttendance(data || [])
    } catch (error) {
      console.error('Error fetching attendance:', error)
      toast.error('Gagal memuat data absensi')
    } finally {
      setIsLoading(false)
    }
  }

  const getGradeStats = () => {
    if (grades.length === 0) return null

    const average = grades.reduce((acc, grade) => acc + grade.value, 0) / grades.length
    const max = Math.max(...grades.map(grade => grade.value))
    const min = Math.min(...grades.map(grade => grade.value))

    return {
      average: Math.round(average * 100) / 100,
      max,
      min,
      count: grades.length
    }
  }

  const getAttendanceStats = () => {
    if (attendance.length === 0) return null

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

  const exportToCSV = () => {
    // Simple CSV export implementation
    const data = selectedTab === 'nilai' ? grades : attendance
    if (data.length === 0) {
      toast.error('Tidak ada data untuk diexport')
      return
    }

    const headers = selectedTab === 'nilai' 
      ? ['Nama', 'NISN', 'Mata Pelajaran', 'Jenis', 'Nilai', 'Guru']
      : ['Nama', 'NISN', 'Mata Pelajaran', 'Tanggal', 'Status', 'Guru']

    const csvContent = [
      headers.join(','),
      ...data.map(item => 
        selectedTab === 'nilai'
          ? [
              `"${item.siswas.first_name} ${item.siswas.last_name}"`,
              item.siswas.nisn,
              `"${item.subjects.name}"`,
              item.type,
              item.value,
              `"${item.gurus.first_name} ${item.gurus.last_name}"`
            ].join(',')
          : [
              `"${item.siswas.first_name} ${item.siswas.last_name}"`,
              item.siswas.nisn,
              `"${item.subjects.name}"`,
              item.date,
              item.status,
              `"${item.gurus.first_name} ${item.gurus.last_name}"`
            ].join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedTab}_${selectedClass}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast.success('Data berhasil diexport')
  }

  const gradeStats = getGradeStats()
  const attendanceStats = getAttendanceStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Monitoring Nilai & Absensi</h1>
          <p className="text-gray-600 mt-2">Pantau perkembangan akademik dan kehadiran siswa</p>
        </div>
        
        <button
          onClick={exportToCSV}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Download size={20} />
          <span>Export CSV</span>
        </button>
      </motion.div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'nilai', label: 'Nilai', icon: TrendingUp },
            { id: 'absensi', label: 'Absensi', icon: Users }
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pilih Kelas
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Semua Kelas</option>
              {classes.map(classItem => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name}
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
              <option value="">Semua Mapel</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={selectedTab === 'nilai' ? fetchGrades : fetchAttendance}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700"
            >
              Terapkan Filter
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      {(gradeStats || attendanceStats) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          {selectedTab === 'nilai' && gradeStats && (
            <>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Rata-rata</p>
                    <p className="text-2xl font-bold text-gray-900">{gradeStats.average}</p>
                  </div>
                  <TrendingUp className="text-blue-600" size={24} />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tertinggi</p>
                    <p className="text-2xl font-bold text-gray-900">{gradeStats.max}</p>
                  </div>
                  <TrendingUp className="text-green-600" size={24} />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Terendah</p>
                    <p className="text-2xl font-bold text-gray-900">{gradeStats.min}</p>
                  </div>
                  <TrendingUp className="text-red-600" size={24} />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Data</p>
                    <p className="text-2xl font-bold text-gray-900">{gradeStats.count}</p>
                  </div>
                  <Eye className="text-purple-600" size={24} />
                </div>
              </div>
            </>
          )}

          {selectedTab === 'absensi' && attendanceStats && (
            <>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Hadir</p>
                    <p className="text-2xl font-bold text-gray-900">{attendanceStats.hadir}</p>
                  </div>
                  <Users className="text-green-600" size={24} />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Izin</p>
                    <p className="text-2xl font-bold text-gray-900">{attendanceStats.izin}</p>
                  </div>
                  <Users className="text-blue-600" size={24} />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sakit</p>
                    <p className="text-2xl font-bold text-gray-900">{attendanceStats.sakit}</p>
                  </div>
                  <Users className="text-orange-600" size={24} />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Alpha</p>
                    <p className="text-2xl font-bold text-gray-900">{attendanceStats.alpha}</p>
                  </div>
                  <Users className="text-red-600" size={24} />
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* Data Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm overflow-hidden"
      >
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Memuat data...</p>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Data {selectedTab === 'nilai' ? 'Nilai' : 'Absensi'} 
                {selectedClass && ` (${selectedTab === 'nilai' ? grades.length : attendance.length} records)`}
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {selectedTab === 'nilai' ? (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Siswa
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mata Pelajaran
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Jenis
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nilai
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Guru
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Siswa
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mata Pelajaran
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tanggal
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Guru
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedTab === 'nilai' ? (
                    grades.map((grade) => (
                      <tr key={grade.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {grade.siswas.first_name} {grade.siswas.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{grade.siswas.nisn}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {grade.subjects.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                          {grade.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            grade.value >= 85 ? 'bg-green-100 text-green-800' :
                            grade.value >= 75 ? 'bg-blue-100 text-blue-800' :
                            grade.value >= 65 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {grade.value}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {grade.gurus.first_name} {grade.gurus.last_name}
                        </td>
                      </tr>
                    ))
                  ) : (
                    attendance.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {record.siswas.first_name} {record.siswas.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{record.siswas.nisn}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.subjects.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(record.date).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            record.status === 'hadir' ? 'bg-green-100 text-green-800' :
                            record.status === 'izin' ? 'bg-blue-100 text-blue-800' :
                            record.status === 'sakit' ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.gurus.first_name} {record.gurus.last_name}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {(selectedTab === 'nilai' ? grades.length : attendance.length) === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p>Tidak ada data yang ditemukan</p>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  )
}

export default NilaiAbsensiAdmin