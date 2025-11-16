import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, Edit, Trash2, Mail, Phone, Users } from 'lucide-react'
import { supabase } from '../../supabase/supabaseClient'
import toast from 'react-hot-toast'

const ManajemenSiswa = () => {
  const [siswas, setSiswas] = useState([])
  const [filteredSiswas, setFilteredSiswas] = useState([])
  const [classes, setClasses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [classFilter, setClassFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingSiswa, setEditingSiswa] = useState(null)
  const [formData, setFormData] = useState({
    nisn: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    class_id: '',
    status: 'belum_lengkap'
  })

  useEffect(() => {
    fetchSiswas()
    fetchClasses()
  }, [])

  useEffect(() => {
    filterSiswas()
  }, [siswas, searchTerm, statusFilter, classFilter])

  const fetchSiswas = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('siswas')
        .select(`
          *,
          classes(name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSiswas(data || [])
    } catch (error) {
      console.error('Error fetching siswas:', error)
      toast.error('Gagal memuat data siswa')
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

  const filterSiswas = () => {
    let filtered = siswas

    if (searchTerm) {
      filtered = filtered.filter(siswa =>
        siswa.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        siswa.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        siswa.nisn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        siswa.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(siswa => siswa.status === statusFilter)
    }

    if (classFilter !== 'all') {
      filtered = filtered.filter(siswa => siswa.class_id === classFilter)
    }

    setFilteredSiswas(filtered)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingSiswa) {
        // Update existing siswa
        const { error } = await supabase
          .from('siswas')
          .update(formData)
          .eq('id', editingSiswa.id)

        if (error) throw error
        toast.success('Data siswa berhasil diperbarui')
      } else {
        // Check if NISN already exists
        if (formData.nisn) {
          const { data: existingSiswa } = await supabase
            .from('siswas')
            .select('id')
            .eq('nisn', formData.nisn)
            .single()

          if (existingSiswa) {
            toast.error('NISN sudah terdaftar')
            return
          }
        }

        // Create new siswa
        const { data: userData, error: userError } = await supabase.auth.signUp({
          email: formData.email,
          password: 'password123', // Default password
        })

        if (userError) throw userError

        // Create user record
        await supabase
          .from('users')
          .insert({
            id: userData.user.id,
            email: formData.email,
            password: 'password123',
            role: 'siswa',
            status: formData.status
          })

        // Create siswa profile
        const { error: siswaError } = await supabase
          .from('siswas')
          .insert({
            ...formData,
            user_id: userData.user.id
          })

        if (siswaError) throw siswaError

        toast.success('Siswa berhasil ditambahkan')
      }

      setShowModal(false)
      setEditingSiswa(null)
      setFormData({
        nisn: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        class_id: '',
        status: 'belum_lengkap'
      })
      fetchSiswas()
    } catch (error) {
      console.error('Error saving siswa:', error)
      toast.error('Gagal menyimpan data siswa')
    }
  }

  const handleEdit = (siswa) => {
    setEditingSiswa(siswa)
    setFormData({
      nisn: siswa.nisn || '',
      first_name: siswa.first_name || '',
      last_name: siswa.last_name || '',
      email: siswa.email || '',
      phone: siswa.phone || '',
      class_id: siswa.class_id || '',
      status: siswa.status
    })
    setShowModal(true)
  }

  const handleDelete = async (siswa) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus ${siswa.first_name} ${siswa.last_name}?`)) {
      return
    }

    try {
      // Delete user account first
      if (siswa.user_id) {
        await supabase.auth.admin.deleteUser(siswa.user_id)
      }

      // Delete siswa profile
      const { error } = await supabase
        .from('siswas')
        .delete()
        .eq('id', siswa.id)

      if (error) throw error

      toast.success('Siswa berhasil dihapus')
      fetchSiswas()
    } catch (error) {
      console.error('Error deleting siswa:', error)
      toast.error('Gagal menghapus siswa')
    }
  }

  const resetPassword = async (siswa) => {
    try {
      const { error } = await supabase.auth.admin.updateUserById(
        siswa.user_id,
        { password: 'password123' }
      )

      if (error) throw error
      toast.success('Password berhasil direset ke "password123"')
    } catch (error) {
      console.error('Error resetting password:', error)
      toast.error('Gagal reset password')
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      aktif: { color: 'bg-green-100 text-green-800', label: 'Aktif' },
      belum_lengkap: { color: 'bg-orange-100 text-orange-800', label: 'Belum Lengkap' }
    }
    const config = statusConfig[status] || statusConfig.belum_lengkap
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
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
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Siswa</h1>
          <p className="text-gray-600 mt-2">Kelola data siswa dan akun</p>
        </div>
        
        <button
          onClick={() => {
            setEditingSiswa(null)
            setFormData({
              nisn: '',
              first_name: '',
              last_name: '',
              email: '',
              phone: '',
              class_id: '',
              status: 'belum_lengkap'
            })
            setShowModal(true)
          }}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          <span>Tambah Siswa</span>
        </button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Cari berdasarkan nama, NISN, atau email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="belum_lengkap">Belum Lengkap</option>
            </select>
          </div>

          <div>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Semua Kelas</option>
              {classes.map(classItem => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Siswa Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
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
                Daftar Siswa ({filteredSiswas.length})
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
                      Kelas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kontak
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSiswas.map((siswa) => (
                    <tr key={siswa.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {siswa.first_name} {siswa.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{siswa.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {siswa.nisn || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {siswa.classes?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          {siswa.phone && (
                            <div className="flex items-center space-x-1">
                              <Phone size={14} />
                              <span>{siswa.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(siswa.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(siswa)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => resetPassword(siswa)}
                            className="text-orange-600 hover:text-orange-900 p-1"
                            title="Reset Password"
                          >
                            <Mail size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(siswa)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredSiswas.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Tidak ada data siswa yang ditemukan</p>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingSiswa ? 'Edit Siswa' : 'Tambah Siswa'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NISN
                </label>
                <input
                  type="text"
                  value={formData.nisn}
                  onChange={(e) => setFormData(prev => ({ ...prev, nisn: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Masukkan NISN"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Depan *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Belakang *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telepon
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kelas
                </label>
                <select
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
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="belum_lengkap">Belum Lengkap</option>
                  <option value="aktif">Aktif</option>
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
                  {editingSiswa ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default ManajemenSiswa