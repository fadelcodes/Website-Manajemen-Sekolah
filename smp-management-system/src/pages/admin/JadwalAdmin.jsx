import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Edit, Trash2, Clock, MapPin, Users } from 'lucide-react'
import { supabase } from '../../supabase/supabaseClient'
import toast from 'react-hot-toast'

const JadwalAdmin = () => {
  const [schedules, setSchedules] = useState([])
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [gurus, setGurus] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [formData, setFormData] = useState({
    class_id: '',
    subject_id: '',
    guru_id: '',
    day_of_week: 1,
    start_time: '',
    end_time: '',
    room: ''
  })

  const daysOfWeek = [
    { value: 1, label: 'Senin' },
    { value: 2, label: 'Selasa' },
    { value: 3, label: 'Rabu' },
    { value: 4, label: 'Kamis' },
    { value: 5, label: 'Jumat' },
    { value: 6, label: 'Sabtu' },
    { value: 7, label: 'Minggu' }
  ]

  useEffect(() => {
    fetchSchedules()
    fetchClasses()
    fetchSubjects()
    fetchGurus()
  }, [])

  const fetchSchedules = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          classes(name),
          subjects(name),
          gurus(first_name, last_name)
        `)
        .order('day_of_week')
        .order('start_time')

      if (error) throw error
      setSchedules(data || [])
    } catch (error) {
      console.error('Error fetching schedules:', error)
      toast.error('Gagal memuat jadwal')
    } finally {
      setIsLoading(false)
    }
  }

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

  const fetchGurus = async () => {
    const { data } = await supabase
      .from('gurus')
      .select('id, first_name, last_name')
      .eq('status', 'aktif')
      .order('first_name')
    setGurus(data || [])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Validate time
      if (formData.start_time >= formData.end_time) {
        toast.error('Waktu mulai harus sebelum waktu selesai')
        return
      }

      if (editingSchedule) {
        // Update existing schedule
        const { error } = await supabase
          .from('schedules')
          .update(formData)
          .eq('id', editingSchedule.id)

        if (error) throw error
        toast.success('Jadwal berhasil diperbarui')
      } else {
        // Check for schedule conflict
        const { data: conflict } = await supabase
          .from('schedules')
          .select('id')
          .eq('class_id', formData.class_id)
          .eq('day_of_week', formData.day_of_week)
          .or(`and(start_time.lte.${formData.end_time},end_time.gte.${formData.start_time})`)
          .single()

        if (conflict) {
          toast.error('Terjadi konflik jadwal dengan kelas yang sama')
          return
        }

        // Create new schedule
        const { error } = await supabase
          .from('schedules')
          .insert(formData)

        if (error) throw error
        toast.success('Jadwal berhasil ditambahkan')
      }

      setShowModal(false)
      setEditingSchedule(null)
      setFormData({
        class_id: '',
        subject_id: '',
        guru_id: '',
        day_of_week: 1,
        start_time: '',
        end_time: '',
        room: ''
      })
      fetchSchedules()
    } catch (error) {
      console.error('Error saving schedule:', error)
      toast.error('Gagal menyimpan jadwal')
    }
  }

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule)
    setFormData({
      class_id: schedule.class_id,
      subject_id: schedule.subject_id,
      guru_id: schedule.guru_id,
      day_of_week: schedule.day_of_week,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      room: schedule.room || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (schedule) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', schedule.id)

      if (error) throw error

      toast.success('Jadwal berhasil dihapus')
      fetchSchedules()
    } catch (error) {
      console.error('Error deleting schedule:', error)
      toast.error('Gagal menghapus jadwal')
    }
  }

  const getSchedulesByDay = (day) => {
    return schedules.filter(schedule => schedule.day_of_week === day)
  }

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    })
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
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Jadwal</h1>
          <p className="text-gray-600 mt-2">Kelola jadwal pelajaran semua kelas</p>
        </div>
        
        <button
          onClick={() => {
            setEditingSchedule(null)
            setFormData({
              class_id: '',
              subject_id: '',
              guru_id: '',
              day_of_week: 1,
              start_time: '',
              end_time: '',
              room: ''
            })
            setShowModal(true)
          }}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          <span>Tambah Jadwal</span>
        </button>
      </motion.div>

      {/* Schedule by Days */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {daysOfWeek.map(day => {
          const daySchedules = getSchedulesByDay(day.value)
          return (
            <motion.div
              key={day.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: day.value * 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {day.label} ({daySchedules.length})
              </h3>
              
              <div className="space-y-3">
                {daySchedules.map(schedule => (
                  <div
                    key={schedule.id}
                    className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">
                          {schedule.subjects?.name}
                        </h4>
                        <p className="text-xs text-gray-600 mb-1">
                          {schedule.classes?.name} - {schedule.gurus?.first_name} {schedule.gurus?.last_name}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock size={12} />
                            <span>{formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}</span>
                          </div>
                          {schedule.room && (
                            <div className="flex items-center space-x-1">
                              <MapPin size={12} />
                              <span>{schedule.room}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        <button
                          onClick={() => handleEdit(schedule)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(schedule)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {daySchedules.length === 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Tidak ada jadwal
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingSchedule ? 'Edit Jadwal' : 'Tambah Jadwal'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kelas *
                </label>
                <select
                  required
                  value={formData.class_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, class_id: e.target.value }))}
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
                  Mata Pelajaran *
                </label>
                <select
                  required
                  value={formData.subject_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject_id: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Pilih Mata Pelajaran</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Guru *
                </label>
                <select
                  required
                  value={formData.guru_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, guru_id: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Pilih Guru</option>
                  {gurus.map(guru => (
                    <option key={guru.id} value={guru.id}>
                      {guru.first_name} {guru.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hari *
                </label>
                <select
                  required
                  value={formData.day_of_week}
                  onChange={(e) => setFormData(prev => ({ ...prev, day_of_week: parseInt(e.target.value) }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {daysOfWeek.map(day => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Waktu Mulai *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.start_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Waktu Selesai *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.end_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ruangan
                </label>
                <input
                  type="text"
                  value={formData.room}
                  onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Contoh: Lab Komputer, Aula"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingSchedule ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default JadwalAdmin