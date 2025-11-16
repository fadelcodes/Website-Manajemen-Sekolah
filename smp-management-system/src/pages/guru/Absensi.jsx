import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, Calendar, Users, CheckCircle, XCircle, Clock, Heart } from 'lucide-react'
import { supabase } from '../../supabase/supabaseClient'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

const Absensi = () => {
  const { profile } = useAuthStore()
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [subjects, setSubjects] = useState([])
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState({})
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [isSaving, setIsSaving] = useState(false)

  const attendanceOptions = [
    { value: 'hadir', label: 'Hadir', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
    { value: 'izin', label: 'Izin', icon: Clock, color: 'text-blue-600 bg-blue-50' },
    { value: 'sakit', label: 'Sakit', icon: Heart, color: 'text-orange-600 bg-orange-50' },
    { value: 'alpha', label: 'Alpha', icon: XCircle, color: 'text-red-600 bg-red-50' },
  ]

  useEffect(() => {
    fetchClasses()
  }, [profile])

  useEffect(() => {
    if (selectedClass) {
      fetchSubjects()
      fetchStudents()
    }
  }, [selectedClass])

  useEffect(() => {
    if (students.length > 0 && selectedSubject && selectedDate) {
      loadExistingAttendance()
    }
  }, [students, selectedSubject, selectedDate])

  const fetchClasses = async () => {
    const { data } = await supabase
      .from('subjects')
      .select('classes(id, name)')
      .eq('guru_id', profile.id)

    const uniqueClasses = [...new Map(data?.map(item => 
      [item.classes.id, item.classes])).values()]
    setClasses(uniqueClasses || [])
  }

  const fetchSubjects = async () => {
    const { data } = await supabase
      .from('subjects')
      .select('*')
      .eq('guru_id', profile.id)
      .eq('class_id', selectedClass)

    setSubjects(data || [])
    if (data?.length) {
      setSelectedSubject(data[0].id)
    }
  }

  const fetchStudents = async () => {
    const { data } = await supabase
      .from('siswas')
      .select('*')
      .eq('class_id', selectedClass)
      .order('first_name')

    setStudents(data || [])
  }

  const loadExistingAttendance = async () => {
    const studentIds = students.map(s => s.id)
    const { data } = await supabase
      .from('attendance')
      .select('*')
      .eq('subject_id', selectedSubject)
      .eq('date', selectedDate)
      .in('siswa_id', studentIds)

    const attendanceMap = {}
    data?.forEach(record => {
      attendanceMap[record.siswa_id] = record.status
    })
    setAttendance(attendanceMap)
  }

  const handleAttendanceChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }))
  }

  const saveAttendance = async () => {
    if (!selectedSubject || !selectedDate) {
      toast.error('Pilih mata pelajaran dan tanggal terlebih dahulu')
      return
    }

    setIsSaving(true)
    try {
      const attendanceRecords = Object.entries(attendance).map(([siswa_id, status]) => ({
        siswa_id,
        subject_id: selectedSubject,
        guru_id: profile.id,
        date: selectedDate,
        status
      }))

      // Delete existing attendance first
      await supabase
        .from('attendance')
        .delete()
        .eq('subject_id', selectedSubject)
        .eq('date', selectedDate)
        .in('siswa_id', Object.keys(attendance))

      // Insert new attendance records
      const { error } = await supabase
        .from('attendance')
        .insert(attendanceRecords)

      if (error) throw error

      toast.success('Absensi berhasil disimpan!')
    } catch (error) {
      console.error('Error saving attendance:', error)
      toast.error('Gagal menyimpan absensi')
    } finally {
      setIsSaving(false)
    }
  }

  const getAttendanceStats = () => {
    const stats = {
      hadir: 0,
      izin: 0,
      sakit: 0,
      alpha: 0,
      total: students.length
    }

    Object.values(attendance).forEach(status => {
      if (stats.hasOwnProperty(status)) {
        stats[status]++
      }
    })

    return stats
  }

  const stats = getAttendanceStats()

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Input Absensi</h1>
          <p className="text-gray-600 mt-2">Rekam kehadiran siswa secara realtime</p>
        </div>
        
        <button
          onClick={saveAttendance}
          disabled={isSaving}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save size={20} />
          <span>{isSaving ? 'Menyimpan...' : 'Simpan Absensi'}</span>
        </button>
      </motion.div>

      {/* Filters and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-3 bg-white rounded-xl shadow-sm p-6"
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
                <option value="">Pilih Kelas</option>
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
                <option value="">Pilih Mapel</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Rekap Kehadiran</h3>
          <div className="space-y-3">
            {attendanceOptions.map(option => (
              <div key={option.value} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{option.label}</span>
                <span className="font-semibold">{stats[option.value]}</span>
              </div>
            ))}
            <div className="border-t pt-2">
              <div className="flex items-center justify-between font-semibold">
                <span>Total</span>
                <span>{stats.total}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Attendance Table */}
      {students.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Daftar Siswa - {students.length} siswa
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama Siswa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    NISN
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status Kehadiran
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student, index) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {student.first_name} {student.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.nisn}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {attendanceOptions.map(option => {
                          const Icon = option.icon
                          const isSelected = attendance[student.id] === option.value
                          return (
                            <button
                              key={option.value}
                              onClick={() => handleAttendanceChange(student.id, option.value)}
                              className={`flex items-center space-x-1 px-3 py-2 rounded-lg border transition-all ${
                                isSelected
                                  ? `${option.color} border-current`
                                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              <Icon size={16} />
                              <span className="text-sm">{option.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default Absensi