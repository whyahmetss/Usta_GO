import cloudinary from '../config/cloudinary.js'

// Helper: upload buffer to Cloudinary via stream
function uploadToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error)
      resolve(result)
    })
    stream.end(buffer)
  })
}

export const uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'usta-go/profile-photos',
      resource_type: 'image',
      transformation: [
        { width: 500, height: 500, crop: 'limit' },
        { quality: 'auto' }
      ]
    })

    res.json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id
      }
    })
  } catch (err) {
    console.error('Upload photo error:', err)
    res.status(500).json({ error: err.message })
  }
}

export const uploadPhotos = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' })
    }

    const uploads = await Promise.all(
      req.files.map(file =>
        uploadToCloudinary(file.buffer, {
          folder: 'usta-go/job-photos',
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto' }
          ]
        })
      )
    )

    res.json({
      success: true,
      data: {
        urls: uploads.map(u => u.secure_url)
      }
    })
  } catch (err) {
    console.error('Upload photos error:', err)
    res.status(500).json({ error: err.message })
  }
}
