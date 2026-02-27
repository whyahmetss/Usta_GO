import cloudinary from '../config/cloudinary.js'
import fs from 'fs'

export const uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'usta-go/profile-photos',
      resource_type: 'image',
      transformation: [
        { width: 500, height: 500, crop: 'limit' },
        { quality: 'auto' }
      ]
    })

    // Clean up temp file
    fs.unlink(req.file.path, () => {})

    res.json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id
      }
    })
  } catch (err) {
    // Clean up temp file on error
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {})
    }
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
        cloudinary.uploader.upload(file.path, {
          folder: 'usta-go/job-photos',
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto' }
          ]
        })
      )
    )

    // Clean up temp files
    req.files.forEach(file => {
      fs.unlink(file.path, () => {})
    })

    res.json({
      success: true,
      data: {
        urls: uploads.map(u => u.secure_url)
      }
    })
  } catch (err) {
    // Clean up temp files on error
    if (req.files) {
      req.files.forEach(file => {
        fs.unlink(file.path, () => {})
      })
    }
    console.error('Upload photos error:', err)
    res.status(500).json({ error: err.message })
  }
}
