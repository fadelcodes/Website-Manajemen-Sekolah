import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import OnboardingGuru from './OnboardingGuru'
import OnboardingSiswa from './OnboardingSiswa'

const Onboarding = () => {
  const { role, profile, completeOnboarding } = useAuthStore()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (formData) => {
    setIsLoading(true)
    const result = await completeOnboarding(formData)
    
    if (result.success) {
      toast.success('Profil berhasil dilengkapi!')
      navigate(`/${role}`)
    } else {
      toast.error(result.error || 'Gagal menyimpan profil')
    }
    setIsLoading(false)
  }

  if (role === 'guru') {
    return <OnboardingGuru onSubmit={handleSubmit} isLoading={isLoading} initialData={profile} />
  }

  if (role === 'siswa') {
    return <OnboardingSiswa onSubmit={handleSubmit} isLoading={isLoading} initialData={profile} />
  }

  return null
}

export default Onboarding