import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, BookOpen, Calendar, Download } from 'lucide-react'
import { supabase } from '../../supabase/supabaseClient'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

const NilaiSiswa = () => {
  const { profile } = useAuthStore()
  const [grades, setGrades] = useState([])
  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [isLoading, setIsLoading] = useState(true)

  const gradeTypes = [
    { value: 'all', label: 'Semua Jenis' },
    { value: 'tugas', label: 'Tugas' },
    { value: 'uts', label: 'UTS' },
    { value: 'uas', label: 'UAS' }
  ]

  useEffect(() => {
    fetchGrades()
    fetchSubjects()
  }, [profile])

  useEffect(() => {
    filterGrades()
  }, [selectedSubject, selectedType])

  const fetchGrades = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('grades')
        .select(`
          *,
          subjects(name),
          gurus(first_name, last_name)
        `)
        .eq('siswa_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setGrades(data || [])
    } catch (error) {
      console.error('Error fetching grades:', error)
      toast.error('Gagal memuat data nilai')
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

  const filterGrades = () => {
    let filtered = grades

    if (selectedSubject !== 'all') {
      filtered = filtered.filter(grade => grade.subject_id === selectedSubject)
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(grade => grade.type === selectedType)
    }

    return filtered
  }

  const getSubjectAverage = (subjectId) => {
    const subjectGrades = grades.filter(grade => grade.subject_id === subjectId)
    if (subjectGrades.length === 0) return 0
    
    const average = subjectGrades.reduce((acc, grade) => acc + grade.value, 0) / subjectGrades.length
    return Math.round(average * 100) / 100
  }

  const getOverallAverage = () => {
    if (grades.length === 0) return 0
    
    const average = grades.reduce((acc, grade) => acc + grade.value, 0) / grades.length
    return Math.round(average * 100) / 100
  }

  const getGradeStats = () => {
    const stats = {
      tugas: { count: 0, average: 0 },
      uts: { count: 0, average: 0 },
      uas: { count: 0, average: 0 }
    }

    grades.forEach(grade => {
      if (stats[grade.type]) {
        stats[grade.type].count++
        stats[grade.type].average += grade.value
      }
    })

    // Calculate averages
    Object.keys(stats).forEach(type => {
      if (stats[type].count > 0) {
        stats[type].average = Math.round((stats[type].average / stats[type].count) * 100) / 100
      }
    })

    return stats
  }

  const exportToPDF = () => {
    toast.success('Fitur export PDF akan segera tersedia')
    // Implement PDF export functionality here
  }

  const filteredGrades = filterGrades()
  const gradeStats = getGradeStats()
  const overallAverage = getOverallAverage()

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
          <h1 className="text-3xl font-bold text-gray-900">Nilai Pribadi</h1>
          <p className="text-gray-600 mt-2">Lihat perkembangan nilai akademik Anda</p>
        </div>
        
        <button
          onClick={exportToPDF}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Download size={20} />
          <span>Export PDF</span>
        </button>
      </motion.div>

      {/* Overall Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rata-rata Keseluruhan</p>
              <p className="text-2xl font-bold text-gray-900">{overallAverage}</p>
            </div>
            <TrendingUp className="text-blue-600" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Nilai</p>
              <p className="text-2xl font-bold text-gray-900">{grades.length}</p>
            </div>
            <BookOpen className="text-green-600" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Mata Pelajaran</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(grades.map(grade => grade.subject_id)).size}
              </p>
            </div>
            <Calendar className="text-purple-600" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Nilai Tertinggi</p>
              <p className="text-2xl font-bold text-gray-900">
                {grades.length > 0 ? Math.max(...grades.map(grade => grade.value)) : 0}
              </p>
            </div>
            <TrendingUp className="text-orange-600" size={24} />
          </div>
        </div>
      </motion.div>

      {/* Grade Type Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {Object.entries(gradeStats).map(([type, stats]) => (
          <div key={type} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 capitalize">{type}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.average || 0}</p>
                <p className="text-xs text-gray-500">{stats.count} nilai</p>
              </div>
              <div className={`p-2 rounded-lg ${
                type === 'tugas' ? 'bg-blue-100 text-blue-600' :
                type === 'uts' ? 'bg-orange-100 text-orange-600' :
                'bg-green-100 text-green-600'
              }`}>
                <TrendingUp size={20} />
              </div>
            </div>
          </div>
        ))}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jenis Nilai
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {gradeTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              Menampilkan {filteredGrades.length} dari {grades.length} nilai
            </div>
          </div>
        </div>
      </motion.div>

      {/* Subject Averages */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Rata-rata per Mata Pelajaran
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map(subject => {
            const average = getSubjectAverage(subject.id)
            const subjectGrades = grades.filter(grade => grade.subject_id === subject.id)
            
            if (subjectGrades.length === 0) return null

            return (
              <div key={subject.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{subject.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    average >= 85 ? 'bg-green-100 text-green-800' :
                    average >= 75 ? 'bg-blue-100 text-blue-800' :
                    average >= 65 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {average}
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  {subjectGrades.length} nilai • {subjectGrades.filter(g => g.type === 'tugas').length} Tugas • 
                  {subjectGrades.filter(g => g.type === 'uts').length} UTS • 
                  {subjectGrades.filter(g => g.type === 'uas').length} UAS
                </p>
              </div>
            )
          }).filter(Boolean)}
        </div>
      </motion.div>

      {/* Grades Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl shadow-sm overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Detail Nilai ({filteredGrades.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Keterangan
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredGrades.map((grade) => (
                <tr key={grade.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {grade.subjects.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {grade.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(grade.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {grade.description || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredGrades.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <BookOpen className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-lg font-semibold mb-2">Belum ada nilai</h3>
            <p>Tidak ada nilai yang sesuai dengan filter yang dipilih</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default NilaiSiswa