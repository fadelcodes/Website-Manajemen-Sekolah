import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, BookOpen, Mail, Phone, Calendar } from 'lucide-react'
import { supabase } from '../../supabase/supabaseClient'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

const KelasSiswa = () => {
  const { profile } = useAuthStore()
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState(null)
  const [students, setStudents] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchClasses()
  }, [profile])

  const fetchClasses = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('subjects')
        .select(`
          classes(id, name, level),
          gurus!inner(id)
        `)
        .eq('gurus.id', profile.id)

      if (error) throw error

      const uniqueClasses = [...new Map(data?.map(item => 
        [item.classes.id, item.classes])).values()]
      
      setClasses(uniqueClasses || [])
      
      if (uniqueClasses.length > 0) {
        setSelectedClass(uniqueClasses[0])
        fetchStudents(uniqueClasses[0].id)
      }
    } catch (error) {
      console.error('Error fetching classes:', error)
      toast.error('Gagal memuat data kelas')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStudents = async (classId) => {
    try {
      const { data, error } = await supabase
        .from('siswas')
        .select('*')
        .eq('class_id', classId)
        .eq('status', 'aktif')
        .order('first_name')

      if (error) throw error
      setStudents(data || [])
    } catch (error) {
      console.error('Error fetching students:', error)
      toast.error('Gagal memuat data siswa')
    }
  }

  const handleClassChange = (classItem) => {
    setSelectedClass(classItem)
    fetchStudents(classItem.id)
  }

  const getAttendanceStats = async (studentId) => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data, count } = await supabase
      .from('attendance')
      .select('*', { count: 'exact' })
      .eq('siswa_id', studentId)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])

    const presentCount = data?.filter(a => a.status === 'hadir').length || 0
    return count ? Math.round((presentCount / count) * 100) : 0
  }

  const getGradeStats = async (studentId) => {
    const { data } = await supabase
      .from('grades')
      .select('value')
      .eq('siswa_id', studentId)

    if (!data || data.length === 0) return 0
    
    const average = data.reduce((acc, grade) => acc + grade.value, 0) / data.length
    return Math.round(average * 100) / 100
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white rounded-xl shadow-sm p-6">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
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
          <h1 className="text-3xl font-bold text-gray-900">Kelas & Siswa</h1>
          <p className="text-gray-600 mt-2">Kelola kelas yang Anda ajar dan data siswa</p>
        </div>
        
        <div className="flex items-center space-x-2 text-gray-600">
          <Users size={24} />
          <span className="text-sm">
            {classes.length} Kelas • {students.length} Siswa
          </span>
        </div>
      </motion.div>

      {/* Class Selection */}
      {classes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pilih Kelas</h3>
          <div className="flex flex-wrap gap-2">
            {classes.map(classItem => (
              <button
                key={classItem.id}
                onClick={() => handleClassChange(classItem)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  selectedClass?.id === classItem.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                }`}
              >
                {classItem.name}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Class Info */}
      {selectedClass && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <BookOpen className="text-blue-600" size={24} />
              <div>
                <p className="text-sm font-medium text-gray-600">Kelas</p>
                <p className="text-xl font-bold text-gray-900">{selectedClass.name}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <Users className="text-green-600" size={24} />
              <div>
                <p className="text-sm font-medium text-gray-600">Jumlah Siswa</p>
                <p className="text-xl font-bold text-gray-900">{students.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <Calendar className="text-purple-600" size={24} />
              <div>
                <p className="text-sm font-medium text-gray-600">Tingkat</p>
                <p className="text-xl font-bold text-gray-900">Kelas {selectedClass.level}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Students List */}
      {selectedClass && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Daftar Siswa - {selectedClass.name}
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Siswa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    NISN
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kontak
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rata-rata Nilai
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kehadiran (30 hari)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map(async (student, index) => {
                  const attendanceRate = await getAttendanceStats(student.id)
                  const averageGrade = await getGradeStats(student.id)
                  
                  return (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                            <Users className="text-white" size={16} />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {student.first_name} {student.last_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.nisn || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {student.email && (
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <Mail size={14} />
                              <span>{student.email}</span>
                            </div>
                          )}
                          {student.phone && (
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <Phone size={14} />
                              <span>{student.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          averageGrade >= 85 ? 'bg-green-100 text-green-800' :
                          averageGrade >= 75 ? 'bg-blue-100 text-blue-800' :
                          averageGrade >= 65 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {averageGrade || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full transition-all"
                              style={{ width: `${attendanceRate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{attendanceRate}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {students.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Users className="mx-auto mb-4 text-gray-400" size={48} />
              <h3 className="text-lg font-semibold mb-2">Belum ada siswa</h3>
              <p>Tidak ada siswa yang terdaftar di kelas ini</p>
            </div>
          )}
        </motion.div>
      )}

      {classes.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 bg-white rounded-xl shadow-sm"
        >
          <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum mengajar kelas</h3>
          <p className="text-gray-600">Anda belum ditugaskan untuk mengajar kelas apapun</p>
        </motion.div>
      )}
    </div>
  )
}

export default KelasSiswa