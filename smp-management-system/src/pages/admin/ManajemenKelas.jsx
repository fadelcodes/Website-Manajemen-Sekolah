import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Edit, Trash2, Users, BookOpen } from 'lucide-react'
import { supabase } from '../../supabase/supabaseClient'
import toast from 'react-hot-toast'

const ManajemenKelas = () => {
  const [classes, setClasses] = useState([])
  const [filteredClasses, setFilteredClasses] = useState([])
  const [gurus, setGurus] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingClass, setEditingClass] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    level: '',
    guru_id: ''
  })

  useEffect(() => {
    fetchClasses()
    fetchGurus()
  }, [])

  useEffect(() => {
    filterClasses()
  }, [classes, searchTerm])

  const fetchClasses = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          gurus(first_name, last_name),
          siswas(count)
        `)
        .order('name')

      if (error) throw error
      setClasses(data || [])
    } catch (error) {
      console.error('Error fetching classes:', error)
      toast.error('Gagal memuat data kelas')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchGurus = async () => {
    const { data } = await supabase
      .from('gurus')
      .select('id, first_name, last_name')
      .eq('status', 'aktif')
      .order('first_name')
    
    setGurus(data || [])
  }

  const filterClasses = () => {
    let filtered = classes

    if (searchTerm) {
      filtered = filtered.filter(classItem =>
        classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        classItem.level.toLowerCase().includes(searchTerm.toLowerCase()) ||
        classItem.gurus?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        classItem.gurus?.last_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredClasses(filtered)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingClass) {
        // Update existing class
        const { error } = await supabase
          .from('classes')
          .update(formData)
          .eq('id', editingClass.id)

        if (error) throw error
        toast.success('Kelas berhasil diperbarui')
      } else {
        // Create new class
        const { error } = await supabase
          .from('classes')
          .insert(formData)

        if (error) throw error
        toast.success('Kelas berhasil ditambahkan')
      }

      setShowModal(false)
      setEditingClass(null)
      setFormData({
        name: '',
        level: '',
        guru_id: ''
      })
      fetchClasses()
    } catch (error) {
      console.error('Error saving class:', error)
      toast.error('Gagal menyimpan data kelas')
    }
  }

  const handleEdit = (classItem) => {
    setEditingClass(classItem)
    setFormData({
      name: classItem.name,
      level: classItem.level,
      guru_id: classItem.guru_id || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (classItem) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kelas ${classItem.name}?`)) {
      return
    }

    // Check if class has students
    const { count } = await supabase
      .from('siswas')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', classItem.id)

    if (count > 0) {
      toast.error('Tidak dapat menghapus kelas yang masih memiliki siswa')
      return
    }

    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classItem.id)

      if (error) throw error

      toast.success('Kelas berhasil dihapus')
      fetchClasses()
    } catch (error) {
      console.error('Error deleting class:', error)
      toast.error('Gagal menghapus kelas')
    }
  }

  const getStudentCount = (classItem) => {
    return classItem.siswas?.[0]?.count || 0
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
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Kelas</h1>
          <p className="text-gray-600 mt-2">Kelola data kelas dan wali kelas</p>
        </div>
        
        <button
          onClick={() => {
            setEditingClass(null)
            setFormData({
              name: '',
              level: '',
              guru_id: ''
            })
            setShowModal(true)
          }}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          <span>Tambah Kelas</span>
        </button>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Cari berdasarkan nama kelas, tingkat, atau wali kelas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </motion.div>

      {/* Classes Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))
        ) : (
          filteredClasses.map((classItem) => (
            <motion.div
              key={classItem.id}
              whileHover={{ y: -2 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{classItem.name}</h3>
                  <p className="text-sm text-gray-600">Tingkat {classItem.level}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(classItem)}
                    className="text-blue-600 hover:text-blue-900 p-1"
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(classItem)}
                    className="text-red-600 hover:text-red-900 p-1"
                    title="Hapus"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Users size={16} />
                    <span>Jumlah Siswa</span>
                  </div>
                  <span className="font-semibold">{getStudentCount(classItem)}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <BookOpen size={16} />
                    <span>Wali Kelas</span>
                  </div>
                  <span className="font-semibold text-right">
                    {classItem.gurus ? 
                      `${classItem.gurus.first_name} ${classItem.gurus.last_name}` : 
                      '-'
                    }
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      {!isLoading && filteredClasses.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 bg-white rounded-xl shadow-sm"
        >
          <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak ada kelas</h3>
          <p className="text-gray-600">Mulai dengan menambahkan kelas pertama Anda</p>
        </motion.div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingClass ? 'Edit Kelas' : 'Tambah Kelas'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Kelas *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Contoh: 7A, 8B, 9C"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tingkat *
                </label>
                <select
                  required
                  value={formData.level}
                  onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Pilih Tingkat</option>
                  <option value="7">Kelas 7</option>
                  <option value="8">Kelas 8</option>
                  <option value="9">Kelas 9</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wali Kelas
                </label>
                <select
                  value={formData.guru_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, guru_id: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Pilih Wali Kelas</option>
                  {gurus.map(guru => (
                    <option key={guru.id} value={guru.id}>
                      {guru.first_name} {guru.last_name}
                    </option>
                  ))}
                </select>
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
                  {editingClass ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default ManajemenKelas