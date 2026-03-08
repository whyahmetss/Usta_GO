import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { X, ZoomIn, ZoomOut, Check, RotateCw } from 'lucide-react'

async function getCroppedImg(imageSrc, pixelCrop) {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
    img.src = imageSrc
  })

  const canvas = document.createElement('canvas')
  const size = Math.min(pixelCrop.width, pixelCrop.height)
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')
  ctx.drawImage(
    img,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    size,
    size,
  )

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob),
      'image/jpeg',
      0.92,
    )
  })
}

export default function ImageCropper({ imageSrc, onCropDone, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [saving, setSaving] = useState(false)

  const onCropComplete = useCallback((_area, areaPixels) => {
    setCroppedAreaPixels(areaPixels)
  }, [])

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return
    setSaving(true)
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels)
      onCropDone(blob)
    } catch (err) {
      console.error('Crop error:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 flex-shrink-0">
        <button onClick={onCancel} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition">
          <X size={22} className="text-white" />
        </button>
        <h2 className="text-white font-semibold text-[15px]">Fotoğrafı Kırp</h2>
        <button
          onClick={handleConfirm}
          disabled={saving}
          className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition disabled:opacity-50"
        >
          {saving
            ? <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
            : <Check size={20} className="text-gray-900" />
          }
        </button>
      </div>

      {/* Crop area */}
      <div className="flex-1 relative">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
          onCropComplete={onCropComplete}
          style={{
            containerStyle: { background: '#000' },
            cropAreaStyle: {
              border: '3px solid rgba(255,255,255,0.6)',
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)',
            },
          }}
        />
      </div>

      {/* Controls */}
      <div className="px-6 py-5 flex-shrink-0 safe-bottom">
        {/* Zoom slider */}
        <div className="flex items-center gap-3 mb-4">
          <ZoomOut size={18} className="text-white/50 flex-shrink-0" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 h-1 appearance-none rounded-full bg-white/20 accent-white cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md"
          />
          <ZoomIn size={18} className="text-white/50 flex-shrink-0" />
        </div>

        {/* Rotate button */}
        <div className="flex justify-center">
          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/70 text-xs font-medium hover:bg-white/20 transition"
          >
            <RotateCw size={14} />
            Döndür
          </button>
        </div>
      </div>
    </div>
  )
}
