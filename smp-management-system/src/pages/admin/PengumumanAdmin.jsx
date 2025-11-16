import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Send } from 'lucide-react'
import { supabase } from '../../supabase/supabaseClient'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

const PengumumanAdmin = () => {
  const { user } = useAuthStore()
  const [announcements, setAnnouncements] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    target_roles: [],
    is_published: false
  })

  const roleOptions = [
    { value: 'guru', label: 'Guru' },
    { value: 'siswa', label: 'Siswa' },
    { value: 'ortu', label: 'Orang Tua' }
  ]

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAnnouncements(data || [])
    } catch (error) {
      console.error('Error fetching announcements:', error)
      toast.error('Gagal memuat pengumuman')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingAnnouncement) {
        // Update existing announcement
        const { error } = await supabase
          .from('announcements')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingAnnouncement.id)

        if (error) throw error
        toast.success('Pengumuman berhasil diperbarui')
      } else {
        // Create new announcement
        const { error } = await supabase
          .from('announcements')
          .insert({
            ...formData,
            author_id: user.id
          })

        if (error) throw error
        toast.success('Pengumuman berhasil dibuat')
      }

      setShowModal(false)
      setEditingAnnouncement(null)
      setFormData({
        title: '',
        content: '',
        target_roles: [],
        is_published: false
      })
      fetchAnnouncements()
    } catch (error) {
      console.error('Error saving announcement:', error)
      toast.error('Gagal menyimpan pengumuman')
    }
  }

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement)
    setFormData({
      title: announcement.title,
      content: announcement.content,
      target_roles: announcement.target_roles || [],
      is_published: announcement.is_published
    })
    setShowModal(true)
  }

  const handleDelete = async (announcement) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus pengumuman "${announcement.title}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', announcement.id)

      if (error) throw error

      toast.success('Pengumuman berhasil dihapus')
      fetchAnnouncements()
    } catch (error) {
      console.error('Error deleting announcement:', error)
      toast.error('Gagal menghapus pengumuman')
    }
  }

  const togglePublish = async (announcement) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ 
          is_published: !announcement.is_published,
          updated_at: new Date().toISOString()
        })
        .eq('id', announcement.id)

      if (error) throw error

      toast.success(`Pengumuman ${!announcement.is_published ? 'dipublikasikan' : 'disembunyikan'}`)
      fetchAnnouncements()
    } catch (error) {
      console.error('Error toggling publish:', error)
      toast.error('Gagal mengubah status pengumuman')
    }
  }

  const handleRoleChange = (role) => {
    setFormData(prev => ({
      ...prev,
      target_roles: prev.target_roles.includes(role)
        ? prev.target_roles.filter(r => r !== role)
        : [...prev.target_roles, role]
    }))
  }

  const getStatusBadge = (isPublished) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
      isPublished 
        ? 'bg-green-100 text-green-800' 
        : 'bg-gray-100 text-gray-800'
    }`}>
      {isPublished ? 'Published' : 'Draft'}
    </span>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Pengumuman</h1>
          <p className="text-gray-600 mt-2">Buat dan kelola pengumuman untuk guru, siswa, dan orang tua</p>
        </div>
        
        <button
          onClick={() => {
            setEditingAnnouncement(null)
            setFormData({
              title: '',
              content: '',
              target_roles: [],
              is_published: false
            })
            setShowModal(true)
          }}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          <span>Buat Pengumuman</span>
        </button>
      </motion.div>

      {/* Announcements List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm overflow-hidden"
      >
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Memuat pengumuman...</p>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Daftar Pengumuman ({announcements.length})
              </h3>
            </div>
            
            <div className="divide-y divide-gray-200">
              {announcements.map((announcement) => (
                <motion.div
                  key={announcement.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-6 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {announcement.title}
                        </h3>
                        {getStatusBadge(announcement.is_published)}
                      </div>
                      
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {announcement.content}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>
                          Target: {announcement.target_roles?.map(role => 
                            roleOptions.find(r => r.value === role)?.label
                          ).join(', ') || 'Semua'}
                        </span>
                        <span>
                          {new Date(announcement.created_at).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => togglePublish(announcement)}
                        className={`p-2 rounded-lg ${
                          announcement.is_published
                            ? 'text-orange-600 hover:bg-orange-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={announcement.is_published ? 'Sembunyikan' : 'Publikasikan'}
                      >
                        {announcement.is_published ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button
                        onClick={() => handleEdit(announcement)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(announcement)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Hapus"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {announcements.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Send className="mx-auto mb-4 text-gray-400" size={48} />
                <h3 className="text-lg font-semibold mb-2">Belum ada pengumuman</h3>
                <p>Buat pengumuman pertama untuk berbagi informasi penting</p>
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
            className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingAnnouncement ? 'Edit Pengumuman' : 'Buat Pengumuman'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Judul Pengumuman *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Masukkan judul pengumuman"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Konten Pengumuman *
                </label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tulis isi pengumuman di sini..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Target Pengumuman
                </label>
                <div className="space-y-2">
                  {roleOptions.map(role => (
                    <label key={role.value} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.target_roles.includes(role.value)}
                        onChange={() => handleRoleChange(role.value)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{role.label}</span>
                    </label>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Kosongkan semua untuk mengirim ke semua role
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={formData.is_published}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_published" className="text-sm font-medium text-gray-700">
                  Publikasikan langsung
                </label>
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
                  {editingAnnouncement ? 'Update' : 'Buat Pengumuman'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default PengumumanAdmin