import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchAPI, uploadFile } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { ArrowLeft, Camera, Sparkles, MapPin } from 'lucide-react'

function CreateJobPage() {
  const { user, createJob } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [aiPrice, setAiPrice] = useState(null)
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [address, setAddress] = useState('')
  const [selectedCoupon, setSelectedCoupon] = useState(null)
  const [activeCoupons, setActiveCoupons] = useState([])
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState(null)

  // Get region multiplier from address
  const getRegionMultiplier = (addr) => {
    if (!addr) return 1.0
    const premiumZones = ['Kadikoy', 'Besiktas', 'Nisantasi']
    const economyZones = ['Esenyurt', 'Sultanbeyli']

    const upperAddr = addr.toUpperCase()
    if (premiumZones.some(zone => upperAddr.includes(zone.toUpperCase()))) {
      return 1.3
    }
    if (economyZones.some(zone => upperAddr.includes(zone.toUpperCase()))) {
      return 1.0
    }
    return 1.15 // Default for other zones
  }

  const regionMultiplier = getRegionMultiplier(address)
  const finalPrice = aiPrice ? Math.round(aiPrice * regionMultiplier) : 0

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPhoto(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAIAnalysis = async () => {
    if (!description.trim()) {
      alert('Lutfen problemi aciklayin')
      return
    }

    setIsAnalyzing(true)
    setStep(2)

    setTimeout(() => {
      let estimatedPrice = 150
      let category = 'Genel Elektrik'

      const desc = description.toLowerCase()

      if (desc.includes('priz') || desc.includes('sigorta')) {
        estimatedPrice = 120
        category = 'Priz/Sigorta'
      } else if (desc.includes('avize') || desc.includes('lamba')) {
        estimatedPrice = 200
        category = 'Aydinlatma'
      } else if (desc.includes('kivilcim') || desc.includes('yangin') || desc.includes('tehlike')) {
        estimatedPrice = 350
        category = 'Acil Ariza'
      } else if (desc.includes('kablo') || desc.includes('tesisat')) {
        estimatedPrice = 400
        category = 'Tesisat'
      }

      if (photo) {
        estimatedPrice += 50
      }

      setAiPrice(estimatedPrice)
      setAiAnalysis({
        category,
        urgency: desc.includes('acil') || desc.includes('tehlike') ? 'Yuksek' : 'Normal',
        estimatedDuration: estimatedPrice > 300 ? '2-3 saat' : '1-2 saat'
      })
      setIsAnalyzing(false)
      setStep(3)
    }, 2000)
  }

  useEffect(() => {
    // Load active coupons from API on component mount
    const loadCoupons = async () => {
      try {
        const response = await fetchAPI(API_ENDPOINTS.WALLET.GET)
        if (response.data?.coupons) {
          const unused = response.data.coupons.filter(c => !c.used && new Date(c.expiresAt) > new Date())
          setActiveCoupons(unused)
        }
      } catch (err) {
        console.warn('Failed to load coupons:', err)
      }
    }
    loadCoupons()
  }, [user])

 const handleLoadCoupons = () => {
    const unused = activeCoupons.filter(c => !c.used && new Date(c.expiresAt) > new Date())
    setActiveCoupons(unused)
  }

  const handleCreateJob = async () => {
    if (isCreating) return
    setError(null)
    setIsCreating(true)

    try {
      let finalJobPrice = aiPrice
      const regionMultiplier = getRegionMultiplier(address)
      finalJobPrice = Math.round(finalJobPrice * regionMultiplier)

      let couponDiscount = 0
      let photoUrl = null

      if (selectedCoupon) {
        couponDiscount = selectedCoupon.amount
        finalJobPrice = Math.max(0, finalJobPrice - couponDiscount)
      }

      if (photo) {
        try {
          const uploadResponse = await uploadFile(API_ENDPOINTS.UPLOAD.SINGLE, photo, 'photo')
          photoUrl = uploadResponse.data?.url || photoPreview
        } catch (err) {
          console.warn('Fotoğraf yüklenemedi:', err)
          photoUrl = photoPreview
        }
      }

      const jobData = {
        title: aiAnalysis.category,
        description: description,
        budget: Number(finalJobPrice), // Backend'in beklediği zorunlu alan
        location: address || 'Kadikoy, Istanbul', // Backend'in beklediği string formatı
        photo: photoUrl,
        urgent: aiAnalysis.urgency === 'Yuksek',
        category: 'electric'
      }

      const result = await createJob(jobData)
      if (result) {
        alert('Is talebi olusturuldu!')
        navigate('/my-jobs')
      }
    } catch (err) {
      setError(err.message || 'Hata olustu')
      alert(`Hata: ${err.message}`)
    } finally {
      setIsCreating(false)
    }
  }
