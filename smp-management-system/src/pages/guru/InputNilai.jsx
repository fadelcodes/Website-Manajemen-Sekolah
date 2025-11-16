import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, Search, Filter } from 'lucide-react'
import { supabase } from '../../supabase/supabaseClient'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

const InputNilai = () => {
  const { profile } = useAuthStore()
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [subjects, setSubjects] = useState([])
  const [students, setStudents] = useState([])
  const [grades, setGrades] = useState({})
  const [gradeType, setGradeType] = useState('tugas')
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    fetchClasses()
  }, [profile])

  useEffect(() => {
    if (selectedClass) {
      fetchSubjects()
      fetchStudents()
    }
  }, [selectedClass])

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

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
    
    // Load existing grades
    if (data?.length && selectedSubject) {
      loadExistingGrades(data.map(s => s.id))
    }
  }

  const loadExistingGrades = async (studentIds) => {
    const { data } = await supabase
      .from('grades')
      .select('*')
      .eq('subject_id', selectedSubject)
      .eq('type', gradeType)
      .in('siswa_id', studentIds)

    const gradeMap = {}
    data?.forEach(grade => {
      gradeMap[grade.siswa_id] = grade.value
    })
    setGrades(gradeMap)
  }

  const handleGradeChange = (studentId, value) => {
    const numericValue = parseFloat(value)
    if (numericValue >= 0 && numericValue <= 100) {
      setGrades(prev => ({
        ...prev,
        [studentId]: numericValue
      }))
      setHasUnsavedChanges(true)
    }
  }

  const saveGrades = async () => {
    if (!selectedSubject) {
      toast.error('Pilih mata pelajaran terlebih dahulu')
      return
    }

    setIsSaving(true)
    try {
      const gradesToSave = Object.entries(grades).map(([siswa_id, value]) => ({
        siswa_id,
        subject_id: selectedSubject,
        guru_id: profile.id,
        type: gradeType,
        value,
        max_value: 100
      }))

      // Delete existing grades first
      await supabase
        .from('grades')
        .delete()
        .eq('subject_id', selectedSubject)
        .eq('type', gradeType)
        .in('siswa_id', Object.keys(grades))

      // Insert new grades
      const { error } = await supabase
        .from('grades')
        .insert(gradesToSave)

      if (error) throw error

      toast.success('Nilai berhasil disimpan!')
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Error saving grades:', error)
      toast.error('Gagal menyimpan nilai')
    } finally {
      setIsSaving(false)
    }
  }

  // Auto-save functionality
  useEffect(() => {
    if (hasUnsavedChanges) {
      const autoSaveTimer = setTimeout(() => {
        if (Object.keys(grades).length > 0) {
          saveGrades()
        }
      }, 3000) // Auto-save after 3 seconds

      return () => clearTimeout(autoSaveTimer)
    }
  }, [grades, hasUnsavedChanges])

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Input Nilai</h1>
          <p className="text-gray-600 mt-2">Input dan kelola nilai siswa</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {hasUnsavedChanges && (
            <span className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
              Ada perubahan yang belum disimpan
            </span>
          )}
          <button
            onClick={saveGrades}
            disabled={isSaving || !hasUnsavedChanges}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={20} />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
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
              Jenis Nilai
            </label>
            <select
              value={gradeType}
              onChange={(e) => setGradeType(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="tugas">Tugas</option>
              <option value="uts">UTS</option>
              <option value="uas">UAS</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Grades Table */}
      {students.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
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
                    Nilai (0-100)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Keterangan
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
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={grades[student.id] || ''}
                        onChange={(e) => handleGradeChange(student.id, e.target.value)}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0-100"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {grades[student.id] >= 85 ? 'Sangat Baik' :
                       grades[student.id] >= 75 ? 'Baik' :
                       grades[student.id] >= 65 ? 'Cukup' :
                       grades[student.id] >= 55 ? 'Kurang' : ''}
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

export default InputNilai