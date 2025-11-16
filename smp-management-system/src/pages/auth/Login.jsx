import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, User, BookOpen } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const Login = () => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    loginMethod: 'email'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    const result = await login(formData.identifier, formData.password, formData.loginMethod)
    
    if (result.success) {
      if (result.needsOnboarding) {
        navigate('/onboarding')
      } else {
        toast.success('Login berhasil!')
      }
    } else {
      toast.error(result.error || 'Login gagal')
    }
    
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Sistem Sekolah</h1>
          <p className="text-gray-600 mt-2">Masuk ke akun Anda</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Login Method Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Masuk sebagai:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'email', label: 'Email', icon: Mail },
                { value: 'nip', label: 'NIP', icon: User },
                { value: 'nisn', label: 'NISN', icon: User }
              ].map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, loginMethod: method.value }))}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.loginMethod === method.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <method.icon size={20} className="mx-auto mb-1" />
                  <span className="text-xs font-medium">{method.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Identifier Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {formData.loginMethod === 'email' ? 'Email' : 
               formData.loginMethod === 'nip' ? 'NIP' : 'NISN'}
            </label>
            <input
              type="text"
              value={formData.identifier}
              onChange={(e) => setFormData(prev => ({ ...prev, identifier: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder={`Masukkan ${formData.loginMethod === 'email' ? 'email' : formData.loginMethod}`}
              required
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pr-12"
                placeholder="Masukkan password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-primary text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          Orang tua?{' '}
          <a href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
            Daftar di sini
          </a>
        </p>
      </motion.div>
    </div>
  )
}

export default Login